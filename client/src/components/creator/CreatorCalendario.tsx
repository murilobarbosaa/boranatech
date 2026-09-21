import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { AvatarDeCreator } from "@shared/creatorAvatar";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { AvatarDoCreator } from "@/components/creator/AvatarDoCreator";
import { CabecalhoDeSecao } from "@/components/creator/CabecalhoDeSecao";
import {
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  erroClass,
  inputClass,
} from "@/components/creator/creatorFormEstilos";
import { IconeDaRede } from "@/components/creator/IconeDaRede";
import { MarcadorDeCor } from "@/components/creator/MarcadorDeCor";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch, contentFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import {
  gerarGradeDoMes,
  MENSAGEM_MAX,
  normalizarMensagemDeCollab,
  normalizarNota,
  NOTA_MAX,
  podePedirCollab,
  PRIMEIRO_DIA_MARCAVEL,
  validarDataDeMarcacao,
  type DiaDaGrade,
} from "@shared/creatorCalendar";
import {
  REDES_DE_CREATOR,
  rotuloDaRede,
  type RedeDeCreator,
} from "@shared/creatorProfile";

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

type Autor = {
  user_id: string;
  name: string | null;
  handle: string | null;
  /** Ausentes no backend anterior ao lote 11b. */
  avatar_url?: string | null;
  avatar?: AvatarDeCreator;
};

type StatusDoPedido = "pendente" | "aceita" | "recusada";

type Marcacao = {
  id: string;
  user_id: string;
  event_date: string;
  network: RedeDeCreator;
  note: string | null;
  created_at: string;
  autor: Autor | null;
  /** Cor do creator da marcacao no calendario (lote 10c). Ausente no backend
   * anterior: o marcador cai no violeta. */
  calendar_color?: string;
  /**
   * O pedido de collab que EU fiz nesta marcacao (lote 10c). Opcional por
   * causa da janela de deploy: o backend anterior nao manda o campo, e
   * ausente e "nao sei" (o botao continua), nunca "nao pedi".
   */
  meu_pedido?: { id: string; status: StatusDoPedido } | null;
  /** Collabs ACEITAS nesta marcacao (lote 10c), visiveis a todos. Opcional
   * pelo mesmo motivo: ausente e o backend anterior. */
  collabs?: Parceiro[];
  /** Eu sou um dos parceiros aceitos. */
  minha_collab?: boolean;
};

type Parceiro = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  /** Ausente no backend anterior ao lote 11b. */
  avatar?: AvatarDeCreator;
  calendar_color?: string;
};

/** Quantos marcadores cabem na celula do dia antes do "+N". */
const MARCADORES_POR_DIA = 4;

type MarcadorDoDia = {
  chave: string;
  cor: string | undefined;
  nome: string;
  meu: boolean;
};

/**
 * Os marcadores de um dia (lote 10c): um por marcacao, na cor de quem marcou,
 * mais um por parceiro de collab aceita, na cor do parceiro. Os MEUS (minha
 * marcacao ou minha collab) sao os que ganham o anel.
 */
function marcadoresDoDia(
  marcacoes: Marcacao[],
  meuId: string | null,
): MarcadorDoDia[] {
  const lista: MarcadorDoDia[] = [];
  for (const m of marcacoes) {
    const minha = meuId !== null && m.user_id === meuId;
    lista.push({
      chave: m.id,
      cor: m.calendar_color,
      // TODO(Ana)
      nome: minha ? "Você" : nomeDoAutor(m.autor),
      meu: minha,
    });
    for (const p of m.collabs ?? []) {
      const meu = meuId !== null && p.user_id === meuId;
      lista.push({
        chave: `${m.id}-${p.user_id}`,
        cor: p.calendar_color,
        // TODO(Ana)
        nome: meu ? "Você" : nomeDoParceiro(p),
        meu,
      });
    }
  }
  return lista;
}

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

/** Nome curto de quem marcou. Sem nome, o @; sem os dois, um rotulo neutro. */
function nomeDoAutor(autor: Autor | null): string {
  const nome = autor?.name?.trim();
  if (nome) return nome;
  const handle = autor?.handle?.trim();
  // TODO(Ana)
  return handle ? `@${handle}` : "Outro creator";
}

/**
 * O que virou o "Pedir collab" depois que a pessoa pediu (lote 10c): slate
 * enquanto o dono nao respondeu, rose se recusou. Aceito vira collab de
 * verdade e e desenhado pela marcacao. Status que este bundle nao conhece nao
 * desenha nada, em vez de derrubar o dia.
 */
