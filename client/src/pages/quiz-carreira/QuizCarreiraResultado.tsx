import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, RotateCcw, Sparkles } from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { areasTI } from "@/lib/data";
import {
  getAreaAccent,
  getTechRecommendation,
  techRecommendations,
} from "@/lib/platformData";
import { useAuth } from "@/contexts/AuthContext";
import {
  getQuizHistory,
  QUIZ_RESULT_SESSION_KEY,
} from "@/services/careerQuizService";

interface AreaScore {
  area: string;
  score: number;
  percentage: number;
  slug?: string;
}

interface QuizResult {
  kind: "area" | "tech";
  resultArea: string;
  resultAreaSlug: string;
  confidence: number;
  topAreas: AreaScore[];
  reasons: string[];
  completedAt: string;
  techKey?: string;
  // Presente so quando o resultado veio do sessionStorage: false indica que a
  // gravacao em career_quiz_attempts ainda nao foi confirmada.
  persisted?: boolean;
}

interface HistoryEntry {
  id: string;
  started_at: string | null;
  completed_at: string | null;
  result_area: string | null;
  result_area_slug: string | null;
  confidence: number | null;
  result_json?: {
    kind?: "area" | "tech";
    techKey?: string;
    scores?: Record<string, number>;
    topAreas?: AreaScore[];
    reasons?: string[];
  } | null;
}

function normalizeHistoryEntry(entry: HistoryEntry): QuizResult | null {
  if (!entry.result_area) return null;
  const json = entry.result_json || {};
  const slugFromMeta =
    entry.result_area_slug ||
    areasTI.find((a) => a.nome === entry.result_area)?.slug ||
    "";

  return {
    kind: json.kind === "tech" ? "tech" : "area",
    resultArea: entry.result_area,
    resultAreaSlug: slugFromMeta,
    confidence: entry.confidence ?? 0,
    topAreas: json.topAreas ?? [],
    reasons: json.reasons ?? [],
    completedAt: entry.completed_at || new Date().toISOString(),
    techKey: json.techKey,
  };
}

function accentForItem(kind: "area" | "tech", name: string): string {
  if (kind === "tech") {
    return (
      techRecommendations.find((t) => t.label === name)?.accent ?? "#0e7490"
    );
  }
  return getAreaAccent(name);
}

function descForItem(kind: "area" | "tech", name: string): string {
  if (kind === "tech") {
    return techRecommendations.find((t) => t.label === name)?.tagline ?? "";
  }
  return areasTI.find((a) => a.nome === name)?.descricaoCurta ?? "";
}

