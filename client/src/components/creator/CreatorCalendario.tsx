import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { CabecalhoDeSecao } from "@/components/creator/CabecalhoDeSecao";
import {
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  erroClass,
  inputClass,
} from "@/components/creator/creatorFormEstilos";
import { IconeDaRede } from "@/components/creator/IconeDaRede";
import { useAuth } from "@/contexts/AuthContext";
import { contentFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import {
  gerarGradeDoMes,
  MENSAGEM_MAX,
  normalizarMensagemDeCollab,
  normalizarNota,
  NOTA_MAX,
  validarDataDeMarcacao,
  type DiaDaGrade,
} from "@shared/creatorCalendar";
import type { RedeDeCreator } from "@shared/creatorProfile";

// CALENDARIO COMPARTILHADO (lote 10): todo creator ve o mes inteiro, de todo
// mundo, e e isso que permite a duas pessoas nao falarem do mesmo assunto no
// mesmo dia.
//
// A GRADE VEM DE `shared/creatorCalendar.ts` (`gerarGradeDoMes`), sem
// biblioteca de data: as mesmas semanas de domingo a sabado que o servidor
// conhece, com os dias de fora do mes marcados para desenhar apagados em vez de
// deixar buraco (buraco desalinha a coluna do dia da semana).
//
// AS REGRAS SAO AS DO SERVIDOR, rodadas antes do envio: nota ate 140, recado
// ate 300, dia entre hoje e hoje mais 90. O 409 (ja marcado), o 429 (teto de
// collabs) e o 400 `own_event` so o servidor sabe, e a mensagem deles vem dele.
//
// SEM VARIANTE `dark:` DE PROPOSITO: a folha de estilo troca a PALETA sob
// `.dark` (`--color-white`, `--color-slate-*`), entao `bg-white` e
// `text-slate-600` ja invertem sozinhos, e `card-brutal` se apoia em
// `var(--bnt-ink)` e `var(--bnt-shadow)`. Escrever `dark:` aqui aplicaria a
// inversao duas vezes.

type Autor = { user_id: string; name: string | null; handle: string | null };

type Marcacao = {
  id: string;
  user_id: string;
  event_date: string;
  network: RedeDeCreator;
  note: string | null;
  created_at: string;
  autor: Autor | null;
};

type Pedido = {
  id: string;
  event_id: string;
  requester_id: string;
  owner_id: string;
  message: string | null;
  status: "pendente" | "aceita" | "recusada";
  event_date: string;
  network: RedeDeCreator;
  outra_pessoa: Autor | null;
};

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; marcacoes: Marcacao[]; recebidos: Pedido[] };

// TODO(Ana)
const ROTULO_DA_REDE: Record<RedeDeCreator, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
};

// TODO(Ana)
const DIAS_DA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

// TODO(Ana)
const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * Rotulo da rede vindo do servidor. Resolver com fallback neutro: uma rede nova
 * que este bundle ainda nao conhece mostra "rede" em vez de derrubar o mes
 * inteiro.
 */
function rotuloDaRede(rede: string): string {
  // TODO(Ana)
  return (ROTULO_DA_REDE as Record<string, string | undefined>)[rede] ?? "rede";
}

/** Nome curto de quem marcou. Sem nome, o @; sem os dois, um rotulo neutro. */
function nomeDoAutor(autor: Autor | null): string {
  const nome = autor?.name?.trim();
  if (nome) return nome;
  const handle = autor?.handle?.trim();
  // TODO(Ana)
  return handle ? `@${handle}` : "Outro creator";
}

function listaDaResposta(json: unknown, chave: string): unknown[] | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) return null;
  const valor = (data as Record<string, unknown>)[chave];
  return Array.isArray(valor) ? valor : null;
}

