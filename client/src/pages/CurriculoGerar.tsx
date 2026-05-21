import { useMemo, useState } from "react";
import { CheckCircle2, FileJson, RefreshCw } from "lucide-react";

import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import PageHero from "@/components/shared/PageHero";
import CurriculoChatPanel from "@/components/curriculo/CurriculoChatPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import type { Curriculo } from "@shared/curriculo/schema";

const ac = getPageAccentUi("amber");

function firstName(full: string | null | undefined, emailFallback: string | undefined): string {
  if (full && full.trim()) {
    return full.trim().split(/\s+/)[0];
  }
  if (emailFallback) {
    return emailFallback.split("@")[0];
  }
  return "";
}

function buildGreeting(name: string): string {
  const opener = name ? `Oi, ${name}!` : "Oi!";
  return `${opener} Sou o Natechinho, mentor de carreira do BoraNaTech. Vou te ajudar a montar um currículo do zero. Vai ser uma conversa de uns 10 minutinhos pra eu entender teu momento, e no final tu vai ter um PDF pronto pra usar onde quiser.

Pra gente começar, me conta um pouco sobre você. Em que momento da carreira tu tá? Tipo, tá estudando ainda, querendo entrar em TI, ou já trabalhou em alguma coisa na área?`;
}

export default function CurriculoGerar() {
  const { isPro } = useSubscription();
  const { profile, user } = useAuth();
  const [generated, setGenerated] = useState<Curriculo | null>(null);

  const greeting = useMemo(
    () => buildGreeting(firstName(profile?.name, user?.email)),
    [profile?.name, user?.email],
  );

  function handleReset() {
    setGenerated(null);
    window.location.reload();
  }

  return (
    <Layout>
      <PageHero
        accent="amber"
        eyebrow="currículo pro"
        title="Monta teu currículo com o Natechinho"
        subtitle="Conversa rápida, sem formulário. Sai um currículo no formato certo pra tua vaga."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          {!isPro ? (
            <ProGate description="A geração assistida do currículo (e os formatos Híbrido, Cronológico e Harvard) é uma feature do Plano Pro. Assina pra desbloquear." />
          ) : (
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <CurriculoChatPanel
                  initialAssistantMessage={greeting}
                  onCurriculoReady={(cv) => setGenerated(cv)}
                />
              </div>
              <aside className="lg:col-span-2">
                <CurriculoStatus generated={generated} onReset={handleReset} />
              </aside>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

interface CurriculoStatusProps {
  generated: Curriculo | null;
  onReset: () => void;
}

function CurriculoStatus({ generated, onReset }: CurriculoStatusProps) {
  if (!generated) {
    return (
      <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-100 shadow-[2px_2px_0_#0f172a]">
            <FileJson className="h-5 w-5 text-slate-950" strokeWidth={2.25} aria-hidden />
          </div>
          <h3 className="font-display text-lg font-black text-slate-950">Resultado vai aparecer aqui</h3>
        </div>
        <p className="mt-4 text-sm font-medium leading-relaxed text-slate-700">
          Quando tu confirmar pro Natechinho que pode gerar, o currículo sai por aqui. Por enquanto, tá em formato JSON cru, mas é o
          mesmo dado que vai virar o PDF bonitinho na próxima etapa.
        </p>
        <ul className="mt-5 space-y-2 text-sm font-bold text-slate-800">
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[#FFB800]" aria-hidden />
            Conversa de uns 10 minutos
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[#FFB800]" aria-hidden />
            JSON estruturado conforme o template do BoraNaTech
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[#FFB800]" aria-hidden />
            Em breve, preview e download em PDF
          </li>
        </ul>
      </div>
    );
  }

  const pretty = JSON.stringify(generated, null, 2);
  return (
    <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-200 shadow-[2px_2px_0_#0f172a]">
          <CheckCircle2 className="h-5 w-5 text-emerald-900" strokeWidth={2.25} aria-hidden />
        </div>
        <div>
          <h3 className="font-display text-lg font-black text-slate-950">Currículo pronto</h3>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">JSON validado</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Field label="Nome" value={generated.dadosPessoais.nome} />
        <Field label="Idioma" value={generated.idioma === "en" ? "Inglês" : "Português"} />
        <Field label="Formato" value={generated.formato} />
        <Field label="Persona" value={generated.persona} />
        <Field label="Experiências" value={String(generated.experiencias.length)} />
        <Field label="Projetos" value={String(generated.projetos.length)} />
      </dl>
      <details className="mt-5 rounded-xl border-2 border-slate-950 bg-slate-50">
        <summary className="cursor-pointer select-none px-4 py-3 font-display text-sm font-black uppercase tracking-[0.15em] text-slate-950">
          Ver JSON cru
        </summary>
        <pre className="max-h-96 overflow-auto border-t-2 border-slate-950 bg-slate-950 p-4 text-xs leading-relaxed text-amber-50">
          <code>{pretty}</code>
        </pre>
      </details>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        Começar de novo
      </button>
      <p className="mt-3 text-xs font-medium text-slate-600">
        O preview visual e o download em PDF chegam na próxima fase.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-slate-950 bg-amber-50 px-3 py-2">
      <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">{label}</dt>
      <dd className="mt-0.5 truncate font-display text-sm font-black text-slate-950">{value}</dd>
    </div>
  );
}
