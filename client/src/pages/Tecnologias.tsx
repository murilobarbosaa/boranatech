import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, ArrowRight, Lightbulb, Map } from "lucide-react";
import Layout from "@/components/Layout";
import FilterPills from "@/components/shared/FilterPills";
import PageHero from "@/components/shared/PageHero";
import TechnologyLogo from "@/components/TechnologyLogo";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  technologies,
  technologyCategories,
  technologyCategoryLabels,
  technologyRanking,
} from "@/lib/technologyData";
import { technologyCuriosities } from "@/lib/technologyCuriosities";
import { getTechnologies } from "@/services/contentService";

const ac = getPageAccentUi("violet");

const GENERAL_SUBTITLE =
  "Tecnologia é toda ferramenta que ajuda a construir software: linguagens (o idioma em que você escreve o código), frameworks (kits prontos que aceleram o trabalho) e ferramentas de apoio. Aqui você vê o que cada uma faz, onde é usada e quanto custa começar.";

const CATEGORY_SUBTITLES: Record<string, string> = {
  Linguagens:
    "O idioma em que o código é escrito. Cada linguagem tem seu jeito e suas forças: algumas são ótimas pra web, outras pra dados, apps ou jogos.",
  Frameworks:
    "Kits prontos que poupam trabalho. Em vez de começar do zero, você usa uma base já estruturada pra construir mais rápido e com menos erro.",
  "Banco de Dados":
    "Onde a informação fica guardada e organizada. É o que permite um sistema lembrar cadastros, pedidos, mensagens e tudo que precisa ser salvo.",
  Ferramentas:
    "Programas de apoio do dia a dia: versionar código, desenhar telas, criar gráficos, testar e organizar as tarefas do time.",
  Cloud:
    "Servidores de empresas como Amazon, Google e Microsoft que você aluga pela internet, sem precisar manter máquinas próprias.",
  DevOps:
    "Práticas e ferramentas pra colocar software no ar de forma automática, confiável e monitorada, do código até o usuário final.",
  "Dados e IA":
    "Bibliotecas e plataformas para analisar dados, treinar modelos e construir soluções de inteligência artificial.",
  Segurança:
    "Ferramentas para testar, proteger e investigar sistemas, redes e aplicações.",
  Testes:
    "Ferramentas para testar software de forma automática e garantir qualidade antes de ir pro ar.",
  Design:
    "Ferramentas para desenhar telas, protótipos e interfaces antes de virar código.",
  Gestão:
    "Ferramentas para organizar tarefas, documentar e tocar projetos com o time.",
};

const CATEGORY_TAG: Record<string, string> = {
  Linguagens: "bg-violet-600 text-white",
  Frameworks: "bg-blue-600 text-white",
  "Banco de Dados": "bg-emerald-700 text-white",
  Ferramentas: "bg-slate-700 text-white",
  Cloud: "bg-sky-600 text-white",
  DevOps: "bg-orange-600 text-white",
  "Dados e IA": "bg-fuchsia-700 text-white",
  Segurança: "bg-rose-700 text-white",
  Testes: "bg-teal-700 text-white",
  Design: "bg-pink-600 text-white",
  Gestão: "bg-amber-500 text-slate-950",
};

const MARQUEE_TEXT = [
  "text-violet-700",
  "text-blue-700",
  "text-emerald-700",
  "text-rose-700",
  "text-fuchsia-700",
  "text-cyan-700",
  "text-orange-700",
  "text-indigo-700",
];

const ROADMAP_AREA_SLUGS = new Set([
  "backend",
  "carreira",
  "ciberseguranca",
  "cloud",
  "dados",
  "devops",
  "frontend",
  "fullstack",
  "gestao",
  "ia",
  "mobile",
  "produto",
  "qa",
  "uxui",
]);

function roadmapHref(areas: string[]): string {
  const match = areas.find((area) => ROADMAP_AREA_SLUGS.has(area));
  return match ? `/roadmaps?area=${match}` : "/roadmaps";
}

const marqueeItems = technologyRanking.slice(0, 24);

