export type SalaryRow = {
  area: string;
  level: string;
  city: string;
  clt?: number | string;
  pj?: number | string;
  bolsa?: string;
  fonte?: string;
  ano?: number;
};

// Os valores de clt/pj/bolsa vem como numero unico (entradas antigas) ou como
// faixa em texto "min-max" (entradas novas com fonte). Estes helpers lidam com
// os dois formatos e sao compartilhados entre /salarios e a pagina de detalhe
// de curso.
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function parseLow(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.split("-")[0]);
  return NaN;
}

export function parseHigh(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parts = value.split("-");
    return Number(parts[parts.length - 1]);
  }
  return NaN;
}

// Formata um valor de salario pra exibicao em card: numero unico vira
// "R$ 2.200"; faixa vira "R$ 4.000 a R$ 6.000". Retorna null quando o valor
// esta ausente ou nao e parseavel, pra quem chama poder esconder a linha.
export function formatSalaryValue(
  value: number | string | undefined | null,
): string | null {
  if (value == null) return null;
  const low = parseLow(value);
  const high = parseHigh(value);
  if (Number.isNaN(low) || Number.isNaN(high)) return null;
  if (low === high) return formatBRL(low);
  return `${formatBRL(low)} a ${formatBRL(high)}`;
}

const baseSalaryRows: SalaryRow[] = (
  [
    ["Front-end", "Estágio", "São Paulo", 2200, 3200],
    ["Front-end", "Trainee", "São Paulo", 3600, 5200],
    ["Front-end", "Júnior", "São Paulo", 4200, 6200],
    ["Back-end", "Trainee", "São Paulo", 3900, 5600],
    ["Back-end", "Júnior", "São Paulo", 4800, 7000],
    ["Dados", "Trainee", "São Paulo", 4000, 5800],
    ["Dados", "Júnior", "São Paulo", 5000, 7200],
    ["DevOps", "Trainee", "São Paulo", 4300, 6200],
    ["DevOps", "Júnior", "São Paulo", 5600, 8200],
    ["UX/UI", "Júnior", "São Paulo", 3900, 5800],
    ["QA", "Trainee", "São Paulo", 3200, 4800],
    ["Mobile", "Júnior", "São Paulo", 4700, 6900],
    ["QA", "Júnior", "São Paulo", 3600, 5400],
    ["Front-end", "Pleno", "Remoto", 7600, 10500],
    ["Back-end", "Pleno", "Remoto", 8600, 12000],
    ["Dados", "Pleno", "Remoto", 9000, 13000],
    ["DevOps", "Sênior", "Remoto", 14500, 21000],
    ["Produto", "Pleno", "Rio de Janeiro", 9000, 12500],
    ["Cloud", "Especialista", "Remoto", 18000, 26000],
  ] as [string, string, string, number, number][]
).map(([area, level, city, clt, pj]) => ({ area, level, city, clt, pj }));

