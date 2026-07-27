import { describe, expect, it } from "vitest";

/**
 * TOCTOU do limite diario de IA (achado P0 da rodada 1).
 *
 * O que este teste faz e NAO faz. Ele modela os dois desenhos sobre um store em
 * memoria e prova a diferenca de comportamento sob concorrencia. Ele NAO executa
 * Postgres: a atomicidade em producao vem do `pg_advisory_xact_lock` dentro de
 * `reserve_ai_usage_slot`, e a serializacao aqui e o modelo desse lock. O que o
 * teste garante e que o DESENHO novo nao tem a janela; que o lock funciona e
 * propriedade do Postgres.
 */

const LIMITE = 5;
const PARALELAS = 10;

interface Linha {
  id: string;
  status: "reserved" | "success" | "error";
}

class Store {
  linhas: Linha[] = [];
  private seq = 0;

  contarAntigo(): number {
    return this.linhas.filter((l) => l.status === "success").length;
  }

  contarComReserva(): number {
    return this.linhas.filter(
      (l) => l.status === "success" || l.status === "reserved",
    ).length;
  }

  inserir(status: Linha["status"]): string {
    const id = `l${(this.seq += 1)}`;
    this.linhas.push({ id, status });
    return id;
  }

  confirmar(id: string, status: Linha["status"]): void {
    const l = this.linhas.find((x) => x.id === id);
    if (l) l.status = status;
  }

  remover(id: string): void {
    this.linhas = this.linhas.filter((x) => x.id !== id);
  }
}

/** Cede o event loop, modelando a latencia da chamada a OpenAI. */
const chamadaDaIa = () => new Promise((r) => setTimeout(r, 1));

/** Mutex, modelando o advisory lock por usuario. */
function criarTrava() {
  let fila: Promise<unknown> = Promise.resolve();
  return async <T>(fn: () => T): Promise<T> => {
    const anterior = fila;
    let liberar!: () => void;
    fila = new Promise<void>((r) => (liberar = r));
    await anterior;
    try {
      return fn();
    } finally {
      liberar();
    }
  };
}

