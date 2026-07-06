import { useEffect, useRef, useState } from "react";
import { ExternalLink, Github, Globe, Info, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import PageHero from "@/components/shared/PageHero";
import SEO from "@/components/SEO";
import { Spinner } from "@/components/ui/spinner";
import {
  AnalysisError,
  AnalysisSkeleton,
} from "@/components/portfolio/AnalysisStates";
import { HowItWorks, WhatYouGet } from "@/components/portfolio/AnalyzerIntro";
import ChecklistByCategory from "@/components/portfolio/ChecklistByCategory";
import GithubHistory from "@/components/portfolio/GithubHistory";
import { MetadataChips, TopRepos } from "@/components/portfolio/MetadataStrip";
import NextStepsByArea from "@/components/portfolio/NextStepsByArea";
import ScoreCard from "@/components/portfolio/ScoreCard";
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
} from "@shared/github/schema";

const ac = getPageAccentUi("violet");

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
    <div className="card-brutal overflow-hidden rounded-2xl border-slate-950 bg-white">
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
            band={deterministic.band}
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
      <PageHero
        accent="violet"
        eyebrow="revisão com IA"
        title="Analisador de GitHub"
        subtitle="Receba uma nota objetiva, um checklist do que falta e melhorias priorizadas pra deixar seu GitHub pronto pra vagas."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          {!isPro ? (
            <ProGate description="A análise lê seu perfil ou repositório público do GitHub, calcula uma nota e mostra o que melhorar pra vagas de estágio, trainee, júnior ou pleno." />
          ) : (
            <div className="space-y-8">
              <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <span>Área alvo</span>
                  <select
                    value={area}
                    onChange={(event) =>
                      changeArea(event.target.value as AreaSelection)
                    }
                    className="rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-violet-200"
                  >
                    <option value={GENERAL_AREA}>Geral</option>
                    {areasTI.map((a) => (
                      <option key={a.slug} value={a.slug}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <form
                  onSubmit={handleSubmit}
                  className="mt-4 flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={INPUT_PLACEHOLDER}
                    className="w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-violet-200"
                  />
                  <button
                    type="submit"
                    disabled={loading || detection.kind === "invalid"}
                    className="btn-brutal-accent inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {loading ? "Analisando..." : "Analisar"}
                  </button>
                </form>

                {/* TODO(Ana): revisar a copy do badge de deteccao. */}
                {input.trim() !== "" ? (
                  detection.kind === "invalid" ? (
                    <p className="mt-3 text-xs font-bold text-rose-700">
                      {detection.reason}
                    </p>
                  ) : (
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-violet-100 px-2.5 py-0.5 font-black text-slate-900">
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
                <div className="space-y-8">
                  <HowItWorks />
                  <WhatYouGet />
                </div>
              ) : null}

              {!loading && !error && result ? (
                <div className="space-y-8">
                  <ResultHeader response={result} />

                  {scoreDelta ? (
                    <div className="rounded-2xl border-2 border-slate-950 bg-emerald-50 p-4 text-sm font-bold text-slate-900 shadow-[3px_3px_0_#0f172a]">
                      {/* TODO(Ana): revisar a copy do delta de nota. */}
                      Sua nota foi de {scoreDelta.from} para {scoreDelta.to}
                      {scoreDelta.to > scoreDelta.from
                        ? ". Continua assim!"
                        : scoreDelta.to === scoreDelta.from
                          ? "."
                          : ". Veja abaixo o que priorizar."}
                    </div>
                  ) : null}

                  {result.deterministic.suficienciaRazao?.trim() ? (
                    <div className="flex items-start gap-2 rounded-2xl border-2 border-sky-300 bg-sky-50 p-4 text-sm font-medium text-sky-900">
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

                  <div className="flex flex-wrap items-center gap-3">
                    {/* TODO(Ana): revisar a copy da reanalise. */}
                    {confirmReanalyze ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void runAnalysis()}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
                        >
                          <Sparkles className="h-4 w-4" />
                          Confirmar (usa 1 análise do dia)
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReanalyze(false)}
                          className="text-sm font-bold text-slate-500 underline underline-offset-2 hover:text-slate-800"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmReanalyze(true)}
                        className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
                      >
                        <Sparkles className="h-4 w-4" />
                        Apliquei as melhorias, analisar de novo
                      </button>
                    )}
                  </div>
                </div>
              ) : null}

              {history && history.length > 0 ? (
                <GithubHistory
                  analyses={history}
                  onOpen={(id) => void openHistory(id)}
                  loadingId={historyLoadingId}
                />
              ) : null}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
