import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ClipboardPaste,
  FileUp,
  History,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

import Layout from "@/components/Layout";
import { LinkedinSkeleton } from "@/components/linkedin/LinkedinStates";
import ProGate from "@/components/pro/ProGate";
import PageHero from "@/components/shared/PageHero";
import SEO from "@/components/SEO";
import ResumeScoreCard from "@/components/curriculo/ResumeScoreCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { extractPdfText, PdfExtractError } from "@/lib/pdfExtract";
import { cn } from "@/lib/utils";
import { updateMyProfile } from "@/services/profileService";
import {
  analyzeResume,
  getResumeAnalysis,
  listResumeAnalyses,
  type ResumeAnalysisSummary,
  type ResumeAnalyzeResponse,
} from "@/services/resumeAnalysisService";
import {
  RESUME_FAIXA_LABELS,
  type ResumeSugestaoSecao,
} from "@shared/resumeAnalysis/schema";

// Analisador de Curriculo (Pro): upload de PDF com extracao 100% client-side
// (o arquivo nunca sobe) ou texto colado; nota deterministica do servidor +
// qualitativo da IA; historico do dono. Substitui o antigo chat placeholder.

const ac = getPageAccentUi("blue");

const RESUME_TEXT_MIN = 200;
const RESUME_TEXT_MAX = 12_000;
const JOB_POSTING_MAX = 4_000;
const TARGET_ROLE_MAX = 120;

// TODO(Ana): revisar TODOS os textos desta pagina (copy, abas, formulario,
// mensagens de status e erro, resultado e historico).
const COPY = {
  seoTitle: "Analisador de currículo com IA",
  seoDescription:
    "Envie seu currículo em PDF ou cole o texto e receba nota, pontos fortes e fracos, sugestões de reescrita por seção e aderência à vaga que você quer.",
  heroEyebrow: "avaliador de currículo",
  heroTitle: "Analisador de Currículo",
  heroSubtitle:
    "Nota na hora, diagnóstico honesto e sugestões prontas pra copiar, seção por seção.",
  proGateDescription:
    "Envie seu currículo (PDF ou texto) e receba nota com critérios abertos, pontos fortes e fracos, sugestões de reescrita por seção e aderência a uma vaga específica.",
  tabUpload: "Enviar PDF",
  tabPaste: "Colar texto",
  uploadHint:
    "Seu arquivo nunca sai do navegador: a gente lê o texto aqui mesmo e só o texto vai pra análise.",
  uploadCta: "Escolher PDF do currículo",
  extracting: "Lendo o PDF...",
  extractedPrefix: "Texto extraído de",
  pasteLabel: "Texto do seu currículo",
  pastePlaceholder: "Cole aqui o conteúdo do seu currículo...",
  goalLabel: "Cargo ou objetivo que você busca (opcional)",
  goalPlaceholder: "ex: estágio em desenvolvimento backend",
  goalFromProfile: "Puxamos do seu perfil. Confirma ou ajusta se mudou.",
  goalSaveBack: "Atualizar meu objetivo no perfil",
  jobLabel: "Vaga específica (opcional)",
  jobPlaceholder:
    "Cole o texto da vaga pra receber a análise de aderência (palavras-chave presentes e faltando).",
  submit: "Analisar meu currículo",
  analyzing: "Analisando seu currículo...",
  textTooShort: `O texto precisa ter pelo menos ${RESUME_TEXT_MIN} caracteres.`,
  textTooLong: `O texto passou de ${RESUME_TEXT_MAX} caracteres. Corte um pouco.`,
  genericError: "Não foi possível analisar agora. Tente novamente.",
  strengths: "Pontos fortes",
  weaknesses: "Pontos a melhorar",
  sectionSuggestions: "Sugestões por seção",
  suggestionLabel: "Sugestão de reescrita:",
  jobFit: "Aderência à vaga",
  jobFitPresent: "Palavras-chave presentes",
  jobFitMissing: "Palavras-chave faltando",
  jobFitRecommendations: "Recomendações",
  rewriteCta: "Reescrever com o Natechinho",
  rewriteCtaHint:
    "Abre o assistente de criação com este currículo já carregado na conversa.",
  newAnalysis: "Analisar outro currículo",
  historyTitle: "Suas análises anteriores",
  historyToggle: "Análises anteriores",
  historyEmpty: "Você ainda não analisou nenhum currículo.",
  historyOpen: "Ver",
  scoreTransparency:
    "A nota é calculada pela estrutura do texto do currículo e não muda com o objetivo ou a vaga; eles direcionam a avaliação qualitativa abaixo.",
} as const;

