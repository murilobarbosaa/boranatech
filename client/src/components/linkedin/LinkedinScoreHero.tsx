import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { ArrowRight, Linkedin, Sparkles } from "lucide-react";
import {
  faixaLabelOf,
  faixaUiOf,
} from "@/components/linkedin/faixaUi";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  decomporNota,
  pontosPendentes,
  parcelaAutodeclarada,
} from "@shared/linkedin/reguaV2";
import { AREA_LABELS } from "@shared/areas";
import {
  LINKEDIN_CATEGORIES,
  LINKEDIN_CATEGORY_LABELS,
  LINKEDIN_LEVEL_LABELS,
  MERCADO_LABELS,
  TIER_WEIGHTS,
  type LinkedinAnalysisResponse,
} from "@shared/linkedin/schema";

const ac = getPageAccentUi("sky");

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Contador da nota: rAF de ~1s com ease-out cubico, de `from` ate `target`.
// reduce pula direto ao valor final. Copia fiel do useCountUp do GitHub.
function useCountUp(target: number, from: number, reduce: boolean): number {
  const [value, setValue] = useState(reduce ? target : from);
  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1000;
    const stepFrame = (ts: number) => {
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(stepFrame);
    };
    raf = requestAnimationFrame(stepFrame);
    return () => cancelAnimationFrame(raf);
  }, [target, from, reduce]);
  return value;
}

// Paleta do confete da plataforma (proConfetti.ts), reusada no burst
// localizado do delta que subiu, como no GitHub.
const CONFETTI_COLORS = ["#FFB800", "#1a1a1a", "#ffffff", "#10b981"];

