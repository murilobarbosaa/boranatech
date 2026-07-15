import { env } from "../env";
import { resolvePlanPriceCents } from "../planPrice";
import { supabaseAdmin } from "../supabaseAdmin";

// Fatos canonicos da plataforma injetados como mensagem system nos DOIS tiers
// do agente. Parte dinamica (precos da tabela plans e limites do env) e parte
// estatica editorial. Fail-soft por item: falha em um item omite o item (com o
// fallback textual definido), nunca derruba a montagem nem o chat.
//
// Cache em memoria do texto montado, com TTL. Erro na montagem devolve o ultimo
// cache valido se existir; sem cache, devolve so a parte estatica.

// TTL do cache do bloco de fatos. Ajustavel. // TODO: calibrar.
const FACTS_CACHE_TTL_MS = 10 * 60 * 1000;

// TODO(Ana): revisar esta linha de cabecalho do bloco de fatos.
const FACTS_HEADER =
  "Fatos da plataforma (fonte canonica; ao responder sobre precos, planos, limites, certificados ou suporte, use SOMENTE estes fatos e nunca invente outros):";

// Bloco estatico editorial. // TODO(Ana): revisar todos os fatos editoriais.
const WHAT_IS_FACT =
  "O que e: O BoraNaTech e a bussola de quem quer comecar em tecnologia no Brasil: um quiz descobre a area com a sua cara e a plataforma guia o caminho com roadmaps, cursos selecionados e ferramentas de IA, do zero ate a primeira vaga. A camada de descoberta e gratuita; as analises personalizadas por IA fazem parte do Plano Pro.";
const CERTIFICATES_FACT =
  "Certificados: o BoraNaTech nao emite certificados proprios. A plataforma orienta o caminho e indica cursos, e muitos dos cursos indicados emitem os certificados deles.";
const CANCELLATION_FACT =
  "Cancelamento: a assinatura pode ser cancelada a qualquer momento na pagina /perfil; em caso de duvida, o suporte resolve.";

// Fatos das ferramentas Pro (atualizados na frente de features Pro de 2026-07).
const PRO_TOOLS_FACT =
  "Ferramentas Pro atuais: analise de curriculo (/curriculo/analisar), geracao de curriculo (/curriculo/gerar), analise de LinkedIn com nota, checklist de recrutador e textos prontos (/linkedin/analisar), analise de portfolio com base no GitHub (/portfolio/analisar), treino de entrevista com IA (/entrevistas), plano de carreira com IA (/plano-carreira) e Roadmap com IA (/roadmaps/ia).";
const INTERVIEW_FACT =
  "Entrevistas: a pagina /entrevistas reune o guia gratuito do processo seletivo (com banco de perguntas e desafios) e o treino de entrevista com IA (Pro), com feedback por resposta e veredito de preparo. O antigo simulador separado foi unificado nessa pagina.";
const CAREER_PLAN_FACT =
  "Plano de carreira: a pagina /plano-carreira gera com IA a rota da carreira da pessoa (degraus ordenados, certificacoes com preco de referencia e cronograma) com checklist de progresso. Substituiu o antigo plano de estudos (/estudos).";
const MENTORIAS_FACT =
  "Mentorias e ebooks: a pagina /mentorias esta em modo em breve, com parcerias sendo fechadas; sem data prometida.";

// TODO(Ana): so entra em producao quando a caixa de email existir; incluir no
// texto final apenas se a constante nao for vazia.
const SUPPORT_FACT =
  "Suporte: o canal oficial e o email contato@boranatech.com.br.";

// Fallback quando a leitura de planos falha ou nao retorna plano ativo.
// TODO(Ana): revisar esta linha de fallback de precos.
const PLANS_FALLBACK_FACT =
  "Para valores atualizados, indique a pagina /planos.";

interface PlanRow {
  code: string | null;
  name: string;
  price_cents: number;
  currency: string | null;
  interval: string;
}

function formatPrice(priceCents: number, currency: string | null): string {
  const value = (priceCents / 100).toFixed(2).replace(".", ",");
  const symbol = !currency || currency === "BRL" ? "R$" : currency;
  return `${symbol} ${value}`;
}