export default function QuizCarreiraResultado() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // true quando o resultado exibido veio do sessionStorage com persisted false
  // (quiz concluido sem a gravacao na conta confirmada).
  const [unsavedLocally, setUnsavedLocally] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestResult() {
      try {
        let fromSession: string | null = null;
        try {
          fromSession = sessionStorage.getItem(QUIZ_RESULT_SESSION_KEY);
        } catch {
          // sessionStorage indisponível
        }

        if (fromSession) {
          const parsed = JSON.parse(fromSession) as QuizResult;
          if (!cancelled) {
            setResult({ ...parsed, kind: parsed.kind ?? "area" });
            setUnsavedLocally(parsed.persisted === false);
            setIsLoading(false);
          }
          return;
        }

        const history = (await getQuizHistory()) as HistoryEntry[];
        if (cancelled) return;

        if (!Array.isArray(history) || history.length === 0) {
          setLocation("/quiz-carreira");
          return;
        }

        const normalized = normalizeHistoryEntry(history[0]);
        if (!normalized) {
          setLocation("/quiz-carreira");
          return;
        }

        setResult(normalized);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar resultado",
        );
        setIsLoading(false);
      }
    }

    void loadLatestResult();
    return () => {
      cancelled = true;
    };
  }, [setLocation]);

  const accent = useMemo(() => {
    if (!result) return "#7c3aed";
    return result.kind === "tech"
      ? getTechRecommendation(result.techKey || result.resultArea).accent
      : getAreaAccent(result.resultArea);
  }, [result]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center bg-[#faf8f4]">
          <p className="font-mono text-sm text-slate-500">
            Carregando resultado...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !result) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center bg-[#faf8f4]">
          <div className="max-w-md text-center">
            <p className="mb-4 font-bold text-rose-700">
              {error || "Resultado não encontrado"}
            </p>
            <Link
              href="/quiz-carreira"
              className="inline-flex items-center gap-2 font-bold text-violet-700 hover:underline"
            >
              Fazer o quiz <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isTech = result.kind === "tech";

  return (
    <Layout>
      <SEO
        title={`${isTech ? "Foque em" : "Você combina com"} ${result.resultArea} · Bora na Tech?`}
        description={`Resultado do quiz: ${result.resultArea} com ${result.confidence}% de match.`}
        url="/quiz-carreira/resultado"
      />

      <div className="min-h-screen bg-[#faf8f4]">
        <div className="container max-w-3xl py-10 md:py-12">
          <Link
            href="/quiz-carreira"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-slate-600 hover:text-slate-950"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={3} />
            Refazer quiz
          </Link>

          {unsavedLocally && !authLoading && !user && (
            <div className="mb-6 rounded-2xl border-2 border-[#1a1a1a] bg-white px-5 py-4 shadow-[2px_2px_0_#0f172a]">
              {/* TODO(Ana): copy do aviso de resultado nao salvo na conta. */}
              <p className="text-sm font-semibold text-slate-700">
                Seu resultado ainda não está salvo na sua conta. Entre para não
                perder.
              </p>
            </div>
          )}

          <ResultHero result={result} accent={accent} />

          {isTech && <TechStartHere result={result} accent={accent} />}

          {!isTech && (
            <AboutArea areaName={result.resultArea} accent={accent} />
          )}

          {result.topAreas.length > 1 && (
            <OtherAreas areas={result.topAreas.slice(1)} kind={result.kind} />
          )}

          {result.reasons.length > 0 && (
            <ReasonsSection
              reasons={result.reasons}
              areaName={result.resultArea}
              accent={accent}
            />
          )}

          <CTAsSection result={result} accent={accent} />
        </div>
      </div>
    </Layout>
  );
}

function ConfettiBurst({ accent }: { accent: string }) {
  const colors = [accent, "#FFB800", "#db2777", "#0e7490", "#15803d"];
  const dots = Array.from({ length: 14 });
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {dots.map((_, i) => {
        const left = (i * 53) % 100;
        const size = 6 + (i % 3) * 3;
        return (
          <motion.span
            key={i}
            className="absolute rounded-[2px]"
            style={{
              left: `${left}%`,
              top: "-10%",
              width: size,
              height: size,
              backgroundColor: colors[i % colors.length],
            }}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: "120%", opacity: [0, 1, 1, 0], rotate: 180 }}
            transition={{
              duration: 1.6 + (i % 4) * 0.25,
              delay: 0.1 + (i % 5) * 0.06,
              ease: "easeIn",
            }}
          />
        );
      })}
    </div>
  );
}

