import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  EXPECTED_APP_ROUTE_COUNT,
  NON_ROUTE_KEYS,
  ONBOARDING_REGISTRY,
  resolveRoutePattern,
} from "./registry";

// Este e o teste que impede a rota 97 de entrar sem classificacao.
//
// Ele le o App.tsx e compara com o registry nos DOIS sentidos ("o que declarei
// existe?" E "o que existe esta declarado?"), afirmando o TOTAL em vez da
// pertinencia. Guard que responde "as N que eu conheco estao la" nao serve:
// e exatamente a forma que falha PASSANDO quando o parser encolhe.
//
// O parser aqui e um regex, ou seja, da classe de instrumento que pode
// sub-casar em silencio. A contramedida esta em `conta as ocorrencias amplas e
// compara`: `<Route` (contagem grosseira, sem estrutura) precisa bater com o
// que o regex estruturado leu. Divergiu, aborta.

const APP_TSX = path.resolve(import.meta.dirname, "..", "..", "App.tsx");
const source = readFileSync(APP_TSX, "utf8");

/** Contagem AMPLA: toda abertura de <Route>, sem olhar atributo nenhum. */
const broadRouteTags = source.match(/<Route\b/g) ?? [];

/** Leitura ESTRUTURADA: os que tem `path="..."`, na ordem de declaracao. */
const parsedPaths = Array.from(
  source.matchAll(/<Route\s[^>]*?path="([^"]+)"/g),
  (match) => match[1],
);

/** Chaves do registry que vieram do <Switch>, na ordem de declaracao. */
const registryKeys = Object.keys(ONBOARDING_REGISTRY);
const nonRouteKeys = new Set<string>(NON_ROUTE_KEYS);
const registryRouteKeys = registryKeys.filter((key) => !nonRouteKeys.has(key));

describe("registry de onboarding: parser sobre o App.tsx", () => {
  it("a contagem ampla bate com a leitura estruturada", () => {
    // <Route> sem `path` e o catch-all do NotFound. Mais de um significa que o
    // regex de `path` deixou de casar alguma forma de declaracao, e a partir
    // dai TUDO abaixo mediria uma superficie menor sem acusar.
    const semPath = broadRouteTags.length - parsedPaths.length;
    expect(semPath).toBe(1);
  });

  it("afirma o total de rotas do App.tsx", () => {
    // Mesmo contrato de EXPECTED_TABLE_COUNT: mudar este numero e ato
    // deliberado, no commit que cria ou remove a rota.
    expect(broadRouteTags.length).toBe(EXPECTED_APP_ROUTE_COUNT);
  });
});

describe("registry de onboarding: cobertura nos dois sentidos", () => {
  it("toda rota do App.tsx esta classificada, na mesma ordem", () => {
    // A ordem entra na assercao porque `resolveRoutePattern` casa na ordem de
    // declaracao, igual ao <Switch>. Registry fora de ordem faria /roadmaps/ia
    // cair em /roadmaps/:slug sem nenhum teste reclamar.
    expect(registryRouteKeys).toEqual(parsedPaths.concat(["*"]));
  });

  it("nao ha chave no registry sem rota correspondente", () => {
    const conhecidas = new Set(
      parsedPaths.concat(["*"], NON_ROUTE_KEYS as readonly string[]),
    );
    const orfas = registryKeys.filter((key) => !conhecidas.has(key));
    expect(orfas).toEqual([]);
  });

  it("as chaves fora do <Switch> estao declaradas", () => {
    for (const key of NON_ROUTE_KEYS) {
      expect(ONBOARDING_REGISTRY[key]).toBeDefined();
    }
  });

  it("todo 'sem-onboarding' tem motivo escrito", () => {
    const semMotivo = Object.entries(ONBOARDING_REGISTRY)
      .filter(
        ([, entry]) =>
          entry.type === "sem-onboarding" && entry.motivo.trim() === "",
      )
      .map(([key]) => key);
    expect(semMotivo).toEqual([]);
  });

  it("a home e a unica rota com onboarding nesta etapa", () => {
    const comOnboarding = Object.entries(ONBOARDING_REGISTRY)
      .filter(([, entry]) => entry.type === "onboarding")
      .map(([key]) => key);
    expect(comOnboarding).toEqual(["/"]);
  });

  it("o import dinamico da home resolve para um OnboardingDef", async () => {
    const entry = ONBOARDING_REGISTRY["/"];
    if (entry.type !== "onboarding") throw new Error("home sem onboarding");
    const module = await entry.load();
    expect(module.default.screen).toBe("home");
    expect(module.default.steps.length).toBeGreaterThan(0);
  });
});

describe("resolveRoutePattern", () => {
  /** URL representativa de um padrao: cada `:param` vira um segmento concreto. */
  const urlFor = (pattern: string) =>
    pattern
      .split("/")
      .map((part) => (part.startsWith(":") ? `exemplo-${part.slice(1)}` : part))
      .join("/");

  it("nunca resolve para um padrao declarado DEPOIS do que casaria", () => {
    // Invariante barato e forte: se o matcher deixar de reconhecer um padrao,
    // a URL dele cai no catch-all, que e o ultimo, e o indice resolvido passa
    // do indice declarado. Pega tanto sub-casamento quanto ordem errada.
    registryRouteKeys.forEach((pattern, declaredIndex) => {
      if (pattern === "*") return;
      const resolved = resolveRoutePattern(urlFor(pattern));
      const resolvedIndex = registryRouteKeys.indexOf(resolved);
      expect(
        resolvedIndex,
        `${pattern} resolveu para ${resolved}`,
      ).toBeLessThanOrEqual(declaredIndex);
    });
  });

  it("resolve os casos de ordem que o App.tsx marca como frageis", () => {
    // As tres rotas que o comentario do App.tsx manda NAO reordenar.
    expect(resolveRoutePattern("/roadmaps/ia")).toBe("/roadmaps/ia");
    expect(resolveRoutePattern("/roadmaps/ia/frontend")).toBe(
      "/roadmaps/ia/:slug",
    );
    expect(resolveRoutePattern("/roadmaps/frontend/prova")).toBe(
      "/roadmaps/:slug/prova",
    );
    expect(resolveRoutePattern("/roadmaps/frontend")).toBe("/roadmaps/:slug");
  });

  it("literal ganha de parametrico", () => {
    expect(resolveRoutePattern("/tecnologias/comparar")).toBe(
      "/tecnologias/comparar",
    );
    expect(resolveRoutePattern("/tecnologias/react")).toBe(
      "/tecnologias/:slug",
    );
    expect(resolveRoutePattern("/perfil/conquistas")).toBe(
      "/perfil/conquistas",
    );
    expect(resolveRoutePattern("/perfil")).toBe("/perfil");
  });

  it("home, barra final e desconhecidos", () => {
    expect(resolveRoutePattern("/")).toBe("/");
    expect(resolveRoutePattern("/cursos/")).toBe("/cursos");
    expect(resolveRoutePattern("/nao-existe-em-lugar-nenhum")).toBe("*");
    expect(resolveRoutePattern("/areas/dados/engenharia/extra")).toBe("*");
  });

  it("/acesso e reconhecido mesmo nao sendo <Route>", () => {
    // Declarado DEPOIS do catch-all no objeto: se o catch-all voltasse a
    // participar da varredura, esta assercao cairia.
    expect(resolveRoutePattern("/acesso")).toBe("/acesso");
  });
});
