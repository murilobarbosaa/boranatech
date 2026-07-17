import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/Layout";
import FavoriteButton from "@/components/FavoriteButton";
import { faculdades } from "@/lib/data";
import { companies } from "@/lib/companyData";
import { salaryRows } from "@/lib/marketData";
import { technologies } from "@/lib/technologyData";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { courseDetails, slugifyCourse } from "@/lib/faculdadeDetails";

const accent = "violet" as const;
const ac = getPageAccentUi(accent);

export default function FaculdadeDetalhe() {
  const params = useParams<{ slug: string }>();
  const course = faculdades.cursos.find(
    (item) => slugifyCourse(item.nome) === params.slug,
  );
  const detail = params.slug ? courseDetails[params.slug] : undefined;

  if (!course) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="mb-4 text-5xl">🎓</p>
          <h1 className="font-display mb-2 text-2xl font-black text-slate-950">
            Curso não encontrado
          </h1>
          <p className="mb-6 text-slate-950">
            Esse curso não existe ou ainda não tem uma página detalhada.
          </p>
          <Link
            href="/faculdades"
            className={cn(
              "inline-flex items-center gap-2 font-bold",
              ac.link,
              ac.linkHover,
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para faculdades
          </Link>
        </div>
      </Layout>
    );
  }

  if (!detail) {
    return (
      <Layout>
        <PageHero
          accent={accent}
          eyebrow={`${course.tipo} · ${course.duracao}`}
          title={course.nome}
          subtitle={course.perfilIndicado}
          topSlot={
            <Link
              href="/faculdades"
              className={cn(
                "inline-flex items-center gap-2 text-sm font-bold",
                ac.link,
                ac.linkHover,
              )}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Todos os cursos superiores
            </Link>
          }
          titlePrefix={
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white text-slate-900 shadow-[4px_4px_0_#0f172a]">
              <GraduationCap className="h-9 w-9" aria-hidden />
            </span>
          }
          actions={
            <FavoriteButton
              item={{
                id: slugifyCourse(course.nome),
                type: "faculdade",
                title: course.nome,
                subtitle: course.tipo,
              }}
            />
          }
        />

        <section className={cn(ac.contentBg, "py-12")}>
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-3">
              <main className="space-y-8 lg:col-span-2">
                <section className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-3 text-xl font-black text-slate-950">
                    O que você estuda nesse curso
                  </h2>
                  <p className="leading-relaxed text-slate-700">
                    {course.oQueEstuda}
                  </p>
                </section>

                <section
                  className={cn(
                    "card-brutal rounded-xl border-2 p-6",
                    ac.panelBorder,
                    ac.panelSoft,
                  )}
                >
                  <h2 className="font-display mb-3 text-xl font-black text-slate-950">
                    Pra quem é
                  </h2>
                  <p className="text-slate-700">{course.perfilIndicado}</p>
                  <h3 className="font-display mb-2 mt-5 text-base font-black text-slate-950">
                    Diferença dos outros cursos
                  </h3>
                  <p className="text-sm font-medium text-slate-600">
                    {course.diferencas}
                  </p>
                </section>

                <section className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                    Onde você pode atuar
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {course.areasAtuacao.map((area) => (
                      <div
                        key={area}
                        className={cn(
                          "rounded-xl border-2 p-4",
                          ac.panelBorder,
                          ac.panelSoft,
                        )}
                      >
                        <Briefcase
                          className={cn("mb-2 h-5 w-5", ac.iconMuted)}
                          aria-hidden
                        />
                        <p className={cn("font-bold", ac.tbodyAccentBold)}>
                          {area}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                    Pontos positivos
                  </h2>
                  <ul className="space-y-2">
                    {course.pontoPositivos.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <CheckCircle
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            ac.iconMuted,
                          )}
                          aria-hidden
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
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
                    Resumo rápido
                  </h3>
                  <div className="space-y-3 text-sm text-slate-900">
                    <div>
                      <p
                        className={cn(
                          "text-xs font-black uppercase",
                          ac.iconMuted,
                        )}
                      >
                        Duração
                      </p>
                      <p className="font-bold">{course.duracao}</p>
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-xs font-black uppercase",
                          ac.iconMuted,
                        )}
                      >
                        Tipo
                      </p>
                      <p className="font-bold">{course.tipo}</p>
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-xs font-black uppercase",
                          ac.iconMuted,
                        )}
                      >
                        Programação
                      </p>
                      <p className="font-bold">{course.programacao}</p>
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-xs font-black uppercase",
                          ac.iconMuted,
                        )}
                      >
                        Matemática
                      </p>
                      <p className="font-bold">{course.matematica}</p>
                    </div>
                  </div>
                </div>

                <div className="card-brutal rounded-xl border-red-200 bg-red-50 p-5">
                  <h3 className="font-display mb-3 font-black text-slate-950">
                    Pontos de atenção
                  </h3>
                  <ul className="space-y-2">
                    {course.pontosAtencao.map((point) => (
                      <li
                        key={point}
                        className="text-sm font-medium text-slate-700"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={cn(
                    "card-brutal rounded-xl border-2 p-5",
                    ac.panelBorder,
                    ac.panelSoft,
                  )}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-white shadow-[2px_2px_0_#0f172a]",
                        ac.tableBanner,
                      )}
                    >
                      <Sparkles className="h-5 w-5 text-white" aria-hidden />
                    </span>
                    <p className="font-display text-sm font-bold text-slate-900">
                      Quer comparar com outros caminhos?
                    </p>
                  </div>
                  <Link
                    href="/comparador"
                    className="btn-brutal-accent block rounded-lg py-2.5 text-center text-sm font-black"
                  >
                    Abrir comparador
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const relatedTechnologies = technologies.filter((technology) =>
    detail.technologies.includes(technology.name),
  );
  const relatedCompanies = companies
    .filter((company) =>
      company.areas.some((area) => detail.areaSlugs.includes(area)),
    )
    .slice(0, 4);
  const relatedSalaries = salaryRows
    .filter((row) => detail.salaryAreas.includes(String(row.area)))
    .slice(0, 5);

  return (
    <Layout>
      <PageHero
        accent={accent}
        eyebrow={`${course.tipo} · ${course.duracao}`}
        title={course.nome}
        subtitle={course.perfilIndicado}
        topSlot={
          <Link
            href="/faculdades"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-bold",
              ac.link,
              ac.linkHover,
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Todos os cursos superiores
          </Link>
        }
        titlePrefix={
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white text-slate-900 shadow-[4px_4px_0_#0f172a]">
            <GraduationCap className="h-9 w-9" aria-hidden />
          </span>
        }
        actions={
          <FavoriteButton
            item={{
              id: slugifyCourse(course.nome),
              type: "faculdade",
              title: course.nome,
              subtitle: course.tipo,
            }}
          />
        }
      />

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            <main className="space-y-8 lg:col-span-2">
              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-3 text-xl font-black text-slate-950">
                  O que é esse curso?
                </h2>
                <p className="leading-relaxed text-slate-700">
                  {detail.summary}
                </p>
              </section>

              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                  Conteúdos que você deve estudar
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {detail.coreContents.map((content) => (
                    <div
                      key={content}
                      className="flex items-start gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700"
                    >
                      <CheckCircle
                        className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)}
                        aria-hidden
                      />
                      {content}
                    </div>
                  ))}
                </div>
              </section>

              <section
                className={cn(
                  "card-brutal rounded-xl border-2 p-6",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <h2 className="font-display mb-3 text-xl font-black text-slate-950">
                  Quem combina com esse curso?
                </h2>
                <p className="text-slate-700">{course.perfilIndicado}</p>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  {detail.marketContext}
                </p>
              </section>

              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                  Opções de carreira depois do curso
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {detail.careerOptions.map((career) => (
                    <div
                      key={career}
                      className={cn(
                        "rounded-xl border-2 p-4",
                        ac.panelBorder,
                        ac.panelSoft,
                      )}
                    >
                      <Briefcase
                        className={cn("mb-2 h-5 w-5", ac.iconMuted)}
                        aria-hidden
                      />
                      <p className={cn("font-bold", ac.tbodyAccentBold)}>
                        {career}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                  Projetos para provar conhecimento
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {detail.practicalProjects.map((project) => (
                    <div
                      key={project}
                      className={cn(
                        "rounded-xl border-2 p-4 text-sm font-bold text-slate-800",
                        ac.panelBorder,
                        ac.panelSoft,
                      )}
                    >
                      {project}
                    </div>
                  ))}
                </div>
                <Link
                  href="/projetos"
                  className={cn(
                    "mt-4 inline-flex items-center gap-1 text-sm font-bold",
                    ac.link,
                    ac.linkHover,
                  )}
                >
                  Ver ideias de projetos <ExternalLink className="h-3 w-3" />
                </Link>
              </section>

              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                  Roadmap inicial
                </h2>
                <div className="space-y-3">
                  {detail.roadmap.map((step, index) => (
                    <div key={step} className="flex gap-3">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-black text-white",
                          ac.tableBanner,
                        )}
                      >
                        {index + 1}
                      </span>
                      <p className="pt-1 text-sm font-medium text-slate-700">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {relatedCompanies.length > 0 && (
                <section className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                    Empresas relacionadas
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {relatedCompanies.map((company) => (
                      <Link
                        key={company.slug}
                        href={`/empresas/${company.slug}`}
                        className={cn(
                          "rounded-xl border-2 border-slate-200 bg-slate-50 p-4 transition-colors",
                          ac.cardHover,
                        )}
                      >
                        <span className="font-display block font-black text-slate-950">
                          {company.name}
                        </span>
                        <span className="text-sm font-medium text-slate-600">
                          {company.segment} · {company.city}
                        </span>
                        <span
                          className={cn(
                            "mt-2 block text-xs font-bold",
                            ac.tbodyAccentBold,
                          )}
                        >
                          Júnior: {company.juniorSalary}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
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
                  Resumo rápido
                </h3>
                <div className="space-y-3 text-sm text-slate-900">
                  <div>
                    <p
                      className={cn(
                        "text-xs font-black uppercase",
                        ac.iconMuted,
                      )}
                    >
                      Duração
                    </p>
                    <p className="font-bold">{course.duracao}</p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-xs font-black uppercase",
                        ac.iconMuted,
                      )}
                    >
                      Tipo
                    </p>
                    <p className="font-bold">{course.tipo}</p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-xs font-black uppercase",
                        ac.iconMuted,
                      )}
                    >
                      Programação
                    </p>
                    <p className="font-bold">{course.programacao}</p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-xs font-black uppercase",
                        ac.iconMuted,
                      )}
                    >
                      Matemática
                    </p>
                    <p className="font-bold">{course.matematica}</p>
                  </div>
                </div>
              </div>

              {relatedSalaries.length > 0 && (
                <div
                  className={cn(
                    "card-brutal rounded-xl border-2 bg-white p-5",
                    ac.panelBorder,
                  )}
                >
                  <h3 className="font-display mb-3 font-black text-slate-950">
                    Salários médios relacionados
                  </h3>
                  <div className="space-y-3">
                    {relatedSalaries.map((row) => (
                      <div
                        key={`${row.area}-${row.level}-${row.city}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <p
                          className={cn(
                            "text-xs font-black uppercase",
                            ac.tbodyAccentBold,
                          )}
                        >
                          {String(row.area)} · {String(row.level)}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          CLT: R$ {Number(row.clt).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs font-medium text-slate-600">
                          PJ: R$ {Number(row.pj).toLocaleString("pt-BR")} ·{" "}
                          {String(row.city)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/salarios"
                    className={cn(
                      "mt-3 inline-flex items-center gap-1 text-xs font-bold",
                      ac.link,
                      ac.linkHover,
                    )}
                  >
                    Ver tabela salarial <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {relatedTechnologies.length > 0 && (
                <div
                  className={cn(
                    "card-brutal rounded-xl border-2 bg-white p-5",
                    ac.panelBorder,
                  )}
                >
                  <h3 className="font-display mb-3 font-black text-slate-950">
                    Tecnologias úteis
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedTechnologies.map((technology) => (
                      <Link
                        key={technology.slug}
                        href={`/tecnologias/${technology.slug}`}
                        className={cn(
                          "rounded-full border-2 px-3 py-1.5 text-xs font-black",
                          ac.panelBorder,
                          ac.panelSoft,
                          ac.tbodyAccentBold,
                        )}
                      >
                        {technology.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-5",
                  ac.panelBorder,
                )}
              >
                <h3 className="font-display mb-3 font-black text-slate-950">
                  Primeiras vagas para mirar
                </h3>
                <ul className="space-y-2">
                  {detail.firstJobs.map((job) => (
                    <li
                      key={job}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <CheckCircle
                        className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)}
                        aria-hidden
                      />
                      {job}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-brutal rounded-xl border-red-200 bg-red-50 p-5">
                <h3 className="font-display mb-3 font-black text-slate-950">
                  Pontos de atenção
                </h3>
                <ul className="space-y-2">
                  {course.pontosAtencao.map((point) => (
                    <li
                      key={point}
                      className="text-sm font-medium text-slate-700"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={cn(
                  "card-brutal rounded-xl border-2 p-5",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-white shadow-[2px_2px_0_#0f172a]",
                      ac.tableBanner,
                    )}
                  >
                    <Sparkles className="h-5 w-5 text-white" aria-hidden />
                  </span>
                  <p className="font-display text-sm font-bold text-slate-900">
                    Quer comparar com outros caminhos?
                  </p>
                </div>
                <Link
                  href="/comparador"
                  className="btn-brutal-accent block rounded-lg py-2.5 text-center text-sm font-black"
                >
                  Abrir comparador
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}
