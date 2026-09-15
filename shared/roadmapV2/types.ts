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
  // Nas trilhas estaticas: id do catalogo de projetos (array projetos em
  // client/src/lib/data.ts), resolvido pelo ProjectCard. Roadmaps de IA
  // historicamente emitiram texto livre aqui, que nao resolve no catalogo
  // (o card cai no fallback de indisponivel); normalizar a geracao e assunto
  // da fase 5c.
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
  // Resumo de uma linha para o card da vitrine (/roadmaps). Opcional: sem
  // ele, o card usa a description. O generateRoadmapMeta leva ao meta.
  summary?: string;
  // Ausente: trilha de area (comportamento padrao, card no grid principal,
  // exige entrada correspondente em areasTI). "carreira": trilha transversal
  // de carreira, listada na secao "Trilhas de carreira" da listagem e sem
  // dependencia de areasTI.
  //
  // Convencao de `area` (mesma sentinela que "carreira" ja usa, ver
  // docs/glossario.md): trilha COM kind tem `area` IGUAL ao proprio kind
  // (area: "carreira", "linguagem", "framework" ou "ferramenta"); trilha SEM
  // kind tem `area` igual a um slug de areasTI. O pnpm check afirma os dois
  // sentidos (checkKinds em scripts/generateRoadmapMeta.mts).
  //
  // "linguagem": linguagem de programacao (JavaScript, Python, SQL).
  // "framework": framework, biblioteca ou runtime (React, Node, Django).
  // "ferramenta": ferramenta de trabalho (Git, Docker, Linux).
  // A vitrine agrupa "linguagem" e "framework" num mesmo bloco.
  kind?: "carreira" | "linguagem" | "framework" | "ferramenta";
  languages?: RoadmapLanguage[];
  // Linguagens em que o codigo desta trilha e escrito, como identificadores
  // de cerca markdown (js, ts, python, sql, bash, dockerfile, yaml...). So em
  // trilhas de kind linguagem, framework ou ferramenta; a primeira e a
  // principal. E o que liga o gerador de pool as perguntas de codigo: trilha
  // sem este campo gera so perguntas de conceito, como as trilhas de area.
  codeLanguages?: string[];
  sections: RoadmapSection[];
};
