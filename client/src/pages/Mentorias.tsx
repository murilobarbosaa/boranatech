import { Link } from "wouter";
import { ArrowRight, Bell } from "lucide-react";
import Layout from "@/components/Layout";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("amber");

export default function Mentorias() {
  return (
    <Layout>
      <PageHero
        accent="amber"
        eyebrow="acompanhamento próximo"
        title="Mentorias"
        subtitle="Sessões com pessoas da área para tirar dúvidas, revisar rumo de carreira e estudar com mais confiança."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container max-w-2xl space-y-8">
          <div className="card-brutal rounded-3xl border-2 border-slate-900 bg-white p-8 shadow-[6px_6px_0_#0f172a]">
            <p className="mb-4 inline-flex rounded-full border border-amber-400/90 bg-amber-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-amber-950">
              Em breve
            </p>
            <h2 className="font-display text-2xl font-black text-slate-950">
              Estamos preparando algo especial
            </h2>
            <p className="mt-3 text-base font-medium leading-relaxed text-slate-700">
              Em breve você poderá se conectar a mentorias alinhadas ao jeito
              BORA NA TECH?: linguagem acessível, foco em quem está entrando na
              área e conversas que realmente destravam o próximo passo, sem
              promessa vazia.
            </p>
            <div
              className={cn(
                "mt-6 rounded-2xl border-2 border-slate-200 p-5",
                ac.panelSoft,
              )}
            >
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0_#0f172a]">
                  <Bell className="h-5 w-5 text-amber-900" />
                </span>
                <div>
                  <p className="font-display font-black text-slate-950">
                    Quer ser avisada?
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Fique de olho nas novidades da plataforma. Avisaremos por
                    aqui quando as mentorias abrirem.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/"
              className={cn(
                "btn-brutal-accent mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-black",
              )}
            >
              Voltar ao início
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
