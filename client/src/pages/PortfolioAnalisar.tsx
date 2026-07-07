import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Github, Globe, Info, Sparkles } from "lucide-react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import AnalysisSkeleton from "@/components/shared/AnalysisSkeleton";
import BrutalActionButton from "@/components/shared/BrutalActionButton";
import PageHero from "@/components/shared/PageHero";
import ReanalyzeCta from "@/components/shared/ReanalyzeCta";
import ScoreCard, { type ScoreBandUi } from "@/components/shared/ScoreCard";
import ScoreDeltaBanner from "@/components/shared/ScoreDeltaBanner";
import SEO from "@/components/SEO";
import { AnalysisError } from "@/components/portfolio/AnalysisStates";
import { HowItWorks, WhatYouGet } from "@/components/portfolio/AnalyzerIntro";
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
import {
  analyzeGithub,
  getGithubAnalysis,
  listGithubAnalyses,
  normalizeGithubTarget,
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

// Mapa faixa->cor preservado byte a byte do antigo ScoreCard do portfolio; a
// anatomia agora vive no ScoreCard compartilhado.
const BAND_UI: Record<ScoreBand, ScoreBandUi> = {
  comecando: { label: "Começando", cardBg: "bg-red-100", chipBg: "bg-red-300" },
  evoluindo: {
    label: "Evoluindo",
    cardBg: "bg-amber-100",
    chipBg: "bg-amber-300",
  },
  bom: { label: "Bom", cardBg: "bg-sky-100", chipBg: "bg-sky-300" },
  destaque: {
    label: "Destaque",
    cardBg: "bg-emerald-100",
    chipBg: "bg-emerald-300",
  },
};

// Decor do hero no padrao das paginas de area (blobs de baixa opacidade com
// animate-gentle-float; reduced-motion coberto pelo CSS global da classe).
function AnalyzerHeroDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="animate-gentle-float absolute -right-12 -top-16 h-48 w-48 rounded-full bg-violet-300 opacity-40 blur-3xl" />
      <div
        className="animate-gentle-float absolute right-1/4 top-1/3 h-28 w-28 rounded-full bg-violet-300 opacity-30 blur-3xl"
        style={{ animationDelay: "1.4s" }}
      />
      <div
        className="animate-gentle-float absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-violet-300 opacity-25 blur-3xl"
        style={{ animationDelay: "0.7s" }}
      />
    </div>
  );
}

// TODO(Ana): revisar placeholder e descricoes da deteccao automatica.
const INPUT_PLACEHOLDER = "github.com/usuario ou github.com/usuario/projeto";

const MODE_DESCRIPTION: Record<AnalysisMode, string> = {
  perfil:
    "Analisa seu README de perfil, bio, links de contato, repositórios e atividade.",
  repo: "Analisa README, descrição, licença, topics, arquivos de segurança e a organização do projeto.",
};

const STORAGE_KEY = "boranatech:portfolio-analyzer";
// Versao da forma do payload persistido. Bump sempre que a forma da resposta
// (GithubAnalysisResponse) ou a forma do estado salvo mudar. No restore,
// payload de versao diferente e descartado, pra nunca reusar um result de
// shape antigo. A versao 4 troca os slots por modo por um input/result unico
// (o alvo e autodetectado do input).
const STORAGE_SHAPE_VERSION = 4;

interface StoredState {
  input: string;
  result: GithubAnalysisResponse | null;
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
    return { input: "", result: null, area: null };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { input: "", result: null, area: null };
    const parsed = JSON.parse(raw) as {
      input?: unknown;
      result?: unknown;
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
      area: coerceArea(parsed.area),
    };
  } catch {
    return { input: "", result: null, area: null };
  }
}

