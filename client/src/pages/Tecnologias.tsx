import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import FilterPills from "@/components/shared/FilterPills";
import PageHero from "@/components/shared/PageHero";
import TechnologyLogo from "@/components/TechnologyLogo";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  technologies,
  technologyCategories,
  technologyCategoryLabels,
} from "@/lib/technologyData";
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
            labels={technologyCategoryLabels}
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
            {filtered.map((technology) => (
              <Link
                key={technology.slug}
                href={`/tecnologias/${technology.slug}`}
                className={cn(
                  "group card-brutal block h-full rounded-2xl bg-white p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-4",
                  ac.cardHover,
                  ac.cardFocusRing,
                )}
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
                      ac.tag,
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
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
