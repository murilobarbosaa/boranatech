import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, RotateCcw, Sparkles } from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { areasTI } from "@/lib/data";
import { getQuizHistory } from "@/services/careerQuizService";

const RESULT_SESSION_KEY = "quiz-carreira.last-result";

interface AreaScore {
  area: string;
  score: number;
  percentage: number;
  slug?: string;
}

interface QuizResult {
  resultArea: string;
  resultAreaSlug: string;
  confidence: number;
  topAreas: AreaScore[];
  reasons: string[];
  completedAt: string;
}

interface HistoryEntry {
  id: string;
  started_at: string | null;
  completed_at: string | null;
  result_area: string | null;
  result_area_slug: string | null;
  confidence: number | null;
  result_json?: {
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
    resultArea: entry.result_area,
    resultAreaSlug: slugFromMeta,
    confidence: entry.confidence ?? 0,
    topAreas: json.topAreas ?? [],
    reasons: json.reasons ?? [],
    completedAt: entry.completed_at || new Date().toISOString(),
  };
}

export default function QuizCarreiraResultado() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestResult() {
      try {
        let fromSession: string | null = null;
        try {
          fromSession = sessionStorage.getItem(RESULT_SESSION_KEY);
        } catch {
          // sessionStorage indisponível
        }

        if (fromSession) {
          const parsed = JSON.parse(fromSession) as QuizResult;
          if (!cancelled) {
            setResult(parsed);
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

  return (
    <Layout>
      <SEO
        title={`Você combina com ${result.resultArea} · Bora na Tech?`}
        description={`Resultado do quiz de carreira: ${result.resultArea} com ${result.confidence}% de confiança.`}
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

          <ResultHero result={result} />

          {result.topAreas.length > 1 && (
            <OtherAreas areas={result.topAreas.slice(1)} />
          )}

          {result.reasons.length > 0 && (
            <ReasonsSection
              reasons={result.reasons}
              areaName={result.resultArea}
            />
          )}

          <CTAsSection
            resultAreaSlug={result.resultAreaSlug}
            resultArea={result.resultArea}
          />
        </div>
      </div>
    </Layout>
  );
}

function ResultHero({ result }: { result: QuizResult }) {
  const meta = areasTI.find((a) => a.nome === result.resultArea);
  const Icon = meta?.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-8 overflow-hidden rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[5px_5px_0_#0f172a] md:p-8"
    >
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            "linear-gradient(135deg, #faf5ff 0%, #ffffff 50%, #fdf4ff 100%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        className="absolute right-6 top-6 -z-0"
        aria-hidden="true"
        animate={{ y: [0, -6, 0], rotate: [12, 18, 12] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-8 w-8 text-violet-300" strokeWidth={2} />
      </motion.div>
      <motion.div
        className="absolute bottom-8 left-12 -z-0 opacity-70"
        aria-hidden="true"
        animate={{ y: [0, 6, 0], rotate: [-12, -4, -12] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <Sparkles className="h-5 w-5 text-fuchsia-300" strokeWidth={2} />
      </motion.div>

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-3">
          {Icon && (
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-amber-300 shadow-[2px_2px_0_#0f172a]"
            >
              <Icon className="h-6 w-6 text-slate-950" strokeWidth={2.2} />
            </motion.span>
          )}
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-700">
            Seu match principal
          </p>
        </div>

        <h1
          className="mb-3 break-words font-display font-black leading-[1.0] text-slate-950"
          style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
        >
          {result.resultArea}
        </h1>

        {meta?.descricaoCurta && (
          <p className="mb-6 max-w-xl text-base font-semibold text-slate-700 md:text-lg">
            {meta.descricaoCurta}
          </p>
        )}

        <div className="max-w-md">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
              Confiança do resultado
            </span>
            <span className="font-display text-xl font-black text-slate-950">
              {result.confidence}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-white">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400"
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

function OtherAreas({ areas }: { areas: AreaScore[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="mb-8"
    >
      <div className="mb-4">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
          Outras áreas com afinidade
        </p>
        <h2 className="font-display text-2xl font-black text-slate-950">
          Também combinam com você
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {areas.map((area, idx) => (
          <div
            key={area.area}
            className="rounded-2xl border-2 border-slate-300 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-[3px_3px_0_#0f172a]"
          >
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="truncate font-display text-base font-black text-slate-950">
                {area.area}
              </h3>
              <span className="shrink-0 font-mono text-sm font-bold text-violet-700">
                {area.percentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
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
        ))}
      </div>
    </motion.section>
  );
}

function ReasonsSection({
  reasons,
  areaName,
}: {
  reasons: string[];
  areaName: string;
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
            transition={{ duration: 0.4, delay: 0.5 + idx * 0.1 }}
            className="flex items-start gap-3 rounded-2xl border-2 border-[#1a1a1a] bg-amber-50 px-5 py-4 shadow-[2px_2px_0_#0f172a]"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-300 font-display text-sm font-black text-slate-950">
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
  resultAreaSlug,
  resultArea,
}: {
  resultAreaSlug: string;
  resultArea: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-3xl border-2 border-[#1a1a1a] bg-slate-950 p-6 text-white shadow-[5px_5px_0_#0f172a] md:p-8"
    >
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-violet-300">
        Próximo passo
      </p>

      <h2 className="mb-4 font-display text-3xl font-black md:text-4xl">
        Quer começar de verdade?
      </h2>

      <p className="mb-6 max-w-xl text-base font-semibold text-slate-300 md:text-lg">
        A gente tem trilhas, materiais e ferramentas pra te ajudar a dar o
        primeiro passo em {resultArea}.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        {resultAreaSlug && (
          <Link
            href={`/areas/${resultAreaSlug}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white bg-amber-300 px-6 py-3 font-display text-sm font-black uppercase tracking-wider text-slate-950 transition-all duration-200 hover:bg-amber-400"
          >
            Explorar {resultArea}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        )}

        <Link
          href="/roadmaps"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white bg-transparent px-6 py-3 font-display text-sm font-black uppercase tracking-wider text-white transition-all duration-200 hover:bg-white hover:text-slate-950"
        >
          Ver todas as trilhas
        </Link>
      </div>

      <div className="mt-6 border-t border-slate-800 pt-6">
        <Link
          href="/quiz-carreira"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-400 hover:text-white"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
          Refazer o quiz
        </Link>
      </div>
    </motion.section>
  );
}
