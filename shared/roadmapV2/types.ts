export type RoadmapResource = {
  label: string;
  url: string;
  kind?: "artigo" | "video" | "curso" | "doc";
};

export type RoadmapNodeLanguageContent = {
  content?: string;
  resources?: RoadmapResource[];
};

export type RoadmapNode = {
  id: string;
  title: string;
  description?: string;
  content?: string;
  byLanguage?: Record<string, RoadmapNodeLanguageContent>;
  project?: string;
  estimatedTime?: string;
  optional?: boolean;
  resources?: RoadmapResource[];
  children?: RoadmapNode[];
};

export type RoadmapSection = {
  id: string;
  title: string;
  description?: string;
  level?: "iniciante" | "intermediario" | "avancado";
  children: RoadmapNode[];
};

export type RoadmapLanguage = {
  id: string;
  label: string;
};

export type RoadmapV2 = {
  slug: string;
  area: string;
  title: string;
  level: string;
  description: string;
  // Ausente: trilha de area (comportamento padrao, card no grid principal,
  // exige entrada correspondente em areasTI). "carreira": trilha transversal
  // de carreira, listada na secao "Trilhas de carreira" da listagem e sem
  // dependencia de areasTI.
  kind?: "carreira";
  languages?: RoadmapLanguage[];
  sections: RoadmapSection[];
};
