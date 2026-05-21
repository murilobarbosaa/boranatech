import type { Idioma } from "@shared/curriculo/schema";

export interface CurriculoLabels {
  resumo: string;
  experiencia: string;
  projetosAtividades: string;
  formacao: string;
  habilidades: string;
  projetos: string;
  idiomas: string;
  certificacoes: string;
  presente: string;
  email: string;
  telefone: string;
  cidade: string;
}

const PT: CurriculoLabels = {
  resumo: "Resumo Profissional",
  experiencia: "Experiência Profissional",
  projetosAtividades: "Projetos e Atividades",
  formacao: "Formação",
  habilidades: "Habilidades",
  projetos: "Projetos",
  idiomas: "Idiomas",
  certificacoes: "Certificações",
  presente: "Atual",
  email: "Email",
  telefone: "Telefone",
  cidade: "Cidade",
};

const EN: CurriculoLabels = {
  resumo: "Professional Summary",
  experiencia: "Professional Experience",
  projetosAtividades: "Projects and Activities",
  formacao: "Education",
  habilidades: "Skills",
  projetos: "Projects",
  idiomas: "Languages",
  certificacoes: "Certifications",
  presente: "Present",
  email: "Email",
  telefone: "Phone",
  cidade: "City",
};

export function getLabels(idioma: Idioma): CurriculoLabels {
  return idioma === "en" ? EN : PT;
}
