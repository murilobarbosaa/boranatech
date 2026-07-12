import { Link, useParams } from "wouter";
import { ArrowLeft, Briefcase, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import DifficultyMeter from "@/components/shared/DifficultyMeter";
import PageHero from "@/components/shared/PageHero";
import { companies } from "@/lib/companyData";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const accent = "blue" as const;
const ac = getPageAccentUi(accent);

export default function EmpresaDetalhe() {
  const params = useParams<{ slug: string }>();
  const company = companies.find((item) => item.slug === params.slug);

  if (!company) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-3xl font-black text-slate-950">
            Empresa não encontrada
          </h1>
          <Link
            href="/empresas"
            className={cn(
              "mt-4 inline-flex items-center gap-2 font-bold",
              ac.link,
              ac.linkHover,
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero
        accent={accent}
        eyebrow="empresa tech · mercado BR"
        title={company.name}
        subtitle={`${company.segment} · ${company.city}`}
        topSlot={
          <Link
            href="/empresas"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-bold",
              ac.link,
              ac.linkHover,
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Empresas
          </Link>
        }
        titlePrefix={
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white p-3 shadow-[4px_4px_0_#0f172a]">
            <img
              src={company.logoUrl}
              alt=""
              className="h-10 w-10 object-contain"
            />
          </div>
        }
      />

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            <main className="space-y-8 lg:col-span-2">
              <section
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-6",
                  ac.panelBorder,
                )}
              >
                <h2 className="font-display text-xl font-black text-slate-950">
                  O que a empresa faz
                </h2>
                <p className="mt-3 text-slate-700">{company.description}</p>
              </section>
              {company.technologies.length > 0 ? (
                <section
                  className={cn(
                    "card-brutal rounded-xl border-2 bg-white p-6",
                    ac.panelBorder,
                  )}
                >
                  <h2 className="font-display text-xl font-black text-slate-950">
                    Stack tecnológico
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {company.technologies.map((tech) => (
                      <Link
                        key={tech}
                        href={`/tecnologias/${tech}`}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-black",
                          ac.tag,
                        )}
                      >
                        {tech}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
              <section className="grid gap-5 md:grid-cols-2">
                <div
                  className={cn(
                    "card-brutal rounded-xl border-2 bg-white p-6",
                    ac.panelBorder,
                  )}
                >
                  <h2 className="font-display text-xl font-black text-slate-950">
                    Cultura e ambiente
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {company.culture.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="card-brutal rounded-xl border-2 border-amber-300 bg-amber-50 p-6">
                  <h2 className="font-display text-xl font-black text-slate-950">
                    Benefícios comuns
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {company.benefits.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </section>
              <section
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-6",
                  ac.panelBorder,
                )}
              >
                <h2 className="font-display text-xl font-black text-slate-950">
                  Faixa salarial por nível
                </h2>
                <table className="mt-4 w-full text-sm">
                  <tbody>
                    {company.salaryByLevel.map((row) => (
                      <tr key={row.level} className="border-b border-slate-200">
                        <td className="py-2 font-black">{row.level}</td>
                        <td className="py-2">{row.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-6",
                  ac.panelBorder,
                )}
              >
                <h2 className="font-display text-xl font-black text-slate-950">
                  Como é o processo seletivo
                </h2>
                <ol className="mt-4 space-y-2 text-sm text-slate-700">
                  {company.hiringProcess.map((step, index) => (
                    <li key={step}>
                      <strong>{index + 1}.</strong> {step}
                    </li>
                  ))}
                </ol>
              </section>
            </main>

            <aside className="space-y-5">
              <div
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-6",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <h3
                  className={cn(
                    "font-display mb-4 text-lg font-black",
                    ac.tbodyAccentBold,
                  )}
                >
                  Resumo
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.hiringLevels.map((item) => (
                    <span
                      key={item}
                      className={cn(
                        "rounded-full border-2 px-3 py-1 text-xs font-black",
                        ac.tag,
                      )}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5">
                  <DifficultyMeter
                    value={company.difficulty}
                    label="Dificuldade de entrar"
                  />
                </div>
              </div>
              <div
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-5",
                  ac.panelBorder,
                )}
              >
                <h3 className="font-display font-black text-slate-950">
                  Vagas abertas agora
                </h3>
                <div className="mt-3 space-y-3">
                  {company.openJobs.map((job) => (
                    <div
                      key={job.title}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                    >
                      <p className="font-black">{job.title}</p>
                      <p className="text-slate-600">
                        {job.area} • {job.location} • {job.level}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <a
                href={company.careerUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-brutal-accent flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black"
              >
                <Briefcase className="h-4 w-4" aria-hidden />
                Página de carreiras{" "}
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}