// Nota-hero do analisador de LinkedIn, no molde do ScoreHero do GitHub: a
// nota e o protagonista (contador + anel SVG preenchendo junto + carimbo da
// faixa via FAIXA_UI), com o contexto da analise (area, nivel, mercado)
// reorganizado ao lado. Delta de reanalise: contador anima DA nota antiga
// PARA a nova, a antiga aparece riscada, e subir dispara um burst de confete
// localizado (reduce desliga contador, carimbo e confete).
export default function LinkedinScoreHero({
  response,
  scoreDelta,
  reduce,
  improvements = null,
}: {
  response: LinkedinAnalysisResponse;
  scoreDelta: { from: number; to: number } | null;
  reduce: boolean;
  /** Placar do checklist de melhorias (null = sem checklist nesta analise:
   * persistencia falhou, storage v2 ou erro de carga; o chip nao renderiza). */
  improvements?: { done: number; total: number } | null;
}) {
  const { deterministic } = response;
  const faixaUi = faixaUiOf(deterministic.faixa);
  // Delta valido para ESTE resultado: anima da nota antiga pra nova.
  const delta =
    scoreDelta && scoreDelta.to === deterministic.score ? scoreDelta : null;
  const value = useCountUp(deterministic.score, delta ? delta.from : 0, reduce);
  const ringOffset = RING_CIRCUMFERENCE * (1 - value / 100);

  const scoreRef = useRef<HTMLDivElement>(null);

  // DECOMPOSICAO DA NOTA (achado #12 da rodada 1: a nota nunca mostrava de onde
  // vinha, nem os pesos). Calculada aqui a partir de `deterministic.checks`, que
  // ja carrega tier e categoria: nao muda nada no servidor e nao toca a nota.
  //
  // A parcela de `sinais` sai destacada porque ela e a unica AUTODECLARADA: os
  // cinco checks vem do formulario e a plataforma nao consegue conferi-los. Isso
  // fecha, por transparencia, o vetor que a supressao de delta nao alcanca (a
  // primeira analise, onde nao ha "antes" para comparar).
  //
  // Mostrar so a parcela dos sinais seria pior que mostrar tudo: "14% da sua
  // nota e autodeclarado" convida a pergunta "de que?", e a resposta ja esta na
  // mao. O custo de computar as seis categorias e o mesmo.
  const decomposicao = decomporNota(
    deterministic.checks,
    TIER_WEIGHTS,
    LINKEDIN_CATEGORIES,
  );
  const totalPossivel = decomposicao.reduce((s, d) => s + d.possivel, 0);

  /**
   * Pontos aguardando confirmacao, e a nota esta incompleta?
   *
   * O numero sai de `pontosPendentes`, a MESMA fonte de pesos da decomposicao.
   * Um `35` escrito aqui seria uma segunda implementacao, livre para divergir
   * no dia em que um check de headline mudar de tier;
   * `reguaV2.pontosPendentes.test.ts` trava isso trocando o tier e conferindo
   * que o numero acompanha.
   */
  const pendentes = pontosPendentes(deterministic.checks, TIER_WEIGHTS);
  const notaIncompleta = deterministic.notaIncompleta === true;

  // Burst localizado quando a reanalise SUBIU a nota, sincronizado com a
  // chegada do contador. reduce nao dispara nada. Condicao identica ao GitHub.
  useEffect(() => {
    if (reduce || !delta || delta.to <= delta.from) return;
    const timer = window.setTimeout(() => {
      const rect = scoreRef.current?.getBoundingClientRect();
      const origin = rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : { x: 0.5, y: 0.35 };
      confetti({
        particleCount: 90,
        spread: 100,
        origin,
        colors: CONFETTI_COLORS,
        scalar: 0.9,
        ticks: 140,
        gravity: 0.85,
      });
    }, 950);
    return () => window.clearTimeout(timer);
  }, [delta, reduce]);

  return (
    // Peca central da familia da vitrine: rotacao leve compensada + selo de
    // proposito no topo (o card interno mantem o overflow-hidden dos paineis).
    <div className="relative -rotate-[0.3deg]">
      {/* TODO(Ana): revisar o selo do resultado. */}
      <span className="absolute -top-3.5 left-6 z-10 inline-flex rotate-1 items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_var(--bnt-shadow)]">
        <Sparkles className="h-3 w-3" aria-hidden />
        Seu raio-X
      </span>
      <div
        className={cn(
          "card-brutal overflow-hidden rounded-2xl border-slate-950 bg-white",
          ac.liftShadow,
        )}
      >
        <div className="flex flex-col md:flex-row">
          <div
            ref={scoreRef}
            className={cn(
              "flex flex-col items-center justify-center gap-3 border-b-2 border-slate-950 p-8 text-center md:w-72 md:shrink-0 md:border-b-0 md:border-r-2",
              faixaUi.cardBg,
            )}
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">
              Nota do perfil
            </p>
            <div className="relative h-[132px] w-[132px]">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#0f172a"
                  strokeOpacity="0.15"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-black leading-none text-slate-950">
                  {value}
                </span>
                <span className="text-xs font-black text-slate-500">/100</span>
              </div>
            </div>
            {delta ? (
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                <span className="line-through opacity-60">{delta.from}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                <span>{delta.to}</span>
              </p>
            ) : null}
            <motion.span
              initial={reduce ? false : { opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { delay: 0.85, duration: 0.3, ease: "backOut" }
              }
              className={cn(
                "inline-flex rounded-full border-2 border-slate-950 px-4 py-1 text-sm font-black text-slate-950 shadow-[3px_3px_0_var(--bnt-shadow)]",
                faixaUi.chipBg,
              )}
            >
              {notaIncompleta ? "A confirmar" : faixaLabelOf(deterministic.faixa)}
            </motion.span>
            {notaIncompleta ? (
              /*
               * O asterisco da nota. A porcentagem sai de `pontosPendentes`
               * dividido pelo total possivel, as duas da MESMA fonte de pesos
               * da decomposicao: nao ha numero escrito aqui, e trocar o tier de
               * um check de headline move este texto sozinho.
               *
               * Por que PORCENTAGEM e nao "35 dos 194 pontos": o total de 194
               * nao aparece em lugar nenhum da tela, entao "35" e um numero sem
               * denominador, e "35 de 194" convida uma conta que a pessoa nao
               * pediu. A proporcao responde a pergunta que ela tem ("quanto
               * disso esta em aberto?") sem ensinar a regua.
               *
               * A copy NAO promete melhora: "pode subir ou descer". Prometer
               * subida seria a mesma classe do chip verde de "detectada" que a
               * Fase 4 removeu, que tranquilizava sobre uma leitura errada.
               *
               * E NAO manda "conferir o texto acima". Este hero vive em
               * `showResult`, e o texto da headline vive no `details` do passo
               * de revisao, que e `showEntry`: os dois sao mutuamente
               * exclusivos, entao "acima" apontaria para algo que nao esta na
               * tela. A conferencia acontece na PROXIMA analise, e a copy diz
               * isso e diz o custo (outra analise), em vez de prometer uma
               * revisao que ali nao existe.
               */
              <span className="mt-3 block max-w-prose text-xs font-bold text-slate-600">
                Não conseguimos ler sua headline com certeza, e ela pesa{" "}
                {Math.round((pendentes / totalPossivel) * 100)}% da nota, então
                esses pontos ficam em aberto. Em Nova análise, o passo de
                revisão mostra a headline que lemos: é ali que dá para conferir
                antes de enviar. A nota pode subir ou descer depois disso.
              </span>
            ) : null}
            {improvements && improvements.total > 0 ? (
              <motion.span
                // key muda a cada avanco: o remount reanima; no N de N, o
                // pulso unico de micro-celebracao (sem confete, que segue
                // exclusivo do delta que subiu).
                key={`${improvements.done}/${improvements.total}`}
                initial={false}
                animate={
                  !reduce && improvements.done === improvements.total
                    ? { scale: [1, 1.15, 1] }
                    : undefined
                }
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={cn(
                  "inline-flex rounded-full border-2 border-slate-950 px-3 py-0.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_var(--bnt-shadow)]",
                  improvements.done === improvements.total
                    ? "bg-emerald-300"
                    : "bg-white",
                )}
              >
                {/* TODO(Ana): revisar a copy do placar de melhorias. */}
                {improvements.done} de {improvements.total} melhorias aplicadas
              </motion.span>
            ) : null}
          </div>

          {/* Coluna do contexto da analise (o antigo ResultHeader absorvido):
              centrada na vertical, com os chips logo apos o bloco do titulo.
              A altura do card e ditada so pelo painel da nota. */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-5 p-6">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-sky-600 text-white shadow-[3px_3px_0_var(--bnt-shadow)]"
                aria-hidden
              >
                <Linkedin className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Análise do perfil
                </p>
                <p className="truncate font-display text-2xl font-black text-slate-950">
                  {AREA_LABELS[response.area]}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-700">
                {LINKEDIN_LEVEL_LABELS[response.level]}
              </span>
              <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-700">
                {MERCADO_LABELS[response.mercado]}
              </span>
            </div>

            <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                de onde vem a sua nota
              </p>
              <ul className="mt-3 space-y-2">
                {decomposicao.map((d) => {
                  const autodeclarado = d.categoria === "sinais";
                  // O grupo cuja leitura esta em duvida. Derivado do MESMO
                  // conjunto de checks: se um check de headline deixar de ser
                  // pendente, o marcador some sozinho.
                  const grupoPendente =
                    notaIncompleta &&
                    deterministic.checks.some(
                      (c) => c.category === d.categoria && c.pendente === true,
                    );
                  return (
                    <li key={d.categoria} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-28 shrink-0 truncate text-xs font-bold",
                          autodeclarado ? "text-amber-800" : "text-slate-600",
                        )}
                      >
                        {LINKEDIN_CATEGORY_LABELS[d.categoria]}
                      </span>
                      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full border border-slate-300 bg-white">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            grupoPendente
                              ? "bg-slate-300"
                              : autodeclarado
                                ? "bg-amber-400"
                                : "bg-sky-600",
                          )}
                          style={{
                            // Grupo pendente nao mostra progresso: a barra cheia
                            // seria a mesma afirmacao que o chip "Forte" fazia
                            // sobre uma headline cortada.
                            width: grupoPendente
                              ? "100%"
                              : `${Math.round((d.ganho / d.possivel) * 100)}%`,
                          }}
                        />
                      </span>
                      <span
                        className={cn(
                          "w-14 shrink-0 text-right text-xs font-bold tabular-nums",
                          grupoPendente ? "text-slate-400" : "text-slate-500",
                        )}
                      >
                        {grupoPendente ? "a conferir" : `${d.ganho}/${d.possivel}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs font-medium text-amber-900">
                Sinais do perfil vale {parcelaAutodeclarada(decomposicao)} dos{" "}
                {totalPossivel} pontos e vem do que você respondeu no
                formulário, não do PDF: é a única parte que a gente não consegue
                conferir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
