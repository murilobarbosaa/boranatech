import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  FileCode2,
  FolderGit2,
  GitCommitHorizontal,
  GitFork,
  Github,
  Globe,
  History,
  Info,
  Sparkles,
  Star,
} from "lucide-react";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import BrutalActionButton from "@/components/shared/BrutalActionButton";
import ReanalyzeCta from "@/components/shared/ReanalyzeCta";
import ScoreDeltaBanner from "@/components/shared/ScoreDeltaBanner";
import SectionLabel from "@/components/shared/SectionLabel";
import SEO from "@/components/SEO";
import { AnalysisError } from "@/components/portfolio/AnalysisStates";
import {
  BenefitPills,
  HowItWorksTimeline,
  ResultShowcase,
} from "@/components/portfolio/AnalyzerIntro";
import {
  BAND_UI,
  BAND_WASH,
  BAND_WASH_SOFT,
} from "@/components/portfolio/bandUi";
import ChecklistByCategory from "@/components/portfolio/ChecklistByCategory";
import GithubHistory from "@/components/portfolio/GithubHistory";
import { MetadataChips, TopRepos } from "@/components/portfolio/MetadataStrip";
import NextStepsByArea from "@/components/portfolio/NextStepsByArea";
import {
  AiSummary,
  Improvements,
  NextStepCard,
  ReadmeSuggestion,
  StrengthsWeaknesses,
} from "@/components/portfolio/QualitativePanels";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { areasTI } from "@/lib/data";
import { openAgentWidget } from "@/components/agent/AgentWidget";
import FeedbackBanner from "@/components/shared/FeedbackBanner";
import {
  analyzeGithub,
  getGithubAnalysis,
  listGithubAnalyses,
  listImprovementProgress,
  normalizeGithubTarget,
  setImprovementProgress,
  type GithubAnalysisSummary,
} from "@/lib/githubClient";
import { getQuizHistory } from "@/services/careerQuizService";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { GENERAL_AREA, isAreaSlug, type AreaSelection } from "@shared/areas";
import { detectGithubTarget } from "@shared/github/detect";
import type {
  AnalysisMode,
  GithubAnalysisResponse,
  ScoreBand,
} from "@shared/github/schema";

const ac = getPageAccentUi("violet");

// TODO(Ana): revisar placeholder e descricoes da deteccao automatica.
const INPUT_PLACEHOLDER = "github.com/usuario ou github.com/usuario/projeto";

const MODE_DESCRIPTION: Record<AnalysisMode, string> = {
  perfil:
    "Analisa seu README de perfil, bio, links de contato, repositórios e atividade.",
  repo: "Analisa README, descrição, licença, topics, arquivos de segurança e a organização do projeto.",
};

// Doodles tematicos de GitHub do cenario de entrada, no padrao exato dos
// HERO_DOODLES do RoadmapsV2Index (loop lento de y/rotate; reduce para tudo).
const ENTRY_DOODLES = [
  { Icon: Github, cls: "left-[4%] top-[6%] text-violet-500 opacity-[0.16]", size: "h-12 w-12", rot: 6, dur: 7, delay: 0 },
  { Icon: Star, cls: "right-[6%] top-[8%] text-amber-500 opacity-[0.15]", size: "h-10 w-10", rot: -6, dur: 8, delay: 0.5 },
  { Icon: GitFork, cls: "left-[14%] top-[30%] text-purple-500 opacity-[0.13]", size: "h-9 w-9", rot: 8, dur: 7.5, delay: 0.3 },
  { Icon: FileCode2, cls: "right-[12%] top-[34%] text-violet-600 opacity-[0.14]", size: "h-10 w-10", rot: -7, dur: 6.5, delay: 1.1 },
  { Icon: GitCommitHorizontal, cls: "left-[6%] top-[58%] text-violet-400 opacity-[0.13]", size: "h-10 w-10", rot: 7, dur: 7, delay: 0.8 },
  { Icon: FolderGit2, cls: "right-[5%] top-[62%] text-purple-600 opacity-[0.14]", size: "h-11 w-11", rot: -5, dur: 8, delay: 1.4 },
  { Icon: Star, cls: "left-[10%] top-[84%] text-violet-500 opacity-[0.12]", size: "h-8 w-8", rot: 9, dur: 6, delay: 0.6 },
  { Icon: Github, cls: "right-[15%] top-[86%] text-purple-500 opacity-[0.12]", size: "h-9 w-9", rot: -8, dur: 6.5, delay: 1 },
];

// Cenario vivo do estado de ENTRADA: overlay de gradiente de marca (o mesmo
// do RoadmapsV2Index) na regiao superior com fade pro fundo + doodles
// flutuantes. Renderizado SO na entrada; scan e resultado ficam limpos.
function AnalyzerBackdrop({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-x-0 top-0 h-[540px] bg-gradient-to-br from-violet-300/45 via-fuchsia-200/35 to-amber-200/45 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
      {ENTRY_DOODLES.map((doodle, i) => {
        const Icon = doodle.Icon;
        return (
          <motion.span
            key={i}
            className={`absolute ${doodle.cls}`}
            animate={
              reduce
                ? undefined
                : { y: [0, -10, 0], rotate: [0, doodle.rot, 0] }
            }
            transition={
              reduce
                ? undefined
                : {
                    duration: doodle.dur,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: doodle.delay,
                  }
            }
          >
            <Icon className={doodle.size} strokeWidth={2.5} />
          </motion.span>
        );
      })}
    </div>
  );
}

