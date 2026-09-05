import { PROJETOS_V2_IDS, loaders } from "./registry.generated";
import type { ProjetoV2Detalhe } from "./types";

// Fonte unica de quais projetos tem detalhe v2. Pequeno de proposito: e o
// unico pedaco do v2 que vai no chunk compartilhado. O detalhe em si so
// carrega quando alguem pede (loadProjetoV2), um modulo por projeto.
//
// A lista e o mapa de loaders sao GERADOS dos arquivos do diretorio
// (scripts/generateProjectsV2Registry.mts). Para adicionar um projeto v2:
// criar shared/projects/v2/<id>.ts e rodar `pnpm gen:projetos-v2`. Nada de
// lista escrita a mao aqui: era o caso degenerado que o CLAUDE.md cataloga,
// tres lugares para lembrar e um teste avisando depois.
export { PROJETOS_V2_IDS };

// Ids que o mapa de loaders cobre. Existe para o guard poder comparar os dois
// conjuntos sem exportar o `loaders` inteiro.
export function loaderIds(): string[] {
  return Object.keys(loaders);
}

export function isProjetoV2(id: string): boolean {
  return id in loaders;
}

// null para id sem v2 (nunca lanca): quem chama decide o fallback v1. Um id
// desconhecido nao e erro, e o caso normal dos projetos que ainda nao
// migraram.
export async function loadProjetoV2(
  id: string,
): Promise<ProjetoV2Detalhe | null> {
  const loader = loaders[id];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}
