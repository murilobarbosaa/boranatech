import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import {
  CheckCircle2,
  CloudUpload,
  FileDown,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";

import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import PageHero from "@/components/shared/PageHero";
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

export default function CurriculoGerar() {
  const { isPro } = useSubscription();
  const { profile, loading: authLoading } = useAuth();
  const search = useSearch();
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
  // Com itens salvos, a pagina abre na lista; "chat" e o fluxo de criar novo.
  // Com ?rewrite, abre DIRETO no chat (a lista nao interfere na ponte).
  const [mode, setMode] = useState<"list" | "chat">(
    rewriteId ? "chat" : "list",
  );

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

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Gerador de currículo com IA"
        description="Monte seu currículo conversando com o Natechinho: uma conversa rápida, sem formulário, que gera um currículo no formato certo para a sua vaga."
        url="/curriculo/gerar"
      />
      <div className="print-hide">
        <PageHero
          accent="amber"
          eyebrow="currículo pro"
          title="Monta teu currículo com o Natechinho"
          subtitle="Conversa rápida, sem formulário. Sai um currículo no formato certo pra tua vaga."
        />
      </div>
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
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
          ) : mode === "list" && saved !== undefined && saved !== null && saved.length > 0 ? (
            <SavedResumesList
              resumes={saved}
              onOpen={(id) => void handleOpenSaved(id)}
              onDeleted={loadSaved}
              onCreateNew={() => setMode("chat")}
            />
          ) : mode === "list" && saved === undefined ? (
            <div className="print-hide">
              <PreparingChat />
            </div>
          ) : (
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

interface SavedResumesListProps {
  resumes: ResumeSummary[];
  onOpen: (id: string) => void;
  onDeleted: () => void;
  onCreateNew: () => void;
}

// Lista dos curriculos salvos, mostrada antes de iniciar um chat novo.
// Exclusao em dois passos (clique em excluir pede confirmacao inline).
function SavedResumesList({
  resumes,
  onOpen,
  onDeleted,
  onCreateNew,
}: SavedResumesListProps) {
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
    <div className="mx-auto max-w-2xl">
      {/* TODO(Ana): revisar os textos da lista de curriculos salvos */}
      <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
        <h2 className="font-display text-2xl font-black text-slate-950">
          Teus currículos salvos
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Reabre um currículo pronto ou começa um novo com o Natechinho.
        </p>
        <div className="mt-5 space-y-3">
          {resumes.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-slate-950 bg-white p-4 shadow-[2px_2px_0_#0f172a]"
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{item.title}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {formatDate(item.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Criar um currículo novo
        </button>
      </div>
    </div>
  );
}