// Doodles do cenario do RESULTADO: familia do cenario da entrada, tintados
// pela pagina toda (nao so no topo), opacidade 0.08 a 0.14, SO nas margens
// externas, fora da coluna de leitura; escondidos abaixo de lg pra nunca
// atrapalhar o corpo denso.
const RESULT_DOODLES = [
  { Icon: Github, cls: "left-[3%] top-[6%] text-violet-500 opacity-[0.14]", size: "h-11 w-11", rot: 6, dur: 7, delay: 0 },
  { Icon: Star, cls: "right-[2%] top-[10%] text-amber-500 opacity-[0.12]", size: "h-10 w-10", rot: -6, dur: 8, delay: 0.6 },
  { Icon: GitFork, cls: "left-[2%] top-[30%] text-purple-500 opacity-[0.10]", size: "h-9 w-9", rot: 8, dur: 7.5, delay: 0.3 },
  { Icon: FileCode2, cls: "right-[3%] top-[38%] text-violet-600 opacity-[0.11]", size: "h-10 w-10", rot: -7, dur: 6.5, delay: 1.1 },
  { Icon: GitCommitHorizontal, cls: "left-[2%] top-[58%] text-violet-400 opacity-[0.09]", size: "h-10 w-10", rot: 7, dur: 7, delay: 1 },
  { Icon: FolderGit2, cls: "right-[2%] top-[66%] text-purple-600 opacity-[0.10]", size: "h-10 w-10", rot: -5, dur: 6.5, delay: 0.3 },
  { Icon: Star, cls: "left-[3%] top-[86%] text-violet-500 opacity-[0.08]", size: "h-9 w-9", rot: 9, dur: 6, delay: 0.8 },
];

// Cenario do estado de resultado: o mesmo pontilhado da secao, o wash da
// FAIXA da nota (BAND_WASH) em DOIS focos (topo atras do hero + um segundo
// suave a meia pagina), sempre com fade antes das areas de leitura densa, e
// os doodles das margens ao longo de toda a altura.
function ResultBackdrop({
  band,
  reduce,
}: {
  band: ScoreBand;
  reduce: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-80 bg-gradient-to-b via-transparent to-transparent [mask-image:linear-gradient(to_bottom,black_40%,transparent)]",
          BAND_WASH[band],
        )}
      />
      <div
        className={cn(
          "absolute right-[-12%] top-[42%] h-96 w-[65%] rounded-full bg-gradient-to-tl via-transparent to-transparent blur-3xl",
          BAND_WASH[band],
        )}
      />
      {RESULT_DOODLES.map((doodle, i) => {
        const Icon = doodle.Icon;
        return (
          <motion.span
            key={i}
            className={`absolute hidden lg:block ${doodle.cls}`}
            animate={
              reduce
                ? undefined
                : { y: [0, -10, 0], rotate: [0, doodle.rot, 0] }
            }
            transition={
              reduce
                ? undefined
                : {
                    duration: doodle.dur,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: doodle.delay,
                  }
            }
          >
            <Icon className={doodle.size} strokeWidth={2.5} />
          </motion.span>
        );
      })}
    </div>
  );
}

// Avatar publico do GitHub (github.com/<owner>.png, redirect oficial, sem
// API). onError cai pro icone; key={owner} no call-site zera o estado de erro
// quando o alvo muda.
function TargetAvatar({ owner }: { owner: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-slate-950 text-white shadow-[3px_3px_0_#0f172a]"
        aria-hidden
      >
        <Github className="h-6 w-6" />
      </span>
    );
  }
  return (
    <img
      src={`https://github.com/${owner}.png?size=96`}
      alt=""
      aria-hidden
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 rounded-xl border-2 border-slate-950 bg-white object-cover shadow-[3px_3px_0_#0f172a]"
    />
  );
}

const STORAGE_KEY = "boranatech:portfolio-analyzer";
// Versao da forma do payload persistido. Bump sempre que a forma da resposta
// (GithubAnalysisResponse) ou a forma do estado salvo mudar. No restore,
// payload de versao diferente e descartado, pra nunca reusar um result de
// shape antigo. A versao 5 adiciona analysisId ao lado do result (o checklist
// de melhorias aplicadas e chaveado pelo id da analise persistida).
const STORAGE_SHAPE_VERSION = 5;

interface StoredState {
  input: string;
  result: GithubAnalysisResponse | null;
  // Id da analise persistida exibida (null = sem checklist de melhorias).
  analysisId: string | null;
  // null = nada valido salvo (ainda nao escolhido nesta sessao).
  area: AreaSelection | null;
}

function coerceArea(value: unknown): AreaSelection | null {
  if (value === GENERAL_AREA) return GENERAL_AREA;
  if (isAreaSlug(value)) return value;
  return null;
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return { input: "", result: null, analysisId: null, area: null };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { input: "", result: null, analysisId: null, area: null };
    const parsed = JSON.parse(raw) as {
      input?: unknown;
      result?: unknown;
      analysisId?: unknown;
      area?: unknown;
      version?: unknown;
    };
    // So restaura input/result se a versao de shape bater com a atual. A area
    // nao depende da forma da resposta, entao e restaurada de qualquer jeito.
    const ok = parsed.version === STORAGE_SHAPE_VERSION;
    return {
      input: ok && typeof parsed.input === "string" ? parsed.input : "",
      result:
        ok && parsed.result && typeof parsed.result === "object"
          ? (parsed.result as GithubAnalysisResponse)
          : null,
      analysisId:
        ok && typeof parsed.analysisId === "string" ? parsed.analysisId : null,
      area: coerceArea(parsed.area),
    };
  } catch {
    return { input: "", result: null, analysisId: null, area: null };
  }
}

