import { formatIsoDay } from "./relativeTime";
import type { TaskActivity } from "./types";

// Resolucao das linhas do histórico.
//
// Regra do CLAUDE.md aplicada aqui: NUNCA `MAPA[activity.action].label`. O
// `action` e um CHECK no banco e o bundle carregado no navegador pode ser mais
// antigo que o backend no ar (Vercel e Railway sobem separados). Um valor novo
// num acesso direto derruba a aba inteira com "Cannot read properties of
// undefined". Aqui um action desconhecido cai numa frase generica.
//
// Segunda regra, do mesmo espirito: os rotulos legiveis saem do PAYLOAD, que o
// server denormaliza no momento da escrita (nome da etiqueta, da coluna, do
// responsavel). Resolver id contra o estado ATUAL faria o histórico se reescrever
// sozinho: renomear uma etiqueta mudaria o que aconteceu seis meses atras.
// Linhas antigas gravadas antes da denormalizacao caem no fallback, que e
// exatamente para isso que ele existe.

export type ActivityLine = {
  /** Frase completa, ja com os rotulos. */
  text: string;
  /** Chave curta para o icone/cor, sempre resolvida. */
  kind:
    | "created"
    | "moved"
    | "edited"
    | "people"
    | "label"
    | "archive"
    | "done"
    | "other";
};

function str(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** Rotulo legivel com degradacao: nome gravado > id > texto neutro. */
function labelOf(
  payload: Record<string, unknown>,
  nameKey: string,
  idKey: string,
  fallback: string,
): string {
  return str(payload, nameKey) ?? str(payload, idKey) ?? fallback;
}

const PRIORITY_LABELS: Record<string, string> = {
  baixa: "baixa",
  media: "média",
  alta: "alta",
  urgente: "urgente",
};

const TYPE_LABELS: Record<string, string> = {
  feature: "feature",
  bug: "bug",
  melhoria: "melhoria",
  debito_tecnico: "débito técnico",
  tarefa: "tarefa",
};

function valueLabel(map: Record<string, string>, value: string | null): string {
  if (!value) return "vazio";
  return map[value] ?? value;
}

function formatDay(value: string | null): string {
  if (!value) return "sem data";
  // Reusa o formatador do modulo de datas em vez de manter uma copia.
  return formatIsoDay(value) || value;
}

/**
 * Traduz uma linha do histórico. NUNCA lanca e NUNCA devolve string vazia: uma
 * linha em branco no meio do histórico e pior que uma frase generica, porque
 * parece que nao aconteceu nada.
 */
export function activityLineOf(activity: TaskActivity): ActivityLine {
  const payload = activity.payload ?? {};

  switch (activity.action) {
    case "created":
      return {
        kind: "created",
        text: `criou a tarefa em ${labelOf(payload, "column_name", "column_id", "uma etapa")}`,
      };
    case "moved":
      return {
        kind: "moved",
        text: `moveu de ${labelOf(payload, "from_column_name", "from_column_id", "outra etapa")} para ${labelOf(payload, "to_column_name", "to_column_id", "outra etapa")}`,
      };
    case "renamed":
      return {
        kind: "edited",
        text: `renomeou de “${str(payload, "from") ?? "sem título"}” para “${str(payload, "to") ?? "sem título"}”`,
      };
    case "assigned":
      return {
        kind: "people",
        text: `definiu ${labelOf(payload, "to_name", "to", "alguém")} como responsável`,
      };
    case "unassigned":
      return {
        kind: "people",
        text: `removeu ${labelOf(payload, "from_name", "from", "o responsável")} da tarefa`,
      };
    case "priority_changed":
      return {
        kind: "edited",
        text: `mudou a prioridade de ${valueLabel(PRIORITY_LABELS, str(payload, "from"))} para ${valueLabel(PRIORITY_LABELS, str(payload, "to"))}`,
      };
    case "type_changed":
      return {
        kind: "edited",
        text: `mudou o tipo de ${valueLabel(TYPE_LABELS, str(payload, "from"))} para ${valueLabel(TYPE_LABELS, str(payload, "to"))}`,
      };
    case "due_date_changed":
      return {
        kind: "edited",
        text: `mudou o vencimento de ${formatDay(str(payload, "from"))} para ${formatDay(str(payload, "to"))}`,
      };
    case "label_added":
      return {
        kind: "label",
        text: `aplicou a etiqueta ${labelOf(payload, "label_name", "label_id", "uma etiqueta")}`,
      };
    case "label_removed":
      return {
        kind: "label",
        text: `removeu a etiqueta ${labelOf(payload, "label_name", "label_id", "uma etiqueta")}`,
      };
    case "archived":
      return { kind: "archive", text: "arquivou a tarefa" };
    case "unarchived":
      return { kind: "archive", text: "desarquivou a tarefa" };
    case "completed":
      return { kind: "done", text: "concluiu a tarefa" };
    case "reopened":
      return { kind: "done", text: "reabriu a tarefa" };
    default:
      // Action que este bundle nao conhece. Degrada em vez de derrubar a aba.
      return { kind: "other", text: "registrou uma alteração" };
  }
}

const KIND_DOT: Record<ActivityLine["kind"], string> = {
  created: "bg-emerald-400",
  moved: "bg-sky-400",
  edited: "bg-amber-400",
  people: "bg-violet-400",
  label: "bg-pink-400",
  archive: "bg-slate-400",
  done: "bg-emerald-500",
  other: "bg-slate-300",
};

/** Cor do marcador. Tambem por resolver, pelo mesmo motivo. */
export function activityDotOf(kind: string): string {
  return KIND_DOT[kind as ActivityLine["kind"]] ?? KIND_DOT.other;
}
