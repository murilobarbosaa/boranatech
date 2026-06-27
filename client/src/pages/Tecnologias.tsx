import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Search,
  ArrowRight,
  Lightbulb,
  Map,
  Code,
  Terminal,
  Braces,
  Hash,
} from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import FilterPills from "@/components/shared/FilterPills";
import PageHero from "@/components/shared/PageHero";
import TechnologyLogo from "@/components/TechnologyLogo";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import EmbaixadoraBadge from "@/components/shared/EmbaixadoraBadge";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  technologies,
  technologyCategories,
  technologyCategoryLabels,
} from "@/lib/technologyData";
import { technologyCuriosities } from "@/lib/technologyCuriosities";
import { getTechnologies } from "@/services/contentService";

const ac = getPageAccentUi("violet");

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

const ELEVENLABS_EMBAIXADORA_URL: string | undefined = undefined;

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

const DOODLES = [
  { Icon: Code, pos: "left-[4%] top-[18%]", size: "h-10 w-10", color: "#7c3aed", rot: 6, dur: 7 },
  { Icon: Terminal, pos: "left-[14%] top-[68%]", size: "h-8 w-8", color: "#6d28d9", rot: -5, dur: 8 },
  { Icon: Braces, pos: "left-[30%] top-[30%]", size: "h-9 w-9", color: "#8b5cf6", rot: 4, dur: 9 },
  { Icon: Hash, pos: "left-[48%] top-[74%]", size: "h-8 w-8", color: "#7c3aed", rot: -6, dur: 7.5 },
  { Icon: Code, pos: "left-[64%] top-[22%]", size: "h-9 w-9", color: "#6d28d9", rot: 5, dur: 8.5 },
  { Icon: Terminal, pos: "left-[80%] top-[60%]", size: "h-10 w-10", color: "#8b5cf6", rot: -4, dur: 9.5 },
  { Icon: Braces, pos: "left-[90%] top-[28%]", size: "h-8 w-8", color: "#7c3aed", rot: 6, dur: 7 },
  { Icon: Hash, pos: "left-[22%] top-[88%]", size: "h-8 w-8", color: "#6d28d9", rot: -5, dur: 8 },
];

function BackgroundDoodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {DOODLES.map((doodle) => {
        const Icon = doodle.Icon;
        return (
          <motion.span
            key={doodle.pos}
            aria-hidden
            className={cn("absolute", doodle.pos)}
            style={{ color: doodle.color, opacity: 0.1 }}
            animate={{ y: [0, -10, 0], rotate: [0, doodle.rot, 0] }}
            transition={{
              duration: doodle.dur,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon className={doodle.size} strokeWidth={2} />
          </motion.span>
        );
      })}
    </div>
  );
}

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

  const marqueeItems = useMemo(
    () => technologyItems.filter((technology) => technology.logoUrl).slice(0, 28),
    [technologyItems],
  );

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <PageHero
          accent="violet"
          eyebrow="stack e mercado"
          title="Conheça as tecnologias da área"
          subtitle="Linguagens, frameworks, bancos, cloud, ferramentas e mais. Clica em qualquer uma pra ver o que é, pra que serve e por onde começar."
          backgroundSlot={<BackgroundDoodles />}
        />
      </motion.div>

      <section className="relative overflow-hidden bg-[#faf8f4] py-8">
        <BackgroundDoodles />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="bnt-marquee relative z-10"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#faf8f4] to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#faf8f4] to-transparent sm:w-24" />
          <div className="bnt-marquee-track flex w-max items-center gap-8 motion-reduce:animate-none">
            {[...marqueeItems, ...marqueeItems].map((technology, index) => (
              <Link
                key={`${technology.slug}-${index}`}
                href={`/tecnologias/${technology.slug}`}
                aria-label={technology.name}
                className="group shrink-0"
              >
                <TechnologyLogo
                  name={technology.name}
                  icon={technology.icon}
                  logoUrl={technology.logoUrl}
                  className="h-14 w-14 border-0 bg-transparent shadow-none brightness-0 transition-all duration-300 group-hover:scale-110 group-hover:brightness-100"
                  imageClassName="h-9 w-9"
                />
              </Link>
            ))}
          </div>
        </motion.div>
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
            <Link
              href="/tecnologias/jogos"
              className="btn-brutal-primary rounded-full bg-fuchsia-300 px-4 py-2 text-sm font-black"
            >
              🎮 Como os jogos foram feitos
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
                    {technology.name === "ElevenLabs" ? (
                      <EmbaixadoraBadge
                        program="ElevenLabs"
                        href={ELEVENLABS_EMBAIXADORA_URL}
                        className="mb-3 self-start"
                      />
                    ) : null}
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
                      <span className="mt-5 inline-flex items-center gap-2 rounded-full border-[2.5px] border-slate-900 bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[5px_5px_0_#0f172a]">
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