export function CreatorCalendario() {
  const { user } = useAuth();
  const meuId = user?.id ?? null;

  const hoje = diaBrasilia(new Date().toISOString()) ?? "";
  const [mes, setMes] = useState(() => ({
    ano: Number(hoje.slice(0, 4)),
    mes: Number(hoje.slice(5, 7)),
  }));
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [dia, setDia] = useState<string | null>(hoje || null);

  const [rede, setRede] = useState<RedeDeCreator>("instagram");
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [pedindo, setPedindo] = useState<string | null>(null);
  const [recado, setRecado] = useState("");

  const chaveDoMes = `${mes.ano}-${String(mes.mes).padStart(2, "0")}`;

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    Promise.all([
      contentFetch(`/creator/calendar?mes=${chaveDoMes}`),
      contentFetch("/creator/collabs"),
    ])
      .then(([doMes, collabs]: unknown[]) => {
        if (cancelado) return;
        const marcacoes = listaDaResposta(doMes, "marcacoes");
        const recebidos = listaDaResposta(collabs, "recebidos");
        setEstado(
          marcacoes && recebidos
            ? {
                tipo: "ok",
                marcacoes: marcacoes as Marcacao[],
                recebidos: (recebidos as Pedido[]).filter(
                  (p) => p.status === "pendente",
                ),
              }
            : { tipo: "erro" },
        );
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [chaveDoMes, tentativa]);

  function recarregar() {
    setTentativa((n) => n + 1);
  }

  function andarMes(passo: number) {
    setMes((atual) => {
      const total = atual.mes - 1 + passo;
      return {
        ano: atual.ano + Math.floor(total / 12),
        mes: (((total % 12) + 12) % 12) + 1,
      };
    });
    setDia(null);
    setErro(null);
  }

  async function marcar() {
    if (!dia) return;
    // As mesmas regras do servidor, antes do envio.
    const data = validarDataDeMarcacao(dia, hoje);
    if (!data.ok) {
      setErro(
        // TODO(Ana)
        data.code === "invalid_date"
          ? "Data inválida."
          : `Escolha um dia entre hoje e os próximos 90 dias.`,
      );
      return;
    }
    const texto = normalizarNota(nota);
    if (!texto.ok) {
      // TODO(Ana)
      setErro(`O assunto pode ter até ${NOTA_MAX} caracteres.`);
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const json: unknown = await contentFetch("/creator/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_date: dia, network: rede, note: nota }),
      });
      const marcacao = (json as { data?: { marcacao?: Marcacao } }).data
        ?.marcacao;
      if (marcacao) {
        setEstado((atual) =>
          atual.tipo === "ok"
            ? { ...atual, marcacoes: [...atual.marcacoes, marcacao] }
            : atual,
        );
      }
      setNota("");
      // TODO(Ana)
      toast.success("Dia marcado.");
    } catch (err) {
      // O 409 (ja marcado) tem mensagem propria do servidor, e ela e mais
      // precisa do que qualquer texto generico daqui.
      const mensagem =
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível marcar o dia.";
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function desmarcar(id: string) {
    try {
      await contentFetch(`/creator/calendar/${id}`, { method: "DELETE" });
      setEstado((atual) =>
        atual.tipo === "ok"
          ? {
              ...atual,
              marcacoes: atual.marcacoes.filter((m) => m.id !== id),
            }
          : atual,
      );
      // TODO(Ana)
      toast.success("Marcação removida.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível remover a marcação.",
      );
    }
  }

  async function pedirCollab(marcacaoId: string) {
    const texto = normalizarMensagemDeCollab(recado);
    if (!texto.ok) {
      // TODO(Ana)
      setErro(`O recado pode ter até ${MENSAGEM_MAX} caracteres.`);
      return;
    }
    setErro(null);
    try {
      await contentFetch(`/creator/calendar/${marcacaoId}/collab`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: recado }),
      });
      setPedindo(null);
      setRecado("");
      // TODO(Ana)
      toast.success("Pedido de collab enviado.");
    } catch (err) {
      // 409 (ja pediu) e 429 (teto do dia) so o servidor sabe.
      const mensagem =
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível pedir a collab.";
      setErro(mensagem);
      toast.error(mensagem);
    }
  }

  async function responder(id: string, aceita: boolean) {
    try {
      await contentFetch(`/creator/collabs/${id}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceita }),
      });
      setEstado((atual) =>
        atual.tipo === "ok"
          ? { ...atual, recebidos: atual.recebidos.filter((p) => p.id !== id) }
          : atual,
      );
      // TODO(Ana)
      toast.success(aceita ? "Collab aceita." : "Pedido recusado.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível responder o pedido.",
      );
    }
  }

  if (estado.tipo === "carregando") {
    // TODO(Ana)
    return <LoadingBlock label="Carregando o calendário..." />;
  }

  if (estado.tipo === "erro") {
    return (
      <div data-testid="creator-calendario-erro" className="space-y-3">
        {/* TODO(Ana) */}
        <ErrorBlock message="Não foi possível carregar o calendário agora." />
        <div className="text-center">
          <button
            type="button"
            onClick={recarregar}
            className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
          >
            {/* TODO(Ana) */}
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  const grade = gerarGradeDoMes(mes.ano, mes.mes);
  const porDia = new Map<string, Marcacao[]>();
  for (const marcacao of estado.marcacoes) {
    const lista = porDia.get(marcacao.event_date) ?? [];
    lista.push(marcacao);
    porDia.set(marcacao.event_date, lista);
  }
  const doDia = dia ? (porDia.get(dia) ?? []) : [];
  const podeMarcar = dia ? validarDataDeMarcacao(dia, hoje).ok : false;

  return (
    <div data-testid="creator-calendario" className="space-y-5">
      <CabecalhoDeSecao
        id="creator-calendario-titulo"
        icone={<CalendarDays aria-hidden="true" className="h-4 w-4" />}
        // TODO(Ana)
        selo="calendário compartilhado"
        // TODO(Ana)
        titulo="Calendário dos creators"
        // TODO(Ana)
        frase="Marque o dia em que você vai publicar. Todo creator vê este calendário, e é assim que ninguém repete o assunto do outro no mesmo dia."
      />

      {estado.recebidos.length > 0 ? (
        <div
          data-testid="creator-collabs-pendentes"
          className="space-y-2 rounded-2xl border-2 border-slate-900 bg-violet-50 p-4 shadow-[3px_3px_0_var(--bnt-shadow)]"
        >
          <p className="text-sm font-black uppercase tracking-[0.15em] text-violet-900">
            {/* TODO(Ana) */}
            pedidos de collab
          </p>
          <ul className="space-y-2">
            {estado.recebidos.map((pedido) => (
              <li
                key={pedido.id}
                data-testid={`creator-collab-${pedido.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-2"
              >
                <IconeDaRede rede={pedido.network} />
                <span className="text-sm font-bold text-slate-900">
                  {`${nomeDoAutor(pedido.outra_pessoa)} pediu collab em ${
                    formatarDiaCivil(pedido.event_date) ?? pedido.event_date
                  }`}
                </span>
                {pedido.message ? (
                  <span className="text-sm font-semibold text-slate-600">
                    {`"${pedido.message}"`}
                  </span>
                ) : null}
                <button
                  type="button"
                  data-testid={`creator-collab-aceitar-${pedido.id}`}
                  onClick={() => void responder(pedido.id, true)}
                  className={BOTAO_PRIMARIO}
                >
                  <Check aria-hidden="true" className="h-4 w-4" />
                  {/* TODO(Ana) */}
                  Aceitar
                </button>
                <button
                  type="button"
                  data-testid={`creator-collab-recusar-${pedido.id}`}
                  onClick={() => void responder(pedido.id, false)}
                  className={BOTAO_SECUNDARIO}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                  {/* TODO(Ana) */}
                  Recusar
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          data-testid="creator-calendario-anterior"
          onClick={() => andarMes(-1)}
          className="bnt-pressable rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900"
          // TODO(Ana)
          aria-label="Mês anterior"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <p
          data-testid="creator-calendario-mes"
          className="text-sm font-black uppercase tracking-[0.15em] text-slate-900"
        >
          {`${MESES[mes.mes - 1]} de ${mes.ano}`}
        </p>
        <button
          type="button"
          data-testid="creator-calendario-proximo"
          onClick={() => andarMes(1)}
          className="bnt-pressable rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900"
          // TODO(Ana)
          aria-label="Próximo mês"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_DA_SEMANA.map((rotulo, i) => (
          <p
            key={`${rotulo}-${i}`}
            aria-hidden="true"
            className="py-1 text-center text-xs font-black uppercase text-slate-500"
          >
            {rotulo}
          </p>
        ))}
        {grade.flat().map((quadrado: DiaDaGrade) => {
          const quantas = porDia.get(quadrado.dia)?.length ?? 0;
          const selecionado = quadrado.dia === dia;
          return (
            <button
              key={quadrado.dia}
              type="button"
              data-testid={`creator-dia-${quadrado.dia}`}
              onClick={() => {
                setDia(quadrado.dia);
                setErro(null);
                setPedindo(null);
              }}
              aria-pressed={selecionado}
              className={[
                "flex min-h-14 flex-col items-center justify-center rounded-xl border-2 p-1 text-sm font-black",
                selecionado
                  ? "border-slate-900 bg-violet-200 text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
                  : "border-slate-300 bg-white text-slate-900",
                // Dia de fora do mes fica APAGADO, e nao ausente: buraco na
                // grade desalinha a coluna do dia da semana.
                quadrado.doMes ? "" : "opacity-40",
              ].join(" ")}
            >
              <span>{Number(quadrado.dia.slice(8, 10))}</span>
              {quantas > 0 ? (
                <span
                  data-testid={`creator-dia-contagem-${quadrado.dia}`}
                  className="mt-0.5 rounded-full bg-violet-800 px-1.5 text-[10px] font-black text-white"
                >
                  {quantas}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {dia ? (
        <div
          data-testid="creator-dia-painel"
          className="space-y-3 rounded-2xl border-2 border-slate-300 bg-slate-50 p-4"
        >
          <p className="text-sm font-black text-slate-900">
            {formatarDiaCivil(dia) ?? dia}
          </p>

          {doDia.length === 0 ? (
            <p
              data-testid="creator-dia-vazio"
              className="text-sm font-semibold text-slate-600"
            >
              {/* TODO(Ana) */}
              Ninguém marcou este dia ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {doDia.map((marcacao) => {
                // "NAO SEI DE QUEM E" NAO E "E DE OUTRO": enquanto a sessao nao
                // respondeu, a marcacao aparece sem acao nenhuma, em vez de
                // oferecer collab na propria marcacao (que o servidor recusaria
                // com 400 `own_event`).
                const minha = meuId !== null && marcacao.user_id === meuId;
                const deOutro = meuId !== null && !minha;
                return (
                  <li
                    key={marcacao.id}
                    data-testid={`creator-marcacao-${marcacao.id}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2"
                  >
                    <IconeDaRede rede={marcacao.network} />
                    <span className="rounded-full border-2 border-slate-400 px-2 py-0.5 text-[11px] font-black uppercase text-slate-700">
                      {rotuloDaRede(marcacao.network)}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {minha
                        ? // TODO(Ana)
                          "Você"
                        : nomeDoAutor(marcacao.autor)}
                    </span>
                    {marcacao.note ? (
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-600">
                        {marcacao.note}
                      </span>
                    ) : null}
                    {minha ? (
                      <button
                        type="button"
                        data-testid={`creator-marcacao-remover-${marcacao.id}`}
                        onClick={() => void desmarcar(marcacao.id)}
                        className="bnt-pressable rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900"
                        // TODO(Ana)
                        aria-label="Desmarcar"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {deOutro && pedindo !== marcacao.id ? (
                      <button
                        type="button"
                        data-testid={`creator-collab-pedir-${marcacao.id}`}
                        onClick={() => {
                          setPedindo(marcacao.id);
                          setErro(null);
                        }}
                        className={BOTAO_SECUNDARIO}
                      >
                        {/* TODO(Ana) */}
                        Pedir collab
                      </button>
                    ) : null}
                    {deOutro && pedindo === marcacao.id ? (
                      <span className="flex w-full flex-wrap items-center gap-2">
                        <label className="min-w-0 flex-1">
                          <span className="sr-only">
                            {/* TODO(Ana) */}
                            Recado do pedido de collab
                          </span>
                          <input
                            value={recado}
                            onChange={(e) => setRecado(e.target.value)}
                            className={inputClass}
                            // TODO(Ana)
                            placeholder="Um recado curto (opcional)"
                            autoComplete="off"
                          />
                        </label>
                        <button
                          type="button"
                          data-testid={`creator-collab-enviar-${marcacao.id}`}
                          onClick={() => void pedirCollab(marcacao.id)}
                          className={BOTAO_PRIMARIO}
                        >
                          {/* TODO(Ana) */}
                          Enviar pedido
                        </button>
                        <button
                          type="button"
                          onClick={() => setPedindo(null)}
                          className={BOTAO_SECUNDARIO}
                        >
                          {/* TODO(Ana) */}
                          Cancelar
                        </button>
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {podeMarcar ? (
            <div className="space-y-2 border-t-2 border-dashed border-slate-300 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                {(["instagram", "tiktok"] as const).map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    data-testid={`creator-marcar-rede-${opcao}`}
                    onClick={() => setRede(opcao)}
                    aria-pressed={rede === opcao}
                    // `gap-2` entre o glifo e o nome (lote 10b): o botao base
                    // nao preve icone, e sem folga o glifo encostava no texto.
                    className={`${
                      rede === opcao ? BOTAO_PRIMARIO : BOTAO_SECUNDARIO
                    } gap-2`}
                  >
                    <IconeDaRede rede={opcao} />
                    {rotuloDaRede(opcao)}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex-1">
                  <span className="sr-only">
                    {/* TODO(Ana) */}
                    Assunto da publicação
                  </span>
                  <input
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className={inputClass}
                    // TODO(Ana)
                    placeholder="Sobre o que você vai publicar (opcional)"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  data-testid="creator-marcar-dia"
                  onClick={() => void marcar()}
                  disabled={salvando}
                  className={BOTAO_PRIMARIO}
                >
                  {/* TODO(Ana) */}
                  {salvando ? "Marcando..." : "Marcar este dia"}
                </button>
              </div>
            </div>
          ) : (
            <p
              data-testid="creator-dia-fora-da-janela"
              className="border-t-2 border-dashed border-slate-300 pt-3 text-sm font-semibold text-slate-600"
            >
              {/* TODO(Ana) */}
              Dá para marcar de hoje até os próximos 90 dias.
            </p>
          )}

          {erro ? (
            <span
              data-testid="creator-calendario-erro-campo"
              className={erroClass}
            >
              {erro}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
