/**
 * ALLOWLIST de renderização do histórico administrativo. Fonte ÚNICA, aplicada
 * no servidor (antes de responder) E no cliente (antes de pintar).
 *
 * Os dois não são redundância: o servidor filtra para o valor não trafegar, e o
 * cliente filtra para que uma mudança na gravação do log, ou um backend mais
 * novo que a tela, não faça um valor aparecer sem ninguém ter decidido. A
 * guarda mora DENTRO da função de filtro, nunca em cada lugar que renderiza,
 * porque guarda no chamador some no primeiro chamador que alguém esquecer.
 *
 * Blocklist não serve aqui: ela protege o que alguém lembrou de listar, e campo
 * novo entraria na tela por padrão. Aqui é o contrário, e o custo de exibir um
 * campo novo é uma linha deliberada neste arquivo.
 */

/**
 * O que pode aparecer na tela, por ação.
 *
 * Critério: campo curto e factual entra; texto livre e atributo pessoal não. A
 * ausência de `bio`, `objetivo`, `career_goal` e `gender` é deliberada, não
 * esquecimento. `reveal` é lista vazia por escrito: hoje a rota grava os dois
 * json como null (produção confere, 0 linhas de reveal com json), mas a
 * allowlist existe para o dia em que alguém mudar a gravação sem lembrar da
 * tela.
 */
export const CAMPOS_VISIVEIS_POR_ACTION: Record<string, readonly string[]> = {
  update_profile: [
    "name",
    "full_name",
    "headline",
    "city",
    "uf",
    "area_interesse",
    "nivel_atual",
    "github_url",
    "linkedin_url",
    "website_url",
  ],
  update_email: ["email"],
  refund: ["amount_cents", "reason", "stripe_reason"],
  cancel_subscription: [
    "reason_code",
    "current_period_end",
    "cancel_at_period_end",
  ],
  // `trigger` diz que a revogação veio de uma devolução, e não de uma ação
  // avulsa. Sem ele a linha não explica por que o acesso caiu.
  revoke_pro: ["status", "reason", "trigger"],
  reveal: [],
  grant: [],
  revoke: [],
};

function ehPrimitivo(v: unknown): v is string | number | boolean | null {
  return (
    v === null ||
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  );
}

export function comoObjeto(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  return json as Record<string, unknown>;
}

/**
 * Filtra um json de auditoria pela allowlist da ação. Fora da allowlist, ou
 * valor não primitivo, não sai daqui.
 */
export function camposVisiveis(
  action: string,
  json: unknown,
): Record<string, string | number | boolean | null> {
  const permitidos = CAMPOS_VISIVEIS_POR_ACTION[action];
  const obj = comoObjeto(json);
  if (!permitidos || permitidos.length === 0 || !obj) return {};

  const saida: Record<string, string | number | boolean | null> = {};
  for (const campo of permitidos) {
    if (!Object.prototype.hasOwnProperty.call(obj, campo)) continue;
    const valor = obj[campo];
    if (!ehPrimitivo(valor)) continue;
    saida[campo] = valor;
  }
  return saida;
}
