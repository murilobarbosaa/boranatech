import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Briefcase, Dumbbell, Loader2, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import PageHero from "@/components/shared/PageHero";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { interviewSteps } from "@/lib/careerToolsData";
import FilterPills from "@/components/shared/FilterPills";
import {
  createSession,
  deleteSession,
  listSessions,
  InterviewApiError,
  type InterviewKind,
  type InterviewLanguage,
  type InterviewSessionSummary,
} from "@/services/interviewService";

const ac = getPageAccentUi("sky");

// HERANCA do form do simulador antigo (aposentado): listas fechadas, sem texto
// livre nem areas como Mobile/QA/Seguranca. O intake definitivo (formato,
// opcoes e origem dos dados) e decisao do redesign E3; nao mexer antes dele.
const AREA_OPTIONS = ["Front-end", "Back-end", "Dados", "UX/UI", "DevOps"];
const LEVEL_OPTIONS = ["Estágio", "Trainee", "Júnior", "Pleno"];

const START_CARDS: Array<{
  kind: InterviewKind;
  title: string;
  description: string;
  icon: typeof Briefcase;
}> = [
  {
    kind: "job",
    // TODO(Ana): copy do card de preparacao para vaga
    title: "Preparação para vaga",
    description:
      "Cole a vaga e treine com perguntas calibradas pelos requisitos dela, com feedback a cada resposta.",
    icon: Briefcase,
  },
  {
    kind: "general",
    // TODO(Ana): copy do card de treino geral
    title: "Treino geral",
    description:
      "Entrevista da sua área e nível, sem vaga específica, pra ganhar ritmo e descobrir o que estudar.",
    icon: Dumbbell,
  },
];

const selectClass =
  "w-full rounded-xl border-2 border-slate-950 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 shadow-[2px_2px_0_#0f172a] outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

