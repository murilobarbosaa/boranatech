import type { ProjetoRequisito } from "../catalog";

// Tipos do schema v2 do projeto. Vivem FORA de catalog.ts de proposito: o
// catalogo entra no chunk compartilhado do client (data.ts o reexporta e 23
// arquivos o importam), e o detalhe v2 nao pode ir junto.

// Entrega esperada do projeto. Decide o formulario de entrega e quais
// verificacoes automaticas fazem sentido (lote 04).
export type ProjetoTipoEntrega =
  | "repo_deploy"
  | "repo"
  | "figma"
  | "notebook"
  | "documento"
  | "dashboard";

export type ProjetoBriefing = {
  contexto: string;
  aprende: string[];
  preRequisitos: Array<{ rotulo: string; href: string }>;
  tempoEstimado: { horas: [number, number]; semanas?: [number, number] };
};

export type ProjetoEtapa = {
  id: string;
  titulo: string;
  tempo: string;
  oQueFazer: string[];
  prontoQuando: string;
};

export type ProjetoKitItem = {
  tipo:
    | "figma"
    | "dataset"
    | "api"
    | "repo_base"
    | "modelo"
    | "checklist"
    | "link";
  titulo: string;
  url?: string;
  nota?: string;
};

export type ProjetoAjuda = {
  video?: { titulo: string; url: string };
  trilha?: { slug: string; nodeIds: string[] };
  termos?: string[];
};

export type ProjetoVerificacaoAuto =
  | "deploy_responde"
  | "repo_publico"
  | "readme_existe"
  | "readme_tem_link_deploy"
  | "min_commits_5"
  | `arquivo:${string}`
  | `pasta:${string}`
  | "artefato_responde";

// Detalhe v2 de um projeto: os blocos que a pagina renderiza quando o card
// abre. Vive em um modulo por projeto (shared/projects/v2/<id>.ts) e e
// carregado sob demanda, para o catalogo (que vai no chunk compartilhado do
// client) continuar leve. O id repete o do catalogo e o guard afirma a
// igualdade.
export type ProjetoV2Detalhe = {
  id: string;
  tipoEntrega: ProjetoTipoEntrega;
  briefing: ProjetoBriefing;
  requisitos: ProjetoRequisito[];
  etapas: ProjetoEtapa[];
  kit?: ProjetoKitItem[];
  ajuda?: ProjetoAjuda;
  verificacaoAutomatica?: ProjetoVerificacaoAuto[];
};