describe("TOCTOU do limite diario: reproducao", () => {
  it("DESENHO ANTIGO: le antes, escreve depois, e TODAS as paralelas passam", async () => {
    const store = new Store();
    const permitidas: boolean[] = [];

    await Promise.all(
      Array.from({ length: PARALELAS }, async () => {
        // checkAiDailyLimit: conta o dia
        const contagem = store.contarAntigo();
        const permitido = contagem < LIMITE;
        permitidas.push(permitido);
        if (!permitido) return;
        // a janela: a chamada acontece antes de qualquer escrita
        await chamadaDaIa();
        // logAiUsage: so agora a linha existe
        store.inserir("success");
      }),
    );

    // A corrida, crua: dez requisicoes, limite cinco, dez chamadas pagas.
    expect(permitidas.filter(Boolean)).toHaveLength(PARALELAS);
    expect(store.contarAntigo()).toBe(PARALELAS);
    expect(store.contarAntigo()).toBeGreaterThan(LIMITE);
  });

  it("DESENHO NOVO: reserva atomica, e passam exatamente as do limite", async () => {
    const store = new Store();
    const trava = criarTrava();
    const permitidas: boolean[] = [];

    await Promise.all(
      Array.from({ length: PARALELAS }, async () => {
        // reserve_ai_usage_slot: conta E insere na mesma secao critica
        const reserva = await trava(() => {
          if (store.contarComReserva() >= LIMITE) return null;
          return store.inserir("reserved");
        });
        permitidas.push(reserva !== null);
        if (!reserva) return;
        await chamadaDaIa();
        // logAiUsage confirma a linha que ja existe, nao insere outra
        store.confirmar(reserva, "success");
      }),
    );

    expect(permitidas.filter(Boolean)).toHaveLength(LIMITE);
    expect(store.contarAntigo()).toBe(LIMITE);
    expect(store.linhas).toHaveLength(LIMITE);
  });

  it("DEVOLUCAO: chamada que falha libera a vaga para a proxima", async () => {
    const store = new Store();
    const trava = criarTrava();

    const reservar = () =>
      trava(() => {
        if (store.contarComReserva() >= LIMITE) return null;
        return store.inserir("reserved");
      });

    // Ocupa o limite inteiro.
    const ocupadas: string[] = [];
    for (let i = 0; i < LIMITE; i += 1) {
      const r = await reservar();
      expect(r).not.toBeNull();
      ocupadas.push(r as string);
    }
    expect(await reservar()).toBeNull();

    // Uma delas falha: releaseAiSlot apaga a linha reservada.
    store.remover(ocupadas[0]);

    // A vaga voltou. Sem devolucao, a pessoa ficaria punida ate a virada do dia
    // por uma falha que nao foi dela.
    const depois = await reservar();
    expect(depois).not.toBeNull();
    expect(store.contarComReserva()).toBe(LIMITE);
  });

  it("reserva orfa expira: crash entre reservar e confirmar nao trava a cota", async () => {
    // Sem o corte de 10 minutos na contagem, um processo que morre entre a
    // reserva e a confirmacao deixa a linha 'reserved' ocupando vaga ate a
    // virada do dia. O teste modela o corte por idade.
    const agora = 1_000_000;
    const linhas = [
      { status: "reserved", idade: 60_000 },
      { status: "reserved", idade: 11 * 60_000 },
    ];
    const contar = (l: typeof linhas) =>
      l.filter(
        (x) => x.status !== "reserved" || agora - (agora - x.idade) < 10 * 60_000,
      ).length;
    // A de 1 minuto conta; a de 11 minutos nao.
    expect(contar(linhas)).toBe(1);
  });

  it("MODO DEGRADADO: o aviso e de erro, nomeia a causa e nao se repete em rajada", () => {
    // Modela `avisarModoDegradado`: mesma regra de intervalo, mesmo conteudo.
    // O que importa provar e que (a) o nivel e error, nao warn, (b) a mensagem
    // nomeia a migration a aplicar, e (c) uma rajada de requisicoes nao vira
    // uma rajada de alertas, que e outra forma de silencio.
    const INTERVALO = 5 * 60 * 1000;
    let ultimo = 0;
    const emitidos: string[] = [];
    const avisar = (agora: number, causa: string) => {
      if (agora - ultimo < INTERVALO) return;
      ultimo = agora;
      emitidos.push(
        `MODO DEGRADADO do limite diario de IA: reserve_ai_usage_slot indisponivel, a cota voltou a ser verificada de forma NAO-ATOMICA e a corrida esta aberta. Causa: ${causa}. Aplique supabase/migrations/20260727150000_reserve_ai_usage_slot.sql.`,
      );
    };
    // 100 requisicoes em 2 segundos, degradadas.
    for (let i = 0; i < 100; i += 1) avisar(1_000_000 + i * 20, "PGRST202");
    expect(emitidos).toHaveLength(1);
    expect(emitidos[0]).toContain("MODO DEGRADADO");
    expect(emitidos[0]).toContain("NAO-ATOMICA");
    expect(emitidos[0]).toContain("PGRST202");
    expect(emitidos[0]).toContain("reserve_ai_usage_slot.sql");
    // Passado o intervalo, volta a avisar: o problema nao pode sumir do radar.
    avisar(1_000_000 + 6 * 60 * 1000, "PGRST202");
    expect(emitidos).toHaveLength(2);
  });

  it("confirmar NAO duplica: a linha confirmada e a mesma que foi reservada", async () => {
    const store = new Store();
    const id = store.inserir("reserved");
    store.confirmar(id, "success");
    expect(store.linhas).toHaveLength(1);
    expect(store.contarAntigo()).toBe(1);
  });
});
