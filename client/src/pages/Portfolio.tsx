import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, ClipboardList, FolderGit2, Info, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import AuthModal from "@/components/auth/AuthModal";
import Layout from "@/components/Layout";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import CopyButton from "@/components/shared/CopyButton";
import PageHero from "@/components/shared/PageHero";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolioChecklist } from "@/hooks/usePortfolioChecklist";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { consumePendingIntent, savePendingIntent } from "@/lib/pendingIntent";
import { cn } from "@/lib/utils";
import { portfolioChecklist, portfolioGuides, readmeTemplates } from "@/lib/careerToolsData";

const ac = getPageAccentUi("emerald");

export default function Portfolio() {
  const { user } = useAuth();
  const {
    checkedIds,
    isLoading,
    toggle,
    queueMarkOnNextLoad,
    pendingAuthItemId,
    clearPendingAuth,
  } = usePortfolioChecklist();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const authJustSucceededRef = useRef(false);

  useEffect(() => {
    if (pendingAuthItemId && !user) {
      setAuthModalOpen(true);
    }
  }, [pendingAuthItemId, user]);

  const prevUserRef = useRef(user);
  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    if (!user) return;
    if (prevUser) return;

    const oauthIntent = consumePendingIntent();
    if (
      oauthIntent &&
      oauthIntent.kind === "progress" &&
      oauthIntent.context === "portfolio_checklist"
    ) {
      queueMarkOnNextLoad(oauthIntent.itemKey);
    } else if (oauthIntent) {
      savePendingIntent(oauthIntent);
      if (pendingAuthItemId) {
        queueMarkOnNextLoad(pendingAuthItemId);
        clearPendingAuth();
      }
    } else if (pendingAuthItemId) {
      queueMarkOnNextLoad(pendingAuthItemId);
      clearPendingAuth();
    }
  }, [user, pendingAuthItemId, clearPendingAuth, queueMarkOnNextLoad]);

  const allDone = !isLoading && checkedIds.size === portfolioChecklist.length;
  const progress = Math.round((checkedIds.size / portfolioChecklist.length) * 100);

  async function handleToggle(itemId: string) {
    const result = await toggle(itemId);
    if (result.requiresAuth) return;
    if (!result.ok) {
      if (user) {
        toast.error("Sua sessão expirou. Faça login novamente.");
      } else {
        toast.error("Não foi possível salvar. Tente novamente.");
      }
    }
  }

  function handleModalOpenChange(open: boolean) {
    setAuthModalOpen(open);
    if (!open) {
      if (authJustSucceededRef.current) {
        authJustSucceededRef.current = false;
        return;
      }
      clearPendingAuth();
    }
  }

  function handleAuthenticated() {
    authJustSucceededRef.current = true;
  }

  return (
    <Layout>
      <PageHero
        accent="emerald"
        eyebrow="projetos e evidências"
        title="Monte seu Portfólio"
        subtitle="Aprenda a mostrar seu trabalho do jeito certo."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
        <Link
          href="/portfolio/analisar"
          className={cn("card-brutal group block rounded-3xl p-6 text-white transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_#0f172a]", ac.tableBanner)}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-950 bg-amber-300 text-slate-950 shadow-[4px_4px_0_#0f172a]">
                <Sparkles className="h-8 w-8" />
              </span>
              <div>
                <h2 className="font-display text-3xl font-black leading-tight md:text-4xl">Analisar seu portfólio com IA</h2>
                <p className={cn("mt-2 max-w-3xl text-sm font-medium md:text-base", ac.tableBannerMuted)}>
                  Receba uma avaliação do seu GitHub com pontos fortes, lacunas, melhorias de README, organização dos projetos e próximos passos para ficar mais pronta para vagas.
                </p>
              </div>
            </div>
            <span className={cn("inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-white bg-white px-5 py-3 text-sm font-black transition-all group-hover:bg-amber-300 group-hover:text-slate-950", ac.tbodyAccent)}>
              Começar análise <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {portfolioGuides.map(([area, quantity, project, avoid]) => (
            <DetailsChevronOnly key={area} className="card-brutal rounded-2xl bg-white p-5" title={<span className="font-display text-xl font-black">{area}</span>}>
              <div className="mt-4 space-y-2 text-sm text-slate-700"><p><strong>Quantidade:</strong> {quantity}</p><p><strong>Chama atenção:</strong> {project}</p><p><strong>Exemplo real:</strong> GitHub/Behance de profissionais da área.</p><p><strong>Nunca fazer:</strong> {avoid}</p></div>
            </DetailsChevronOnly>
          ))}
        </div>
        <div className="card-brutal rounded-2xl bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-black">Checklist de portfólio</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">Marque o que já está pronto e acompanhe sua evolução.</p>
            </div>
            <div className={cn("rounded-2xl border-2 border-slate-900 px-5 py-3 text-white shadow-[4px_4px_0_#0f172a]", ac.tableBanner)}>
              <p className={cn("text-xs font-black uppercase", ac.tableBannerMuted)}>progresso</p>
              <p className="font-display text-3xl font-black">{progress}%</p>
            </div>
          </div>
          <div className={cn("mt-5 h-5 overflow-hidden rounded-full border-2 border-slate-900 shadow-[3px_3px_0_#0f172a]", ac.panelSoft)}>
            <div className={cn("h-full transition-all duration-300", ac.progressFill)} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {isLoading ? "Carregando seu progresso..." : `${checkedIds.size} de ${portfolioChecklist.length} itens concluídos`}
          </p>
          <div className={cn("mt-4 grid gap-3 md:grid-cols-2", isLoading && "opacity-60")}>
            {portfolioChecklist.map((item) => {
              const isChecked = checkedIds.has(item.id);

              return (
              <label
                key={item.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 text-sm font-bold transition-all",
                  isChecked
                    ? cn("border-slate-900 shadow-[3px_3px_0_#0f172a]", ac.panelSoft)
                    : "border-emerald-200 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50",
                  isLoading && "pointer-events-none",
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(item.id)}
                  disabled={isLoading}
                  className="sr-only"
                />
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 transition-all ${
                    isChecked ? "bg-amber-300 text-slate-950 shadow-[2px_2px_0_#0f172a]" : "bg-white text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  <Check className="h-4 w-4 stroke-[4]" />
                </span>
                <span className={isChecked ? "text-slate-950" : "text-slate-700"}>{item.label}</span>
              </label>
              );
            })}
          </div>
          {allDone && <div className="mt-5 rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-4 font-display text-xl font-black text-emerald-800">Portfólio pronto para o mercado</div>}
        </div>
          <div className={cn("card-brutal rounded-2xl p-6 text-white", ac.tableBanner)}>
          <div className="flex items-start gap-3">
            <span className={cn("rounded-xl border-2 border-slate-950 bg-amber-300 p-3 text-slate-950", ac.brutalShadow)}>
              <ClipboardList className="h-6 w-6" />
            </span>
            <div>
              <p className={cn("text-xs font-black uppercase", ac.tableBannerMuted)}>templates para copiar e adaptar</p>
              <h2 className="font-display text-3xl font-black">O que são esses modelos no final?</h2>
              <p className={cn("mt-2 max-w-3xl text-sm font-medium", ac.tableBannerMuted)}>
                São estruturas de README para diferentes tipos de projeto. O README é o texto que explica seu projeto no GitHub: o que ele faz, quais tecnologias usou, como acessar, como rodar e o que você aprendeu.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <Info className="mb-2 h-5 w-5 text-amber-200" />
              <p className="font-black">Para que serve?</p>
              <p className={cn("mt-1 text-xs", ac.tableBannerMuted)}>Para recrutadores entenderem seu projeto sem precisar adivinhar pelo código.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <Target className="mb-2 h-5 w-5 text-amber-200" />
              <p className="font-black">Como usar?</p>
              <p className={cn("mt-1 text-xs", ac.tableBannerMuted)}>Escolha o modelo parecido com seu projeto, copie e substitua pelos seus dados reais.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <FolderGit2 className="mb-2 h-5 w-5 text-amber-200" />
              <p className="font-black">Onde colocar?</p>
              <p className={cn("mt-1 text-xs", ac.tableBannerMuted)}>No arquivo README.md do repositório do projeto no GitHub.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {readmeTemplates.map((template) => (
            <article key={template.title} className="card-brutal rounded-2xl bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn("mb-2 inline-flex rounded-full px-2 py-1 text-xs font-black uppercase", ac.panelSoft, ac.tbodyAccent)}>modelo de README</p>
                  <h3 className="font-display text-xl font-black">{template.title}</h3>
                </div>
                <CopyButton text={template.body} />
              </div>
              <div className="mt-4 space-y-3 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                <p><strong>O que é:</strong> {template.purpose}</p>
                <p><strong>Serve para:</strong> {template.bestFor}</p>
                <p><strong>Por que ajuda no portfólio:</strong> {template.whyItMatters}</p>
              </div>
              <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-white">{template.body}</pre>
            </article>
          ))}
        </div>
        </div>
      </section>
      <AuthModal
        open={authModalOpen}
        onOpenChange={handleModalOpenChange}
        onAuthenticated={handleAuthenticated}
        title={<>Faça login pra salvar seu <span className="text-[#FFB800]">Progresso</span></>}
        description="Seu progresso fica salvo na sua conta."
        pendingIntent={pendingAuthItemId ? { kind: "progress", context: "portfolio_checklist", itemKey: pendingAuthItemId } : undefined}
      />
    </Layout>
  );
}
