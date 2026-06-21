import { z } from "zod";

/**
 * Schema canônico do plano de estudos estruturado (PlanoEstudos).
 *
 * A conversa do Natechinho (tool study-plan) roda em streaming separado; este
 * plano é montado pela tool estruturada study-plan-build a partir do histórico.
 * Os itens referenciam SÓ conteúdo curado real, por UUID, validado no servidor
 * (titulo/slug/url canônicos) antes de chegar no front.
 *
 * Decisão de design (mesma do currículo): campos sem dado obrigatório usam
 * .nullable() em vez de .optional(), porque o structured output da OpenAI em
 * strict mode exige toda chave presente; nullable permite a IA mandar null.
 */

export const PLANO_NIVEIS = ["iniciante", "intermediario", "avancado"] as const;
export const PLANO_STATUS = ["coletando", "montando", "pronto"] as const;
export const PLANO_ITEM_TIPOS = [
  "curso",
  "tecnologia",
  "plataforma",
  "projeto",
] as const;

export const PlanoAreaSchema = z.object({
  slug: z
    .string()
    .min(1)
    .describe("Slug da área (ex: frontend, backend, dados)."),
  titulo: z.string().min(1).describe("Nome de exibição da área."),
});

export const PlanoItemSchema = z.object({
  tipo: z
    .enum(PLANO_ITEM_TIPOS)
    .describe("Tipo do conteúdo curado referenciado."),
  id: z
    .string()
    .min(1)
    .describe(
      "UUID do item no catálogo curado. Use SOMENTE ids fornecidos no catálogo, nunca invente.",
    ),
  titulo: z
    .string()
    .min(1)
    .describe(
      "Título do item, apenas para exibição. O servidor sobrescreve pelo título canônico do banco.",
    ),
  slug: z
    .string()
    .describe(
      "Slug do item. Pode deixar vazio; o servidor sobrescreve pelo slug canônico do banco.",
    ),
  url: z
    .string()
    .nullable()
    .describe(
      "URL externa do item. Deixe null; o servidor sobrescreve com a URL canônica do banco quando houver.",
    ),
});

export const PlanoSemanaSchema = z.object({
  numero: z.number().int().describe("Número da semana, começando em 1."),
  foco: z.string().min(1).describe("Foco principal da semana."),
  marco: z
    .string()
    .nullable()
    .describe("Marco ou entregável da semana, ou null se não houver."),
  itens: z
    .array(PlanoItemSchema)
    .describe(
      "Itens curados desta semana. Deixe vazio se não houver item curado adequado.",
    ),
});

export const PlanoEstudosSchema = z.object({
  area: PlanoAreaSchema.nullable().describe(
    "Área escolhida, ou null enquanto não foi definida na conversa.",
  ),
  nivel: z
    .enum(PLANO_NIVEIS)
    .nullable()
    .describe("Nível atual da pessoa, ou null."),
  horasPorDia: z
    .number()
    .nullable()
    .describe("Horas de estudo por dia, ou null."),
  diasPorSemana: z
    .number()
    .nullable()
    .describe("Dias de estudo por semana, ou null."),
  prazoSemanas: z
    .number()
    .nullable()
    .describe("Prazo total em semanas, ou null."),
  objetivo: z
    .string()
    .nullable()
    .describe("Objetivo da pessoa em poucas palavras, ou null."),
  status: z
    .enum(PLANO_STATUS)
    .describe(
      "coletando enquanto falta contexto; montando ao começar o cronograma; pronto quando o plano estiver completo.",
    ),
  semanas: z
    .array(PlanoSemanaSchema)
    .describe(
      "Cronograma semanal. Deixe vazio enquanto status = coletando.",
    ),
});

export type PlanoArea = z.infer<typeof PlanoAreaSchema>;
export type PlanoItem = z.infer<typeof PlanoItemSchema>;
export type PlanoSemana = z.infer<typeof PlanoSemanaSchema>;
export type PlanoEstudos = z.infer<typeof PlanoEstudosSchema>;
export type PlanoItemTipo = (typeof PLANO_ITEM_TIPOS)[number];
export type PlanoNivel = (typeof PLANO_NIVEIS)[number];
export type PlanoStatus = (typeof PLANO_STATUS)[number];
