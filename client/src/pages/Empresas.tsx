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
  type Company,
} from "@/lib/companyData";
import { technologies } from "@/lib/technologyData";

const ac = getPageAccentUi("blue");

// Logos reais de tecnologia que o site ja tem, indexados por slug. Usados nas
// tags de tecnologia de cada empresa (quando o dado for preenchido pela Ana).
const TECH_BY_SLUG = new Map(technologies.map((tech) => [tech.slug, tech]));

type SegmentAccent = {
  bar: string;
  chip: string;
  logoBg: string;
  shadow: string;
};

// Cor de acento por segmento, pra dar vida e ritmo (cada tipo de empresa ganha
// sua cor, como nos cards de area). Cai no DEFAULT_ACCENT se o segmento nao
// estiver mapeado.
const SEGMENT_ACCENT: Record<string, SegmentAccent> = {
  Fintech: {
    bar: "bg-emerald-400",
    chip: "border-emerald-300 bg-emerald-100 text-emerald-800",
    logoBg: "bg-emerald-100",
    shadow: "shadow-[4px_4px_0_#6ee7b7] motion-safe:hover:shadow-[6px_6px_0_#6ee7b7]",
  },
  "E-commerce": {
    bar: "bg-amber-400",
    chip: "border-amber-300 bg-amber-100 text-amber-800",
    logoBg: "bg-amber-100",
    shadow: "shadow-[4px_4px_0_#fcd34d] motion-safe:hover:shadow-[6px_6px_0_#fcd34d]",
  },
  SaaS: {
    bar: "bg-violet-400",
    chip: "border-violet-300 bg-violet-100 text-violet-800",
    logoBg: "bg-violet-100",
    shadow: "shadow-[4px_4px_0_#c4b5fd] motion-safe:hover:shadow-[6px_6px_0_#c4b5fd]",
  },
  Consultoria: {
    bar: "bg-sky-400",
    chip: "border-sky-300 bg-sky-100 text-sky-800",
    logoBg: "bg-sky-100",
    shadow: "shadow-[4px_4px_0_#7dd3fc] motion-safe:hover:shadow-[6px_6px_0_#7dd3fc]",
  },
  Banco: {
    bar: "bg-rose-400",
    chip: "border-rose-300 bg-rose-100 text-rose-800",
    logoBg: "bg-rose-100",
    shadow: "shadow-[4px_4px_0_#fda4af] motion-safe:hover:shadow-[6px_6px_0_#fda4af]",
  },
  Startup: {
    bar: "bg-fuchsia-400",
    chip: "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800",
    logoBg: "bg-fuchsia-100",
    shadow: "shadow-[4px_4px_0_#f0abfc] motion-safe:hover:shadow-[6px_6px_0_#f0abfc]",
  },
  "Big Tech": {
    bar: "bg-blue-400",
    chip: "border-blue-300 bg-blue-100 text-blue-800",
    logoBg: "bg-blue-100",
    shadow: "shadow-[4px_4px_0_#93c5fd] motion-safe:hover:shadow-[6px_6px_0_#93c5fd]",
  },
};

const DEFAULT_ACCENT: SegmentAccent = {
  bar: "bg-slate-400",
  chip: "border-slate-300 bg-slate-100 text-slate-700",
  logoBg: "bg-slate-100",
  shadow: "shadow-[4px_4px_0_#cbd5e1] motion-safe:hover:shadow-[6px_6px_0_#cbd5e1]",
};

const JUNIOR_LEVELS = ["Estágio", "Trainee", "Júnior"];

function CompanyLogo({
  company,
  accent,
}: {
  company: Company;
  accent: SegmentAccent;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-900 shadow-[3px_3px_0_#0f172a]",
        accent.logoBg,
      )}
    >
      {failed || !company.logoUrl ? (
        <span className="font-display text-2xl font-black text-slate-900">
          {company.name.charAt(0)}
        </span>
      ) : (
        <img
          src={company.logoUrl}
          alt={`Logo ${company.name}`}
          className="h-9 w-9 object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

// Tag de tecnologia: reusa o logo real da tecnologia (quando existe) + o nome.
// So renderizada quando a empresa tem o dado preenchido.
function TechTag({ slug }: { slug: string }) {
  const tech = TECH_BY_SLUG.get(slug);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-[2px_2px_0_#0f172a]">
      {tech?.logoUrl ? (
        <img
          src={tech.logoUrl}
          alt=""
          aria-hidden="true"
          className="h-4 w-4 object-contain"
          loading="lazy"
        />
      ) : null}
      {tech?.name ?? slug}
    </span>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const accent = SEGMENT_ACCENT[company.segment] ?? DEFAULT_ACCENT;
  return (
    <Link
      href={`/empresas/${company.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border-2 border-slate-900 bg-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1",
        accent.shadow,
      )}
    >
      <div className={cn("h-2 w-full", accent.bar)} aria-hidden="true" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <CompanyLogo company={company} accent={accent} />
          <div className="min-w-0">
            <h2 className="font-display text-xl font-black leading-tight text-slate-950">
              {company.name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-black uppercase tracking-wide",
                  accent.chip,
                )}
              >
                {company.segment}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {company.city}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {company.hiringLevels.map((item) => (
            <span
              key={item}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-black",
                JUNIOR_LEVELS.includes(item)
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600",
              )}
            >
              {item}
            </span>
          ))}
        </div>

        {company.technologies.length > 0 ? (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-slate-400">
              Tecnologias
            </p>
            <div className="flex flex-wrap gap-1.5">
              {company.technologies.slice(0, 6).map((slug) => (
                <TechTag key={slug} slug={slug} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto pt-4">
          <p className="text-sm font-bold text-slate-700">
            Júnior: <span className="text-slate-900">{company.juniorSalary}</span>
          </p>
          <span
            className={cn(
              "mt-3 inline-flex items-center gap-2 text-sm font-black",
              ac.link,
            )}
          >
            Ver detalhes
            <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

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
        title="Empresas no Brasil"
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
                    className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-[2px_2px_0_#0f172a] transition-all motion-safe:hover:-translate-y-0.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Limpar
                  </button>
                )}
                <Link
                  href="/empresas/ranking-junior"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-blue-700 px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-all motion-safe:hover:-translate-y-0.5"
                >
                  <Trophy className="h-4 w-4" />
                  Ranking carreira inicial
                </Link>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-slate-500">
              Mostrando {filtered.length}{" "}
              {filtered.length === 1 ? "empresa" : "empresas"} com os filtros
              selecionados.
            </p>
          </div>
        </div>
      </section>
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          {filtered.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-display text-lg font-black text-slate-950">
                Nenhuma empresa nesse recorte
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Tente ampliar o segmento, a cidade ou o nível.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((company) => (
                <CompanyCard key={company.slug} company={company} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
