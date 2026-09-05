// Shape do `state` jsonb de user_progress no context `project_progress`.
//
// FONTE UNICA porque os dois lados precisam concordar: o client escreve, o
// server valida antes de gravar e o client normaliza o que le de volta. Uma
// copia da regra em cada lado divergiria no primeiro campo novo.
//
// Nao ha migration: `state` ja e jsonb livre (a rota so exigia "ser objeto").
// Linha antiga `{ done: true }` continua valida e vira `{ done: true,
// etapas: {} }` na leitura, entao ninguem perde progresso.

export type ProjectProgressState = {
  // Conclusao autodeclarada, ou espelho do no de trilha vinculado.
  done: boolean;
  // etapaId -> ISO 8601 de quando foi marcada. So existe para projeto v2.
  etapas: Record<string, string>;
};

export type ParseProgressResult =
  | { ok: true; value: ProjectProgressState }
  | { ok: false; reason: string };

function ehIso(valor: unknown): boolean {
  if (typeof valor !== "string" || valor.trim() === "") return false;
  const t = Date.parse(valor);
  return Number.isFinite(t);
}

/**
 * Valida e normaliza um `state` vindo de fora (corpo de request ou linha
 * antiga do banco).
 *
 * `etapaIds` null significa "este projeto nao tem detalhe v2". Nesse caso
 * QUALQUER chave em `etapas` e invalida, e nao ignorada: aceitar em silencio
 * deixaria o banco guardar checkpoint de etapa que nao existe, e o erro so
 * apareceria quando o projeto virasse v2 com outros ids. Fail closed.
 */
export function parseProjectProgressState(
  state: unknown,
  etapaIds: readonly string[] | null,
): ParseProgressResult {
  if (state === undefined)
    return { ok: true, value: { done: false, etapas: {} } };
  if (state === null || typeof state !== "object" || Array.isArray(state))
    return { ok: false, reason: "state deve ser um objeto." };

  const bruto = state as Record<string, unknown>;

  if (bruto.done !== undefined && typeof bruto.done !== "boolean")
    return { ok: false, reason: "done deve ser booleano." };
  const done = bruto.done === true;

  if (bruto.etapas === undefined)
    return { ok: true, value: { done, etapas: {} } };
  if (
    bruto.etapas === null ||
    typeof bruto.etapas !== "object" ||
    Array.isArray(bruto.etapas)
  )
    return { ok: false, reason: "etapas deve ser um objeto." };

  const entradas = Object.entries(bruto.etapas as Record<string, unknown>);
  if (entradas.length === 0) return { ok: true, value: { done, etapas: {} } };

  if (etapaIds === null)
    return {
      ok: false,
      reason: `etapas nao vale para projeto sem detalhe v2 (recebido: ${entradas
        .map(([k]) => k)
        .join(", ")}).`,
    };

  const permitidos = new Set(etapaIds);
  const etapas: Record<string, string> = {};
  for (const [id, valor] of entradas) {
    if (!permitidos.has(id))
      return { ok: false, reason: `etapa desconhecida: ${id}.` };
    if (!ehIso(valor))
      return { ok: false, reason: `etapa ${id} deve ter uma data ISO.` };
    etapas[id] = new Date(valor as string).toISOString();
  }
  return { ok: true, value: { done, etapas } };
}