function ResultHero({
  result,
  accent,
}: {
  result: QuizResult;
  accent: string;
}) {
  const isTech = result.kind === "tech";
  const areaMeta = areasTI.find((a) => a.nome === result.resultArea);
  const Icon = areaMeta?.icon;
  const rec = isTech
    ? getTechRecommendation(result.techKey || result.resultArea)
    : null;
  const description = isTech ? rec?.why : areaMeta?.descricaoCurta;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-8 overflow-hidden rounded-3xl border-2 border-[#1a1a1a] p-6 shadow-[6px_6px_0_#0f172a] md:p-8"
      style={{ backgroundColor: `${accent}10` }}
    >
      <ConfettiBurst accent={accent} />

      <motion.div
        className="absolute right-6 top-6 -z-0"
        aria-hidden
        animate={{ y: [0, -6, 0], rotate: [12, 18, 12] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles
          className="h-8 w-8"
          style={{ color: `${accent}66` }}
          strokeWidth={2}
        />
      </motion.div>

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-3">
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: 0.15,
            }}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 text-white shadow-[2px_2px_0_#0f172a]"
            style={{ backgroundColor: accent, fontSize: "1.4rem" }}
          >
            {isTech ? (
              <span aria-hidden>{rec?.emoji}</span>
            ) : (
              Icon && <Icon className="h-6 w-6" strokeWidth={2.2} />
            )}
          </motion.span>
          <p
            className="font-mono text-xs uppercase tracking-[0.22em]"
            style={{ color: accent }}
          >
            {isTech ? "Sua tecnologia pra focar" : "Seu match principal"}
          </p>
        </div>

        <h1
          className="mb-3 break-words font-display font-black leading-[1.0] text-slate-950"
          style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
        >
          {result.resultArea}
        </h1>

        {isTech && rec?.tagline && (
          <p
            className="mb-2 text-base font-black md:text-lg"
            style={{ color: accent }}
          >
            {rec.tagline}
          </p>
        )}

        {description && (
          <p className="mb-6 max-w-xl text-base font-semibold text-slate-700 md:text-lg">
            {description}
          </p>
        )}

        <div className="max-w-md">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
              {isTech ? "Aderência ao seu perfil" : "Confiança do resultado"}
            </span>
            <span className="font-display text-xl font-black text-slate-950">
              {result.confidence}%
            </span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-white">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${accent}, #FFB800)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function TechStartHere({
  result,
  accent,
}: {
  result: QuizResult;
  accent: string;
}) {
  const rec = getTechRecommendation(result.techKey || result.resultArea);
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="mb-8"
    >
      <div className="mb-4">
        <p
          className="mb-1 font-mono text-xs uppercase tracking-[0.22em]"
          style={{ color: accent }}
        >
          Por onde começar
        </p>
        <h2 className="font-display text-2xl font-black text-slate-950">
          Seus primeiros passos com {rec.label}
        </h2>
      </div>

      <ol className="space-y-3">
        {rec.startHere.map((step, idx) => (
          <motion.li
            key={step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 + idx * 0.1 }}
            className="flex items-start gap-3 rounded-2xl border-2 border-[#1a1a1a] bg-white px-5 py-4 shadow-[2px_2px_0_#0f172a]"
          >
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-sm font-black text-white"
              style={{ backgroundColor: accent }}
            >
              {idx + 1}
            </span>
            <p className="pt-0.5 text-base font-semibold text-slate-900">
              {step}
            </p>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}

function AboutArea({ areaName, accent }: { areaName: string; accent: string }) {
  const meta = areasTI.find((a) => a.nome === areaName);
  if (!meta) return null;
  const tarefas = meta.tarefasDiarias?.slice(0, 4) ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18 }}
      className="mb-8"
    >
      <div className="mb-4">
        <p
          className="mb-1 font-mono text-xs uppercase tracking-[0.22em]"
          style={{ color: accent }}
        >
          O que é essa área
        </p>
        <h2 className="font-display text-2xl font-black text-slate-950">
          Conhecendo {areaName}
        </h2>
      </div>

      <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
        <p className="text-base font-semibold leading-relaxed text-slate-700">
          {meta.descricaoCompleta}
        </p>

        {tarefas.length > 0 && (
          <>
            <p className="mb-3 mt-6 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              No dia a dia
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {tarefas.map((tarefa) => (
                <li
                  key={tarefa}
                  className="flex items-start gap-2.5 text-sm font-semibold text-slate-700"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  {tarefa}
                </li>
              ))}
            </ul>
          </>
        )}

        {meta.perfilIndicado && (
          <div
            className="mt-6 rounded-2xl border-2 px-4 py-3"
            style={{ borderColor: accent, backgroundColor: `${accent}10` }}
          >
            <p
              className="mb-1 font-mono text-[11px] font-black uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              Combina com quem
            </p>
            <p className="text-sm font-semibold text-slate-700">
              {meta.perfilIndicado}
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function OtherAreas({
  areas,
  kind,
}: {
  areas: AreaScore[];
  kind: "area" | "tech";
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-8"
    >
      <div className="mb-4">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
          {kind === "tech"
            ? "Outras tecnologias"
            : "Outras áreas com afinidade"}
        </p>
        <h2 className="font-display text-2xl font-black text-slate-950">
          Também combinam com você
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {areas.map((area, idx) => {
          const itemAccent = accentForItem(kind, area.area);
          const desc = descForItem(kind, area.area);
          return (
            <div
              key={area.area}
              className="flex flex-col rounded-2xl border-2 border-slate-300 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-[3px_3px_0_#0f172a]"
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <h3 className="truncate font-display text-base font-black text-slate-950">
                  {area.area}
                </h3>
                <span
                  className="shrink-0 font-mono text-sm font-bold"
                  style={{ color: itemAccent }}
                >
                  {area.percentage}%
                </span>
              </div>
              {desc && (
                <p className="mb-3 text-xs font-semibold leading-snug text-slate-500">
                  {desc}
                </p>
              )}
              <div className="mt-auto h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: itemAccent }}
                  initial={{ width: 0 }}
                  animate={{ width: `${area.percentage}%` }}
                  transition={{
                    duration: 0.6,
                    delay: 0.4 + idx * 0.1,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function ReasonsSection({
  reasons,
  areaName,
  accent,
}: {
  reasons: string[];
  areaName: string;
  accent: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mb-8"
    >
      <div className="mb-4">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.22em] text-amber-700">
          Por que esse resultado
        </p>
        <h2 className="font-display text-2xl font-black text-slate-950">
          Você se aproximou de {areaName} porque:
        </h2>
      </div>

      <div className="space-y-3">
        {reasons.map((reason, idx) => (
          <motion.div
            key={`${idx}-${reason}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
            className="flex items-start gap-3 rounded-2xl border-2 border-[#1a1a1a] bg-white px-5 py-4 shadow-[2px_2px_0_#0f172a]"
          >
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-sm font-black text-white"
              style={{ backgroundColor: accent }}
            >
              {idx + 1}
            </span>
            <p className="pt-0.5 text-base font-semibold text-slate-900">
              {reason}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function CTAsSection({
  result,
  accent,
}: {
  result: QuizResult;
  accent: string;
}) {
  const isTech = result.kind === "tech";
  const relatedArea = areasTI.find((a) => a.slug === result.resultAreaSlug);
  const exploreLabel = isTech
    ? relatedArea
      ? `Explorar ${relatedArea.nome}`
      : "Explorar a área"
    : `Explorar ${result.resultArea}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="overflow-hidden rounded-3xl border-2 border-[#1a1a1a] p-6 shadow-[6px_6px_0_#0f172a] md:p-8"
      style={{ backgroundColor: `${accent}12` }}
    >
      <p
        className="mb-3 font-mono text-xs uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        Próximo passo
      </p>

      <h2 className="mb-3 font-display text-3xl font-black text-slate-950 md:text-4xl">
        {isTech
          ? `Bora aprender ${result.resultArea}?`
          : `Bora começar em ${result.resultArea}?`}
      </h2>

      <p className="mb-6 max-w-xl text-base font-semibold text-slate-700 md:text-lg">
        {isTech
          ? `Temos trilhas, materiais e ferramentas pra você aprender ${result.resultArea} do jeito certo.`
          : `Temos trilhas, materiais e ferramentas pra te ajudar a dar o primeiro passo em ${result.resultArea}.`}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        {result.resultAreaSlug && (
          <Link
            href={`/areas/${result.resultAreaSlug}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-display text-sm font-black uppercase tracking-wider text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
          >
            {exploreLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        )}

        <Link
          href="/roadmaps"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-white px-6 py-3 font-display text-sm font-black uppercase tracking-wider text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
        >
          Ver todas as trilhas
        </Link>
      </div>

      <div className="mt-6 border-t-2 border-slate-200 pt-5">
        <Link
          href="/quiz-carreira"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-500 hover:text-slate-950"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
          Refazer o quiz
        </Link>
      </div>
    </motion.section>
  );
}
