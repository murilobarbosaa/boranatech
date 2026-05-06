export interface Company {
  slug: string;
  name: string;
  logoUrl: string;
  segment: string;
  city: string;
  hiresJunior: boolean;
  hiringLevels: string[];
  technologies: string[];
  juniorSalary: string;
  description: string;
  culture: string[];
  benefits: string[];
  salaryByLevel: Array<{ level: string; range: string }>;
  hiringProcess: string[];
  difficulty: number;
  careerUrl: string;
  areas: string[];
  openJobs: Array<{ title: string; area: string; location: string; level: string }>;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "e").replace(/\//g, "-").replace(/\s+/g, "-");
}

const baseCompanies = [
  ["Nubank", "Fintech", "São Paulo", true, ["typescript", "python", "aws", "kubernetes"], "R$ 5.000 a R$ 8.000"],
  ["iFood", "E-commerce", "Osasco", true, ["java", "kotlin", "react", "aws"], "R$ 4.500 a R$ 7.000"],
  ["Mercado Livre", "E-commerce", "São Paulo", true, ["go", "java", "react", "kubernetes"], "R$ 5.000 a R$ 8.500"],
  ["Itaú", "Banco", "São Paulo", true, ["java", "angular", "aws", "sql"], "R$ 4.000 a R$ 6.500"],
  ["Bradesco", "Banco", "Osasco", true, ["java", "csharp", "sql", "azure"], "R$ 3.800 a R$ 6.200"],
  ["Totvs", "SaaS", "São Paulo", true, ["java", "react", "sql", "docker"], "R$ 3.500 a R$ 5.800"],
  ["CI&T", "Consultoria", "Campinas", true, ["react", "nodejs", "aws", "java"], "R$ 3.800 a R$ 6.000"],
  ["Stefanini", "Consultoria", "São Paulo", true, ["java", "sql", "azure", "react"], "R$ 3.200 a R$ 5.300"],
  ["Accenture", "Consultoria", "São Paulo", true, ["java", "python", "azure", "sql"], "R$ 3.800 a R$ 6.300"],
  ["Zup Innovation", "Consultoria", "Uberlândia", true, ["kotlin", "java", "react", "docker"], "R$ 4.200 a R$ 6.800"],
  ["PicPay", "Fintech", "Vitória", true, ["java", "kotlin", "aws", "redis"], "R$ 4.000 a R$ 6.800"],
  ["Stone", "Fintech", "Rio de Janeiro", true, ["python", "go", "react", "aws"], "R$ 4.200 a R$ 7.200"],
  ["Creditas", "Fintech", "São Paulo", true, ["ruby", "react", "postgresql", "aws"], "R$ 4.000 a R$ 6.700"],
  ["QuintoAndar", "Startup", "São Paulo", true, ["python", "react", "typescript", "aws"], "R$ 4.500 a R$ 7.400"],
  ["Loft", "Startup", "São Paulo", false, ["python", "react", "sql", "aws"], "R$ 4.800 a R$ 7.800"],
  ["Gympass/Wellhub", "SaaS", "São Paulo", false, ["go", "react", "kubernetes", "aws"], "R$ 5.000 a R$ 8.000"],
  ["Conta Azul", "SaaS", "Joinville", true, ["java", "react", "mysql", "aws"], "R$ 3.500 a R$ 5.800"],
  ["RD Station", "SaaS", "Florianópolis", true, ["ruby", "react", "postgresql", "aws"], "R$ 3.800 a R$ 6.300"],
  ["Hotmart", "SaaS", "Belo Horizonte", true, ["java", "react", "go", "aws"], "R$ 4.000 a R$ 6.800"],
  ["Locaweb", "SaaS", "São Paulo", true, ["php", "linux", "mysql", "docker"], "R$ 3.300 a R$ 5.500"],
] as const;

