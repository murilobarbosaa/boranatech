// Titulos das trilhas em ingles, para a APRESENTACAO bilingue do certificado
// (pagina + SVG/PDF/PNG em EN). Traducao fiel dos titulos reais (PT), sem mudar
// o sentido; "do Zero" -> "from Scratch". O snapshot/banco continua em PT (a
// verdade congelada); isto e so uma projecao de exibicao. Chave: slug da trilha.
export const ROADMAP_TITLES_EN: Record<string, string> = {
  frontend: "Front-end from Scratch",
  backend: "Back-end from Scratch",
  fullstack: "Full-stack from Scratch",
  dados: "Data Science from Scratch",
  uxui: "UX/UI Design from Scratch",
  "inteligencia-artificial": "Artificial Intelligence from Scratch",
  produto: "Digital Product from Scratch",
  ciberseguranca: "Cybersecurity from Scratch",
  cloud: "Cloud Computing from Scratch",
  gestao: "Tech Project Management from Scratch",
  qa: "QA and Software Testing from Scratch",
  mobile: "Mobile Development from Scratch",
  devops: "DevOps from Scratch",
  gamedev: "Game Development from Scratch",
  "analise-dados": "Data Analytics and BI from Scratch",
  "engenharia-dados": "Data Engineering from Scratch",
  "banco-de-dados": "Databases and DBA from Scratch",
  sre: "SRE from Scratch",
  infraestrutura: "IT Support and Infrastructure from Scratch",
  "analise-sistemas": "Systems Analysis from Scratch",
  blockchain: "Blockchain and Web3 from Scratch",
  iot: "IoT and Embedded Systems from Scratch",
  mainframe: "Mainframe and COBOL from Scratch",
  "comecar-do-zero": "Getting Started in Tech",
  linkedin: "LinkedIn for Internships and Trainee Roles",
  "engenharia-software": "Software Engineering from Scratch",
  mlops: "MLOps and Machine Learning Engineer from Scratch",
  suporte: "Technical Support and Help Desk from Scratch",
  "tech-writer": "Tech Writer and Documentation from Scratch",
  erp: "Enterprise Systems and ERP from Scratch",
};

// Titulo da trilha no idioma pedido. Fallback: o proprio titulo (PT) se nao
// houver mapeamento EN (ex trilha nova ainda nao traduzida).
export function localizedRoadmapTitle(
  slug: string,
  ptTitle: string,
  lang: "pt" | "en",
): string {
  if (lang === "en") return ROADMAP_TITLES_EN[slug] ?? ptTitle;
  return ptTitle;
}
