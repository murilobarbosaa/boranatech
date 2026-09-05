import type { ProjetoV2Detalhe } from "./types";

// Fonte unica de quais projetos tem detalhe v2. Pequeno de proposito: e o
// unico pedaco do v2 que vai no chunk compartilhado. O detalhe em si so
// carrega quando alguem pede (loadProjetoV2), um modulo por projeto.
//
// Para adicionar um projeto v2: criar shared/projects/v2/<id>.ts com
// `export default` de ProjetoV2Detalhe, e acrescentar o id AQUI, em `loaders`
// abaixo, em `all.ts` e em EXPECTED_V2_COUNT (v2.test.ts). O guard afirma que
// os quatro batem, entao esquecer um deles quebra o teste, nao a producao.
export const PROJETOS_V2_IDS = ["landing-page-pessoal"] as const;

// Escrito a mao, sem `import.meta.glob`: o indice tambem e importado pelo
// server, que nao passa pelo Vite e nao conhece esse recurso.
const loaders: Record<string, () => Promise<{ default: ProjetoV2Detalhe }>> = {
  "landing-page-pessoal": () => import("./landing-page-pessoal"),
};

// Ids que o mapa de loaders cobre. Existe para o guard poder comparar os dois
// conjuntos sem exportar o `loaders` inteiro.
export function loaderIds(): string[] {
  return Object.keys(loaders);
}

export function isProjetoV2(id: string): boolean {
  return id in loaders;
}

// null para id sem v2 (nunca lanca): quem chama decide o fallback v1. Um id
// desconhecido nao e erro, e o caso normal dos 265 projetos que ainda nao
// migraram.
export async function loadProjetoV2(
  id: string,
): Promise<ProjetoV2Detalhe | null> {
  const loader = loaders[id];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}
