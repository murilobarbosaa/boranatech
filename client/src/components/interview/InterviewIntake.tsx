import { useState } from "react";
import { useLocation } from "wouter";
import { Briefcase, Dumbbell, Sparkles } from "lucide-react";

import BrutalActionButton from "@/components/shared/BrutalActionButton";
import FilterPills from "@/components/shared/FilterPills";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  createSession,
  InterviewApiError,
  type InterviewKind,
  type InterviewLanguage,
} from "@/services/interviewService";

const ac = getPageAccentUi("blue");

// Sugestoes de area e niveis: as listas do simulador antigo viram CHIPS.
// Decisao da E3: area e texto livre (o zod do server cobre min 1, max 120)
// com as opcoes antigas como atalho; nivel segue lista fechada (cap 60
// garantido pelas opcoes).
const AREA_SUGGESTIONS = ["Front-end", "Back-end", "Dados", "UX/UI", "DevOps"];
const LEVEL_OPTIONS = ["Estágio", "Trainee", "Júnior", "Pleno"];

const AREA_MAX_CHARS = 120;

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

const inputClass = cn(
  "w-full rounded-xl border-2 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none",
  ac.input,
  ac.cardFocusRing,
);

// Palco de intake da arena (molde do palco do PortfolioAnalisar): as duas
// frentes como cards brutais; selecionar revela o form no mesmo palco. O fluxo
// de criacao e IDENTICO ao anterior (retorno discriminado de job_fetch_failed
// caindo pro modo texto sem perder area/nivel/idioma).
export default function InterviewIntake({
  onCreatingChange,
}: {
  onCreatingChange?: (creating: boolean) => void;
}) {
  const [, navigate] = useLocation();
  const [intakeKind, setIntakeKind] = useState<InterviewKind | null>(null);
  const [area, setArea] = useState("");
  const [level, setLevel] = useState<string | null>(null);
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

  const canCreate = area.trim().length > 0 && level !== null;

  async function handleCreate() {
    if (creating || !intakeKind || !canCreate) return;
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
    onCreatingChange?.(true);
    setIntakeError("");
    try {
      const result = await createSession({
        kind: intakeKind,
        area: area.trim(),
        level: level ?? "",
        language,
        ...(intakeKind === "job"
          ? jobMode === "url"
            ? { jobUrl: jobUrl.trim() }
            : { jobText: jobText.trim() }
          : {}),
      });

      if (result.kind === "job_fetch_failed") {
        // Cai automaticamente pro modo de colar texto SEM perder area/nivel/idioma.
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
      onCreatingChange?.(false);
    }
  }

  return (
    <div
      className={cn(
        "card-brutal area-rise relative mx-auto max-w-3xl -rotate-[0.4deg] rounded-2xl border-slate-950 bg-white p-6 sm:p-8",
        ac.liftShadow,
      )}
    >
      {/* TODO(Ana): revisar o selo e o titulo do palco. */}
      <span className="absolute -top-3.5 left-6 z-10 inline-flex rotate-1 items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
        <Sparkles className="h-3 w-3" aria-hidden />
        Comece aqui
      </span>
      <h2 className="font-display text-xl font-black text-slate-950 sm:text-2xl">
        Escolha sua frente e comece a treinar
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {START_CARDS.map((card) => (
          <button
            key={card.kind}
            type="button"
            onClick={() => openIntake(card.kind)}
            aria-pressed={intakeKind === card.kind}
            className={cn(
              "rounded-2xl border-2 border-slate-950 bg-white p-4 text-left shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-0.5",
              intakeKind === card.kind && "bg-blue-50 ring-2 ring-blue-500",
            )}
          >
            <card.icon className="h-6 w-6 text-blue-700" aria-hidden />
            <h3 className="mt-2 font-display text-lg font-black text-slate-950">
              {card.title}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{card.description}</p>
          </button>
        ))}
      </div>

      {intakeKind ? (
        <div className="mt-6 border-t-2 border-dashed border-slate-300 pt-5">
          <div>
            <label
              className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600"
              htmlFor="interview-area-input"
            >
              {/* TODO(Ana): rotulo do campo de area. */}
              Sua área
            </label>
            <input
              id="interview-area-input"
              type="text"
              maxLength={AREA_MAX_CHARS}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              /* TODO(Ana): placeholder do campo de area. */
              placeholder="Ex: Front-end, QA, Mobile, Segurança..."
              className={inputClass}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {AREA_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setArea(suggestion)}
                  aria-pressed={area.trim() === suggestion}
                  className={cn(
                    "rounded-full border-2 px-3 py-1 text-xs font-bold transition-all",
                    area.trim() === suggestion
                      ? ac.filterActive
                      : ac.filterInactive,
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-500">
              {/* TODO(Ana): microcopy do campo de area. */}
              Toque numa sugestão ou escreva a sua; dá pra editar depois de
              tocar.
            </p>
          </div>

          <div className="mt-4">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600">
              {/* TODO(Ana): rotulo do seletor de nivel. */}
              Nível
            </span>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLevel(option)}
                  aria-pressed={level === option}
                  className={cn(
                    "rounded-full border-2 px-3 py-1 text-xs font-bold transition-all",
                    level === option ? ac.filterActive : ac.filterInactive,
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
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
                    className={inputClass}
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
                    className={cn(inputClass, "resize-y font-medium")}
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
                className={cn(
                  "mt-2 text-xs font-bold underline underline-offset-2",
                  ac.link,
                  ac.linkHover,
                )}
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

          {/* CTA centralizado, na cor de ACAO da casa (primary FFB800, a
              mesma familia do selo "Comece aqui"): o violeta de IA destoava
              do palco blue. */}
          <div className="mt-5 flex justify-center">
            <BrutalActionButton
              variant="primary"
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
              loading={creating}
              onClick={() => void handleCreate()}
              disabled={creating || !canCreate}
            >
              {/* TODO(Ana): label do botao de iniciar */}
              {creating ? "Preparando a entrevista" : "Começar entrevista"}
            </BrutalActionButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
