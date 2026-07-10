// Gera client/src/lib/homeData.generated.ts com a fatia minima que a home
// renderiza (Hero, CtaFinal, PraVoce), derivada dos arrays reais de data.ts,
// para as secoes nao arrastarem o catalogo inteiro pro grafo do boot.
// A logica de selecao replica exatamente a das secoes; nada inventado.
// Rodar com: pnpm generate:home-data (encadeado no prebuild).
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { areasTI, cursosGratuitos, eventos, noticias } from "../client/src/lib/data";

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "client",
  "src",
  "lib",
  "homeData.generated.ts",
);

// Hero: mesmos 8 slugs do FEATURED_SLUGS. O icone (componente Lucide) nao e
// serializavel, entao fica num mapa local do Hero; daqui vao slug e nome.
const FEATURED_SLUGS = [
  "frontend",
  "backend",
  "mobile",
  "dados",
  "uxui",
  "cloud",
  "devops",
  "ciberseguranca",
];

const featuredAreas = FEATURED_SLUGS.flatMap((slug) => {
  const area = areasTI.find((a) => a.slug === slug);
  return area ? [{ slug: area.slug, nome: area.nome }] : [];
});

// CtaFinal: os nomes das areas para o comando skills do terminal.
const skillsAreaNames = areasTI.map((area) => area.nome);

// PraVoce: mesma selecao da secao (find por id com fallback + indices 0 e 1).
const praVoceNoticia =
  noticias.find((n) => n.id === "vagas-ti-brasil") ?? noticias[0];
const praVoceEventos = [eventos[0], eventos[1]];

// Mesma logica do labelForCursoArea da PraVoce, resolvida em build time.
const CURSO_AREA_SPECIAL_LABELS: Record<string, string> = {
  carreira: "Carreira",
  fullstack: "Full Stack",
};

function labelForCursoArea(slug: string | null | undefined): string {
  if (!slug) return "Geral";
  return (
    areasTI.find((a) => a.slug === slug)?.nome ??
    CURSO_AREA_SPECIAL_LABELS[slug] ??
    slug
  );
}

const praVoceCursos = [cursosGratuitos[0], cursosGratuitos[1]].map((curso) => ({
  ...curso,
  areaLabel: labelForCursoArea(curso.areaSlug),
}));

const emit = (value: unknown) => JSON.stringify(value, null, 2);

const content = `// GENERATED FILE. Do not edit. Run pnpm generate:home-data
// Fatia minima renderizada pela home (Hero, CtaFinal, PraVoce), derivada dos
// arrays reais de data.ts em build time.

export const featuredAreas = ${emit(featuredAreas)};

export const skillsAreaNames = ${emit(skillsAreaNames)};

export const praVoceNoticia = ${emit(praVoceNoticia)};

export const praVoceEventos = ${emit(praVoceEventos)};

export const praVoceCursos = ${emit(praVoceCursos)};
`;

writeFileSync(OUT, content);
console.log(
  `[generateHomeData] featuredAreas=${featuredAreas.length} skillsAreaNames=${skillsAreaNames.length} noticia=${praVoceNoticia.id} eventos=${praVoceEventos.map((e) => e.id).join(",")} cursos=${praVoceCursos.map((c) => c.id).join(",")} -> ${path.relative(process.cwd(), OUT)}`,
);