const companyLogoDomains: Record<string, string> = {
  Nubank: "nubank.com.br",
  iFood: "ifood.com.br",
  "Mercado Livre": "mercadolivre.com.br",
  Itaú: "itau.com.br",
  Bradesco: "bradesco.com.br",
  Totvs: "totvs.com",
  "CI&T": "ciandt.com",
  Stefanini: "stefanini.com",
  Accenture: "accenture.com",
  "Zup Innovation": "zup.com.br",
  PicPay: "picpay.com",
  Stone: "stone.com.br",
  Creditas: "creditas.com",
  QuintoAndar: "quintoandar.com.br",
  Loft: "loft.com.br",
  "Gympass/Wellhub": "wellhub.com",
  "Conta Azul": "contaazul.com",
  "RD Station": "rdstation.com",
  Hotmart: "hotmart.com",
  Locaweb: "locaweb.com.br",
};

const entryLevels = ["Estágio", "Trainee", "Júnior"];
const seniorLevels = ["Pleno", "Sênior"];

export const companies: Company[] = baseCompanies.map(([name, segment, city, hiresJunior, technologies, juniorSalary], index) => ({
  slug: slugify(name),
  name,
  logoUrl: `https://www.google.com/s2/favicons?domain=${companyLogoDomains[name]}&sz=128`,
  segment,
  city,
  hiresJunior,
  hiringLevels: hiresJunior
    ? [...entryLevels, ...(index % 3 === 0 ? ["Pleno"] : [])]
    : [...seniorLevels, ...(index % 2 === 0 ? ["Trainee"] : [])],
  technologies: [...technologies],
  juniorSalary,
  description: `${name} atua em ${segment.toLowerCase()} e mantém times de produto, engenharia, dados, design e infraestrutura para construir soluções digitais em escala.`,
  culture: ["Times multidisciplinares", "Ritmo de produto digital", "Aprendizado contínuo", "Colaboração entre negócio e tecnologia"],
  benefits: ["Plano de saúde", "Vale-refeição", "Modelo híbrido ou remoto", "Auxílio educação"],
  salaryByLevel: [
    { level: "Estágio", range: "R$ 1.500 a R$ 2.800" },
    { level: "Trainee", range: "R$ 3.500 a R$ 5.500" },
    { level: "Júnior", range: juniorSalary },
    { level: "Pleno", range: "R$ 7.000 a R$ 11.000" },
    { level: "Sênior", range: "R$ 12.000 a R$ 20.000" },
  ],
  hiringProcess: ["Inscrição e triagem", "Conversa com RH", "Teste técnico ou case", "Entrevista técnica", "Conversa final e proposta"],
  difficulty: hiresJunior ? 3 + (index % 2) : 5,
  careerUrl: `https://www.google.com/search?q=carreiras+${encodeURIComponent(name)}`,
  areas: ["frontend", "backend", "dados", "devops"].slice(0, 2 + (index % 3)),
  openJobs: [
    ...(hiresJunior ? [
      { title: "Estágio em Tecnologia", area: "Carreira inicial", location: city, level: "Estágio" },
      { title: "Trainee em Tecnologia", area: "Carreira inicial", location: city, level: "Trainee" },
      { title: "Desenvolvedor(a) Júnior", area: "Engenharia", location: city, level: "Júnior" },
    ] : []),
    ...(!hiresJunior && index % 2 === 0 ? [{ title: "Trainee em Produto e Tecnologia", area: "Carreira inicial", location: city, level: "Trainee" }] : []),
    { title: "Pessoa Desenvolvedora Pleno", area: "Engenharia", location: city, level: "Pleno" },
  ],
}));

export const companySegments = ["Todas", "Fintech", "E-commerce", "SaaS", "Consultoria", "Banco", "Startup", "Big Tech"];
export const companyCities = ["Todas", "São Paulo", "Osasco", "Campinas", "Rio de Janeiro", "Belo Horizonte", "Florianópolis", "Joinville", "Vitória", "Uberlândia"];
export const companyHiringLevels = ["Todas", "Estágio", "Trainee", "Júnior", "Pleno", "Sênior"];

export const juniorCompanyRanking = companies
  .filter((company) => company.hiresJunior)
  .map((company, index) => ({
    position: index + 1,
    company: company.name,
    logoUrl: company.logoUrl,
    juniorJobs: 18 - (index % 7),
    areas: company.areas.join(", "),
  }));