function ChipDoMeuPedido({
  marcacaoId,
  status,
}: {
  marcacaoId: string;
  status: string;
}) {
  if (status === "pendente") {
    return (
      <span
        data-testid={`creator-collab-status-${marcacaoId}`}
        className="ml-auto shrink-0 rounded-full border-2 border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600"
      >
        {/* TODO(Ana) */}
        pedido enviado
      </span>
    );
  }
  if (status === "recusada") {
    return (
      <span
        data-testid={`creator-collab-status-${marcacaoId}`}
        className="ml-auto shrink-0 rounded-full border-2 border-rose-700 bg-rose-50 px-2 py-0.5 text-[11px] font-black text-rose-800"
      >
        {/* TODO(Ana) */}
        pedido recusado
      </span>
    );
  }
  // Aceita: a collab passa a ser da marcacao, e e `ChipDeCollab` que a
  // desenha ("Sua collab com ..."); aqui nao ha o que dizer.
  return null;
}

/** Nome do parceiro de collab; sem nome, um rotulo neutro. */
function nomeDoParceiro(parceiro: Parceiro): string {
  const nome = parceiro.name?.trim();
  // TODO(Ana)
  return nome ? nome : "outro creator";
}

/**
 * A collab aceita NA marcacao (lote 10c), dita de tres jeitos conforme quem
 * olha: o dono ("Collab aceita com X"), o parceiro ("Sua collab com <dono>")
 * e todo o resto ("Collab com X"). Emerald como o chip de consentimento do
 * admin: collab fechada e um estado bom, nao um alerta.
 */
