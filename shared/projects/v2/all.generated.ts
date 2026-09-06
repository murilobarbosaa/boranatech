// GENERATED FILE. Do not edit. Run pnpm gen:projetos-v2
//
// Importa TODOS os modulos v2 estaticamente. So para testes e para o server
// (que nao se importa com tamanho de bundle). O client NUNCA importa este
// arquivo: o guard em client/src/lib/projectsV2Import.test.ts afirma isso.
import analiseDadosPublicos from "./analise-dados-publicos";
import apiRestTarefas from "./api-rest-tarefas";
import automacaoLoginCypress from "./automacao-login-cypress";
import landingPagePessoal from "./landing-page-pessoal";
import listaTarefasFullstack from "./lista-tarefas-fullstack";
import pipelineEtlPython from "./pipeline-etl-python";
import todoList from "./todo-list";
import type { ProjetoV2Detalhe } from "./types";

export const PROJETOS_V2: ProjetoV2Detalhe[] = [
  analiseDadosPublicos,
  apiRestTarefas,
  automacaoLoginCypress,
  landingPagePessoal,
  listaTarefasFullstack,
  pipelineEtlPython,
  todoList,
];