// Periodicidade legivel dos intervals conhecidos da tabela plans. Interval
// desconhecido cai no texto cru (factual, nunca inventado).
function formatInterval(interval: string): string {
  if (interval === "month") return "por mes";
  if (interval === "semiannual") return "por semestre";
  if (interval === "year") return "por ano";
  return `por ${interval}`;
}

// Precos e planos ativos da tabela plans (dado publico; sem filtro de usuario).
// Falha ou zero planos: devolve a linha de fallback apontando /planos.
async function buildPlansFact(): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("code, name, price_cents, currency, interval")
      .eq("is_active", true)
      .order("price_cents", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as PlanRow[];
    if (rows.length === 0) return PLANS_FALLBACK_FACT;
    // Preco do planPricing.ts (fonte unica); plans.price_cents so como fallback
    // defensivo para code desconhecido (ex.: 'free'). A ordem (por price_cents) fica
    // igual: apos a migration, plans.price_cents == planPricing.
    const parts = rows.map((r) => {
      const cents = resolvePlanPriceCents(r.code, r.price_cents, "platformFacts");
      return `${r.name}: ${formatPrice(cents, r.currency)} ${formatInterval(r.interval)}`;
    });
    // TODO(Ana): revisar esta linha de planos e precos.
    return `Planos e precos do Plano Pro: ${parts.join("; ")}. A assinatura e feita na pagina /planos.`;
  } catch (err) {
    console.warn("[platformFacts] leitura de plans falhou, usando fallback:", err);
    return PLANS_FALLBACK_FACT;
  }
}

// Limites diarios do env ja validado (env.ts). Valor ausente ou invalido
// (NaN, zero, negativo) omite a linha correspondente.
function buildLimitsFacts(): string[] {
  const facts: string[] = [];
  const isValid = (n: number) => Number.isFinite(n) && n > 0;
  if (isValid(env.agentDailyLimitFree) && isValid(env.agentDailyLimitPro)) {
    // TODO(Ana): revisar esta linha de limites do assistente.
    facts.push(
      `Limites do assistente: ate ${env.agentDailyLimitFree} mensagens por dia no plano gratuito e ate ${env.agentDailyLimitPro} mensagens por dia no Plano Pro.`,
    );
  }
  if (isValid(env.aiDailyLimitFree) && isValid(env.aiDailyLimitPro)) {
    // TODO(Ana): revisar esta linha de limites das ferramentas de IA.
    facts.push(
      `Limites das ferramentas de IA: ate ${env.aiDailyLimitFree} usos por dia no plano gratuito e ate ${env.aiDailyLimitPro} usos por dia no Plano Pro.`,
    );
  }
  return facts;
}

// Ordem editorial fixa: o que e, ferramentas Pro e features, precos e limites
// (dinamicos), certificados, suporte (condicional) e cancelamento.
function composeFacts(dynamicFacts: string[]): string {
  const facts = [
    WHAT_IS_FACT,
    PRO_TOOLS_FACT,
    INTERVIEW_FACT,
    CAREER_PLAN_FACT,
    MENTORIAS_FACT,
    ...dynamicFacts,
    CERTIFICATES_FACT,
    ...(SUPPORT_FACT.length > 0 ? [SUPPORT_FACT] : []),
    CANCELLATION_FACT,
  ];
  return [FACTS_HEADER, ...facts.map((f) => `- ${f}`)].join("\n");
}

// So a parte estatica, para o pior caso (montagem falhou e nao ha cache).
function staticOnlyFacts(): string {
  return composeFacts([]);
}

let cache: { text: string; builtAt: number } | null = null;

export async function buildPlatformFacts(): Promise<string> {
  const now = Date.now();
  if (cache && now - cache.builtAt < FACTS_CACHE_TTL_MS) {
    return cache.text;
  }
  try {
    const dynamicFacts = [await buildPlansFact(), ...buildLimitsFacts()];
    const text = composeFacts(dynamicFacts);
    cache = { text, builtAt: now };
    return text;
  } catch (err) {
    console.warn("[platformFacts] montagem falhou:", err);
    if (cache) return cache.text;
    return staticOnlyFacts();
  }
}
