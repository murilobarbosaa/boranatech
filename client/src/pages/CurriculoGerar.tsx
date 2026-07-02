import { useMemo, useState } from "react";
import { CheckCircle2, FileDown, Loader2, RefreshCw } from "lucide-react";

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

function buildGreeting(name: string): string {
  const opener = name ? `Oi, ${name}!` : "Oi!";
  return `${opener} Sou o Natechinho, mentor de carreira do BoraNaTech. Vou te ajudar a montar um currículo do zero. Vai ser uma conversa de uns 10 minutinhos pra eu entender teu momento, e no final tu vai ter um PDF pronto pra usar onde quiser.

Pra gente começar, me conta um pouco sobre você. Em que momento da carreira tu tá? Tipo, tá estudando ainda, querendo entrar em TI, ou já trabalhou em alguma coisa na área?`;
}

export default function CurriculoGerar() {
  const { isPro } = useSubscription();
  const { profile, loading: authLoading } = useAuth();
  const [generated, setGenerated] = useState<Curriculo | null>(null);
  // resetKey força o CurriculoChatPanel a desmontar+remontar (limpando state
  // interno) sem precisar de window.location.reload, evitando flash.
  const [resetKey, setResetKey] = useState(0);

  // useAuth().loading só vira false depois que loadProfile resolveu (ver
  // AuthContext linhas 86-93). Esperar aqui evita renderizar a saudação com
  // nome vazio e ter que recalcular depois.
  const greeting = useMemo(
    () => buildGreeting(firstName(profile?.name)),
    [profile?.name],
  );

  function handleReset() {
    setGenerated(null);
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
            <GeneratedView curriculo={generated} onReset={handleReset} />
          ) : (
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <CurriculoChatPanel
                  key={resetKey}
                  initialAssistantMessage={greeting}
                  onCurriculoReady={(cv) => setGenerated(cv)}
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

function GeneratedView({ curriculo, onReset }: GeneratedViewProps) {
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

  const pretty = JSON.stringify(curriculo, null, 2);

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
            Baixar PDF
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
      <p className="print-hide -mt-3 mb-6 text-xs font-medium text-slate-600">
        Abre o diálogo de impressão do navegador. Escolhe "Salvar como PDF" pra
        baixar.
      </p>

      <div className="curriculo-preview-stage rounded-2xl bg-slate-100 p-4 sm:p-8">
        <CurriculoPreview curriculo={curriculo} />
      </div>

      <div className="print-hide mt-6">
        <details className="rounded-xl border-2 border-slate-950 bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 font-display text-sm font-black uppercase tracking-[0.15em] text-slate-950">
            Ver JSON cru (debug)
          </summary>
          <pre className="max-h-96 overflow-auto border-t-2 border-slate-950 bg-slate-950 p-4 text-xs leading-relaxed text-amber-50">
            <code>{pretty}</code>
          </pre>
        </details>
        <p className="mt-3 text-xs font-medium text-slate-600">
          Quer a versão editável depois? Esse JSON é o que vira o PDF, pode
          salvar pra reaproveitar.
        </p>
      </div>
    </div>
  );
}
