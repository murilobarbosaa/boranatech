// Uma geracao ativa por usuario: o nome do indice e a classificacao do erro.
//
// MODULO PURO, sem import nenhum, de proposito. A primeira versao disto morava
// em server/routes/aiRoadmap.ts, e o teste que a exercitava quebrava sem arquivo
// `.env`: importar a rota puxa `middleware/auth`, que monta a URL do JWKS em
// tempo de import e explode com `env.supabaseUrl` vazio. O CI nao tem `.env`
// (regra do CLAUDE.md), entao o teste passaria aqui e falharia la. Mesmo
// racional de ROADMAP_INTAKE_CHAT_DEFAULT_DAILY_LIMIT viver em shared/.

// Nome do indice unico parcial criado por
// 20260730180000_ai_roadmaps_one_generating_per_user.sql.
//
// ACOPLADO A MIGRATION: e por este nome que a rota distingue a corrida de
// geracao da colisao de slug. Renomear o indice la exige renomear aqui, e a
// migration diz isso no proprio cabecalho.
export const ONE_GENERATING_INDEX = "ai_roadmaps_one_generating_per_user";

/**
 * O 23505 de `ai_roadmaps` e da geracao concorrente, ou da colisao de slug?
 *
 * A tabela tem tres restricoes unicas (`ai_roadmaps_slug_key`,
 * `ai_roadmaps_user_id_slug_key` e a parcial acima) e as tres devolvem o MESMO
 * `code`. Os tratamentos sao OPOSTOS: colisao de slug se resolve gerando outro
 * slug e insistindo; corrida de geracao se resolve devolvendo 429 e parando.
 * Trocar um pelo outro faria o servidor insistir ate criar exatamente a geracao
 * duplicada que o indice existe para impedir.
 *
 * Funcao propria, e nao a condicao repetida em cada lugar, porque DOIS caminhos
 * colidem com este indice: o INSERT do /generate e o UPDATE do lock de /resume,
 * que tambem poe status='generating'. Regra do CLAUDE.md, "protecao dentro da
 * funcao": escrita uma vez, cobre os dois e cobre o terceiro que ainda nao
 * existe.
 */
export function isOneGeneratingCollision(
  error: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
  } | null,
): boolean {
  if (!error || error.code !== "23505") return false;
  return `${error.message ?? ""} ${error.details ?? ""}`.includes(
    ONE_GENERATING_INDEX,
  );
}