export default function Tecnologias() {
  const [technologyItems, setTechnologyItems] = useState(technologies);
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");

  useEffect(() => {
    getTechnologies()
      .then(setTechnologyItems)
      .catch(() => setTechnologyItems(technologies));
  }, []);

  const filtered = useMemo(
    () =>
      technologyItems.filter((technology) => {
        const matchesCategory =
          category === "Todas" || technology.category === category;
        const matchesQuery = technology.name
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [category, query, technologyItems],
  );

  return (
    <Layout>
      <PageHero
        accent="violet"
        eyebrow="stack e mercado"
        title="Tecnologias e Linguagens"
        subtitle={
          <span key={category} className="animate-fade-slide-up inline-block">
            {CATEGORY_SUBTITLES[category] ?? GENERAL_SUBTITLE}
          </span>
        }
      />

      <section
        aria-hidden
        className="relative overflow-hidden border-b-2 border-slate-900 bg-violet-50 py-4"
      >
        <div className="flex w-max animate-marquee-left gap-3 motion-reduce:animate-none">
          {[...marqueeItems, ...marqueeItems].map((technology, index) => (
            <span
              key={`${technology.slug}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 shadow-[3px_3px_0_#0f172a]"
            >
              <TechnologyLogo
                name={technology.name}
                icon={technology.icon}
                logoUrl={technology.logoUrl}
                className="h-6 w-6"
              />
              <span
                className={cn(
                  "font-display text-sm font-black",
                  MARQUEE_TEXT[index % MARQUEE_TEXT.length],
                )}
              >
                {technology.name}
              </span>
            </span>
          ))}
        </div>
      </section>

      <section
        className={cn(
          "sticky top-16 z-40 border-b-2 py-4 backdrop-blur",
          ac.stickyBar,
        )}
      >
        <div className="container space-y-4">
          <FilterPills
            accent="violet"
            options={technologyCategories}
            value={category}
            onChange={setCategory}
            labels={{ ...technologyCategoryLabels, Todas: "Todas as categorias" }}
          />
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className={cn(
                "w-full rounded-lg border-2 bg-white py-3 pl-10 pr-4 text-sm font-bold outline-none",
                ac.input,
              )}
              placeholder="Buscar tecnologia pelo nome"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              href="/tecnologias/comparar?from=tecnologias"
              className="btn-brutal-primary rounded-full bg-white px-4 py-2 text-sm font-black"
            >
              Comparar tecnologias
            </Link>
            <Link
              href="/tecnologias/por-area?from=tecnologias"
              className="btn-brutal-primary rounded-full bg-white px-4 py-2 text-sm font-black"
            >
              Tecnologias por área
            </Link>
            <Link
              href="/tecnologias/ranking?from=tecnologias"
              className="btn-brutal-primary rounded-full bg-white px-4 py-2 text-sm font-black"
            >
              Ranking de demanda
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((technology, index) => {
              const curiosity = technologyCuriosities[technology.name];
              return (
                <AnimatedContent
                  key={technology.slug}
                  distance={14}
                  duration={0.4}
                  delay={Math.min(index * 0.03, 0.3)}
                  className="h-full"
                >
                  <div className="card-brutal flex h-full flex-col rounded-2xl bg-white p-5 text-left">
                    <Link
                      href={`/tecnologias/${technology.slug}`}
                      className="group block flex-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <TechnologyLogo
                          name={technology.name}
                          icon={technology.icon}
                          logoUrl={technology.logoUrl}
                          className={cn("h-12 w-12", ac.logoTint)}
                        />
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-black",
                            CATEGORY_TAG[technology.category] ?? ac.tag,
                          )}
                        >
                          {technologyCategoryLabels[technology.category] ??
                            technology.category}
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-black text-slate-950">
                        {technology.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {technology.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          {technology.difficulty}
                        </span>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                          {technology.games?.length
                            ? "Empresas e jogos"
                            : "Empresas/produtos que usam"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[
                            ...technology.companies.slice(0, 2),
                            ...(technology.games || []).slice(0, 1),
                          ].map((example) => (
                            <span
                              key={example}
                              className={cn(
                                "rounded-full px-2 py-1 text-xs font-bold",
                                ac.tag,
                              )}
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "mt-5 inline-flex items-center gap-2 text-sm font-black group-hover:underline",
                          ac.link,
                        )}
                      >
                        Ver detalhes{" "}
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </span>
                    </Link>

                    {curiosity ? (
                      <div className="mt-4 flex gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 p-3">
                        <Lightbulb
                          className="h-4 w-4 shrink-0 text-amber-600"
                          aria-hidden
                        />
                        <div>
                          <p className="text-[0.7rem] font-black uppercase tracking-wide text-amber-700">
                            Curiosidade
                          </p>
                          <p className="mt-0.5 text-sm text-slate-700">
                            {curiosity.curiosity}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <Link
                      href={roadmapHref(technology.areas)}
                      className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-slate-900 bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5"
                    >
                      <Map className="h-4 w-4" aria-hidden />
                      Ver roadmap
                    </Link>
                  </div>
                </AnimatedContent>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