function SessionHistory() {
  const [, navigate] = useLocation();
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
  // Exclusao em dois passos inline (clique em excluir pede confirmacao),
  // mesmo padrao da galeria de curriculos salvos.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listSessions()
      .then((list) => {
        if (alive) setSessions(list);
      })
      .catch(() => {
        if (alive) setSessions([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      if (err instanceof InterviewApiError && err.code === "not_found") {
        // Ja nao existia: some da lista do mesmo jeito.
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
      // Outras falhas: o botao volta ao estado normal e o item fica.
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  if (sessions.length === 0) return null;

  return (
    <section className={cn(ac.contentBg, "pb-4 pt-12")}>
      <div className="container">
        {/* TODO(Ana): titulo da secao de historico */}
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
          Suas entrevistas
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const title =
              s.kind === "job" ? "Preparação para vaga" : "Treino geral";
            return (
              <div
                key={s.id}
                className="card-brutal rounded-2xl bg-white p-4 transition-transform hover:-translate-y-0.5"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/entrevistas/sessao/${s.id}`)}
                  className="block w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-base font-black text-slate-950">
                      {title}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border-2 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide",
                        s.status === "active"
                          ? "border-blue-400 bg-blue-100 text-blue-900"
                          : "border-emerald-400 bg-emerald-100 text-emerald-900",
                      )}
                    >
                      {s.status === "active" ? "Em andamento" : "Concluída"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-600">
                    {s.area ?? "Área não informada"} ·{" "}
                    {s.level ?? "nível não informado"}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {s.question_count > 0
                      ? `${s.good_count} boas de ${s.question_count} respostas · `
                      : ""}
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </button>
                <div className="mt-3 flex justify-end">
                  {confirmingId === s.id ? (
                    <button
                      type="button"
                      disabled={deletingId === s.id}
                      onClick={() => void handleDelete(s.id)}
                      className="rounded-full border-2 border-slate-950 bg-rose-600 px-4 py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {/* TODO(Ana): rotulos da exclusao em dois passos. */}
                      {deletingId === s.id ? "Excluindo..." : "Confirmar exclusão"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(s.id)}
                      /* TODO(Ana): label de acessibilidade do botao excluir. */
                      aria-label={`Excluir ${title}`}
                      title="Excluir entrevista"
                      className="rounded-full border-2 border-slate-950 bg-white p-2 text-slate-600 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrainWithAi() {
  const [, navigate] = useLocation();
  const [intakeKind, setIntakeKind] = useState<InterviewKind | null>(null);
  const [area, setArea] = useState(AREA_OPTIONS[0]);
  const [level, setLevel] = useState(LEVEL_OPTIONS[0]);
  const [language, setLanguage] = useState<InterviewLanguage>("pt");
  const [jobMode, setJobMode] = useState<"url" | "text">("url");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [creating, setCreating] = useState(false);
  const [intakeError, setIntakeError] = useState("");
  const [jobFetchWarn, setJobFetchWarn] = useState(false);

  function openIntake(kind: InterviewKind) {
    setIntakeKind(kind);
    setIntakeError("");
    setJobFetchWarn(false);
  }

  async function handleCreate() {
    if (creating || !intakeKind) return;
    if (intakeKind === "job") {
      if (jobMode === "url" && !jobUrl.trim()) {
        // TODO(Ana): validacao de URL vazia
        setIntakeError("Cole a URL da vaga ou troque pra colar o texto.");
        return;
      }
      if (jobMode === "text" && !jobText.trim()) {
        // TODO(Ana): validacao de texto de vaga vazio
        setIntakeError("Cole o texto da vaga pra continuar.");
        return;
      }
    }

    setCreating(true);
    setIntakeError("");
    try {
      const result = await createSession({
        kind: intakeKind,
        area,
        level,
        language,
        ...(intakeKind === "job"
          ? jobMode === "url"
            ? { jobUrl: jobUrl.trim() }
            : { jobText: jobText.trim() }
          : {}),
      });

      if (result.kind === "job_fetch_failed") {
        // Cai automaticamente pro modo de colar texto SEM perder area/level.
        setJobMode("text");
        setJobFetchWarn(true);
        return;
      }

      navigate(`/entrevistas/sessao/${result.sessionId}`);
    } catch (err) {
      setIntakeError(
        err instanceof InterviewApiError
          ? err.message
          : "Não foi possível iniciar a entrevista agora. Tente de novo.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        {START_CARDS.map((card) => (
          <button
            key={card.kind}
            type="button"
            onClick={() => openIntake(card.kind)}
            className={cn(
              "card-brutal rounded-2xl bg-white p-5 text-left transition-transform hover:-translate-y-0.5",
              intakeKind === card.kind && "ring-2 ring-blue-500",
            )}
          >
            <card.icon className="h-6 w-6 text-blue-700" aria-hidden />
            <h3 className="mt-2 font-display text-xl font-black text-slate-950">
              {card.title}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{card.description}</p>
          </button>
        ))}
      </div>

      {intakeKind ? (
        <div className="card-brutal mt-5 rounded-2xl bg-white p-5">
          <h3 className="font-display text-lg font-black text-slate-950">
            {intakeKind === "job" ? "Preparação para vaga" : "Treino geral"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
                Área
              </span>
              <select
                className={selectClass}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                {AREA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
                Nível
              </span>
              <select
                className={selectClass}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
              {/* TODO(Ana): rotulo do seletor de idioma da entrevista. */}
              Idioma da entrevista
            </span>
            <FilterPills
              options={["pt", "en"]}
              value={language}
              onChange={(v) => setLanguage(v as InterviewLanguage)}
              accent="blue"
              /* TODO(Ana): rotulos das opcoes de idioma. */
              labels={{ pt: "Português", en: "English" }}
            />
            {language === "en" ? (
              <p className="mt-2 text-xs font-medium text-slate-600">
                {/* TODO(Ana): aviso do treino em ingles. */}
                A entrevista inteira acontece em inglês: perguntas, feedback e
                veredito. Treino de verdade pro idioma da vaga.
              </p>
            ) : null}
          </div>

          {intakeKind === "job" ? (
            <div className="mt-4">
              {jobFetchWarn ? (
                <p className="mb-3 rounded-xl border-2 border-amber-400 bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">
                  {/* TODO(Ana): aviso amigavel de fallback pro texto colado */}
                  Não consegui ler a vaga pela URL. Cola o texto dela aqui
                  embaixo que seguimos do mesmo jeito.
                </p>
              ) : null}
              {jobMode === "url" ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
                    URL da vaga
                  </span>
                  <input
                    type="url"
                    className={selectClass}
                    placeholder="https://..."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
                    Texto da vaga
                  </span>
                  <textarea
                    rows={6}
                    className={cn(selectClass, "resize-y font-medium")}
                    placeholder="Cole aqui a descrição da vaga"
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                  />
                </label>
              )}
              <button
                type="button"
                onClick={() => {
                  setJobMode(jobMode === "url" ? "text" : "url");
                  setJobFetchWarn(false);
                }}
                className="mt-2 text-xs font-bold text-blue-700 underline underline-offset-2"
              >
                {jobMode === "url"
                  ? "Prefiro colar o texto da vaga"
                  : "Prefiro informar a URL da vaga"}
              </button>
            </div>
          ) : null}

          {intakeError ? (
            <p className="mt-4 rounded-xl border-2 border-red-400 bg-red-100 px-3 py-2 text-sm font-bold text-red-900">
              {intakeError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
            className="bnt-pressable mt-5 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {/* TODO(Ana): label do botao de iniciar */}
            {creating ? "Preparando a entrevista" : "Começar entrevista"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Entrevistas() {
  const { isPro, loading } = useSubscription();
  const { user } = useAuth();

  return (
    <Layout>
      {/* TODO(Ana): validar title e description da pagina unificada */}
      <SEO
        title="Entrevistas em tech · Guia e treino com IA"
        description="Guia do processo seletivo em tecnologia e treino de entrevista com IA: perguntas calibradas pela vaga ou pela sua área, com feedback a cada resposta."
        url="/entrevistas"
      />
      {/* TODO(Ana): validar copy do hero da pagina unificada */}
      <PageHero
        accent="blue"
        eyebrow="do currículo à proposta"
        title="Entrevistas em Tech"
        subtitle="Entenda o processo seletivo e treine com IA até chegar preparado na conversa de verdade."
      />
      <section
        className={cn("sticky top-16 z-40 border-b-2 py-4", ac.stickyBar)}
      >
        <div className="container flex flex-wrap items-center gap-3">
          <Link
            href="/entrevistas/perguntas"
            className={cn(
              "rounded-full border-2 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-[2px_2px_0_#0f172a] transition-all",
              ac.panelBorder,
              "hover:border-blue-500",
            )}
          >
            Banco de perguntas
          </Link>
          <Link
            href="/entrevistas/desafios"
            className={cn(
              "rounded-full border-2 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-[2px_2px_0_#0f172a] transition-all",
              ac.panelBorder,
              "hover:border-blue-500",
            )}
          >
            Desafios técnicos
          </Link>
        </div>
      </section>

      <section className={cn(ac.contentBg, "pt-12")}>
        <div className="container">
          {/* TODO(Ana): titulo da secao de treino com IA */}
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
            Treinar com IA
          </p>
          <div className="mt-4">
            {!isPro && !loading ? (
              <ProGate description="Treine entrevistas com IA: perguntas calibradas pela vaga ou pela sua área, feedback honesto a cada resposta e um veredito final de preparo." />
            ) : isPro ? (
              <TrainWithAi />
            ) : null}
          </div>
        </div>
      </section>

      {user ? <SessionHistory /> : null}

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className="grid gap-5 md:grid-cols-2">
            {interviewSteps.map((step, index) => (
              <DetailsChevronOnly
                key={step.title}
                className="card-brutal rounded-2xl bg-white p-5"
                title={
                  <span className="font-display text-xl font-black">
                    {index + 1}. {step.title}
                  </span>
                }
              >
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <strong>O que avaliam:</strong> {step.evaluate}
                  </p>
                  <p>
                    <strong>Como se preparar:</strong> {step.prepare}
                  </p>
                  <p>
                    <strong>Erro comum:</strong> {step.mistakes}
                  </p>
                  <p>
                    <strong>Dica prática:</strong> {step.tip}
                  </p>
                </div>
              </DetailsChevronOnly>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
