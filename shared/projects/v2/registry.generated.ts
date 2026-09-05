// GENERATED FILE. Do not edit. Run pnpm gen:projetos-v2
//
// Derivado dos arquivos de shared/projects/v2/. Para adicionar um projeto v2:
// criar shared/projects/v2/<id>.ts e rodar o gerador.
import type { ProjetoV2Detalhe } from "./types";

export const PROJETOS_V2_IDS = [
  "landing-page-pessoal",
] as const;

export const loaders: Record<
  string,
  () => Promise<{ default: ProjetoV2Detalhe }>
> = {
  "landing-page-pessoal": () => import("./landing-page-pessoal"),
};
