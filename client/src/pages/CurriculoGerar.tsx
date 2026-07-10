import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  CloudUpload,
  FileDown,
  FileText,
  GraduationCap,
  Languages,
  Loader2,
  PenLine,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import BrutalActionButton from "@/components/shared/BrutalActionButton";
import SEO from "@/components/SEO";
import CurriculoChatPanel from "@/components/curriculo/CurriculoChatPanel";
import CurriculoPreview from "@/components/curriculo/preview/CurriculoPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { getResumeAnalysis } from "@/services/resumeAnalysisService";
import {
  deleteResume,
  getResume,
  listResumes,
  saveResume,
  type ResumeSummary,
} from "@/services/resumeService";
import type { Curriculo } from "@shared/curriculo/schema";

const ac = getPageAccentUi("amber");

/**
 * Pega o primeiro nome da pessoa. Nunca cai pra email: se não temos um nome
 * real do perfil, o chat usa "Oi!" sem nome em vez de cuspir um login.
 */
function firstName(full: string | null | undefined): string {
  if (!full) return "";
  const trimmed = full.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}

// TODO(Ana): revisar a saudacao (promessa honesta: imprimir/salvar como PDF
// pelo navegador + curriculo salvo na conta).
function buildGreeting(name: string): string {
  const opener = name ? `Oi, ${name}!` : "Oi!";
  return `${opener} Sou o Natechinho, mentor de carreira do BoraNaTech. Vou te ajudar a montar um currículo do zero. Vai ser uma conversa de uns 10 minutinhos pra eu entender teu momento, e no final teu currículo fica salvo na tua conta, prontinho pra imprimir ou salvar como PDF pelo navegador.

Pra gente começar, me conta um pouco sobre você. Em que momento da carreira tu tá? Tipo, tá estudando ainda, querendo entrar em TI, ou já trabalhou em alguma coisa na área?`;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Teto do curriculo colado na mensagem automatica da ponte de reescrita.
// O resume-builder aceita 30k chars de input total (maxInputChars em
// server/lib/aiTools.ts); 10k deixa folga larga pro restante da conversa.
const REWRITE_RESUME_MAX_CHARS = 10_000;

// TODO(Ana): revisar o texto da mensagem automatica de reescrita.
function buildRewriteMessage(score: number, resumeText: string): string {
  const trimmed = resumeText.slice(0, REWRITE_RESUME_MAX_CHARS);
  return `Quero reescrever meu currículo. Ele tirou nota ${score} na análise da plataforma. Aqui está ele:\n\n${trimmed}`;
}

// Doodles tematicos do atelie do Natechinho (papel, caneta, estudo, trabalho,
// idiomas), no padrao dos ENTRY_DOODLES do PortfolioAnalisar (loop lento de
// y/rotate; reduce para tudo).
const ENTRY_DOODLES = [
  { Icon: FileText, cls: "left-[4%] top-[6%] text-amber-500 opacity-[0.16]", size: "h-12 w-12", rot: 6, dur: 7, delay: 0 },
  { Icon: Sparkles, cls: "right-[6%] top-[8%] text-yellow-600 opacity-[0.15]", size: "h-10 w-10", rot: -6, dur: 8, delay: 0.5 },
  { Icon: PenLine, cls: "left-[14%] top-[30%] text-orange-500 opacity-[0.13]", size: "h-9 w-9", rot: 8, dur: 7.5, delay: 0.3 },
  { Icon: GraduationCap, cls: "right-[12%] top-[34%] text-amber-600 opacity-[0.14]", size: "h-10 w-10", rot: -7, dur: 6.5, delay: 1.1 },
  { Icon: Briefcase, cls: "left-[6%] top-[58%] text-amber-500 opacity-[0.13]", size: "h-10 w-10", rot: 7, dur: 7, delay: 0.8 },
  { Icon: Languages, cls: "right-[5%] top-[62%] text-orange-600 opacity-[0.14]", size: "h-11 w-11", rot: -5, dur: 8, delay: 1.4 },
  { Icon: PenLine, cls: "left-[10%] top-[84%] text-amber-500 opacity-[0.12]", size: "h-8 w-8", rot: 9, dur: 6, delay: 0.6 },
  { Icon: FileText, cls: "right-[15%] top-[86%] text-yellow-600 opacity-[0.12]", size: "h-9 w-9", rot: -8, dur: 6.5, delay: 1 },
];

// Cenario vivo do atelie: gradiente de marca amber + doodles flutuantes no
// estado de ENTRADA; nos estados de conversa e resultado o cenario reduz a
// uma faixa curta atras do header (padrao do molde do Analisador de GitHub).
function BuilderBackdrop({ reduce, full }: { reduce: boolean; full: boolean }) {
  return (
    <div
      className="print-hide pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 bg-gradient-to-br from-amber-200/45 via-yellow-100/35 to-orange-100/40",
          full
            ? "h-[540px] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
            : "h-60 [mask-image:linear-gradient(to_bottom,black_35%,transparent)]",
        )}
      />
      {full
        ? ENTRY_DOODLES.map((doodle, i) => {
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
          })
        : null}
    </div>
  );
}

