/**
 * Cabeçalhos estruturais emitidos pelo PDF do LinkedIn.
 *
 * A lista é compartilhada pelo normalizador e pelo parser: um cabeçalho nunca
 * pode ser unido à linha anterior, contado como competência ou atravessado por
 * uma região de headline. Os ids distinguem as seções que o parser lê das que
 * servem apenas como fronteira segura.
 */
export type LinkedinSectionId =
  | "contato"
  | "sobre"
  | "experiencia"
  | "formacao"
  | "skills"
  | "idiomas"
  | "certificacoes"
  | "projetos"
  | "voluntariado"
  | "publicacoes"
  | "cursos"
  | "premios"
  | "organizacoes"
  | "interesses"
  | "recomendacoes"
  | "patentes"
  | "resultados_testes"
  | "destaques";

interface LinkedinSectionDefinition {
  id: LinkedinSectionId;
  labels: readonly string[];
  /** Seção principal: encerra o preâmbulo onde identidade/headline aparecem. */
  principal: boolean;
}

export function normalizeLinkedinSectionLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const SECTIONS: readonly LinkedinSectionDefinition[] = [
  { id: "contato", labels: ["contact", "contato"], principal: false },
  {
    id: "sobre",
    labels: ["summary", "resumo", "sobre", "about"],
    principal: true,
  },
  {
    id: "experiencia",
    labels: ["experience", "experiencia", "experiencia profissional"],
    principal: true,
  },
  {
    id: "formacao",
    labels: ["education", "formacao academica", "formacao", "educacao"],
    principal: true,
  },
  {
    id: "skills",
    labels: [
      "top skills",
      "principais competencias",
      "skills",
      "competencias",
      "aptidoes",
    ],
    principal: false,
  },
  { id: "idiomas", labels: ["languages", "idiomas"], principal: false },
  {
    id: "certificacoes",
    labels: [
      "licenses & certifications",
      "licencas e certificados",
      "certifications",
      "certificacao",
      "certificacoes",
      "certificados",
    ],
    principal: false,
  },
  {
    id: "projetos",
    labels: ["projects", "projetos"],
    principal: true,
  },
  {
    id: "voluntariado",
    labels: [
      "volunteer experience",
      "experiencia voluntaria",
      "volunteering",
      "voluntariado",
    ],
    principal: true,
  },
  {
    id: "publicacoes",
    labels: ["publications", "publicacoes"],
    principal: true,
  },
  { id: "cursos", labels: ["courses", "cursos"], principal: true },
  {
    id: "premios",
    labels: [
      "honors & awards",
      "honors and awards",
      "premios e reconhecimentos",
      "premios",
    ],
    principal: true,
  },
  {
    id: "organizacoes",
    labels: ["organizations", "organizacoes"],
    principal: true,
  },
  {
    id: "interesses",
    labels: ["interests", "interesses"],
    principal: true,
  },
  {
    id: "recomendacoes",
    labels: ["recommendations", "recomendacoes"],
    principal: true,
  },
  {
    id: "patentes",
    labels: ["patents", "patentes"],
    principal: true,
  },
  {
    id: "resultados_testes",
    labels: ["test scores", "resultados de testes"],
    principal: true,
  },
  {
    id: "destaques",
    labels: ["featured", "destaques"],
    principal: true,
  },
] as const;

const BY_LABEL = new Map<string, LinkedinSectionDefinition>();
for (const section of SECTIONS) {
  for (const label of section.labels) BY_LABEL.set(label, section);
}

export function linkedinSectionHeading(
  line: string,
): LinkedinSectionDefinition | null {
  const normalized = normalizeLinkedinSectionLabel(line);
  if (normalized.length === 0 || normalized.length > 60) return null;
  return BY_LABEL.get(normalized) ?? null;
}

export function isLinkedinSectionHeading(line: string): boolean {
  return linkedinSectionHeading(line) !== null;
}
