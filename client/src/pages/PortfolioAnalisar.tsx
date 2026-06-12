import { useEffect, useRef, useState } from "react";
import { ExternalLink, Github, Globe, Info, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import PageHero from "@/components/shared/PageHero";
import { Spinner } from "@/components/ui/spinner";
import {
  AnalysisError,
  AnalysisSkeleton,
} from "@/components/portfolio/AnalysisStates";
import { HowItWorks, WhatYouGet } from "@/components/portfolio/AnalyzerIntro";
import ChecklistByCategory from "@/components/portfolio/ChecklistByCategory";
import { MetadataChips, TopRepos } from "@/components/portfolio/MetadataStrip";
import NextStepsByArea from "@/components/portfolio/NextStepsByArea";
import ScoreCard from "@/components/portfolio/ScoreCard";
import {
  AiSummary,
  Improvements,
  ReadmeSuggestion,
  StrengthsWeaknesses,
} from "@/components/portfolio/QualitativePanels";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { areasTI } from "@/lib/data";
import { analyzeGithub } from "@/lib/githubClient";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { GENERAL_AREA, isAreaSlug, type AreaSelection } from "@shared/areas";
import type {
  AnalysisMode,
  GithubAnalysisResponse,
} from "@shared/github/schema";

const ac = getPageAccentUi("violet");

const PLACEHOLDER: Record<AnalysisMode, string> = {
  perfil: "seu usuario do GitHub",
  repo: "github.com/usuario/projeto",
};

const MODE_DESCRIPTION: Record<AnalysisMode, string> = {
  perfil:
    "Analisa seu README de perfil, bio, links de contato, repositórios e atividade.",
  repo: "Analisa README, descrição, licença, topics, arquivos de segurança e a organização do projeto.",
};

const STORAGE_KEY = "boranatech:portfolio-analyzer";

interface ModeSlot {
  input: string;
  result: GithubAnalysisResponse | null;
}

type ModeSlots = Record<AnalysisMode, ModeSlot>;

function emptySlots(): ModeSlots {
  return {
    perfil: { input: "", result: null },
    repo: { input: "", result: null },
  };
}

function coerceSlot(value: unknown): ModeSlot {
  if (!value || typeof value !== "object") return { input: "", result: null };
  const slot = value as { input?: unknown; result?: unknown };
  const input = typeof slot.input === "string" ? slot.input : "";
  const result =
    slot.result && typeof slot.result === "object"
      ? (slot.result as GithubAnalysisResponse)
      : null;
  return { input, result };
}

interface StoredState {
  slots: ModeSlots;
  // null = nada valido salvo (ainda nao escolhido nesta sessao).
  area: AreaSelection | null;
}

function coerceArea(value: unknown): AreaSelection | null {
  if (value === GENERAL_AREA) return GENERAL_AREA;
  if (isAreaSlug(value)) return value;
  return null;
}

function loadState(): StoredState {
  if (typeof window === "undefined") return { slots: emptySlots(), area: null };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { slots: emptySlots(), area: null };
    const parsed = JSON.parse(raw) as {
      perfil?: unknown;
      repo?: unknown;
      area?: unknown;
    };
    return {
      slots: {
        perfil: coerceSlot(parsed.perfil),
        repo: coerceSlot(parsed.repo),
      },
      area: coerceArea(parsed.area),
    };
  } catch {
    return { slots: emptySlots(), area: null };
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
  const [mode, setMode] = useState<AnalysisMode>("perfil");
  const [slots, setSlots] = useState<ModeSlots>(bootstrap.slots);
  // Area e selecao global (vale pros dois modos), nao por modo.
  const [area, setArea] = useState<AreaSelection>(
    bootstrap.area ?? GENERAL_AREA,
  );
  // Se ja havia area salva, ou o usuario escolher, nao adotamos o default do perfil.
  const areaTouched = useRef(bootstrap.area !== null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Default da area pelo perfil logado, so se o usuario ainda nao escolheu nada
  // e nada valido estava salvo. Usa o profile ja carregado, sem fetch novo.
  useEffect(() => {
    if (areaTouched.current) return;
    const fromProfile = profile?.area_interesse;
    if (fromProfile && isAreaSlug(fromProfile)) {
      setArea(fromProfile);
      areaTouched.current = true;
    }
  }, [profile]);

  // Persiste slots e area no sessionStorage. Nunca persiste loading nem error.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...slots, area }),
      );
    } catch {
      // storage cheio ou indisponivel: ignora, segue so em memoria.
    }
  }, [slots, area]);

  const input = slots[mode].input;
  const result = slots[mode].result;

  function setInput(value: string) {
    setSlots((prev) => ({ ...prev, [mode]: { ...prev[mode], input: value } }));
  }

  function changeArea(next: AreaSelection) {
    areaTouched.current = true;
    setArea(next);
  }

  function changeMode(next: AnalysisMode) {
    if (next === mode) return;
    setMode(next);
    setError("");
  }

  async function runAnalysis() {
    const activeMode = mode;
    const trimmed = slots[activeMode].input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");

    try {
      const data = await analyzeGithub(activeMode, trimmed, area);
      setSlots((prev) => ({
        ...prev,
        [activeMode]: { ...prev[activeMode], result: data },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ANALYSIS_FAILED");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAnalysis();
  }

  return (
    <Layout>
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
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-full border-2 border-slate-950 bg-white p-1 shadow-[3px_3px_0_#0f172a]">
                    <button
                      type="button"
                      onClick={() => changeMode("perfil")}
                      className={cn(
                        "rounded-full px-5 py-2 text-sm font-black transition-colors",
                        mode === "perfil"
                          ? "bg-amber-300 text-slate-950"
                          : "text-slate-600 hover:text-slate-900",
                      )}
                    >
                      Perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => changeMode("repo")}
                      className={cn(
                        "rounded-full px-5 py-2 text-sm font-black transition-colors",
                        mode === "repo"
                          ? "bg-amber-300 text-slate-950"
                          : "text-slate-600 hover:text-slate-900",
                      )}
                    >
                      Repositório
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <span className="hidden sm:inline">Área alvo</span>
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
                </div>

                <p className="mt-4 text-sm font-medium text-slate-600">
                  {MODE_DESCRIPTION[mode]}
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mt-4 flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={PLACEHOLDER[mode]}
                    className="w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-violet-200"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
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
                {mode === "repo" ? (
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

                  {result.deterministic.suficiencia !== "alta" ? (
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

                  <Improvements melhorias={result.qualitative.melhorias} />

                  <ReadmeSuggestion
                    markdown={result.qualitative.readmeSugestao}
                  />

                  <NextStepsByArea area={result.area} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