// TODO(Ana): revisar os rotulos do scan. Eles descrevem o pipeline REAL do
// server (fetch publico do GitHub + checagens deterministicas + 1 chamada de
// IA) e rodam em loop rotativo, sem prometer conclusao de etapa nem
// porcentagem: a resposta e unica e o client nao sabe em que etapa o server
// esta de verdade.
const SCAN_STEPS = [
  "Lendo os dados públicos do GitHub...",
  "Rodando as checagens automáticas...",
  "Consultando a análise da IA...",
];

// Card de scan do estado de analise: alvo no topo, shimmer INDETERMINADO
// (nunca porcentagem) e rotulo rotativo a cada 2.5s. reduce: barra estatica e
// troca de texto sem fade.
function ScanCard({
  owner,
  display,
  reduce,
}: {
  owner: string | null;
  display: string | null;
  reduce: boolean;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setStep((s) => (s + 1) % SCAN_STEPS.length),
      2500,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      className="card-brutal mx-auto max-w-3xl rounded-2xl border-slate-950 bg-white p-8 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        {owner ? (
          <TargetAvatar key={owner} owner={owner} />
        ) : (
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-950 bg-slate-950 text-white shadow-[3px_3px_0_#0f172a]"
            aria-hidden
          >
            <Github className="h-6 w-6" />
          </span>
        )}
        {display ? (
          <p className="truncate font-display text-xl font-black text-slate-950">
            {display}
          </p>
        ) : null}
      </div>
      <div className="mx-auto mt-6 h-3 w-full max-w-sm overflow-hidden rounded-full border-2 border-slate-900 bg-slate-100">
        {reduce ? (
          <div className="h-full w-full bg-violet-300" />
        ) : (
          <motion.div
            className="h-full w-1/3 rounded-full bg-violet-500"
            animate={{ x: ["-110%", "320%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <div className="mt-4 min-h-[1.5rem] text-sm font-bold text-slate-600">
        {reduce ? (
          <p>{SCAN_STEPS[step]}</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {SCAN_STEPS[step]}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Contador da nota: rAF de ~1s com ease-out cubico, de `from` ate `target`.
// reduce pula direto ao valor final.
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
// localizado do delta que subiu.
const CONFETTI_COLORS = ["#FFB800", "#1a1a1a", "#ffffff", "#10b981"];

// Entrada padrao dos blocos do corpo revista do resultado: whileInView uma
// vez, stagger curto via delay; reduce pula direto.
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Nota-hero: a nota e o protagonista (contador + anel SVG preenchendo junto +
// carimbo da faixa), com alvo e link reorganizados ao lado. BAND_UI intacto
// para as cores. Delta de reanalise: contador anima DA nota antiga PARA a
// nova, a antiga aparece riscada, e subir dispara um burst de confete
// localizado (reduce desliga contador, carimbo e confete).
function ScoreHero({
  response,
  scoreDelta,
  reduce,
  improvements,
}: {
  response: GithubAnalysisResponse;
  scoreDelta: { from: number; to: number } | null;
  reduce: boolean;
  /** Placar do checklist de melhorias (null = sem checklist nesta analise). */
  improvements: { done: number; total: number } | null;
}) {
  const { target, deterministic } = response;
  const band = BAND_UI[deterministic.band];
  const display =
    target.kind === "repo"
      ? `${target.login}/${target.repo}`
      : `@${target.login}`;
  // Doodle tematico da coluna do alvo: pasta de codigo pro repo, octocat pro
  // perfil.
  const CornerDoodle = target.kind === "repo" ? FolderGit2 : Github;
  // Delta valido para ESTE resultado: anima da nota antiga pra nova.
  const delta =
    scoreDelta && scoreDelta.to === deterministic.score ? scoreDelta : null;
  const value = useCountUp(deterministic.score, delta ? delta.from : 0, reduce);
  const ringOffset = RING_CIRCUMFERENCE * (1 - value / 100);

  const scoreRef = useRef<HTMLDivElement>(null);

  // Burst localizado quando a reanalise SUBIU a nota, sincronizado com a
  // chegada do contador. reduce nao dispara nada.
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
      <span className="absolute -top-3.5 left-6 z-10 inline-flex rotate-1 items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
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
            band.cardBg,
          )}
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">
            Nota do portfólio
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
              "inline-flex rounded-full border-2 border-slate-950 px-4 py-1 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]",
              band.chipBg,
            )}
          >
            {band.label}
          </motion.span>
          {improvements && improvements.total > 0 ? (
            <motion.span
              // key muda a cada avanco: o remount reanima; no N de N, o pulso
              // unico de micro-celebracao (sem confete, exclusivo do delta).
              key={`${improvements.done}/${improvements.total}`}
              initial={false}
              animate={
                !reduce && improvements.done === improvements.total
                  ? { scale: [1, 1.15, 1] }
                  : undefined
              }
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={cn(
                "inline-flex rounded-full border-2 border-slate-950 px-3 py-0.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]",
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

        {/* Coluna do alvo sem espaco morto: centrada na vertical, com os
            chips logo apos o bloco do alvo (nao presos ao rodape). A altura
            do card e ditada so pelo painel da nota. Decoracao: wash quase
            imperceptivel da faixa sob o micro-pontilhado da casa, e doodle
            tematico em marca-dagua no canto (isolate + -z-10 deixam o doodle
            acima do fundo e abaixo de todo o conteudo; estatico de proposito,
            movimento atrapalha card de leitura, reduce irrelevante). */}
        <div
          className={cn(
            "relative isolate flex min-w-0 flex-1 flex-col justify-center gap-5 p-6",
            "[background-image:radial-gradient(rgba(15,23,42,0.05)_1.2px,transparent_1.2px)] [background-size:18px_18px]",
            BAND_WASH_SOFT[deterministic.band],
          )}
        >
          <CornerDoodle
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 -z-10 hidden h-24 w-24 rotate-12 text-slate-900 opacity-[0.05] sm:block"
          />
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <TargetAvatar key={target.login} owner={target.login} />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  {target.kind === "repo" ? "Repositório" : "Perfil"}
                </p>
                <p className="truncate font-display text-2xl font-black text-slate-950">
                  {display}
                </p>
              </div>
            </div>
            <a
              href={target.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-colors hover:bg-yellow-100"
            >
              Abrir no GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <MetadataChips response={response} />
        </div>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioAnalisar() {
  const { isPro } = useSubscription();
  const { profile } = useAuth();

  const [bootstrap] = useState(loadState);
  const [input, setInput] = useState(bootstrap.input);
  const [result, setResult] = useState<GithubAnalysisResponse | null>(
    bootstrap.result,
  );
  // Id da analise persistida exibida: chaveia o checklist de melhorias
  // aplicadas. null quando a persistencia best-effort falhou (sem checklist).
  const [analysisId, setAnalysisId] = useState<string | null>(
    bootstrap.analysisId,
  );
  // Indices das melhorias marcadas como aplicadas (carregado por analysisId).
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [progressError, setProgressError] = useState("");
  const [area, setArea] = useState<AreaSelection>(
    bootstrap.area ?? GENERAL_AREA,
  );
  // Origem do valor atual da area, para os defaults nao atropelarem escolha:
  // "saved" (sessionStorage) e "user" (escolha manual) nunca sao sobrescritos;
  // o quiz tem precedencia sobre o default do perfil ("profile" -> "quiz").
  const areaSource = useRef<"saved" | "user" | "profile" | "quiz" | null>(
    bootstrap.area !== null ? "saved" : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Historico de analises (dono). null = ainda carregando ou indisponivel.
  const [history, setHistory] = useState<GithubAnalysisSummary[] | null>(null);
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null);
  // Delta de nota vs a analise ANTERIOR do MESMO alvo (so quando existe).
  const [scoreDelta, setScoreDelta] = useState<{
    from: number;
    to: number;
  } | null>(null);
  // Confirmacao leve da reanalise (consome 1 uso de IA).
  const [confirmReanalyze, setConfirmReanalyze] = useState(false);

  // Default da area pelo perfil logado, so se nada foi salvo/escolhido. Usa o
  // profile ja carregado, sem fetch novo.
  useEffect(() => {
    if (areaSource.current !== null) return;
    const fromProfile = profile?.area_interesse;
    if (fromProfile && isAreaSlug(fromProfile)) {
      setArea(fromProfile);
      areaSource.current = "profile";
    }
  }, [profile]);

  // Prefill pela area do quiz (best-effort, fallback geral): tem precedencia
  // sobre o default do perfil, nunca sobre escolha manual ou area salva.
  useEffect(() => {
    let alive = true;
    getQuizHistory()
      .then((rows: Array<Record<string, unknown>>) => {
        if (!alive) return;
        if (areaSource.current === "saved" || areaSource.current === "user") {
          return;
        }
        const slug = rows[0]?.result_area_slug;
        if (isAreaSlug(slug)) {
          setArea(slug);
          areaSource.current = "quiz";
        }
      })
      .catch(() => {
        // Best-effort: sem quiz, fica o default que ja estiver valendo.
      });
    return () => {
      alive = false;
    };
  }, []);

  const loadHistory = () => {
    listGithubAnalyses()
      .then(setHistory)
      .catch(() => setHistory(null));
  };
  useEffect(() => {
    if (isPro) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  // Persiste input, result, analysisId e area no sessionStorage. Nunca
  // persiste loading nem error.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          input,
          result,
          analysisId,
          area,
          version: STORAGE_SHAPE_VERSION,
        }),
      );
    } catch {
      // storage cheio ou indisponivel: ignora, segue so em memoria.
    }
  }, [input, result, analysisId, area]);

  // Carga do checklist por analise: analyze novo comeca vazio (a tabela nao
  // tem linhas pra analise recem-criada), openHistory carrega o salvo. Falha
  // de carga degrada pra vazio (marcar de novo re-upserta, sem duplicar).
  useEffect(() => {
    if (!analysisId) {
      setApplied(new Set());
      return;
    }
    let alive = true;
    listImprovementProgress(analysisId)
      .then((indexes) => {
        if (alive) setApplied(new Set(indexes));
      })
      .catch(() => {
        if (alive) setApplied(new Set());
      });
    return () => {
      alive = false;
    };
  }, [analysisId]);

  // Recupera o analysisId de um resultado restaurado sem id (sessionStorage
  // de antes do RD2.7 ou persistencia best-effort que falhou na hora): busca
  // no historico a analise MAIS RECENTE do mesmo alvo normalizado com a mesma
  // nota exibida. Mesmo alvo + mesma nota = mesmo checklist na pratica, entao
  // empate de criterio nao e problema. O early return em analysisId evita
  // loop (achou -> seta -> proximo run sai cedo) e o effect acima carrega o
  // progresso sozinho. Sem par no historico, fica o aviso atual (correto para
  // o caso raro real de persistencia perdida).
  useEffect(() => {
    if (!result || analysisId !== null || !history) return;
    const normalized = normalizeGithubTarget(input);
    const match = history.find(
      (item) =>
        item.raw_input !== null &&
        typeof item.score === "number" &&
        item.score === result.deterministic.score &&
        normalizeGithubTarget(item.raw_input) === normalized,
    );
    if (match) setAnalysisId(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, analysisId, history]);

  // Toggle otimista do checklist: atualiza na hora, PUT em background e
  // rollback com aviso quando o server recusar.
  function toggleImprovement(index: number) {
    if (!analysisId) return;
    const wasDone = applied.has(index);
    setProgressError("");
    setApplied((prev) => {
      const next = new Set(prev);
      if (wasDone) next.delete(index);
      else next.add(index);
      return next;
    });
    setImprovementProgress(analysisId, index, !wasDone).catch(() => {
      setApplied((prev) => {
        const reverted = new Set(prev);
        if (wasDone) reverted.add(index);
        else reverted.delete(index);
        return reverted;
      });
      // TODO(Ana): revisar a mensagem de falha ao salvar o progresso.
      setProgressError("Não foi possível salvar seu progresso. Tente de novo.");
    });
  }

  // Deteccao ao vivo do alvo (perfil ou repo) pela mesma fonte do server.
  const detection = detectGithubTarget(input);

  const reduce = useReducedMotion() ?? false;

  // Preview vivo com debounce de 300ms: o cartao-alvo (e o avatar) so
  // materializa quando a digitacao assenta, pra nao piscar a cada tecla. O
  // botao e o submit seguem na deteccao ao vivo.
  const [debouncedInput, setDebouncedInput] = useState(input);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);
  const preview = detectGithubTarget(debouncedInput);

  function changeArea(next: AreaSelection) {
    areaSource.current = "user";
    setArea(next);
  }

  // Anterior do MESMO alvo no historico (para o delta de nota). skipId pula a
  // propria linha quando a analise exibida veio do historico.
  function findPriorScore(rawTarget: string, skipId?: string): number | null {
    if (!history) return null;
    const normalized = normalizeGithubTarget(rawTarget);
    let skipping = skipId !== undefined;
    for (const item of history) {
      if (skipping) {
        if (item.id === skipId) skipping = false;
        continue;
      }
      if (
        item.raw_input &&
        typeof item.score === "number" &&
        normalizeGithubTarget(item.raw_input) === normalized
      ) {
        return item.score;
      }
    }
    return null;
  }

  async function runAnalysis() {
    const trimmed = input.trim();
    const target = detectGithubTarget(trimmed);
    if (target.kind === "invalid" || loading) return;

    setLoading(true);
    setError("");
    setConfirmReanalyze(false);

    // Nota anterior do mesmo alvo, capturada ANTES da nova analise entrar no
    // historico.
    const priorScore = findPriorScore(trimmed);

    try {
      // O kind vai por compat (o server autodetecta e ignora o mode).
      const { data, analysisId: newAnalysisId } = await analyzeGithub(
        target.kind,
        trimmed,
        area,
      );
      setResult(data);
      setAnalysisId(newAnalysisId);
      setProgressError("");
      // Delta SO quando a nota mudou: empate (95 -> 95) nao vira banner nem
      // seta, e o contador do hero volta a animar de 0.
      setScoreDelta(
        priorScore !== null && priorScore !== data.deterministic.score
          ? { from: priorScore, to: data.deterministic.score }
          : null,
      );
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ANALYSIS_FAILED");
    } finally {
      setLoading(false);
    }
  }

  // Reabre uma analise salva na MESMA tela de resultado (result do jsonb).
  async function openHistory(id: string) {
    setHistoryLoadingId(id);
    try {
      const record = await getGithubAnalysis(id);
      if (!record) {
        loadHistory();
        return;
      }
      const rawInput = record.input?.input ?? "";
      setError("");
      setConfirmReanalyze(false);
      setInput(rawInput);
      setResult(record.result);
      setAnalysisId(record.id);
      setProgressError("");
      const priorScore = rawInput ? findPriorScore(rawInput, id) : null;
      // Mesmo criterio do analyze: delta so quando a nota mudou de fato.
      setScoreDelta(
        priorScore !== null &&
          typeof record.score === "number" &&
          priorScore !== record.score
          ? { from: priorScore, to: record.score }
          : null,
      );
    } catch {
      // Falha de carga do detalhe: mantem a tela atual.
    } finally {
      setHistoryLoadingId(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAnalysis();
  }

  // Placar do checklist: so conta indices dentro do range das melhorias da
  // analise exibida; sem analysisId (persistencia falhou) nao ha checklist.
  const improvementsTotal = result?.qualitative.melhorias.length ?? 0;
  const appliedCount = Array.from(applied).filter(
    (index) => index < improvementsTotal,
  ).length;
  const improvementsScore =
    analysisId && improvementsTotal > 0
      ? { done: appliedCount, total: improvementsTotal }
      : null;
  const allApplied =
    improvementsScore !== null &&
    improvementsScore.done === improvementsScore.total;

  // Saida do estado de resultado: reset SO de UI (nenhuma funcao B3 muda).
  // Mantem input e area (a pessoa pode analisar o mesmo alvo editado ou
  // outro; o historico segue oferecendo as salvas). O resultado persistido
  // some junto pelo proprio effect de persistencia (que passa a gravar
  // result: null), entao sair e voltar depois disso cai na ENTRADA, sem
  // mudanca de forma nem bump de versao do storage.
  function startNewAnalysis() {
    setResult(null);
    setAnalysisId(null);
    setProgressError("");
    setError("");
    setScoreDelta(null);
    setConfirmReanalyze(false);
  }

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Analisador de GitHub com IA"
        description="Analise seu GitHub com IA: receba uma nota objetiva, um checklist do que falta e melhorias priorizadas para deixar seu perfil pronto para vagas."
        url="/portfolio/analisar"
      />
      {/* Cenario do Dialeto 2 (padrao do RoadmapsV2Index) e a pagina inteira:
          sem PageHero, o cabecalho vive DENTRO do cenario, que nasce no topo.
          O backdrop vivo (gradiente + doodles) so existe no estado de entrada. */}
      <section className="relative overflow-hidden bg-[#faf8f4] pb-16 pt-8 [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        {!loading && !error && !result ? (
          <AnalyzerBackdrop reduce={reduce} />
        ) : null}
        {!loading && !error && result ? (
          <ResultBackdrop band={result.deterministic.band} reduce={reduce} />
        ) : null}
        <div className="container relative z-10">
          {/* Cabecalho integrado, presente nos 3 estados (entrada, scan,
              resultado). O slot do topo esquerdo e o lugar universal de
              "voltar": no resultado vira o link Nova analise; na entrada e no
              scan fica vazio. TODO(Ana): validar eyebrow, titulo, subtitulo e
              o rotulo do link (alternativa: "Analisar outro"). */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-10"
          >
            {!loading && !error && result ? (
              <button
                type="button"
                onClick={startNewAnalysis}
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-bold",
                  ac.link,
                  ac.linkHover,
                )}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Nova análise
              </button>
            ) : null}
            <p
              className={cn(
                !loading && !error && result ? "mt-5" : undefined,
              )}
            >
              <span className="inline-flex rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
                Análise Pro
              </span>
            </p>
            <div className="mt-3.5 flex items-center gap-4">
              <span
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 shadow-[3px_3px_0_currentColor]",
                  ac.panelBorder,
                  ac.panelSoft,
                  ac.iconMuted,
                )}
                aria-hidden
              >
                <Github className="h-8 w-8" />
              </span>
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 md:text-[clamp(2rem,5vw,2.6rem)]">
                Analisador de GitHub
              </h1>
            </div>
            <p className="mt-3 max-w-2xl text-base font-medium text-slate-600">
              Receba uma nota objetiva, um checklist do que falta e melhorias
              priorizadas pra deixar seu GitHub pronto pra vagas.
            </p>
          </motion.div>

          {!isPro ? (
            <ProGate description="A análise lê seu perfil ou repositório público do GitHub, calcula uma nota e mostra o que melhorar pra vagas de estágio, trainee, júnior ou pleno." />
          ) : (
            <div className="space-y-8">
              {/* Ordem narrativa do estado de entrada: explicacao (timeline +
                  vitrine) ANTES do palco; as pills fecham o argumento logo
                  abaixo dele. Em scan/erro/resultado nada disso renderiza e o
                  palco segue no topo. */}
              {!loading && !error && !result ? (
                <div className="mx-auto max-w-5xl">
                  <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
                    <HowItWorksTimeline />
                    <ResultShowcase />
                  </div>
                </div>
              ) : null}

              {/* Palco central: intake em destaque, com o alvo materializando
                  abaixo do campo quando a deteccao assenta. Peca da familia da
                  vitrine: rotacao leve + selo de proposito no topo. */}
              <div
                className={cn(
                  "card-brutal area-rise relative mx-auto max-w-3xl -rotate-[0.4deg] rounded-2xl border-slate-950 bg-white p-6 sm:p-8",
                  // Respiro dedicado entre a explicacao e o palco (so na
                  // entrada; em scan/resultado o palco abre a pagina).
                  !loading && !error && !result && "mt-14 sm:mt-16",
                  ac.liftShadow,
                )}
              >
                {/* TODO(Ana): revisar o selo e o titulo do palco. */}
                <span className="absolute -top-3.5 left-6 z-10 inline-flex rotate-1 items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Comece aqui
                </span>
                <h2 className="font-display text-xl font-black text-slate-950 sm:text-2xl">
                  Cole seu GitHub e receba o raio-X
                </h2>

                <label className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
                  {/* TODO(Ana): revisar rotulo e helper da area alvo. */}
                  <span>Área alvo desta análise</span>
                  <select
                    value={area}
                    onChange={(event) =>
                      changeArea(event.target.value as AreaSelection)
                    }
                    className={cn(
                      "rounded-xl border-2 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none",
                      ac.input,
                      ac.cardFocusRing,
                    )}
                  >
                    <option value={GENERAL_AREA}>Geral</option>
                    {areasTI.map((a) => (
                      <option key={a.slug} value={a.slug}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Vale só para esta análise e direciona as recomendações. Ex:
                  você pode ser full stack e analisar um projeto de IA.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mt-5 flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={INPUT_PLACEHOLDER}
                    className={cn(
                      "w-full rounded-xl border-2 bg-white px-4 py-4 text-base outline-none",
                      ac.input,
                      ac.cardFocusRing,
                    )}
                  />
                  <BrutalActionButton
                    variant="ai"
                    type="submit"
                    disabled={detection.kind === "invalid"}
                    loading={loading}
                    icon={<Sparkles className="h-4 w-4" aria-hidden />}
                    className="shrink-0 px-6 py-4"
                  >
                    {loading ? "Analisando..." : "Analisar"}
                  </BrutalActionButton>
                </form>

                {/* TODO(Ana): revisar a copy do cartao-alvo e do motivo invalido. */}
                {debouncedInput.trim() !== "" ? (
                  preview.kind === "invalid" ? (
                    <p className="mt-4 text-xs font-bold text-rose-700">
                      {preview.reason}
                    </p>
                  ) : (
                    <motion.div
                      key={
                        preview.kind === "repo"
                          ? `repo:${preview.owner}/${preview.repo}`
                          : `perfil:${preview.login}`
                      }
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="mt-5 flex items-start gap-3 rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[3px_3px_0_#0f172a]"
                    >
                      <TargetAvatar
                        key={
                          preview.kind === "repo"
                            ? preview.owner
                            : preview.login
                        }
                        owner={
                          preview.kind === "repo"
                            ? preview.owner
                            : preview.login
                        }
                      />
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide",
                            ac.tag,
                          )}
                        >
                          {preview.kind === "repo" ? "Repositório" : "Perfil"}
                        </span>
                        <p className="mt-1 truncate font-display text-lg font-black leading-tight text-slate-950">
                          {preview.kind === "repo"
                            ? `${preview.owner}/${preview.repo}`
                            : `@${preview.login}`}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          {MODE_DESCRIPTION[preview.kind]}
                        </p>
                        {preview.kind === "repo" ? (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <Globe
                              className="h-3.5 w-3.5 text-slate-400"
                              aria-hidden
                            />
                            O repositório precisa ser público.
                          </p>
                        ) : null}
                      </div>
                    </motion.div>
                  )
                ) : null}
              </div>

              {!loading && !error && !result ? <BenefitPills /> : null}

              {loading ? (
                <ScanCard
                  owner={
                    detection.kind === "repo"
                      ? detection.owner
                      : detection.kind === "perfil"
                        ? detection.login
                        : null
                  }
                  display={
                    detection.kind === "repo"
                      ? `${detection.owner}/${detection.repo}`
                      : detection.kind === "perfil"
                        ? `@${detection.login}`
                        : null
                  }
                  reduce={reduce}
                />
              ) : null}

              {!loading && error ? (
                <AnalysisError
                  error={error}
                  onRetry={input.trim() ? () => void runAnalysis() : undefined}
                />
              ) : null}

              {!loading && !error && result ? (
                <div
                  className="area-rise space-y-8"
                  style={{ animationDelay: "0.08s" }}
                >
                  <ScoreHero
                    response={result}
                    scoreDelta={scoreDelta}
                    reduce={reduce}
                    improvements={improvementsScore}
                  />

                  {scoreDelta ? (
                    <ScoreDeltaBanner
                      from={scoreDelta.from}
                      to={scoreDelta.to}
                    />
                  ) : null}

                  {result.deterministic.suficienciaRazao?.trim() ? (
                    <div className="flex items-start gap-2 rounded-2xl border-2 border-slate-900 bg-sky-50 p-4 text-sm font-medium text-sky-900 shadow-[3px_3px_0_#0f172a]">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                      <span>{result.deterministic.suficienciaRazao}</span>
                    </div>
                  ) : null}

                  {/* Spotlight fora das tabs: a ponte nota -> acao. */}
                  <motion.div
                    initial={
                      reduce ? false : { opacity: 0, y: 16, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { delay: 0.3, duration: 0.4, ease: "easeOut" }
                    }
                    className="rotate-[0.5deg]"
                  >
                    <NextStepCard
                      proximoPasso={result.qualitative.proximoPasso}
                    />
                  </motion.div>

                  {/* Corpo revista: coluna narrativa (7) + trilho lateral
                      consultavel (5). No mobile os wrappers viram display
                      contents e as classes order-* definem a ordem de leitura
                      empilhada: resumo, fortes/fracos, checklist, melhorias,
                      repos, readme, next steps, reanalise. */}
                  <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
                    <div className="contents lg:col-span-7 lg:block lg:space-y-8">
                      <Reveal className="order-1 lg:order-none">
                        <AiSummary
                          resumo={result.qualitative.resumo}
                          onAskAgent={() =>
                            // TODO(Ana): revisar o texto pre-preenchido da ponte.
                            openAgentWidget(
                              "Sobre minha análise de GitHub de hoje: ",
                            )
                          }
                        />
                      </Reveal>
                      <Reveal className="order-2 lg:order-none" delay={0.05}>
                        <StrengthsWeaknesses
                          pontosFortes={result.qualitative.pontosFortes}
                          pontosFracos={result.qualitative.pontosFracos}
                        />
                      </Reveal>
                      <Reveal className="order-4 lg:order-none" delay={0.05}>
                        <div className="space-y-3">
                          {!analysisId ? (
                            <FeedbackBanner variant="warn">
                              {/* TODO(Ana): revisar o aviso de progresso indisponivel. */}
                              O progresso de melhorias está indisponível para
                              esta análise.
                            </FeedbackBanner>
                          ) : null}
                          {progressError ? (
                            <FeedbackBanner variant="error">
                              {progressError}
                            </FeedbackBanner>
                          ) : null}
                          <Improvements
                            melhorias={result.qualitative.melhorias}
                            applied={analysisId ? applied : undefined}
                            onToggle={
                              analysisId ? toggleImprovement : undefined
                            }
                          />
                        </div>
                      </Reveal>
                      {result.qualitative.readmeSugestao ? (
                        <Reveal className="order-6 lg:order-none">
                          <ReadmeSuggestion
                            markdown={result.qualitative.readmeSugestao}
                          />
                        </Reveal>
                      ) : null}
                      {/* Climax do loop fechando a COLUNA PRINCIPAL: card com
                          titulo e controles empilhados, celebrando no N de N.
                          Confirmacao em 2 passos e custo explicito identicos. */}
                      <Reveal className="order-8 lg:order-none">
                        <ReanalyzeCta
                          confirming={confirmReanalyze}
                          onStart={() => setConfirmReanalyze(true)}
                          onConfirm={() => void runAnalysis()}
                          onCancel={() => setConfirmReanalyze(false)}
                          spotlight
                          celebrate={allApplied}
                        />
                      </Reveal>
                    </div>

                    <div className="contents lg:col-span-5 lg:block lg:space-y-8">
                      <Reveal className="order-3 lg:order-none" delay={0.1}>
                        <div className="space-y-4">
                          {/* TODO(Ana): revisar o rotulo do trilho lateral. */}
                          <SectionLabel ac={ac}>Raio-X completo</SectionLabel>
                          <ChecklistByCategory
                            checks={result.deterministic.checks}
                            compact
                            linkTarget={{
                              kind: result.target.kind,
                              login: result.target.login,
                              repo: result.target.repo,
                            }}
                          />
                        </div>
                      </Reveal>
                      {result.mode === "perfil" ? (
                        <Reveal className="order-5 lg:order-none">
                          <TopRepos response={result} compact />
                        </Reveal>
                      ) : null}
                      <Reveal className="order-7 lg:order-none">
                        <NextStepsByArea area={result.area} />
                      </Reveal>
                    </div>
                  </div>
                </div>
              ) : null}

              {!loading && !error && !result && history && history.length > 0 ? (
                <details
                  className={cn(
                    "area-rise group rounded-2xl border-2 border-slate-950 bg-white shadow-[4px_4px_0_#0f172a] transition-shadow",
                    ac.liftShadow,
                  )}
                  style={{ animationDelay: "0.16s" }}
                >
                  {/* TODO(Ana): revisar o rotulo da faixa colapsavel do historico. */}
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                    <span className="flex items-center gap-3 font-display text-lg font-black text-slate-950">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-300 text-slate-950 shadow-[2px_2px_0_#0f172a]"
                        aria-hidden
                      >
                        <History className="h-5 w-5" />
                      </span>
                      Análises anteriores
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-black",
                          ac.tag,
                        )}
                      >
                        {history.length}
                      </span>
                    </span>
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-slate-600 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="px-5 pb-5">
                    <GithubHistory
                      analyses={history}
                      onOpen={(id) => void openHistory(id)}
                      loadingId={historyLoadingId}
                    />
                  </div>
                </details>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
