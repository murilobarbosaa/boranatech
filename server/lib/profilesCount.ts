import { supabaseAdmin } from "./supabaseAdmin";

// FONTE ÚNICA da contagem TOTAL de perfis.
//
// POR QUE ESTE ARQUIVO EXISTE. Até 2026-08-14 havia duas contagens de `profiles`
// escritas separadamente: `queryProfilesCount` em `server/routes/stats.ts` (o
// contador público da home, sem filtro) e `contarPerfis` em
// `server/routes/admin.ts` (o card da Visão, com `created_at` na janela). Elas
// medem coisas diferentes de propósito, e isso está certo, o problema é que a
// única forma de o admin mostrar o TOTAL era escrever uma terceira contagem, e a
// terceira é sempre a que diverge, porque ninguém olha para ela.
//
// A divergência de 4.790 contra 5.456 investigada em
// `docs/investigacoes/2026-08-14-admin-visao-metricas.md` fechou em 666/666 e NÃO
// foi causada por isso, foi a janela de 30 dias. Este módulo existe para que a
// próxima não possa ser causada por isso: com a query morando aqui dentro,
// acrescentar um filtro ao total do admin sem acrescentar ao da home deixa de ser
// possível por construção, e não por alguém lembrar.
//
// PROTEÇÃO DENTRO DA FUNÇÃO, NÃO NO CALL SITE. É a regra do CLAUDE.md: guarda
// escrita no chamador precisa ser repetida em cada chamador e some no primeiro
// que alguém esquecer. Aqui o chamador não tem o que esquecer, ele não escreve
// query nenhuma.
//
// O que NÃO mora aqui: a política de last-known-good e o TTL de 5 minutos do
// endpoint público. Aquilo é decisão de COMO SERVIR um endpoint anônimo que não
// pode devolver 0 inventado, não decisão de O QUE CONTAR. Ver `server/routes/stats.ts`.

/**
 * Quantos perfis existem, sem nenhum recorte.
 *
 * `null` quando o Supabase resolve sem erro mas devolve `count` não numérico
 * (degradação silenciosa observada em produção). É ausência, e quem chama decide
 * o que fazer com ela, nunca 0, que seria indistinguível de "base vazia".
 * Erro de banco PROPAGA: uma contagem de gente que erra para menos não levanta
 * suspeita de ninguém.
 */
export async function contarPerfisTotal(): Promise<number | null> {
  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return typeof count === "number" ? count : null;
}
