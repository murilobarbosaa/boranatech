import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarDays } from "lucide-react";
import Layout from "@/components/Layout";

type LegalTone = {
  hero: string;
  badge: string;
  shadow: string;
  soft: string;
  accentText: string;
  marker: string;
};

type LegalSection = {
  id: string;
  title: string;
  body?: ReactNode;
  items?: string[];
};

type RelatedLink = {
  href: string;
  label: string;
  description: string;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  icon: ReactNode;
  tone: LegalTone;
  highlights: Array<{ label: string; value: string }>;
  sections: LegalSection[];
  relatedLinks?: RelatedLink[];
};

function LegalText({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[15px] font-medium leading-7 text-slate-700">{children}</p>;
}

export { LegalText };

export default function LegalPage({
  eyebrow,
  title,
  subtitle,
  updatedAt,
  icon,
  tone,
  highlights,
  sections,
  relatedLinks = [],
}: LegalPageProps) {
  return (
    <Layout>
      <section className={`relative overflow-hidden border-b-2 border-slate-900 ${tone.hero} py-12 md:py-16`}>
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="container relative">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <header>
              <p className={`mb-5 inline-flex rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a] ${tone.badge}`}>
                {eyebrow}
              </p>
              <h1 className="font-display max-w-4xl text-4xl font-black leading-tight text-slate-950 md:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-relaxed text-slate-800 md:text-lg">
                {subtitle}
              </p>
            </header>

            <aside className={`rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[7px_7px_0_#0f172a] ${tone.shadow}`}>
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-900 ${tone.badge}`}>
                {icon}
              </div>
              <p className="font-display text-2xl font-black text-slate-950">Leitura institucional</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                Documento público para explicar regras, direitos e limites da plataforma.
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase text-slate-600">
                <CalendarDays className="h-4 w-4" aria-hidden />
                Atualizado em {updatedAt}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#faf8f4] py-10 md:py-14">
        <div className="container">
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {highlights.map((highlight) => (
              <article key={highlight.label} className={`rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a] ${tone.shadow}`}>
                <p className={`text-xs font-black uppercase ${tone.accentText}`}>{highlight.label}</p>
                <p className="mt-2 font-display text-xl font-black leading-snug text-slate-950">{highlight.value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
            <nav className="top-24 rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[5px_5px_0_#0f172a] lg:sticky" aria-label="Seções do documento">
              <p className="mb-4 font-display text-lg font-black text-slate-950">Nesta página</p>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950">
                      <span>{section.title.replace(/^\d+\.\s*/, "")}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <article className="space-y-5">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-[5px_5px_0_#0f172a] md:p-7">
                  <div className="flex items-start gap-4">
                    <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 text-sm font-black text-slate-950 ${tone.marker}`}>
                      {section.title.match(/^\d+/)?.[0] || "•"}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl font-black leading-tight text-slate-950">{section.title}</h2>
                      {section.body}
                      {section.items ? (
                        <ul className="mt-4 space-y-3">
                          {section.items.map((item) => (
                            <li key={item} className="flex gap-3 text-[15px] font-medium leading-7 text-slate-700">
                              <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full border border-slate-900 ${tone.marker}`} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </section>
              ))}

              {relatedLinks.length > 0 ? (
                <aside className={`rounded-3xl border-2 border-slate-900 p-6 shadow-[5px_5px_0_#0f172a] ${tone.soft}`}>
                  <p className="font-display text-2xl font-black text-slate-950">Documentos relacionados</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {relatedLinks.map((item) => (
                      <Link key={item.href} href={item.href} className="rounded-2xl border-2 border-slate-900 bg-white p-4 transition-transform hover:-translate-y-0.5">
                        <span className="font-display block font-black text-slate-950">{item.label}</span>
                        <span className="mt-1 block text-xs font-semibold leading-relaxed text-slate-600">{item.description}</span>
                      </Link>
                    ))}
                  </div>
                </aside>
              ) : null}
            </article>
          </div>
        </div>
      </section>
    </Layout>
  );
}
