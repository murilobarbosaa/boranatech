import type { FaculdadeCurso } from "./faculdadesInstituicoes";

export type Subarea =
  | "Desenvolvimento"
  | "Dados e IA"
  | "Infra e Redes"
  | "Segurança"
  | "Gestão e Produto"
  | "Jogos"
  | "QA"
  | "Outros";

export const SUBAREA_ORDER: Subarea[] = [
  "Desenvolvimento",
  "Dados e IA",
  "Infra e Redes",
  "Segurança",
  "Gestão e Produto",
  "Jogos",
  "QA",
  "Outros",
];

// Classifica os valores que JA existem em areasLeva (Passo 0: 26 valores) numa
// subarea primaria. Nao inventa subarea nova; so agrupa o que ja esta no dado.
const AREA_TO_SUBAREA: Record<string, Subarea> = {
  Desenvolvimento: "Desenvolvimento",
  "Full-stack": "Desenvolvimento",
  "Front-end": "Desenvolvimento",
  "Back-end": "Desenvolvimento",
  "Desenvolvimento web": "Desenvolvimento",
  "Arquitetura de software": "Desenvolvimento",
  "Lideranca tecnica": "Desenvolvimento",
  "Analise de sistemas": "Desenvolvimento",
  "Ciencia de dados": "Dados e IA",
  BI: "Dados e IA",
  "Machine Learning": "Dados e IA",
  "IA e Machine Learning": "Dados e IA",
  Dados: "Dados e IA",
  Pesquisa: "Dados e IA",
  Redes: "Infra e Redes",
  IoT: "Infra e Redes",
  "Sistemas embarcados": "Infra e Redes",
  Robotica: "Infra e Redes",
  Seguranca: "Segurança",
  Pentest: "Segurança",
  SOC: "Segurança",
  "Gestao de TI": "Gestão e Produto",
  Governanca: "Gestão e Produto",
  Produto: "Gestão e Produto",
  "Desenvolvimento de jogos": "Jogos",
  QA: "QA",
};

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Sinal forte pelo nome do curso (tem prioridade sobre o mapa de areas).
function subareaPorNome(nome: string): Subarea | null {
  const n = norm(nome);
  if (/seguranca|ciberseguranca|cibernetica|defesa cibernetica/.test(n))
    return "Segurança";
  if (/jogos/.test(n)) return "Jogos";
  if (/redes/.test(n)) return "Infra e Redes";
  if (/engenharia de computacao/.test(n)) return "Infra e Redes";
  if (/ciencia de dados/.test(n)) return "Dados e IA";
  if (/gestao da tecnologia|gestao de ti|gestao da ti/.test(n))
    return "Gestão e Produto";
  if (
    /ciencia da computacao|engenharia de software|sistemas de informacao|analise e desenvolvimento|sistemas para internet/.test(
      n,
    )
  )
    return "Desenvolvimento";
  return null;
}

// Subarea dominante a partir dos valores de areasLeva.
function subareaPorAreas(areas: string[]): Subarea {
  const counts = new Map<Subarea, number>();
  for (const area of areas) {
    const sub = AREA_TO_SUBAREA[area];
    if (sub) counts.set(sub, (counts.get(sub) ?? 0) + 1);
  }
  let best: Subarea | null = null;
  let bestCount = 0;
  for (const sub of SUBAREA_ORDER) {
    const count = counts.get(sub) ?? 0;
    if (count > bestCount) {
      best = sub;
      bestCount = count;
    }
  }
  return best ?? "Outros";
}

export function subareaDoCurso(nome: string, areas: string[]): Subarea {
  return subareaPorNome(nome) ?? subareaPorAreas(areas);
}

export function subareaDaInstituicao(item: FaculdadeCurso): Subarea {
  return subareaDoCurso(item.curso, item.areasLeva);
}
