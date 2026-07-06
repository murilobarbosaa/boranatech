import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, RotateCcw, Trophy } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  companies,
  companyCities,
  companyHiringLevels,
  companySegments,
} from "@/lib/companyData";

const ac = getPageAccentUi("blue");

export default function Empresas() {
  const [segment, setSegment] = useState("Todas");
  const [city, setCity] = useState("Todas");
  const [level, setLevel] = useState("Todas");
  const filtered = useMemo(
    () =>
      companies.filter((company) => {
        return (
          (segment === "Todas" || company.segment === segment) &&
          (city === "Todas" || company.city === city) &&
          (level === "Todas" || company.hiringLevels.includes(level))
        );
      }),
    [city, level, segment],
  );

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Empresas tech no Brasil · Onde trabalhar em TI"
        description="Conheça empresas de tecnologia que contratam no Brasil: o que cada uma faz, quais tecnologias usa e que perfis costuma contratar. Guia para iniciantes."
        url="/empresas"
        schemaType="CollectionPage"
      />
      <PageHero
        accent="blue"
        eyebrow="mercado brasileiro"
        title="Empresas Tech no Brasil"
        subtitle="Conheça as empresas, o que usam e quem elas contratam."
      />
      <section className="sticky top-16 z-40 border-b-2 border-blue-200 bg-blue-50/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-blue-50/90">
        <div className="container">
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#93c5fd]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid flex-1 gap-3 md:grid-cols-3">
                <label className="text-xs font-black uppercase text-slate-500">
                  Segmento
                  <select
                    className="mt-1 w-full rounded-lg border-2 border-blue-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={segment}
                    onChange={(event) => setSegment(event.target.value)}
                  >
                    {companySegments.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-black uppercase text-slate-500">
                  Cidade
                  <select
                    className="mt-1 w-full rounded-lg border-2 border-blue-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  >
                    {companyCities.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-black uppercase text-slate-500">
                  Nível
                  <select
                    className="mt-1 w-full rounded-lg border-2 border-blue-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={level}
                    onChange={(event) => setLevel(event.target.value)}
                  >
                    {companyHiringLevels.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {(segment !== "Todas" ||
                  city !== "Todas" ||
                  level !== "Todas") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSegment("Todas");
                      setCity("Todas");
                      setLevel("Todas");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-0.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Limpar
                  </button>
                )}
                <Link
                  href="/empresas/ranking-junior"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-blue-700 px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5"
                >
                  <Trophy className="h-4 w-4" />
                  Ranking carreira inicial
                </Link>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-slate-500">
              Mostrando {filtered.length} empresas com os filtros selecionados.
            </p>
          </div>
        </div>
      </section>
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((company) => (
              <Link
                key={company.slug}
                href={`/empresas/${company.slug}`}
                className="card-brutal group flex flex-col rounded-2xl bg-white p-5 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1"
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-white p-2 shadow-[3px_3px_0_#0f172a]">
                    <img
                      src={company.logoUrl}
                      alt={`Logo ${company.name}`}
                      className="h-8 w-8 object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-black">
                      {company.name}
                    </h2>
                    <p className="text-sm font-bold text-slate-500">
                      {company.segment} • {company.city}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {company.hiringLevels.map((item) => (
                    <span
                      key={item}
                      className={`rounded-full px-2 py-1 text-xs font-black ${["Estágio", "Trainee", "Júnior"].includes(item) ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {company.technologies.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-bold",
                        ac.panelSoft,
                        ac.tbodyAccent,
                      )}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700">
                  Júnior: {company.juniorSalary}
                </p>
                <span
                  className={cn(
                    "mt-4 inline-flex items-center gap-2 text-sm font-black",
                    ac.link,
                  )}
                >
                  Ver detalhes{" "}
                  <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
