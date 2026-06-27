export type AreaCreator = {
  name: string;
  platform: string;
  url: string;
  handle?: string;
  avatarUrl?: string;
};

// Mapa de criadores por SLUG de area (ex.: "back-end": [...]). Comeca vazio de
// proposito: a Ana preenche depois com criadores reais por area. Nada de nome,
// @ ou link inventado aqui.
export const areaCreators: Record<string, AreaCreator[]> = {};
