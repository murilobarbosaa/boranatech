export type AreaCreator = {
  name: string;
  platform: string;
  url: string;
  handle?: string;
  avatarUrl?: string;
};

// Mapa de criadores por SLUG de area (ex.: "back-end": [...]). A Ana preenche
// com criadores reais por area. Nada de nome, @ ou link inventado aqui.
//
// "Desenvolvimento de Software" e uma CATEGORIA (frontend/backend/fullstack/
// mobile/gamedev), nao uma area unica; code.evelyn entra no slug mais geral de
// dev de software (fullstack). Dados reaproveitados de lib/creatorsData (mesma
// foto, @ e link) -- nada duplicado nem inventado.
export const areaCreators: Record<string, AreaCreator[]> = {
  fullstack: [
    {
      name: "Evelyn",
      handle: "code.evelyn",
      platform: "Instagram",
      url: "https://instagram.com/code.evelyn",
      avatarUrl: "/creators/code-evelyn.jpg",
    },
  ],
};