const extraSalaryRows: SalaryRow[] = [
  { area: "QA / Testes", level: "Estágio", city: "São Paulo", bolsa: "1500-2500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "QA / Testes", level: "Júnior", city: "São Paulo", clt: "4000-6000", pj: "5500-8000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "QA / Testes", level: "Pleno", city: "São Paulo", clt: "6500-9500", pj: "9000-13000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "QA / Testes", level: "Sênior", city: "São Paulo", clt: "10000-15000", pj: "14000-20000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "QA / Testes", level: "Júnior", city: "Rio de Janeiro", clt: "3800-5500", pj: "5000-7500", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "QA / Testes", level: "Pleno", city: "Rio de Janeiro", clt: "6000-8800", pj: "8000-12000", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "QA / Testes", level: "Sênior", city: "Rio de Janeiro", clt: "9500-14000", pj: "13000-18500", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "QA / Testes", level: "Júnior", city: "Remoto", clt: "4200-6200", pj: "5800-8500", fonte: "Pesquisa Coodesh 2025", ano: 2025 },
  { area: "QA / Testes", level: "Pleno", city: "Remoto", clt: "7000-10000", pj: "9500-14000", fonte: "Pesquisa Coodesh 2025", ano: 2025 },
  { area: "QA / Testes", level: "Sênior", city: "Remoto", clt: "11000-16500", pj: "15000-22000", fonte: "Pesquisa Coodesh 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Estágio", city: "São Paulo", bolsa: "1800-2800", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Júnior", city: "São Paulo", clt: "5000-7500", pj: "7000-10000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Pleno", city: "São Paulo", clt: "8000-12500", pj: "11000-17000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Sênior", city: "São Paulo", clt: "13500-22000", pj: "18500-30000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Júnior", city: "Rio de Janeiro", clt: "4700-7000", pj: "6500-9500", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Pleno", city: "Rio de Janeiro", clt: "7500-11500", pj: "10000-15500", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Sênior", city: "Rio de Janeiro", clt: "12500-19500", pj: "17000-27000", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Júnior", city: "Remoto", clt: "5200-7800", pj: "7200-10500", fonte: "Pesquisa Coodesh 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Pleno", city: "Remoto", clt: "8500-13500", pj: "12000-18500", fonte: "Pesquisa Coodesh 2025", ano: 2025 },
  { area: "Segurança da Informação", level: "Sênior", city: "Remoto", clt: "14000-23500", pj: "19500-32000", fonte: "Pesquisa Coodesh 2025", ano: 2025 },
  { area: "Engenharia de Dados", level: "Estágio", city: "São Paulo", bolsa: "1800-2600", fonte: "State of Data Brazil 2024", ano: 2024 },
  { area: "Engenharia de Dados", level: "Júnior", city: "São Paulo", clt: "5000-7500", pj: "6500-10000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Engenharia de Dados", level: "Pleno", city: "São Paulo", clt: "8500-13000", pj: "11500-18000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Engenharia de Dados", level: "Sênior", city: "São Paulo", clt: "14000-22000", pj: "19000-30000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Engenharia de Dados", level: "Júnior", city: "Remoto", clt: "5500-8000", pj: "7500-11000", fonte: "State of Data Brazil 2024", ano: 2024 },
  { area: "Engenharia de Dados", level: "Pleno", city: "Remoto", clt: "9000-14500", pj: "12500-20000", fonte: "State of Data Brazil 2024", ano: 2024 },
  { area: "Engenharia de Dados", level: "Sênior", city: "Remoto", clt: "15000-24000", pj: "21000-33000", fonte: "State of Data Brazil 2024", ano: 2024 },
  { area: "Product Manager", level: "Estágio", city: "São Paulo", bolsa: "1600-2400", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Product Manager", level: "Júnior", city: "São Paulo", clt: "6000-8500", pj: "8000-11500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Product Manager", level: "Pleno", city: "São Paulo", clt: "9000-14000", pj: "12000-19000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Product Manager", level: "Sênior", city: "São Paulo", clt: "15000-24000", pj: "20000-33000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Product Manager", level: "Júnior", city: "Remoto", clt: "6200-8800", pj: "8500-12000", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Product Manager", level: "Pleno", city: "Remoto", clt: "9500-15000", pj: "13000-20500", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Product Manager", level: "Sênior", city: "Remoto", clt: "16000-25500", pj: "22000-35000", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Arquiteto de Software", level: "Sênior", city: "São Paulo", clt: "16000-26000", pj: "22000-36000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Arquiteto de Software", level: "Sênior", city: "Rio de Janeiro", clt: "14500-23000", pj: "20000-31000", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Arquiteto de Software", level: "Sênior", city: "Remoto", clt: "16500-27000", pj: "23000-38000", fonte: "Pesquisa Coodesh 2025", ano: 2025 },
  { area: "SRE / Engenharia de Plataforma", level: "Estágio", city: "São Paulo", bolsa: "1700-2700", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "SRE / Engenharia de Plataforma", level: "Júnior", city: "São Paulo", clt: "5000-7500", pj: "6500-10000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "SRE / Engenharia de Plataforma", level: "Pleno", city: "São Paulo", clt: "8500-13500", pj: "11500-18500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "SRE / Engenharia de Plataforma", level: "Sênior", city: "São Paulo", clt: "14000-23000", pj: "19000-32000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "BI / Business Intelligence", level: "Estágio", city: "São Paulo", bolsa: "1400-2200", fonte: "Robert Half 2025", ano: 2025 },
  { area: "BI / Business Intelligence", level: "Júnior", city: "São Paulo", clt: "4000-5500", pj: "5500-7500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "BI / Business Intelligence", level: "Pleno", city: "São Paulo", clt: "6000-9000", pj: "8000-12500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "BI / Business Intelligence", level: "Sênior", city: "São Paulo", clt: "10000-16000", pj: "13500-22000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Suporte / Help Desk", level: "Estágio", city: "São Paulo", bolsa: "1100-1600", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Suporte / Help Desk", level: "Júnior", city: "São Paulo", clt: "2300-3400", pj: "3200-4500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Suporte / Help Desk", level: "Pleno", city: "São Paulo", clt: "3500-5200", pj: "4800-7000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Suporte / Help Desk", level: "Sênior", city: "São Paulo", clt: "5500-8500", pj: "7500-11500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Redes / Infraestrutura", level: "Estágio", city: "São Paulo", bolsa: "1200-1800", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Redes / Infraestrutura", level: "Júnior", city: "São Paulo", clt: "3500-4800", pj: "4500-6500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Redes / Infraestrutura", level: "Pleno", city: "São Paulo", clt: "5200-8000", pj: "7000-11000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Redes / Infraestrutura", level: "Sênior", city: "São Paulo", clt: "8500-14000", pj: "12000-19000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Front-end", level: "Estágio", city: "Belo Horizonte", bolsa: "1200-1800", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Front-end", level: "Júnior", city: "Belo Horizonte", clt: "3500-5000", pj: "4500-6800", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Front-end", level: "Pleno", city: "Belo Horizonte", clt: "5500-8500", pj: "7500-11500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Front-end", level: "Sênior", city: "Belo Horizonte", clt: "9500-14500", pj: "13000-19000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Back-end", level: "Estágio", city: "Curitiba", bolsa: "1300-2000", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Back-end", level: "Júnior", city: "Curitiba", clt: "3800-5500", pj: "5000-7500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Back-end", level: "Pleno", city: "Curitiba", clt: "6000-9000", pj: "8000-12500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Back-end", level: "Sênior", city: "Curitiba", clt: "10000-15500", pj: "14000-21000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Full-stack", level: "Estágio", city: "Porto Alegre", bolsa: "1300-1900", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Full-stack", level: "Júnior", city: "Porto Alegre", clt: "4000-5800", pj: "5500-8000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Full-stack", level: "Pleno", city: "Porto Alegre", clt: "6500-9500", pj: "9000-13500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Full-stack", level: "Sênior", city: "Porto Alegre", clt: "11000-16500", pj: "15000-23000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "UX/UI Design", level: "Estágio", city: "Florianópolis", bolsa: "1200-1850", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "UX/UI Design", level: "Júnior", city: "Florianópolis", clt: "3600-5200", pj: "4800-7000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "UX/UI Design", level: "Pleno", city: "Florianópolis", clt: "5800-8800", pj: "8000-12000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "UX/UI Design", level: "Sênior", city: "Florianópolis", clt: "9500-15000", pj: "13500-20000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Back-end", level: "Estágio", city: "Recife", bolsa: "1100-1700", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Back-end", level: "Júnior", city: "Recife", clt: "3400-4800", pj: "4500-6500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Back-end", level: "Pleno", city: "Recife", clt: "5200-8000", pj: "7000-11000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Back-end", level: "Sênior", city: "Recife", clt: "9000-14000", pj: "12500-19000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Front-end", level: "Estágio", city: "Fortaleza", bolsa: "1000-1600", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Front-end", level: "Júnior", city: "Fortaleza", clt: "3200-4500", pj: "4200-6000", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Front-end", level: "Pleno", city: "Fortaleza", clt: "5000-7500", pj: "6500-10000", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Front-end", level: "Sênior", city: "Fortaleza", clt: "8500-13000", pj: "11500-17500", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Ciência de Dados", level: "Estágio", city: "Brasília", bolsa: "1400-2100", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Ciência de Dados", level: "Júnior", city: "Brasília", clt: "4500-6500", pj: "6000-9000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Ciência de Dados", level: "Pleno", city: "Brasília", clt: "7000-11000", pj: "9500-15000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Ciência de Dados", level: "Sênior", city: "Brasília", clt: "12000-18500", pj: "16500-25000", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Full-stack", level: "Estágio", city: "Interior de SP", bolsa: "1200-1800", fonte: "Glassdoor 2025", ano: 2025 },
  { area: "Full-stack", level: "Júnior", city: "Interior de SP", clt: "3500-5000", pj: "4800-6800", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Full-stack", level: "Pleno", city: "Interior de SP", clt: "5500-8500", pj: "7500-11500", fonte: "Robert Half 2025", ano: 2025 },
  { area: "Full-stack", level: "Sênior", city: "Interior de SP", clt: "9500-15000", pj: "13000-20000", fonte: "Robert Half 2025", ano: 2025 },
];

export const salaryRows: SalaryRow[] = [...baseSalaryRows, ...extraSalaryRows];

export const marketMonitor = {
  hotAreas: [
    { name: "Back-end", jobs: 1240, change: 8 },
    { name: "Dados", jobs: 980, change: 12 },
    { name: "Front-end", jobs: 920, change: 3 },
    { name: "DevOps", jobs: 760, change: 6 },
    { name: "UX/UI", jobs: 430, change: -2 },
  ],
  hotTechnologies: [
    "JavaScript",
    "Python",
    "SQL",
    "React",
    "Java",
    "AWS",
    "TypeScript",
    "Docker",
    "Node.js",
    "Git",
  ],
  hotCities: [
    { name: "São Paulo", jobs: 3200 },
    { name: "Remoto", jobs: 2850 },
    { name: "Rio de Janeiro", jobs: 920 },
    { name: "Belo Horizonte", jobs: 640 },
    { name: "Curitiba", jobs: 530 },
  ],
};

export const cities = [
  "Todas",
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
  "Recife",
  "Porto Alegre",
  "Florianópolis",
  "Fortaleza",
  "Brasília",
  "Interior de SP",
  "Remoto",
];
export const levels = [
  "Todos",
  "Estágio",
  "Trainee",
  "Júnior",
  "Pleno",
  "Sênior",
  "Especialista",
];
export const workTypes = ["Todos", "CLT", "PJ"];

export type MarketContextEntry = {
  tipo: string;
  descricao: string;
  fonte: string;
  regiao?: string;
  nivel?: string;
  periodo?: string;
  valorMedio?: string;
  percentualMedio?: string;
};

export const marketContext: MarketContextEntry[] = [
  { tipo: "salario_medio_regiao", regiao: "Sudeste", valorMedio: "9500", descricao: "Lidera as medias salariais de TI no pais, impulsionada pelos polos corporativos de SP e RJ.", fonte: "State of Data Brazil 2024" },
  { tipo: "salario_medio_regiao", regiao: "Sul", valorMedio: "8300", descricao: "Segundo maior rendimento medio em tecnologia, com polos de inovacao em SC, PR e RS.", fonte: "State of Data Brazil 2024" },
  { tipo: "salario_medio_regiao", regiao: "Centro-Oeste", valorMedio: "7800", descricao: "Media regional amparada por orgaos publicos e empresas de telecomunicacao em Brasilia.", fonte: "State of Data Brazil 2024" },
  { tipo: "salario_medio_regiao", regiao: "Nordeste", valorMedio: "6900", descricao: "Media cresce impulsionada por ecossistemas como o Porto Digital em Recife.", fonte: "State of Data Brazil 2024" },
  { tipo: "salario_medio_regiao", regiao: "Norte", valorMedio: "6200", descricao: "Menor media nacional, com contratacoes concentradas em polos industriais como Manaus e Belem.", fonte: "State of Data Brazil 2024" },
  { tipo: "diferenca_clt_pj", nivel: "Junior", percentualMedio: "30-40%", descricao: "No nivel junior o contrato PJ costuma pagar de 30% a 40% a mais que o bruto CLT.", fonte: "Pesquisa Coodesh 2024" },
  { tipo: "diferenca_clt_pj", nivel: "Pleno", percentualMedio: "35-45%", descricao: "No nivel pleno a remuneracao PJ se distancia para atrair profissionais que gerem seus beneficios.", fonte: "Pesquisa Coodesh 2024" },
  { tipo: "diferenca_clt_pj", nivel: "Senior", percentualMedio: "40-55%", descricao: "Profissionais seniors tem maior propensao a PJ, onde as faixas ultrapassam a CLT em mais de 40%.", fonte: "Pesquisa Coodesh 2024" },
  { tipo: "crescimento_salarial", periodo: "2024-2025", percentualMedio: "5-8%", descricao: "Salarios de tecnologia cresceram em ritmo moderado, acima da inflacao, apos estabilizacao pos-pandemia.", fonte: "Guia Salarial Robert Half 2025" },
];

export const marketTendencias = [
  { titulo: "Estabilizacao pos-layoffs e foco em eficiencia", descricao: "Apos as grandes ondas de demissoes, o mercado entrou em fase de consolidacao, priorizando contratacoes estrategicas de profissionais seniores com foco em ROI e eficiencia operacional.", fonte: "Guia Salarial Robert Half", ano: 2025 },
  { titulo: "Adocao consolidada do modelo hibrido", descricao: "O modelo totalmente remoto perdeu espaco para o formato hibrido (2 a 3 vezes por semana no escritorio), que passou a ser a exigencia majoritaria de empresas de medio e grande porte.", fonte: "Pesquisa State of Data Brazil", ano: 2024 },
  { titulo: "Explosao de demandas por IA generativa integrada", descricao: "Crescimento acelerado na busca por engenheiros capazes de integrar APIs de LLMs e arquiteturas RAG aos sistemas corporativos, elevando as faixas salariais da categoria.", fonte: "Tech Report Coodesh", ano: 2025 },
  { titulo: "Valorizacao de lideranca tecnica (Tech Lead)", descricao: "Aumento real nos salarios de engenheiros seniors que acumulam gestao de projetos ageis e mentoria, servindo de ponte entre metas de produto e execucao de engenharia.", fonte: "Glassdoor Market Insights", ano: 2025 },
];

export const marketTecnologias = [
  { nome: "Python (IA, LLMs e Dados)", faixaSeniorSP: "16000-24000", motivo: "Modelos preditivos, automacoes inteligentes e arquiteturas de dados complexas.", fonte: "State of Data Brazil", ano: 2024 },
  { nome: "Cloud Architecture (AWS, Azure, GCP)", faixaSeniorSP: "16000-25000", motivo: "Migracoes complexas, governanca de custos (FinOps) e ambientes resilientes.", fonte: "Guia Salarial Robert Half", ano: 2025 },
  { nome: "Rust", faixaSeniorSP: "16000-23000", motivo: "Alta valorizacao por escassez de profissionais e uso em infraestrutura critica.", fonte: "Tech Report Coodesh", ano: 2025 },
  { nome: "CyberSecurity / SIEM", faixaSeniorSP: "15000-24000", motivo: "Pressao regulatoria (LGPD) e aumento de ataques forcam empresas a reter especialistas.", fonte: "Guia Salarial Robert Half", ano: 2025 },
  { nome: "Data Engineering (Spark / Airflow)", faixaSeniorSP: "15000-23000", motivo: "Alta disputa por engenheiros que estruturam bases de dados para IA.", fonte: "State of Data Brazil", ano: 2024 },
  { nome: "Golang", faixaSeniorSP: "15000-22000", motivo: "Usado por fintechs e e-commerce para microsservicos de alta performance.", fonte: "Guia Salarial Robert Half", ano: 2025 },
  { nome: "Scala", faixaSeniorSP: "15000-22000", motivo: "Requisitado em financas e big data por integracao com ecossistema Spark.", fonte: "Glassdoor Market Insights", ano: 2025 },
  { nome: "Kubernetes / DevOps Avancado", faixaSeniorSP: "14000-22000", motivo: "Orquestracao de containers e automacao de CI-CD sao gargalos em empresas tradicionais.", fonte: "Tech Report Coodesh", ano: 2025 },
  { nome: "SAP / ABAP", faixaSeniorSP: "14000-21000", motivo: "Nicho de ERP corporativo com salarios consolidados elevados.", fonte: "Guia Salarial Robert Half", ano: 2025 },
  { nome: "Swift (iOS)", faixaSeniorSP: "14000-21000", motivo: "Escassez estrutural de desenvolvedores iOS nativos inflaciona os salarios.", fonte: "Glassdoor Market Insights", ano: 2025 },
  { nome: "Kotlin (Android)", faixaSeniorSP: "14000-20000", motivo: "Apps transacionais bancarios exigem maxima estabilidade nativa.", fonte: "Guia Salarial Robert Half", ano: 2025 },
  { nome: "Java / Spring Boot", faixaSeniorSP: "13000-19000", motivo: "Base dos maiores bancos e sistemas corporativos do Brasil.", fonte: "Tech Report Coodesh", ano: 2025 },
  { nome: "TypeScript / Node.js Avancado", faixaSeniorSP: "12000-18000", motivo: "Especialistas em arquitetura limpa e microsservicos mantem boa valorizacao.", fonte: "Tech Report Coodesh", ano: 2025 },
];

export const marketBeneficios = [
  { porte: "Startup", beneficio: "Flexibilidade total de horarios e home office", percentual: "85%", fonte: "Tech Report Coodesh", ano: 2025 },
  { porte: "Startup", beneficio: "Stock Options (opcoes de acoes)", percentual: "25%", fonte: "Tech Report Coodesh", ano: 2025 },
  { porte: "Media", beneficio: "VR e VA flexivel (Caju, Flash, etc.)", percentual: "92%", fonte: "Guia Salarial Robert Half", ano: 2025 },
  { porte: "Media", beneficio: "Assistencia medica e odontologica integral", percentual: "88%", fonte: "Guia Salarial Robert Half", ano: 2025 },
  { porte: "Grande", beneficio: "PLR (Participacao nos Lucros e Resultados)", percentual: "78%", fonte: "Glassdoor Market Insights", ano: 2025 },
  { porte: "Grande", beneficio: "Auxilio educacao e reembolso de certificacoes", percentual: "65%", fonte: "Guia Salarial Robert Half", ano: 2025 },
];

export const marketProgressao = [
  { area: "Engenharia de Software", juniorParaPleno: "2 a 3 anos", plenoParaSenior: "4 a 6 anos", fonte: "Tech Report Coodesh", ano: 2025 },
  { area: "Dados (Engenheiro, Cientista, Analista)", juniorParaPleno: "2 a 3 anos", plenoParaSenior: "3 a 5 anos", fonte: "State of Data Brazil", ano: 2024 },
  { area: "Product Management (PM e PO)", juniorParaPleno: "2 anos", plenoParaSenior: "4 a 5 anos", fonte: "Glassdoor Market Insights", ano: 2025 },
  { area: "QA / Engenharia de Testes", juniorParaPleno: "2 a 4 anos", plenoParaSenior: "5 a 7 anos", fonte: "Tech Report Coodesh", ano: 2025 },
  { area: "Design UI/UX", juniorParaPleno: "2 a 3 anos", plenoParaSenior: "4 a 6 anos", fonte: "Glassdoor Market Insights", ano: 2025 },
];

export const calculadoraExplicacoes = {
  fatorPJ: {
    titulo: "O que e o fator 0,68?",
    explicacao: "E o multiplicador padrao de mercado para estimar o equivalente CLT de uma proposta PJ. Ele provisiona o que o contrato PJ nao inclui automaticamente: ferias (8,33%), 13o salario (8,33%), FGTS (8%), INSS (ate 16%) e beneficios tipicos (plano de saude, VR/VA). Sem essas provisoes, o bruto PJ maior vira liquido menor.",
    exemplo: "Proposta PJ de R$ 10.000 x 0,68 = R$ 6.800 de equivalente CLT. Para valer mais que um CLT de R$ 10.000, o PJ precisa ser de pelo menos R$ 14.700.",
    fonte: "Metodologia Robert Half / Calculos CLT FGTS INSS",
    ano: 2025,
  },
  margemNegociacao: {
    titulo: "Por que 15% de margem?",
    explicacao: "E a variacao tipica aceitavel dentro das tabelas salariais corporativas para candidatos com diferenciais comprovados: certificacoes especificas, ingles fluente, dominio de ferramenta escassa na equipe. Nao e garantido; e o teto razoavel sem soar fora de mercado.",
    exemplo: "Se a tabela marca R$ 10.000 para Pleno, um candidato com diferencial pode pleitear ate R$ 11.500 na proposta final.",
    fonte: "Guia Salarial Robert Half",
    ano: 2025,
  },
  pjVsClt: {
    titulo: "Quando vale a pena PJ?",
    criterios: [
      "O PJ paga entre 40% e 50% a mais que o bruto CLT equivalente",
      "Voce tem disciplina para gerir ferias, 13o e impostos por conta",
      "Voce nao depende de estabilidade imediata (FGTS como reserva de emergencia)",
      "A empresa nao oferece beneficios que compensem (saude, PLR, educacao)",
    ],
    exemplo: "CLT de R$ 6.000 com beneficios so deve ser trocado por PJ se a proposta for pelo menos R$ 8.500 a R$ 9.000.",
    fonte: "Analise de Contratacoes Coodesh",
    ano: 2025,
  },
};
