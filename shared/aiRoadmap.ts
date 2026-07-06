import { z } from "zod";

// Schemas da geracao do Roadmap com IA (Roadmap Pro), derivados do shape das
// trilhas v2 (shared/roadmapV2/types.ts). Tres blocos:
//
//  - RoadmapIntakeSchema: o que o usuario responde no entendimento (valida o
//    body da rota de geracao).
//  - RoadmapSkeletonSchema / RoadmapSkeletonModelSchema: o esqueleto da trilha
//    (secoes sem children). A variante Model e a que vai para a IA e NAO tem
//    slug: o slug e gerado SEMPRE no servidor (ia-<8 chars [a-z0-9]>) e
//    injetado depois do parse; o modelo nunca escolhe slug.
//  - RoadmapSectionContentSchema: os children de UMA secao.
//
// Compatibilidade com toOpenAIStrictSchema: o strict mode da OpenAI descarta
// pattern/min/max do JSON Schema (as constraints continuam valendo no
// safeParse local) e transforma opcional em required + nullable. Por isso os
// campos opcionais dos schemas voltados a IA sao .nullable() (o modelo devolve
// null, nunca omite); a conversao para RoadmapNode remove os nulls.
//
// v1 NAO gera resources nem byLanguage: conteudo autocontido, sem URLs (a IA
// inventaria links). Os campos ficam fora dos schemas de proposito.

export const AI_ROADMAP_SLUG_RE = /^ia-[a-z0-9]{8}$/;

export const RoadmapIntakeSchema = z.object({
  hoursPerWeek: z.enum(["ate-5", "5-10", "10-20", "20-mais"]),
  goal: z.enum(["primeira-vaga", "transicao", "freela", "aprofundar"]),
  deadline: z.enum(["3m", "6m", "12m", "sem-prazo"]),
  format: z.enum(["video", "texto", "projetos", "misto"]),
  stackFocus: z
    .string()
    .regex(/^[a-z0-9-]{0,32}$/)
    .optional(),
  extraContext: z.string().max(500).optional(),
});

export type RoadmapIntake = z.infer<typeof RoadmapIntakeSchema>;

const SectionLevelSchema = z.enum(["iniciante", "intermediario", "avancado"]);

const SkeletonSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  level: SectionLevelSchema,
});

// Variante enviada a IA: sem slug (ver comentario do topo).
export const RoadmapSkeletonModelSchema = z.object({
  area: z.string(),
  title: z.string(),
  level: z.string(),
  description: z.string(),
  sections: z.array(SkeletonSectionSchema).min(5).max(9),
});

export type RoadmapSkeletonModel = z.infer<typeof RoadmapSkeletonModelSchema>;

// Esqueleto completo, com o slug do servidor. Validacao final (nao vai a IA).
export const RoadmapSkeletonSchema = RoadmapSkeletonModelSchema.extend({
  slug: z.string().regex(AI_ROADMAP_SLUG_RE),
});

export type RoadmapSkeleton = z.infer<typeof RoadmapSkeletonSchema>;

// No de conteudo gerado. Espelho de RoadmapNode SEM resources e SEM byLanguage
// (v1). Campos opcionais sao nullable pelo strict mode (ver topo).
const SectionContentChildSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  project: z.string().nullable(),
  estimatedTime: z.string().nullable(),
  optional: z.boolean().nullable(),
});

export type RoadmapSectionContentChild = z.infer<
  typeof SectionContentChildSchema
>;

// Primeiro nivel pode ter children (segundo nivel, 0..5, folhas: sem children).
const SectionContentNodeSchema = SectionContentChildSchema.extend({
  children: z.array(SectionContentChildSchema).max(5).nullable(),
});

export type RoadmapSectionContentNode = z.infer<
  typeof SectionContentNodeSchema
>;

export const RoadmapSectionContentSchema = z.object({
  children: z.array(SectionContentNodeSchema).min(4).max(10),
});

export type RoadmapSectionContent = z.infer<typeof RoadmapSectionContentSchema>;
