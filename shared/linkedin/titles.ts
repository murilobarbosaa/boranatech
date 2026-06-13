import type { AreaSlug } from "../areas";

/**
 * Títulos de cargo por área usados no matching do analisador de LinkedIn.
 *
 * PT_TITLES espelha os AreaTI.cargos de client/src/lib/data.ts (que é
 * client-only por importar ícones do lucide, então não dá pra importar do
 * server sem arrastar a lib inteira pro bundle). Mantido manualmente em
 * sincronia, igual ao acordo de shared/areas.ts com baseAreasTI.
 *
 * ENGLISH_TITLES traz os títulos que recrutadores realmente usam em buscas
 * internacionais (LinkedIn Recruiter), 2 a 4 por área, sem termo exótico.
 */

export const PT_TITLES: Record<AreaSlug, string[]> = {
  frontend: [
    "Desenvolvedor Front-end Júnior",
    "Desenvolvedor React",
    "Engenheiro de Interface",
    "UI Developer",
  ],
  backend: [
    "Desenvolvedor Back-end Júnior",
    "Engenheiro de Software",
    "Desenvolvedor Node.js",
    "Desenvolvedor Python",
  ],
  fullstack: [
    "Desenvolvedor Full-stack Júnior",
    "Desenvolvedor Full-stack Pleno",
    "Desenvolvedor Full-stack Sênior",
    "Tech Lead",
  ],
  dados: [
    "Analista de Dados Júnior",
    "Cientista de Dados",
    "Engenheiro de Dados",
    "Analista de BI",
  ],
  uxui: [
    "Designer UX/UI Júnior",
    "Product Designer",
    "UI Designer",
    "UX Researcher",
  ],
  ia: [
    "Engenheiro de ML Júnior",
    "Pesquisador de IA",
    "Desenvolvedor de IA",
    "Engenheiro de Dados",
  ],
  produto: [
    "Assistente de Produto",
    "Analista de Produto",
    "Product Manager Júnior",
    "Product Owner",
  ],
  ciberseguranca: [
    "Analista de Segurança Júnior",
    "Analista SOC",
    "Pentester",
    "Engenheiro de Segurança",
  ],
  cloud: [
    "Analista de Cloud Júnior",
    "Cloud Engineer",
    "DevOps Engineer",
    "SRE",
  ],
  gestao: [
    "Scrum Master Júnior",
    "Analista de PMO",
    "Coordenador de Projetos",
    "Agile Coach",
  ],
  qa: [
    "Analista de QA Júnior",
    "Testador de Software",
    "QA Engineer",
    "Analista de Testes",
  ],
  mobile: [
    "Desenvolvedor Mobile Júnior",
    "Desenvolvedor React Native",
    "Desenvolvedor Flutter",
    "Engenheiro Mobile",
  ],
  devops: [
    "Engenheiro DevOps Júnior",
    "SRE",
    "Engenheiro de Plataforma",
    "Cloud Engineer",
  ],
  gamedev: [
    "Programador de Jogos Júnior",
    "Programador de Jogos Pleno",
    "Programador de Jogos Sênior",
    "Gameplay Programmer",
  ],
  "analise-dados": [
    "Analista de Dados Júnior",
    "Analista de BI",
    "Analista de Dados Pleno",
    "Analista de Dados Sênior",
  ],
  "engenharia-dados": [
    "Engenheiro de Dados Júnior",
    "Engenheiro de Dados Pleno",
    "Engenheiro de Dados Sênior",
    "Arquiteto de Dados",
  ],
  "banco-de-dados": [
    "DBA Júnior",
    "Administrador de Banco de Dados",
    "DBA Pleno",
    "DBA Sênior",
  ],
  sre: [
    "Site Reliability Engineer Júnior",
    "Site Reliability Engineer Pleno",
    "Site Reliability Engineer Sênior",
    "Platform Engineer",
  ],
  infraestrutura: [
    "Analista de Suporte Técnico",
    "Analista de Infraestrutura Júnior",
    "Analista de Redes",
    "Administrador de Sistemas",
  ],
  "analise-sistemas": [
    "Analista de Sistemas Júnior",
    "Analista de Requisitos",
    "Analista de Negócios",
    "Analista de Sistemas Sênior",
  ],
  blockchain: [
    "Desenvolvedor Blockchain Júnior",
    "Desenvolvedor Solidity",
    "Engenheiro Web3",
    "Desenvolvedor Blockchain Sênior",
  ],
  iot: [
    "Desenvolvedor de Firmware Júnior",
    "Engenheiro de Sistemas Embarcados",
    "Desenvolvedor IoT",
    "Engenheiro de Firmware Sênior",
  ],
};

export const ENGLISH_TITLES: Record<AreaSlug, string[]> = {
  frontend: ["Frontend Developer", "Front-end Engineer", "Software Engineer"],
  backend: ["Backend Developer", "Back-end Engineer", "Software Engineer"],
  fullstack: [
    "Full Stack Developer",
    "Full Stack Engineer",
    "Software Engineer",
  ],
  dados: ["Data Scientist", "Data Analyst", "Machine Learning Engineer"],
  uxui: ["Product Designer", "UX Designer", "UI Designer"],
  ia: ["Machine Learning Engineer", "AI Engineer", "Data Scientist"],
  produto: ["Product Manager", "Product Owner", "Associate Product Manager"],
  ciberseguranca: [
    "Security Analyst",
    "Security Engineer",
    "Penetration Tester",
  ],
  cloud: ["Cloud Engineer", "Solutions Architect", "DevOps Engineer"],
  gestao: ["Project Manager", "Scrum Master", "Agile Coach"],
  qa: ["QA Engineer", "Quality Assurance Analyst", "Test Engineer"],
  mobile: ["Mobile Developer", "Android Developer", "iOS Developer"],
  devops: ["DevOps Engineer", "Site Reliability Engineer", "Platform Engineer"],
  gamedev: ["Game Developer", "Gameplay Programmer", "Game Programmer"],
  "analise-dados": [
    "Data Analyst",
    "Business Intelligence Analyst",
    "BI Analyst",
  ],
  "engenharia-dados": [
    "Data Engineer",
    "Analytics Engineer",
    "Big Data Engineer",
  ],
  "banco-de-dados": [
    "Database Administrator",
    "Database Engineer",
    "Database Developer",
  ],
  sre: ["Site Reliability Engineer", "Platform Engineer", "DevOps Engineer"],
  infraestrutura: [
    "IT Support Analyst",
    "Infrastructure Analyst",
    "System Administrator",
    "Network Analyst",
  ],
  "analise-sistemas": [
    "Systems Analyst",
    "Business Analyst",
    "Requirements Analyst",
  ],
  blockchain: [
    "Blockchain Developer",
    "Smart Contract Developer",
    "Web3 Developer",
  ],
  iot: ["Embedded Software Engineer", "Firmware Engineer", "IoT Developer"],
};
