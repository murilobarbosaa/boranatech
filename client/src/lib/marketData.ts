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
