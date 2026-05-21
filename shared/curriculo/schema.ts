import { z } from "zod";

/**
 * Schema canônico do currículo gerado pelo Natechinho.
 *
 * Decisão de design: campos sem dado obrigatório usam .nullable() em vez de
 * .optional(). Razão: OpenAI structured output (strict mode) exige toda chave
 * presente; nullable permite a IA mandar null. .optional() (undefined) gera
 * round-trip ruim porque o JSON sempre traz a chave.
 */

export const IDIOMAS = ["pt-BR", "en"] as const;
export const FORMATOS = ["hibrido", "cronologico", "harvard"] as const;
export const PERSONAS = ["estudante", "transicao", "junior", "experiente"] as const;

export const DadosPessoaisSchema = z.object({
  nome: z.string().min(1).describe("Nome completo da pessoa, vindo do cadastro."),
  email: z.string().email().describe("Email principal, vindo do cadastro."),
  telefone: z.string().nullable().describe("Telefone com DDD se a pessoa forneceu, senão null."),
  linkedin: z.string().nullable().describe("URL do LinkedIn ou null."),
  github: z.string().nullable().describe("URL do GitHub ou null."),
  cidade: z.string().nullable().describe("Cidade/UF ou null."),
});

export const ObjetivoSchema = z.object({
  cargo: z.string().min(1).describe("Cargo alvo (ex: Desenvolvedor Backend Júnior, Senior Software Engineer)."),
  area: z.string().min(1).describe("Área tech (ex: backend, frontend, dados, design, devops)."),
  nivel: z.string().min(1).describe("Nível buscado (estágio, trainee, júnior, pleno, sênior, lead)."),
});

export const FormacaoItemSchema = z.object({
  curso: z.string().min(1).describe("Nome do curso ou bootcamp."),
  instituicao: z.string().min(1).describe("Instituição."),
  periodo: z.string().min(1).describe("Período (ex: '2023 - 2025', '2024', 'em andamento desde 2023')."),
  status: z.string().nullable().describe("Status como 'concluído', 'em andamento', 'trancado', ou null."),
});

export const ExperienciaItemSchema = z.object({
  empresa: z.string().min(1).describe("Nome da empresa, projeto ou atividade."),
  cargo: z.string().min(1).describe("Cargo ou função exercida."),
  periodo: z.string().min(1).describe("Período (ex: 'jan/2024 até hoje', '2022 - 2024')."),
  responsabilidades: z
    .array(z.string())
    .describe("Bullets de responsabilidades em verbos de ação. Vazio se nada foi dito."),
  conquistas: z
    .array(z.string())
    .describe("Bullets de conquistas com quantificação quando possível. Vazio se nada foi dito."),
});

export const ProjetoItemSchema = z.object({
  nome: z.string().min(1).describe("Nome do projeto."),
  descricao: z.string().min(1).describe("Descrição curta do que o projeto faz."),
  tecnologias: z.array(z.string()).describe("Lista de tecnologias usadas."),
  link: z.string().nullable().describe("Link do projeto (repo, deploy, etc) ou null."),
});

export const IdiomaItemSchema = z.object({
  idioma: z.string().min(1).describe("Idioma (ex: Português, Inglês, Espanhol)."),
  nivel: z.string().min(1).describe("Nível (básico, intermediário, avançado, fluente, nativo)."),
});

export const CertificacaoItemSchema = z.object({
  nome: z.string().min(1).describe("Nome da certificação."),
  instituicao: z.string().min(1).describe("Quem emitiu."),
  ano: z.string().nullable().describe("Ano de emissão ou null."),
});

export const CurriculoSchema = z.object({
  dadosPessoais: DadosPessoaisSchema,
  objetivo: ObjetivoSchema,
  idioma: z.enum(IDIOMAS).describe("Idioma do conteúdo do currículo final."),
  formato: z.enum(FORMATOS).describe("Formato escolhido (hibrido, cronologico, harvard)."),
  persona: z.enum(PERSONAS).describe("Persona detectada (estudante, transicao, junior, experiente)."),
  resumoProfissional: z
    .string()
    .min(1)
    .describe("Parágrafo curto de 2 a 4 frases sintetizando objetivo, principais habilidades e diferencial."),
  formacao: z.array(FormacaoItemSchema).describe("Itens de formação. Vazio se nada foi mencionado."),
  experiencias: z
    .array(ExperienciaItemSchema)
    .describe(
      "Experiências profissionais. Pra persona estudante, este array pode representar atividades estruturadas como freelas, voluntariado, monitorias, ou ficar vazio se a pessoa só tem projetos puros.",
    ),
  projetos: z.array(ProjetoItemSchema).describe("Projetos pessoais ou acadêmicos."),
  habilidades: z.array(z.string()).describe("Lista de tecnologias e ferramentas mencionadas."),
  idiomas: z.array(IdiomaItemSchema).describe("Idiomas falados com nível. Vazio se só português."),
  certificacoes: z
    .array(CertificacaoItemSchema)
    .nullable()
    .describe("Certificações relevantes ou null se nenhuma foi mencionada."),
});

export type Curriculo = z.infer<typeof CurriculoSchema>;
export type DadosPessoais = z.infer<typeof DadosPessoaisSchema>;
export type Objetivo = z.infer<typeof ObjetivoSchema>;
export type FormacaoItem = z.infer<typeof FormacaoItemSchema>;
export type ExperienciaItem = z.infer<typeof ExperienciaItemSchema>;
export type ProjetoItem = z.infer<typeof ProjetoItemSchema>;
export type IdiomaItem = z.infer<typeof IdiomaItemSchema>;
export type CertificacaoItem = z.infer<typeof CertificacaoItemSchema>;
export type Idioma = (typeof IDIOMAS)[number];
export type Formato = (typeof FORMATOS)[number];
export type Persona = (typeof PERSONAS)[number];
