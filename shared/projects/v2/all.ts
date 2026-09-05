// Importa TODOS os modulos v2 estaticamente. So para testes e para o server
// (que nao se importa com tamanho de bundle). O client NUNCA importa este
// arquivo: o guard em client/src/lib/projectsV2Import.test.ts afirma isso, e
// existe porque importar `all` "por conveniencia" numa tela desfaz sozinho o
// motivo de o detalhe v2 morar em modulo separado.
import landingPagePessoal from "./landing-page-pessoal";
import type { ProjetoV2Detalhe } from "./types";

export const PROJETOS_V2: ProjetoV2Detalhe[] = [landingPagePessoal];
