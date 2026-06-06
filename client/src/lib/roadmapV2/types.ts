export type RoadmapResource = {
  label: string;
  url: string;
  kind?: "artigo" | "video" | "curso" | "doc";
};

export type RoadmapNode = {
  id: string;
  title: string;
  description?: string;
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

export type RoadmapV2 = {
  slug: string;
  area: string;
  title: string;
  level: string;
  description: string;
  sections: RoadmapSection[];
};
