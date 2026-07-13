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

// Os 6 primeiros campos sao os do formulario original (enums + stackFocus +
// extraContext) e NAO mudam: o resume de roadmaps partial legados reparseia o
// que ficou gravado em ai_roadmaps.inputs, entao qualquer mudanca de shape neles
// quebraria linhas antigas. Os 3 campos novos (startingPoint, motivation,
// constraints) sao de TEXTO LIVRE e OPCIONAIS de proposito: sao eles que o chat
// guiado coleta (o form coleta parametros; o chat coleta historia), e por serem
// opcionais um inputs legado sem eles continua valido no safeParse. O campo
// format continua no schema por retrocompatibilidade mesmo que o chat nao o
// pergunte (o gerador nao ramifica sobre ele; o chat usa o default "misto").
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
  // Campos narrativos novos (chat guiado). Opcionais: nao quebram o resume de
  // inputs legado. Texto livre, teto de 500 chars como o extraContext.
  startingPoint: z.string().max(500).optional(),
  motivation: z.string().max(500).optional(),
  constraints: z.string().max(500).optional(),
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
  sections: z.array(SkeletonSectionSchema).min(7).max(10),
});

export type RoadmapSkeletonModel = z.infer<typeof RoadmapSkeletonModelSchema>;

// Esqueleto completo, com o slug do servidor. Validacao final (nao vai a IA).
export const RoadmapSkeletonSchema = RoadmapSkeletonModelSchema.extend({
  slug: z.string().regex(AI_ROADMAP_SLUG_RE),
});

export type RoadmapSkeleton = z.infer<typeof RoadmapSkeletonSchema>;

// No de conteudo gerado. Espelho de RoadmapNode SEM resources e SEM byLanguage
// (v1). Campos opcionais sao nullable pelo strict mode (ver topo). content e
// estimatedTime sao OBRIGATORIOS (nao-nullable): todo passo ensina e estima;
// o describe orienta o modelo e o safeParse pune ausencia com retry.
const SectionContentChildSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content: z
    .string()
    .describe(
      "Markdown de 4 a 8 frases, estruturado em: o que dominar (com subtopicos nomeados), como praticar, e um mini desafio pratico concreto. Profundo o bastante para a pessoa saber exatamente o que estudar e como praticar hoje.",
    ),
  project: z.string().nullable(),
  estimatedTime: z
    .string()
    .describe(
      'Estimativa realista de tempo, sempre preenchida. Exemplos: "2 semanas", "10 horas", "4h a 6h".',
    ),
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

// Minimo de passos por secao: 4 (nao 6). Secao estreita e legitima (as trilhas
// estaticas de shared/roadmapV2 tem secoes de 3 a 4 passos), e o minimo rigido
// de 6 era a causa determinante de falha em producao: o modelo devolvia uma
// secao curta valida, o safeParse rejeitava com too_small (minimum 6), e as 3
// tentativas repetiam o mesmo prompt e a mesma secao. O alvo (6 a 8) segue no
// prompt; aqui fica so o piso absoluto.
export const RoadmapSectionContentSchema = z.object({
  children: z.array(SectionContentNodeSchema).min(4).max(10),
});

export type RoadmapSectionContent = z.infer<typeof RoadmapSectionContentSchema>;

// Variante por chamada do schema de secao (fase 5c.2), mesmo racional da
// variante de requisitos em shared/github/schema.ts: na ULTIMA secao o campo
// project vira enum dos ids REAIS oferecidos no prompt (ou null); em todas as
// secoes anteriores project e null ESTRITO. Isso impede a IA de inventar id
// de projeto ou de solta-lo no meio da trilha.
export function buildSectionContentSchema(offeredProjectIds: string[] | null) {
  const projectField =
    offeredProjectIds && offeredProjectIds.length > 0
      ? z
          .enum(offeredProjectIds as [string, ...string[]])
          .nullable()
          .describe(
            "Id de um projeto do catalogo oferecido no prompt. Exatamente UM passo desta secao recebe um id; nos demais passos use null.",
          )
      : z
          .null()
          .describe(
            "Sempre null nesta secao (o projeto vive na ultima secao).",
          );
  const child = SectionContentChildSchema.extend({ project: projectField });
  // Piso de 4 passos, igual a RoadmapSectionContentSchema (ver comentario la):
  // este e o schema REALMENTE validado por chamada de secao no generate.ts.
  return z.object({
    children: z
      .array(child.extend({ children: z.array(child).max(5).nullable() }))
      .min(4)
      .max(10),
  });
}