// TODO(Ana): revisar os rotulos das secoes do resultado.
const SECTION_LABELS: Record<ResumeSugestaoSecao["secao"], string> = {
  contato: "Contato",
  objetivo: "Objetivo",
  formacao: "Formação",
  experiencias: "Experiências",
  projetos: "Projetos",
  habilidades: "Habilidades",
  idiomas: "Idiomas",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

export default function CurriculoAnalisar() {
  const { isPro } = useSubscription();
  const { profile } = useAuth();

  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [resumeText, setResumeText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);

  // Objetivo: pre-preenchido do career_goal do perfil (fonte unica, alimenta
  // pool/agente/roadmap). Se o usuario EDITAR, o checkbox (marcado por
  // padrao) oferece salvar de volta no perfil.
  const [targetRole, setTargetRole] = useState("");
  const [goalSeeded, setGoalSeeded] = useState(false);
  const [goalEdited, setGoalEdited] = useState(false);
  const [saveGoalBack, setSaveGoalBack] = useState(true);

  const [jobPostingText, setJobPostingText] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeAnalyzeResponse | null>(null);

  const [history, setHistory] = useState<ResumeAnalysisSummary[] | null>(null);
  // Historico visivel tambem na tela de resultado, sob demanda.
  const [showHistory, setShowHistory] = useState(false);

  // Reset real do fluxo: limpa texto, arquivo e vaga; MANTEM o objetivo
  // (prefill do perfil ou o que a pessoa digitou).
  function startNewAnalysis() {
    setResult(null);
    setResumeText("");
    setPdfFileName(null);
    setPdfError(null);
    setJobPostingText("");
    setFormError(null);
    setShowHistory(false);
  }

  useEffect(() => {
    if (!goalSeeded && profile?.career_goal) {
      setTargetRole(profile.career_goal.slice(0, TARGET_ROLE_MAX));
      setGoalSeeded(true);
    }
  }, [profile?.career_goal, goalSeeded]);

  const loadHistory = useCallback(() => {
    if (!isPro) return;
    listResumeAnalyses()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [isPro]);
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPdfError(null);
    setExtracting(true);
    try {
      const text = await extractPdfText(file);
      setResumeText(text.slice(0, RESUME_TEXT_MAX));
      setPdfFileName(file.name);
    } catch (err) {
      setPdfFileName(null);
      setPdfError(
        err instanceof PdfExtractError ? err.message : COPY.genericError,
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleAnalyze() {
    const text = resumeText.trim();
    if (text.length < RESUME_TEXT_MIN) {
      setFormError(COPY.textTooShort);
      return;
    }
    if (text.length > RESUME_TEXT_MAX) {
      setFormError(COPY.textTooLong);
      return;
    }
    setFormError(null);
    setAnalyzing(true);
    try {
      const trimmedGoal = targetRole.trim();
      const trimmedJob = jobPostingText.trim();
      const response = await analyzeResume({
        resumeText: text,
        targetRole: trimmedGoal === "" ? undefined : trimmedGoal,
        jobPostingText: trimmedJob === "" ? undefined : trimmedJob,
      });
      setResult(response);
      loadHistory();

      // Salvar o objetivo de volta no perfil: SO com acao explicita (usuario
      // editou o campo E manteve o checkbox marcado). Best-effort: falha vira
      // warn e nunca bloqueia a analise ja exibida.
      if (
        goalEdited &&
        saveGoalBack &&
        trimmedGoal !== "" &&
        trimmedGoal !== (profile?.career_goal ?? "")
      ) {
        updateMyProfile({ career_goal: trimmedGoal }).catch((err) => {
          console.warn("[curriculo-analisar] salvar objetivo falhou:", err);
        });
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : COPY.genericError);
    } finally {
      setAnalyzing(false);
    }
  }

  async function openHistory(id: string) {
    const record = await getResumeAnalysis(id).catch(() => null);
    if (!record) {
      loadHistory();
      return;
    }
    setResult({
      id: record.id,
      score: record.result.score,
      faixa: record.result.faixa,
      criterios: record.result.criterios,
      qualitative: record.result.qualitative,
      targetRole: record.target_role,
    });
  }

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title={COPY.seoTitle}
        description={COPY.seoDescription}
        url="/curriculo/analisar"
      />
      <PageHero
        accent="blue"
        eyebrow={COPY.heroEyebrow}
        title={COPY.heroTitle}
        subtitle={COPY.heroSubtitle}
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          {!isPro ? (
            <ProGate description={COPY.proGateDescription} />
          ) : result ? (
            <ResultView
              result={result}
              onNewAnalysis={startNewAnalysis}
              onToggleHistory={() => setShowHistory((prev) => !prev)}
            />
          ) : (
            <div className="mx-auto max-w-3xl">
              <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
                <div className="flex gap-2">
                  {(
                    [
                      { key: "upload", label: COPY.tabUpload, Icon: FileUp },
                      {
                        key: "paste",
                        label: COPY.tabPaste,
                        Icon: ClipboardPaste,
                      },
                    ] as const
                  ).map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={tab === key}
                      onClick={() => setTab(key)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border-2 border-slate-950 px-4 py-2 text-sm font-black shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px",
                        tab === key
                          ? "bg-[#FFB800] text-slate-950"
                          : "bg-white text-slate-600",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>

                {tab === "upload" ? (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-600">
                      {COPY.uploadHint}
                    </p>
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px">
                      <FileUp className="h-4 w-4" aria-hidden />
                      {extracting ? COPY.extracting : COPY.uploadCta}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        disabled={extracting}
                        onChange={(e) => void handleFile(e.target.files?.[0])}
                      />
                    </label>
                    {pdfFileName && !pdfError ? (
                      <p className="mt-2 text-sm font-bold text-emerald-700">
                        {COPY.extractedPrefix} {pdfFileName} (
                        {resumeText.length} caracteres)
                      </p>
                    ) : null}
                    {pdfError ? (
                      <p className="mt-2 text-sm font-bold text-rose-700">
                        {pdfError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {tab === "paste" || (tab === "upload" && resumeText) ? (
                  <label className="mt-5 block">
                    <span className="font-black text-slate-900">
                      {COPY.pasteLabel}
                    </span>
                    <textarea
                      rows={8}
                      value={resumeText}
                      onChange={(e) =>
                        setResumeText(e.target.value.slice(0, RESUME_TEXT_MAX))
                      }
                      placeholder={COPY.pastePlaceholder}
                      className={cn(
                        "mt-2 w-full rounded-xl border-2 p-3 text-sm",
                        ac.input,
                      )}
                    />
                    <span className="mt-1 block text-right text-xs font-bold text-slate-400">
                      {resumeText.length}/{RESUME_TEXT_MAX}
                    </span>
                  </label>
                ) : null}

                <label className="mt-4 block">
                  <span className="font-black text-slate-900">
                    {COPY.goalLabel}
                  </span>
                  {goalSeeded && !goalEdited ? (
                    <span className="ml-2 text-xs font-bold text-slate-500">
                      {COPY.goalFromProfile}
                    </span>
                  ) : null}
                  <input
                    type="text"
                    value={targetRole}
                    maxLength={TARGET_ROLE_MAX}
                    onChange={(e) => {
                      setTargetRole(e.target.value);
                      setGoalEdited(true);
                    }}
                    placeholder={COPY.goalPlaceholder}
                    className={cn(
                      "mt-2 w-full rounded-xl border-2 p-3 text-sm",
                      ac.input,
                    )}
                  />
                </label>
                {goalEdited ? (
                  <label className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={saveGoalBack}
                      onChange={(e) => setSaveGoalBack(e.target.checked)}
                      className="h-4 w-4 accent-slate-900"
                    />
                    {COPY.goalSaveBack}
                  </label>
                ) : null}

                <label className="mt-4 block">
                  <span className="font-black text-slate-900">
                    {COPY.jobLabel}
                  </span>
                  <textarea
                    rows={4}
                    value={jobPostingText}
                    onChange={(e) =>
                      setJobPostingText(
                        e.target.value.slice(0, JOB_POSTING_MAX),
                      )
                    }
                    placeholder={COPY.jobPlaceholder}
                    className={cn(
                      "mt-2 w-full rounded-xl border-2 p-3 text-sm",
                      ac.input,
                    )}
                  />
                  <span className="mt-1 block text-right text-xs font-bold text-slate-400">
                    {jobPostingText.length}/{JOB_POSTING_MAX}
                  </span>
                </label>

                {formError ? (
                  <p className="mt-4 rounded-xl border-2 border-slate-950 bg-rose-100 px-3 py-2 text-sm font-bold text-rose-800">
                    {formError}
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={analyzing}
                  onClick={() => void handleAnalyze()}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-60"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {COPY.analyzing}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden />
                      {COPY.submit}
                    </>
                  )}
                </button>
              </div>

              {analyzing ? (
                <div className="mt-8">
                  <p className="mb-4 text-center text-sm font-bold text-slate-600">
                    {COPY.analyzing}
                  </p>
                  <LinkedinSkeleton />
                </div>
              ) : null}
            </div>
          )}

          {isPro && (!result || showHistory) ? (
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-2xl font-black text-slate-950">
                {COPY.historyTitle}
              </h2>
              {history === null ? (
                <div className="mt-4 flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : history.length === 0 ? (
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  {COPY.historyEmpty}
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-slate-950 bg-white p-4 shadow-[2px_2px_0_#0f172a]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">
                          {item.score}/100 · {RESUME_FAIXA_LABELS[item.faixa]}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {item.target_role ? `${item.target_role} · ` : ""}
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void openHistory(item.id)}
                        className="rounded-full border-2 border-slate-950 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
                      >
                        {COPY.historyOpen}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}

interface ResultViewProps {
  result: ResumeAnalyzeResponse;
  onNewAnalysis: () => void;
  onToggleHistory: () => void;
}

function ResultView({ result, onNewAnalysis, onToggleHistory }: ResultViewProps) {
  const { qualitative } = result;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <ResumeScoreCard
            score={result.score}
            faixa={result.faixa}
            criterios={result.criterios}
          />
          <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500">
            {COPY.scoreTransparency}
          </p>
        </div>
        <div className="space-y-6">
          <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
            <p className="text-sm font-medium leading-relaxed text-slate-800">
              {qualitative.resumoGeral}
            </p>
          </div>
          <div className="card-brutal rounded-2xl border-slate-950 bg-emerald-50 p-6">
            <h3 className="font-display text-lg font-black text-emerald-900">
              {COPY.strengths}
            </h3>
            <ul className="mt-3 space-y-2 text-sm font-medium text-slate-800">
              {qualitative.pontosFortes.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-brutal rounded-2xl border-slate-950 bg-amber-50 p-6">
            <h3 className="font-display text-lg font-black text-amber-900">
              {COPY.weaknesses}
            </h3>
            <ul className="mt-3 space-y-2 text-sm font-medium text-slate-800">
              {qualitative.pontosFracos.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl font-black text-slate-950">
          {COPY.sectionSuggestions}
        </h3>
        <div className="mt-4 space-y-4">
          {qualitative.sugestoesPorSecao.map((sugestao, i) => (
            <div
              key={i}
              className="card-brutal rounded-2xl border-slate-950 bg-white p-5"
            >
              <span className="inline-block rounded-full border-2 border-slate-950 bg-sky-100 px-3 py-0.5 text-xs font-black uppercase tracking-wide text-slate-900">
                {SECTION_LABELS[sugestao.secao]}
              </span>
              <p className="mt-3 text-sm font-medium text-slate-800">
                {sugestao.diagnostico}
              </p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                {COPY.suggestionLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl border-2 border-slate-950 bg-slate-50 p-3 text-sm font-medium text-slate-900">
                {sugestao.sugestaoReescrita}
              </p>
            </div>
          ))}
        </div>
      </div>

      {qualitative.aderenciaVaga ? (
        <div className="card-brutal rounded-2xl border-slate-950 bg-violet-50 p-6">
          <h3 className="font-display text-2xl font-black text-violet-900">
            {COPY.jobFit}
          </h3>
          <p className="mt-3 text-sm font-medium text-slate-800">
            {qualitative.aderenciaVaga.avaliacao}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                {COPY.jobFitPresent}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {qualitative.aderenciaVaga.palavrasChavePresentes.map(
                  (word, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-slate-950 bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900"
                    >
                      {word}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-rose-700">
                {COPY.jobFitMissing}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {qualitative.aderenciaVaga.palavrasChaveFaltando.map(
                  (word, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-slate-950 bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-900"
                    >
                      {word}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.15em] text-slate-500">
            {COPY.jobFitRecommendations}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm font-medium text-slate-800">
            {qualitative.aderenciaVaga.recomendacoes.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-violet-500"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={
            result.id
              ? `/curriculo/gerar?rewrite=${result.id}`
              : "/curriculo/gerar"
          }
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
        >
          <Wand2 className="h-4 w-4" aria-hidden />
          {COPY.rewriteCta}
        </Link>
        <span className="text-xs font-medium text-slate-600">
          {COPY.rewriteCtaHint}
        </span>
        <button
          type="button"
          onClick={onNewAnalysis}
          className="inline-flex items-center rounded-full border-2 border-slate-950 bg-white px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
        >
          {COPY.newAnalysis}
        </button>
        <button
          type="button"
          onClick={onToggleHistory}
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
        >
          <History className="h-4 w-4" aria-hidden />
          {COPY.historyToggle}
        </button>
      </div>
    </div>
  );
}
