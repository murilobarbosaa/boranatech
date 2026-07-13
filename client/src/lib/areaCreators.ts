import { creators, type Creator } from "@/lib/creatorsData";

export type AreaCreator = {
  name: string;
  platform: string;
  url: string;
  handle?: string;
  avatarUrl?: string;
};

// Deriva do dado canonico em creatorsData.ts (fonte unica dos creators).
// Nada de nome, @, foto ou link duplicado ou inventado aqui: se o creator
// nao existe la, ele nao aparece em area nenhuma.
function fromHandles(...handles: string[]): AreaCreator[] {
  return handles
    .map((handle) => creators.find((c) => c.handle === handle))
    .filter((c): c is Creator => Boolean(c))
    .map((c) => ({
      name: c.name,
      platform: "Instagram",
      url: c.instagram,
      handle: `@${c.handle}`,
      avatarUrl: c.photo,
    }));
}

// Mapa de criadores por SLUG de area (slugs reais de client/src/lib/data.ts).
// Areas sem entrada caem no placeholder "Em breve" da pagina.
export const areaCreators: Record<string, AreaCreator[]> = {
  uxui: fromHandles("vua_nessa"),
  frontend: fromHandles("monihillman"),
  backend: fromHandles("ynara_dev", "erikabusiness"),
  sre: fromHandles("andrebrito.dev"),
  // Andre cobre SRE e DevOps de proposito, mesma pessoa nas duas areas.
  devops: fromHandles("andrebrito.dev"),
  fullstack: fromHandles("dioaugusto.dev", "code.evelyn"),
  "desenvolvimento-software": fromHandles("code.evelyn"),
  dados: fromHandles("grazi.tech", "raibyhei"),
  // Gio (gio.yaml): area a definir, ela escolhe depois.
};