function ResultHeader({ response }: { response: GithubAnalysisResponse }) {
  const { target, deterministic } = response;
  const display =
    target.kind === "repo"
      ? `${target.login}/${target.repo}`
      : `@${target.login}`;

  return (
    <div
      className={cn(
        "card-brutal overflow-hidden rounded-2xl border-slate-950 bg-white",
        ac.liftShadow,
      )}
    >
      <div className="flex flex-col md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col p-6">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-slate-950 text-white shadow-[3px_3px_0_#0f172a]">
                <Github className="h-6 w-6" />
              </span>
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
          <div className="mt-auto pt-6">
            <MetadataChips response={response} />
          </div>
        </div>
        <div className="border-t-2 border-slate-950 md:w-56 md:border-l-2 md:border-t-0">
          <ScoreCard
            score={deterministic.score}
            band={BAND_UI[deterministic.band]}
            title="Nota do portfólio"
            variant="panel"
          />
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

  // Persiste input, result e area no sessionStorage. Nunca persiste loading
  // nem error.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ input, result, area, version: STORAGE_SHAPE_VERSION }),
      );
    } catch {
      // storage cheio ou indisponivel: ignora, segue so em memoria.
    }
  }, [input, result, area]);

  // Deteccao ao vivo do alvo (perfil ou repo) pela mesma fonte do server.
  const detection = detectGithubTarget(input);

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
      const data = await analyzeGithub(target.kind, trimmed, area);
      setResult(data);
      setScoreDelta(
        priorScore !== null
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
      const priorScore = rawInput ? findPriorScore(rawInput, id) : null;
      setScoreDelta(
        priorScore !== null && typeof record.score === "number"
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

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Analisador de GitHub com IA"
        description="Analise seu GitHub com IA: receba uma nota objetiva, um checklist do que falta e melhorias priorizadas para deixar seu perfil pronto para vagas."
        url="/portfolio/analisar"
      />
      {/* TODO(Ana): validar eyebrow e label do link de volta do hero */}
      <PageHero
        accent="violet"
        eyebrow="Análise Pro"
        title="Analisador de GitHub"
        subtitle="Receba uma nota objetiva, um checklist do que falta e melhorias priorizadas pra deixar seu GitHub pronto pra vagas."
        backgroundSlot={<AnalyzerHeroDecor />}
        topSlot={
          <Link
            href="/portfolio"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-bold",
              ac.link,
              ac.linkHover,
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Guia de portfólio
          </Link>
        }
        titlePrefix={
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
        }
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          {!isPro ? (
            <ProGate description="A análise lê seu perfil ou repositório público do GitHub, calcula uma nota e mostra o que melhorar pra vagas de estágio, trainee, júnior ou pleno." />
          ) : (
            <div className="space-y-8">
              <div
                className={cn(
                  "card-brutal area-rise rounded-2xl border-slate-950 bg-white p-6",
                  ac.liftShadow,
                )}
              >
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
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
                  className="mt-4 flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={INPUT_PLACEHOLDER}
                    className={cn(
                      "w-full rounded-xl border-2 bg-white p-3 text-sm outline-none",
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
                    className="shrink-0 px-6 py-3"
                  >
                    {loading ? "Analisando..." : "Analisar"}
                  </BrutalActionButton>
                </form>

                {/* TODO(Ana): revisar a copy do badge de deteccao. */}
                {input.trim() !== "" ? (
                  detection.kind === "invalid" ? (
                    <p className="mt-3 text-xs font-bold text-rose-700">
                      {detection.reason}
                    </p>
                  ) : (
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-black",
                          ac.tag,
                        )}
                      >
                        <Github className="h-3 w-3" aria-hidden />
                        {detection.kind === "repo"
                          ? `Repositório: ${detection.owner}/${detection.repo}`
                          : `Perfil: ${detection.login}`}
                      </span>
                      {MODE_DESCRIPTION[detection.kind]}
                    </p>
                  )
                ) : null}
                {detection.kind === "repo" ? (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />O
                    repositório precisa ser público.
                  </p>
                ) : null}
              </div>

              {loading ? <AnalysisSkeleton /> : null}

              {!loading && error ? (
                <AnalysisError
                  error={error}
                  onRetry={input.trim() ? () => void runAnalysis() : undefined}
                />
              ) : null}

              {!loading && !result ? (
                <div
                  className="area-rise space-y-8"
                  style={{ animationDelay: "0.08s" }}
                >
                  <HowItWorks />
                  <WhatYouGet />
                </div>
              ) : null}

              {!loading && !error && result ? (
                <div
                  className="area-rise space-y-8"
                  style={{ animationDelay: "0.08s" }}
                >
                  <ResultHeader response={result} />

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

                  <TopRepos response={result} />

                  <AiSummary resumo={result.qualitative.resumo} />

                  <ChecklistByCategory checks={result.deterministic.checks} />

                  <StrengthsWeaknesses
                    pontosFortes={result.qualitative.pontosFortes}
                    pontosFracos={result.qualitative.pontosFracos}
                  />

                  <NextStepCard proximoPasso={result.qualitative.proximoPasso} />

                  <Improvements melhorias={result.qualitative.melhorias} />

                  <ReadmeSuggestion
                    markdown={result.qualitative.readmeSugestao}
                  />

                  <NextStepsByArea area={result.area} />

                  <ReanalyzeCta
                    confirming={confirmReanalyze}
                    onStart={() => setConfirmReanalyze(true)}
                    onConfirm={() => void runAnalysis()}
                    onCancel={() => setConfirmReanalyze(false)}
                  />
                </div>
              ) : null}

              {history && history.length > 0 ? (
                <div
                  className="area-rise"
                  style={{ animationDelay: "0.16s" }}
                >
                  <GithubHistory
                    analyses={history}
                    onOpen={(id) => void openHistory(id)}
                    loadingId={historyLoadingId}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
