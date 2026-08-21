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

// Teto diario DEFAULT da cota dedicada do chat de intake
// (ROADMAP_INTAKE_CHAT_DAILY_LIMIT_PRO em server/lib/env.ts, que importa daqui).
//
// Mora em shared, e nao em env.ts, por um motivo especifico: o orcamento de
// turnos da conversa (MAX_USER_MESSAGES em server/lib/aiRoadmap/intakeChat.ts)
// precisa CABER nesta cota, e a assercao que trava isso e um teste. Um teste
// que importasse `server/lib/env` quebraria no CI, que nao tem arquivo .env
// (regra do CLAUDE.md). Com o numero aqui, os dois lados da conta vivem em
// modulos puros e o teste le os dois sem tocar em ambiente.
export const ROADMAP_INTAKE_CHAT_DEFAULT_DAILY_LIMIT = 60;

// Semente de abertura da conversa do chat de intake.
//
// Desde a fase 2 ela e INJETADA PELO SERVIDOR na montagem do prompt e nao conta
// no orcamento de turnos; `validateIntakeChatBody` remove a que vier no corpo,
// em qualquer posicao, para o bundle antigo em cache nao duplicar a semente.
//
// Mora em shared porque os DOIS lados precisam do MESMO texto e a igualdade e
// silenciosa quando quebra: o client so a usa no retry de compatibilidade do
// turno de abertura (janela de deploy contra backend antigo), e se os literais
// divergirem o servidor novo deixa de reconhece-la para remover, a semente vira
// mensagem de usuario e o orcamento fica um turno menor sem nada acusar. Duas
// copias mantidas a mao sao a classe de defeito que o CLAUDE.md documenta.
export const CHAT_KICKOFF =
  "Quero montar meu roadmap de estudos. Pode comecar.";

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

// FONTE UNICA da pergunta "da pra gerar com o que temos?".
//
// Antes da fase 2 essa pergunta tinha DUAS respostas divergentes: o botao de
// gerar aparecia quando `ready` (sinal do MODELO de que a conversa acabou) e o
// payload era montado e validado a parte no client. As duas podiam discordar, e
// quando discordavam a pessoa via "Faltou alguma informacao essencial pra gerar"
// sem saber o que faltava e sem saida. `ready` e `canGenerate` sao coisas
// diferentes: ready e sobre a CONVERSA ter terminado, canGenerate e sobre o
// INTAKE estar completo. So o segundo decide se da pra gerar.
//
// Client e servidor chamam esta funcao; nenhum dos dois reimplementa a regra.

// Os tres campos de escolha sem os quais a geracao nao acontece. `format` fica
// de fora: o chat nao o pergunta e ele tem default.
export const INTAKE_REQUIRED_CHOICE_FIELDS = [
  "goal",
  "hoursPerWeek",
  "deadline",
] as const;

export type IntakeRequiredChoiceField =
  (typeof INTAKE_REQUIRED_CHOICE_FIELDS)[number];

// Campos que enriquecem o prompt mas nunca bloqueiam a geracao.
const INTAKE_OPTIONAL_FIELDS = [
  "stackFocus",
  "extraContext",
  "startingPoint",
  "motivation",
  "constraints",
] as const;

// Formato assumido quando o intake nao traz um valido: o chat guiado nao
// pergunta formato de estudo (decisao de produto) e o gerador nao ramifica
// sobre ele.
export const DEFAULT_INTAKE_FORMAT: RoadmapIntake["format"] = "misto";

export interface GenerationReadiness {
  canGenerate: boolean;
  // Quais campos de escolha ainda faltam. INVARIANTE: canGenerate false implica
  // missing nao-vazio, para a UI sempre ter o que dizer e o que pedir. Coberto
  // por teste em shared/aiRoadmap.test.ts.
  missing: IntakeRequiredChoiceField[];
  // Payload pronto para POST /generate, ou null quando falta campo.
  intake: RoadmapIntake | null;
}

// Aceita tanto a proposta parcial do chat (campos nullable) quanto um
// RoadmapIntake ja montado; os dois passam pela MESMA porta.
export type IntakeProposalLike = Partial<
  Record<keyof RoadmapIntake, string | null | undefined>
>;

export function buildGenerationIntake(
  proposal: IntakeProposalLike | null | undefined,
): GenerationReadiness {
  const shape = RoadmapIntakeSchema.shape;
  const missing: IntakeRequiredChoiceField[] = [];
  const candidate: Record<string, unknown> = {};

  for (const field of INTAKE_REQUIRED_CHOICE_FIELDS) {
    const parsed = shape[field].safeParse(proposal?.[field] ?? undefined);
    if (!parsed.success) {
      missing.push(field);
      continue;
    }
    candidate[field] = parsed.data;
  }

  // `format` tem default: um valor invalido nao bloqueia, cai no padrao.
  const parsedFormat = shape.format.safeParse(proposal?.format ?? undefined);
  candidate.format = parsedFormat.success
    ? parsedFormat.data
    : DEFAULT_INTAKE_FORMAT;

  // Campo opcional invalido e DESCARTADO, nunca bloqueia. E o que impede o
  // beco sem saida: um stackFocus que o modelo devolveu fora do regex nao pode
  // custar o roadmap inteiro da pessoa. Descartar degrada o prompt; bloquear
  // degrada o produto.
  for (const field of INTAKE_OPTIONAL_FIELDS) {
    const raw = proposal?.[field];
    if (raw === null || raw === undefined || raw === "") continue;
    const parsed = shape[field].safeParse(raw);
    if (parsed.success && parsed.data !== undefined) {
      candidate[field] = parsed.data;
    }
  }

  if (missing.length > 0) {
    return { canGenerate: false, missing, intake: null };
  }

  const parsed = RoadmapIntakeSchema.safeParse(candidate);
  if (!parsed.success) {
    // Inalcancavel: todo campo obrigatorio ja passou no proprio safeParse e os
    // opcionais invalidos foram descartados. Se acontecer, devolve TODOS os
    // obrigatorios em vez de uma lista vazia, para a UI nunca ficar sem o que
    // pedir (o invariante vale ate no caso que "nao acontece").
    return {
      canGenerate: false,
      missing: [...INTAKE_REQUIRED_CHOICE_FIELDS],
      intake: null,
    };
  }
  return { canGenerate: true, missing: [], intake: parsed.data };
}

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