function ChipDeCollab({
  marcacao,
  minha,
}: {
  marcacao: Marcacao;
  minha: boolean;
}) {
  const parceiros = marcacao.collabs ?? [];
  if (parceiros.length === 0) return null;
  const nomes = parceiros.map(nomeDoParceiro).join(", ");
  // TODO(Ana)
  const texto = minha
    ? `Collab aceita com ${nomes}`
    : marcacao.minha_collab
      ? `Sua collab com ${nomeDoAutor(marcacao.autor)}`
      : `Collab com ${nomes}`;
  return (
    <span
      data-testid={`creator-collab-fechada-${marcacao.id}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-emerald-700 bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-800"
    >
      <Handshake aria-hidden="true" className="h-3 w-3" />
      {/* Os parceiros com o avatar deles (lote 11b), antes do texto. */}
      {parceiros.map((p) => (
        <AvatarDoCreator
          key={p.user_id}
          name={nomeDoParceiro(p)}
          avatar={p.avatar}
          avatarUrl={p.avatar_url}
          size="sm"
          className="h-5 w-5"
        />
      ))}
      <span data-testid={`creator-collab-fechada-texto-${marcacao.id}`}>
        {texto}
      </span>
    </span>
  );
}

function listaDaResposta(json: unknown, chave: string): unknown[] | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) return null;
  const valor = (data as Record<string, unknown>)[chave];
  return Array.isArray(valor) ? valor : null;
}

/**
 * `modo="admin"` (lote 10d): o mesmo calendario, SO LEITURA, na aba Creators
 * do admin. Busca pela rota do admin (sem os pedidos de collab, que sao do
 * creator), e nao desenha formulario de marcar, Desmarcar, Pedir collab nem
 * resposta a pedido: a grade, os marcadores, o aperto de mao e o painel do dia
 * sao os mesmos. `meuId` e nulo de proposito: o admin nao e dono de nada ali.
 */
export function CreatorCalendario({
  modo = "creator",
}: {
  modo?: "creator" | "admin";
} = {}) {
  const { user } = useAuth();
  const admin = modo === "admin";
  const meuId = admin ? null : (user?.id ?? null);

  const hoje = diaBrasilia(new Date().toISOString()) ?? "";
  const [mes, setMes] = useState(() => ({
    ano: Number(hoje.slice(0, 4)),
    mes: Number(hoje.slice(5, 7)),
  }));
  // `silencioso` e a REVALIDACAO depois de uma acao (pedir collab, responder):
  // refaz as duas buscas sem trocar a tela pelo bloco de carregando, porque a
  // pessoa esta no meio do calendario e o dia escolhido tem de continuar
  // na tela. A carga inicial e o "tentar de novo" nao sao silenciosos.
  const [busca, setBusca] = useState({ n: 0, silencioso: false });
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [dia, setDia] = useState<string | null>(hoje || null);

  // Redes do dia a marcar (lote 10d): quantas quiser, ao menos uma. Comeca
  // no Instagram, que e a rede de quase todo mundo.
  const [redes, setRedes] = useState<RedeDeCreator[]>(["instagram"]);

  function alternarRede(rede: RedeDeCreator) {
    setRedes((atual) => {
      if (!atual.includes(rede)) return [...atual, rede];
      // A ultima ligada nao desliga: marcar em rede nenhuma nao existe.
      return atual.length === 1 ? atual : atual.filter((r) => r !== rede);
    });
  }
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [pedindo, setPedindo] = useState<string | null>(null);
  const [recado, setRecado] = useState("");

  const chaveDoMes = `${mes.ano}-${String(mes.mes).padStart(2, "0")}`;

  useEffect(() => {
    let cancelado = false;
    if (!busca.silencioso) setEstado({ tipo: "carregando" });
    Promise.all(
      admin
        ? [
            adminFetch(`/creators/calendar?mes=${chaveDoMes}`),
            Promise.resolve({ data: { recebidos: [] } }),
          ]
        : [
            contentFetch(`/creator/calendar?mes=${chaveDoMes}`),
            contentFetch("/creator/collabs"),
          ],
    )
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
  }, [chaveDoMes, busca]);

  function recarregar() {
    setBusca((b) => ({ n: b.n + 1, silencioso: false }));
  }

  /**
   * Refaz as buscas depois de uma acao. E o que faz o "Pedir collab" virar
   * chip na hora e a collab aceita aparecer na marcacao: o estado do pedido
   * vem do servidor (`meu_pedido`), nao de uma conta local que divergiria
   * dele na primeira recarga.
   */
  function revalidar() {
    setBusca((b) => ({ n: b.n + 1, silencioso: true }));
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
          : `Escolha um dia entre ${formatarDiaCivil(PRIMEIRO_DIA_MARCAVEL) ?? PRIMEIRO_DIA_MARCAVEL} e os próximos 90 dias.`,
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
        body: JSON.stringify({ event_date: dia, redes, note: nota }),
      });
      const data = (json as { data?: { marcacoes?: Marcacao[] } }).data;
      const criadas = Array.isArray(data?.marcacoes) ? data.marcacoes : [];
      // As linhas devolvidas entram na hora, para o dia nao ficar vazio ate a
      // resposta da revalidacao; a revalidacao vem em seguida, em silencio,
      // porque e o servidor que sabe a cor e as collabs de cada marcacao.
      if (criadas.length > 0) {
        setEstado((atual) =>
          atual.tipo === "ok"
            ? { ...atual, marcacoes: [...atual.marcacoes, ...criadas] }
            : atual,
        );
      }
      revalidar();
      setNota("");
      // TODO(Ana)
      toast.success(
        criadas.length > 0
          ? `Marcado em ${criadas.map((m) => rotuloDaRede(m.network)).join(" e ")}`
          : "Dia marcado.",
      );
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
      revalidar();
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
      // A collab aceita passa a fazer parte da marcacao: recarrega o mes.
      revalidar();
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
  const podeMarcar =
    !admin && (dia ? validarDataDeMarcacao(dia, hoje).ok : false);

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
          const marcacoesDoDia = porDia.get(quadrado.dia) ?? [];
          const quantas = marcacoesDoDia.length;
          const marcadores = marcadoresDoDia(marcacoesDoDia, meuId);
          // Collab fechada no dia (lote 10c): o aperto de mao entra na celula,
          // para a collab aparecer NO calendario e nao so no painel do dia.
          const temCollab = marcacoesDoDia.some(
            (m) => (m.collabs?.length ?? 0) > 0,
          );
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
              {/* Os marcadores por creator (lote 10c) no lugar do chip com a
                  contagem: quem marcou o dia passa a ser legivel de relance,
                  pela cor, e o meu dia pelo anel. Ate quatro, depois "+N". */}
              {quantas > 0 ? (
                <span
                  data-testid={`creator-dia-marcadores-${quadrado.dia}`}
                  className="mt-1 flex items-center gap-1"
                >
                  {marcadores.slice(0, MARCADORES_POR_DIA).map((marcador) => (
                    <MarcadorDeCor
                      key={marcador.chave}
                      cor={marcador.cor}
                      nome={marcador.nome}
                      meu={marcador.meu}
                      testId={`creator-marcador-${marcador.chave}`}
                    />
                  ))}
                  {marcadores.length > MARCADORES_POR_DIA ? (
                    <span
                      data-testid={`creator-dia-mais-${quadrado.dia}`}
                      className="text-[10px] font-black text-slate-600"
                    >
                      {`+${marcadores.length - MARCADORES_POR_DIA}`}
                    </span>
                  ) : null}
                  {temCollab ? (
                    <Handshake
                      aria-hidden="true"
                      data-testid={`creator-dia-collab-${quadrado.dia}`}
                      // Token, e nao `dark:`: roxo no claro e amarelo no
                      // escuro (ver --bnt-collab-ink no index.css).
                      className="h-3 w-3 text-[var(--bnt-collab-ink)]"
                    />
                  ) : null}
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
                // Sem `meu_pedido` (nulo ou ausente) o botao existe; com ele,
                // o chip do status no lugar, e o botao NAO volta nem depois
                // de recusa: pedir de novo e o 409 do servidor.
                const meuPedido = marcacao.meu_pedido ?? null;
                // Dia que ja passou (lote 10d): a marcacao e registro do que
                // saiu, e nao ha collab a combinar; o servidor recusa com
                // `collab_event_in_past`, e aqui o botao nem aparece.
                const passado = !podePedirCollab(marcacao.event_date, hoje);
                return (
                  <li
                    key={marcacao.id}
                    data-testid={`creator-marcacao-${marcacao.id}`}
                    // A acao (botao ou chip) fica na MESMA coluna em toda
                    // linha, com ou sem nota (lote 10c): a nota, ou o espaco
                    // dela, ocupa o meio com `flex-1`, e a acao vai para a
                    // direita com `ml-auto`. `flex-wrap` continua por causa
                    // do formulario do recado, que precisa de uma linha
                    // inteira (`w-full`).
                    className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-slate-300 bg-white px-3 py-2"
                  >
                    <IconeDaRede rede={marcacao.network} />
                    <span className="rounded-full border-2 border-slate-400 px-2 py-0.5 text-[11px] font-black uppercase text-slate-700">
                      {rotuloDaRede(marcacao.network)}
                    </span>
                    <MarcadorDeCor
                      cor={marcacao.calendar_color}
                      meu={minha}
                      testId={`creator-marcacao-cor-${marcacao.id}`}
                    />
                    {/* O avatar de quem marcou (lote 11b), como o site o
                        desenha; o proprio tambem, para a linha ser igual. */}
                    <AvatarDoCreator
                      name={nomeDoAutor(marcacao.autor)}
                      avatar={marcacao.autor?.avatar}
                      avatarUrl={marcacao.autor?.avatar_url}
                      size="sm"
                    />
                    <span className="text-sm font-bold text-slate-900">
                      {minha
                        ? // TODO(Ana)
                          "Você"
                        : nomeDoAutor(marcacao.autor)}
                    </span>
                    <span
                      data-testid={`creator-marcacao-nota-${marcacao.id}`}
                      className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-600"
                    >
                      {marcacao.note ?? ""}
                    </span>
                    <ChipDeCollab marcacao={marcacao} minha={minha} />
                    {minha ? (
                      <button
                        type="button"
                        data-testid={`creator-marcacao-remover-${marcacao.id}`}
                        onClick={() => void desmarcar(marcacao.id)}
                        className="bnt-pressable ml-auto shrink-0 rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900"
                        // TODO(Ana)
                        aria-label="Desmarcar"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {deOutro && passado && meuPedido === null ? (
                      <span
                        data-testid={`creator-collab-passado-${marcacao.id}`}
                        className="ml-auto shrink-0 rounded-full border-2 border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600"
                      >
                        {/* TODO(Ana) */}
                        Publicado
                      </span>
                    ) : null}
                    {deOutro &&
                    !passado &&
                    meuPedido === null &&
                    pedindo !== marcacao.id ? (
                      <button
                        type="button"
                        data-testid={`creator-collab-pedir-${marcacao.id}`}
                        onClick={() => {
                          setPedindo(marcacao.id);
                          setErro(null);
                        }}
                        className={`${BOTAO_SECUNDARIO} ml-auto shrink-0`}
                      >
                        {/* TODO(Ana) */}
                        Pedir collab
                      </button>
                    ) : null}
                    {deOutro && meuPedido !== null ? (
                      <ChipDoMeuPedido
                        marcacaoId={marcacao.id}
                        status={meuPedido.status}
                      />
                    ) : null}
                    {deOutro &&
                    !passado &&
                    meuPedido === null &&
                    pedindo === marcacao.id ? (
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
              {/* Tres botoes ALTERNAVEIS (lote 10d): o mesmo dia pode ser
                  marcado em mais de uma rede num envio so. */}
              <div className="flex flex-wrap items-center gap-2">
                {REDES_DE_CREATOR.map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    data-testid={`creator-marcar-rede-${opcao}`}
                    onClick={() => alternarRede(opcao)}
                    aria-pressed={redes.includes(opcao)}
                    // `gap-2` entre o glifo e o nome (lote 10b): o botao base
                    // nao preve icone, e sem folga o glifo encostava no texto.
                    className={`${
                      redes.includes(opcao) ? BOTAO_PRIMARIO : BOTAO_SECUNDARIO
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
          ) : admin ? null : (
            <p
              data-testid="creator-dia-fora-da-janela"
              className="border-t-2 border-dashed border-slate-300 pt-3 text-sm font-semibold text-slate-600"
            >
              {/* TODO(Ana) */}
              {`Dá para marcar de ${formatarDiaCivil(PRIMEIRO_DIA_MARCAVEL) ?? PRIMEIRO_DIA_MARCAVEL} até os próximos 90 dias.`}
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