// TODO(Ana): revisar titulos e frases da linha do tempo do atelie (frases de
// apoio reaproveitadas da saudacao e do card antigo de resultado).
const TIMELINE_STEPS: { title: string; text: string }[] = [
  {
    title: "Conversa de uns 10 minutos",
    text: "O Natechinho pergunta sobre teu momento de carreira, sem formulário.",
  },
  {
    title: "O Natechinho monta nos 3 formatos",
    text: "Híbrido, Cronológico ou Harvard, com o conteúdo adaptado à tua persona.",
  },
  {
    title: "Imprime, salva e reaproveita",
    text: "Fica salvo na tua conta pra reabrir, imprimir de novo ou criar outro.",
  },
];

function BuilderTimeline({ reduce }: { reduce: boolean }) {
  return (
    <div>
      <h2 className="mb-5 font-display text-2xl font-black text-slate-950">
        Como funciona
      </h2>
      <ol className="space-y-0">
        {TIMELINE_STEPS.map((step, i) => {
          const last = i === TIMELINE_STEPS.length - 1;
          return (
            <motion.li
              key={step.title}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.08, 0.3) }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {!last ? (
                <span
                  className="absolute bottom-0 left-5 top-10 w-0 border-l-2 border-dashed border-slate-400"
                  aria-hidden
                />
              ) : null}
              <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 font-display text-lg font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-display text-base font-black text-slate-950">
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {step.text}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

// Um mini-card da vitrine: entrada whileInView + float sutilissimo em loop
// (2 a 3px; reduce desliga os dois). Mesmo padrao do ShowcaseCard do molde.
function ShowcaseCard({
  children,
  className,
  index,
  reduce,
}: {
  children: React.ReactNode;
  className?: string;
  index: number;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.12, 0.36) }}
      className={className}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -3, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: 4 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5,
              }
        }
        className="rounded-xl border-2 border-slate-950 bg-white shadow-[3px_3px_0_#0f172a]"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Barra skeleton ESTATICA da silhueta de curriculo (so decoracao, sem shimmer
// nem semantica de progresso).
function SkeletonBar({ className }: { className?: string }) {
  return <span className={cn("block rounded-full bg-slate-200", className)} />;
}

// Rotulos ILUSTRATIVOS das secoes do mini A4 da vitrine.
// TODO(Ana): revisar os rotulos e a frase de exemplo do balao.
const SHOWCASE_SECTIONS = ["Objetivo", "Experiências", "Skills"];
const SHOWCASE_BUBBLE_TEXT =
  "Me conta teu momento de carreira que eu monto o resto contigo.";
// TODO(Ana): revisar o selo da vitrine.
const SHOWCASE_BADGE = "exemplo ilustrativo";

// Vitrine do estado de entrada: composicao de um mini A4 ilustrativo + um
// mini balao de chat do Natechinho. 100% ILUSTRATIVA (nenhum dado real).
function BuilderShowcase({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <span className="absolute -top-3 right-2 z-20 rotate-2 rounded-full border-2 border-slate-950 bg-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-[2px_2px_0_#0f172a]">
        {SHOWCASE_BADGE}
      </span>

      {/* (a) mini A4: cabecalho + barras de secoes rotuladas */}
      <ShowcaseCard index={0} reduce={reduce} className="w-[72%] -rotate-2">
        <div className="rounded-xl bg-white p-4">
          <SkeletonBar className="h-3 w-1/2 bg-slate-800" />
          <SkeletonBar className="mt-1.5 h-2 w-1/3 bg-slate-300" />
          {SHOWCASE_SECTIONS.map((label) => (
            <div key={label} className="mt-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                {label}
              </p>
              <SkeletonBar className="mt-1 h-2 w-full" />
              <SkeletonBar className="mt-1 h-2 w-5/6" />
            </div>
          ))}
        </div>
      </ShowcaseCard>

      {/* (b) mini balao de chat do Natechinho */}
      <ShowcaseCard
        index={1}
        reduce={reduce}
        className="relative z-10 -mt-8 ml-auto w-[78%] rotate-[1.5deg]"
      >
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-[#FFB800] shadow-[2px_2px_0_#0f172a]">
            <Wand2 className="h-4 w-4 text-slate-950" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-800">
              Natechinho
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {SHOWCASE_BUBBLE_TEXT}
            </p>
          </div>
        </div>
      </ShowcaseCard>
    </div>
  );
}

// Palco da entrada: o card que inicia a conversa (peca da familia da vitrine:
// rotacao leve + selo de proposito no topo, padrao do molde).
function StartStage({ onStart }: { onStart: () => void }) {
  return (
    <div
      className={cn(
        "card-brutal relative mx-auto mt-14 max-w-3xl -rotate-[0.4deg] rounded-2xl border-slate-950 bg-white p-6 sm:mt-16 sm:p-8",
        ac.liftShadow,
      )}
    >
      {/* TODO(Ana): revisar o selo, o titulo e o botao do palco. */}
      <span className="absolute -top-3.5 left-6 z-10 inline-flex rotate-1 items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
        <Sparkles className="h-3 w-3" aria-hidden />
        Comece aqui
      </span>
      <h2 className="font-display text-xl font-black text-slate-950 sm:text-2xl">
        Bora montar teu currículo?
      </h2>
      <p className="mt-2 text-sm font-medium text-slate-600">
        Sem formulário: é uma conversa com o Natechinho, e o currículo sai
        pronto no final.
      </p>
      <BrutalActionButton
        variant="primary"
        icon={<Wand2 className="h-4 w-4" aria-hidden />}
        onClick={onStart}
        className="mt-5 px-6 py-3.5"
      >
        Começar a conversa
      </BrutalActionButton>
    </div>
  );
}

// Modo da tela sem curriculo gerado: "list" e a galeria de salvos (quando
// existem), "intro" e a entrada explicativa (sem salvos ou apos "criar novo")
// e "chat" e o atelie (conversa em andamento).
type BuilderMode = "list" | "intro" | "chat";

export default function CurriculoGerar() {
  const { isPro } = useSubscription();
  const { profile, loading: authLoading } = useAuth();
  const search = useSearch();
  const reduce = useReducedMotion() ?? false;
  const [generated, setGenerated] = useState<Curriculo | null>(null);
  // resetKey força o CurriculoChatPanel a desmontar+remontar (limpando state
  // interno) sem precisar de window.location.reload, evitando flash.
  const [resetKey, setResetKey] = useState(0);

  // Ponte analise -> reescrita: ?rewrite=<analysisId>. Id invalido e tratado
  // como ausente; analise inexistente/alheia (404 -> null) cai no fluxo
  // normal sem erro.
  const rewriteId = useMemo(() => {
    const params = new URLSearchParams(search);
    const id = params.get("rewrite");
    return id && UUID_RE.test(id) ? id : null;
  }, [search]);
  const [rewriteSeed, setRewriteSeed] = useState<string | null>(null);

  // Persistencia best-effort do curriculo recem-gerado: nunca bloqueia a
  // exibicao (o preview aparece igual; o selo/aviso comunica o estado).
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Curriculos ja salvos: undefined = carregando, null = falha de carga.
  const [saved, setSaved] = useState<ResumeSummary[] | null | undefined>(
    undefined,
  );
  // Com itens salvos, a pagina abre na galeria; sem salvos a propria "list"
  // rende a entrada explicativa. Com ?rewrite, abre DIRETO no chat (a galeria
  // nao interfere na ponte).
  const [mode, setMode] = useState<BuilderMode>(rewriteId ? "chat" : "list");

  // Busca a analise da ponte e monta a primeira mensagem automatica.
  useEffect(() => {
    if (!rewriteId || !isPro) return;
    let cancelled = false;
    getResumeAnalysis(rewriteId)
      .then((record) => {
        if (cancelled || !record) return;
        setRewriteSeed(
          buildRewriteMessage(record.result.score, record.input.resumeText),
        );
      })
      .catch(() => {
        // Falha de carga: segue o fluxo normal, sem mensagem automatica.
      });
    return () => {
      cancelled = true;
    };
  }, [rewriteId, isPro]);

  const loadSaved = useCallback(() => {
    listResumes()
      .then(setSaved)
      .catch(() => setSaved(null));
  }, []);
  useEffect(() => {
    if (isPro) loadSaved();
  }, [isPro, loadSaved]);

  // useAuth().loading só vira false depois que loadProfile resolveu (ver
  // AuthContext linhas 86-93). Esperar aqui evita renderizar a saudação com
  // nome vazio e ter que recalcular depois.
  const greeting = useMemo(
    () => buildGreeting(firstName(profile?.name)),
    [profile?.name],
  );

  const persist = useCallback(
    async (cv: Curriculo) => {
      setSaveState("saving");
      try {
        await saveResume(cv);
        setSaveState("saved");
        loadSaved();
      } catch {
        setSaveState("error");
      }
    },
    [loadSaved],
  );

  function handleCurriculoReady(cv: Curriculo) {
    setGenerated(cv);
    void persist(cv);
  }

  async function handleOpenSaved(id: string) {
    const record = await getResume(id).catch(() => null);
    if (!record) {
      loadSaved();
      return;
    }
    // Reabre o jsonb salvo direto no preview: nada e regerado e nada e
    // salvo de novo (ja esta na conta).
    setGenerated(record.curriculo);
    setSaveState("saved");
  }

  function handleReset() {
    setGenerated(null);
    setSaveState("idle");
    setMode("chat");
    // A ponte de reescrita vale UMA vez: comecar de novo abre um chat limpo,
    // sem reenvio automatico do curriculo analisado.
    setRewriteSeed(null);
    setResetKey((k) => k + 1);
  }

  // Estado visual da pagina: ENTRADA (galeria ou explicacao), ATELIE (chat)
  // e RESULTADO (curriculo gerado ou reaberto). A distincao ja existia na
  // logica (generated/mode/saved); aqui ela so organiza JSX e cenario.
  const isAtelier = !generated && mode === "chat";
  const isEntry = !generated && mode !== "chat";

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Gerador de currículo com IA"
        description="Monte seu currículo conversando com o Natechinho: uma conversa rápida, sem formulário, que gera um currículo no formato certo para a sua vaga."
        url="/curriculo/gerar"
      />
      {/* Cenario do atelie na pagina inteira: sem PageHero, o cabecalho vive
          DENTRO do cenario (pontilhado da casa + gradiente de marca amber).
          O backdrop vivo completo so existe na ENTRADA; atelie e resultado
          ficam com a faixa curta. */}
      <section className="relative overflow-hidden bg-[#faf8f4] pb-16 pt-8 [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <BuilderBackdrop reduce={reduce} full={isEntry} />
        <div className="container relative z-10">
          {/* Cabecalho integrado, presente nos 3 estados. TODO(Ana): validar
              badge, titulo e subtitulo. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="print-hide mb-10"
          >
            <p>
              <span className="inline-flex rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
                Currículo Pro
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
                <Wand2 className="h-8 w-8" />
              </span>
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 md:text-[clamp(2rem,5vw,2.6rem)]">
                Monta teu currículo com o Natechinho
              </h1>
            </div>
            <p className="mt-3 max-w-2xl text-base font-medium text-slate-600">
              Conversa rápida, sem formulário. Sai um currículo no formato
              certo pra tua vaga.
            </p>
          </motion.div>

          {!isPro ? (
            <div className="print-hide">
              <ProGate description="A geração assistida do currículo (e os formatos Híbrido, Cronológico e Harvard) é uma feature do Plano Pro. Assina pra desbloquear." />
            </div>
          ) : authLoading ? (
            <div className="print-hide">
              <PreparingChat />
            </div>
          ) : generated ? (
            <GeneratedView
              curriculo={generated}
              onReset={handleReset}
              saveState={saveState}
              onRetrySave={() => void persist(generated)}
            />
          ) : isAtelier ? (
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <CurriculoChatPanel
                  key={resetKey}
                  initialAssistantMessage={greeting}
                  onCurriculoReady={handleCurriculoReady}
                  initialUserMessage={rewriteSeed ?? undefined}
                />
              </div>
              <aside className="lg:col-span-2">
                <PendingStatus />
              </aside>
            </div>
          ) : mode === "list" && saved === undefined ? (
            <div className="print-hide">
              <PreparingChat />
            </div>
          ) : mode === "list" && saved !== null && saved !== undefined && saved.length > 0 ? (
            <SavedResumesGallery
              resumes={saved}
              reduce={reduce}
              onOpen={(id) => void handleOpenSaved(id)}
              onDeleted={loadSaved}
              onCreateNew={() => setMode("intro")}
            />
          ) : (
            <div className="space-y-8">
              <div className="mx-auto max-w-5xl">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
                  <BuilderTimeline reduce={reduce} />
                  <BuilderShowcase reduce={reduce} />
                </div>
              </div>
              <StartStage onStart={() => setMode("chat")} />
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function PreparingChat() {
  return (
    <div className="card-brutal mx-auto max-w-md rounded-2xl border-slate-950 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-100 shadow-[3px_3px_0_#0f172a]">
        <Loader2
          className="h-5 w-5 animate-spin text-slate-950"
          strokeWidth={2.5}
          aria-hidden
        />
      </div>
      <p className="mt-4 font-display text-lg font-black text-slate-950">
        Preparando teu chat...
      </p>
      <p className="mt-1 text-sm font-medium text-slate-600">
        Carregando teu perfil pra começar.
      </p>
    </div>
  );
}

function PendingStatus() {
  return (
    <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-100 shadow-[2px_2px_0_#0f172a]">
          <CheckCircle2
            className="h-5 w-5 text-slate-950"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
        <h3 className="font-display text-lg font-black text-slate-950">
          Resultado vai aparecer aqui
        </h3>
      </div>
      <p className="mt-4 text-sm font-medium leading-relaxed text-slate-700">
        Quando tu confirmar pro Natechinho que pode gerar, o currículo aparece
        nesta tela em formato bonito, pronto pra imprimir.
      </p>
      <ul className="mt-5 space-y-2 text-sm font-bold text-slate-800">
        <li className="flex items-start gap-2">
          <span
            className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[#FFB800]"
            aria-hidden
          />
          Conversa de uns 10 minutos
        </li>
        <li className="flex items-start gap-2">
          <span
            className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[#FFB800]"
            aria-hidden
          />
          3 formatos (Híbrido, Cronológico, Harvard)
        </li>
        <li className="flex items-start gap-2">
          <span
            className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[#FFB800]"
            aria-hidden
          />
          Adapta o conteúdo conforme tua persona
        </li>
      </ul>
    </div>
  );
}

interface GeneratedViewProps {
  curriculo: Curriculo;
  onReset: () => void;
  saveState: SaveState;
  onRetrySave: () => void;
}

/**
 * Sanitiza um nome pra usar como nome de arquivo. Remove caracteres
 * proibidos em filesystems comuns (Windows é o mais restritivo).
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Dispara o diálogo de impressão do navegador (que oferece "Salvar como
 * PDF"). Antes de imprimir, troca o document.title pra que o nome sugerido
 * do arquivo PDF saia como "Curriculo - Nome Da Pessoa" em vez do título
 * genérico da página. Restaura o título depois (via afterprint event, com
 * fallback por setTimeout pra browsers que não disparam o evento).
 */
function downloadAsPdf(nome: string) {
  const safe = sanitizeFileName(nome);
  const newTitle = safe ? `Curriculo - ${safe}` : "Curriculo";
  const originalTitle = document.title;
  document.title = newTitle;

  function restore() {
    document.title = originalTitle;
    window.removeEventListener("afterprint", restore);
  }
  window.addEventListener("afterprint", restore);

  window.print();

  // Fallback: se o browser não disparar afterprint, restaura no próximo tick.
  window.setTimeout(() => {
    if (document.title !== originalTitle) document.title = originalTitle;
  }, 200);
}

function GeneratedView({
  curriculo,
  onReset,
  saveState,
  onRetrySave,
}: GeneratedViewProps) {
  const formatoLabel =
    curriculo.formato === "hibrido"
      ? "Híbrido"
      : curriculo.formato === "cronologico"
        ? "Cronológico"
        : "Harvard";
  const personaLabel =
    curriculo.persona === "estudante"
      ? "Estudante/Iniciante"
      : curriculo.persona === "transicao"
        ? "Transição"
        : curriculo.persona === "junior"
          ? "Júnior"
          : "Experiente";

  function handleDownload() {
    downloadAsPdf(curriculo.dadosPessoais.nome);
  }

  return (
    <div>
      <div className="print-hide mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
            Currículo pronto
          </p>
          <h2 className="mt-1 font-display text-2xl font-black text-slate-950 sm:text-3xl">
            {curriculo.dadosPessoais.nome}
          </h2>
          <p className="mt-0.5 text-sm font-bold text-slate-700">
            Formato {formatoLabel} · Persona {personaLabel} ·{" "}
            {curriculo.idioma === "en" ? "English" : "Português"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
          >
            <FileDown className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            {/* TODO(Ana): copy do botao de imprimir/salvar PDF */}
            Imprimir ou salvar PDF
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Começar de novo
          </button>
        </div>
      </div>
      <p className="print-hide -mt-3 mb-3 text-xs font-medium text-slate-600">
        Abre o diálogo de impressão do navegador. Escolhe "Salvar como PDF" pra
        baixar.
      </p>

      <div className="print-hide mb-6">
        {/* TODO(Ana): revisar os textos do estado de salvamento */}
        {saveState === "saving" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-white px-3 py-1 text-xs font-bold text-slate-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Salvando na sua conta...
          </span>
        ) : saveState === "saved" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <CloudUpload className="h-3.5 w-3.5" aria-hidden />
            Salvo na sua conta
          </span>
        ) : saveState === "error" ? (
          <span className="inline-flex flex-wrap items-center gap-2 rounded-full border-2 border-slate-950 bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
            Não consegui salvar na sua conta.
            <button
              type="button"
              onClick={onRetrySave}
              className="underline underline-offset-2 hover:text-rose-950"
            >
              Tentar de novo
            </button>
          </span>
        ) : null}
      </div>

      <div className="curriculo-preview-stage rounded-2xl bg-slate-100 p-4 sm:p-8">
        <CurriculoPreview curriculo={curriculo} />
      </div>

      <p className="print-hide mt-4 text-xs font-medium text-slate-600">
        {/* TODO(Ana): revisar a frase de reaproveitamento */}
        Teu currículo fica salvo na tua conta: volta nesta página quando quiser
        pra reabrir, imprimir de novo ou criar outro.
      </p>
    </div>
  );
}

interface SavedResumesGalleryProps {
  resumes: ResumeSummary[];
  reduce: boolean;
  onOpen: (id: string) => void;
  onDeleted: () => void;
  onCreateNew: () => void;
}

// Galeria dos curriculos salvos, protagonista da ENTRADA quando existem:
// cada salvo vira um cartao-documento (silhueta A4 estatica + nome e data
// reais, rotacao alternada como a vitrine do molde). Exclusao em dois passos
// (clique em excluir pede confirmacao inline), mesma logica de antes.
function SavedResumesGallery({
  resumes,
  reduce,
  onOpen,
  onDeleted,
  onCreateNew,
}: SavedResumesGalleryProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteResume(id);
      onDeleted();
    } catch {
      // Falha silenciosa nao: volta o botao ao estado normal e o item fica.
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  function formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR");
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* TODO(Ana): revisar os textos da galeria de curriculos salvos */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-slate-950">
            Teus currículos salvos
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Reabre um currículo pronto ou começa um novo com o Natechinho.
          </p>
        </div>
        <BrutalActionButton
          variant="primary"
          icon={<Sparkles className="h-4 w-4" aria-hidden />}
          onClick={onCreateNew}
        >
          Criar novo com o Natechinho
        </BrutalActionButton>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resumes.map((item, i) => (
          <motion.div
            key={item.id}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: reduce ? 0 : Math.min(i * 0.06, 0.3),
            }}
            className={cn(
              "card-brutal rounded-2xl border-slate-950 bg-white p-4",
              i % 2 === 0 ? "-rotate-[0.6deg]" : "rotate-[0.6deg]",
              ac.liftShadow,
            )}
          >
            {/* Silhueta A4 estilizada (decoracao estatica) */}
            <div
              className="rounded-lg border-2 border-slate-200 bg-white p-3"
              aria-hidden
            >
              <SkeletonBar className="h-2.5 w-2/3 bg-slate-800" />
              <SkeletonBar className="mt-1.5 h-1.5 w-1/3 bg-slate-300" />
              <SkeletonBar className="mt-3 h-1.5 w-full" />
              <SkeletonBar className="mt-1 h-1.5 w-5/6" />
              <SkeletonBar className="mt-3 h-1.5 w-full" />
              <SkeletonBar className="mt-1 h-1.5 w-4/6" />
            </div>
            <p className="mt-3 truncate font-bold text-slate-900">
              {item.title}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              {formatDate(item.created_at)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className="rounded-full border-2 border-slate-950 bg-[#FFB800] px-4 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
              >
                Abrir
              </button>
              {confirmingId === item.id ? (
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => void handleDelete(item.id)}
                  className="rounded-full border-2 border-slate-950 bg-rose-600 px-4 py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-60"
                >
                  {deletingId === item.id ? "Excluindo..." : "Confirmar exclusão"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(item.id)}
                  aria-label={`Excluir ${item.title}`}
                  className="rounded-full border-2 border-slate-950 bg-white p-2 text-slate-600 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
