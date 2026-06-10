import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Cloud,
  Cpu,
  Laptop,
  Lightbulb,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/Layout";
import LivrosRecomendados from "@/components/shared/LivrosRecomendados";
import SEO from "@/components/SEO";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { areasTI, livrosFundamentos, livrosPorArea } from "@/lib/data";
import { dicasPraticas } from "@/lib/dicasData";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import {
  notebookByGoal,
  notebookBuyingTips,
  notebookExtras,
  notebookFraming,
  notebookModels,
  notebookModelsAviso,
  notebookParts,
  notebookTiers,
} from "@/lib/notebookGuideData";

const ac = getPageAccentUi("amber");

const areasComLivros = areasTI.filter(
  (area) => (livrosPorArea[area.slug]?.length ?? 0) > 0,
);

const areaFiltros = [
  { key: "todas", label: "Todas" },
  { key: "fundamentos", label: "Fundamentos" },
  ...areasComLivros.map((area) => ({ key: area.slug, label: area.nome })),
];

export default function Dicas() {
  const [tab, setTab] = useState<"dicas" | "livros" | "notebooks">("dicas");
  const [areaFiltro, setAreaFiltro] = useState("todas");

  const mostrarFundamentos =
    areaFiltro === "todas" || areaFiltro === "fundamentos";
  const areasVisiveis =
    areaFiltro === "fundamentos"
      ? []
      : areaFiltro === "todas"
        ? areasComLivros
        : areasComLivros.filter((area) => area.slug === areaFiltro);

  return (
    <Layout>
      <SEO
        title="Dicas de Carreira em TI — Conselhos práticos para sua jornada"
        description="Dicas práticas para estudar tecnologia, evoluir em programação, montar portfólio e se preparar para oportunidades em TI."
        keywords={[
          "dicas carreira ti",
          "como evoluir em ti",
          "dicas programação iniciantes",
          "conselhos tech",
        ]}
        url="/dicas"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-amber-100 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
            <Lightbulb className="h-3.5 w-3.5" />
            dicas e livros
          </p>
          <h1 className="font-display text-4xl font-black text-slate-950">
            Dicas para sair do “não sei por onde começar”.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-950">
            Conselhos práticos por tema para estágio, currículo, entrevistas,
            portfólio e mais, com um catálogo de livros por área e um guia de
            notebook.
          </p>
          <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              "Clareza para decidir",
              "Ideias para praticar",
              "Próximo passo visível",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border-2 border-slate-900 bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-[4px_4px_0_#f59e0b]"
              >
                <Sparkles className="mb-1 h-4 w-4 text-amber-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-40 border-b-2 border-amber-200 bg-amber-50 py-4">
        <div className="container flex flex-wrap gap-2">
          {(
            [
              { key: "dicas", label: "Dicas" },
              { key: "livros", label: "Livros" },
              { key: "notebooks", label: "Notebooks" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-full border-2 px-4 py-1.5 text-xs font-black uppercase ${
                tab === item.key
                  ? "border-slate-900 bg-amber-300 shadow-[2px_2px_0_#0f172a]"
                  : "border-amber-200 bg-white hover:bg-amber-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === "dicas" && (
        <section className="bg-[#fff9e7] py-12">
          <div className="container">
            <Tabs defaultValue="estagio" className="gap-6">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-none bg-transparent p-0">
                {dicasPraticas.map((tema) => (
                  <TabsTrigger
                    key={tema.key}
                    value={tema.key}
                    className="h-auto flex-none rounded-full border-2 border-amber-200 bg-white px-4 py-1.5 text-xs font-black uppercase text-slate-700 transition-all data-[state=active]:border-slate-900 data-[state=active]:bg-amber-300 data-[state=active]:text-slate-950 data-[state=active]:shadow-[2px_2px_0_#0f172a]"
                  >
                    {tema.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {dicasPraticas.map((tema) => (
                <TabsContent key={tema.key} value={tema.key}>
                  <DicaList dicas={tema.dicas} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>
      )}

      {tab === "livros" && (
        <section className="bg-[#fff9e7] py-12">
          <div className="container">
            <div className="mb-8 flex flex-wrap gap-2">
              {areaFiltros.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setAreaFiltro(item.key)}
                  className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold ${
                    areaFiltro === item.key
                      ? "border-slate-900 bg-amber-300 shadow-[2px_2px_0_#0f172a]"
                      : "border-amber-200 bg-white hover:bg-amber-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="space-y-8">
              {mostrarFundamentos ? (
                <LivrosRecomendados
                  titulo="Fundamentos"
                  livros={livrosFundamentos}
                  ac={ac}
                />
              ) : null}
              {areasVisiveis.map((area) => (
                <LivrosRecomendados
                  key={area.slug}
                  titulo={area.nome}
                  livros={livrosPorArea[area.slug]}
                  ac={ac}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "notebooks" && (
        <section className="bg-[#fff9e7] py-12">
          <div className="container space-y-10">
            <div className="card-brutal rounded-2xl border-amber-200 bg-amber-100 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Laptop className="h-6 w-6 text-amber-700" />
                <h2 className="font-display text-2xl font-black text-slate-950">
                  Você não precisa de máquina cara para começar
                </h2>
              </div>
              <ul className="space-y-2 text-sm font-bold text-slate-800">
                {notebookFraming.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-5 flex items-center gap-2">
                <Cpu className="h-6 w-6 text-amber-700" />
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Como funciona, o que importa
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {notebookParts.map((part) => (
                  <div
                    key={part.peca}
                    className="card-brutal rounded-2xl bg-white p-5"
                  >
                    <h3 className="font-display text-lg font-black text-slate-950">
                      {part.peca}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {part.oQueFaz}
                    </p>
                    <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                      {part.quantoBasta}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-5">
                <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                  pelo seu objetivo
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Quanto de cada coisa por tipo de uso
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {notebookByGoal.map((item) => (
                  <div
                    key={item.objetivo}
                    className="card-brutal rounded-2xl bg-white p-5"
                  >
                    <h3 className="font-display text-lg font-black text-slate-950">
                      {item.objetivo}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border-2 border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">
                        RAM: {item.ram}
                      </span>
                      <span className="rounded-full border-2 border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">
                        SSD: {item.ssd}
                      </span>
                      <span className="rounded-full border-2 border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">
                        GPU: {item.gpu}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-5">
                <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                  faixas de máquina
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Quando comprar cada tipo
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {notebookTiers.map((tier) => (
                  <div
                    key={tier.faixa}
                    className="card-brutal flex flex-col rounded-2xl bg-white p-5"
                  >
                    <span className="inline-flex w-fit rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a]">
                      {tier.faixa}
                    </span>
                    <p className="mt-3 text-sm font-bold text-slate-800">
                      {tier.entrega}
                    </p>
                    <p className="mt-2 flex-1 text-sm text-slate-600">
                      {tier.praQuem}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {notebookExtras.map((extra) => (
                  <div
                    key={extra.titulo}
                    className="card-brutal rounded-2xl bg-white p-5"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-amber-700" />
                      <h3 className="font-display text-lg font-black text-slate-950">
                        {extra.titulo}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600">{extra.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-5 flex items-center gap-2">
                <Laptop className="h-6 w-6 text-amber-700" />
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Modelos para começar a olhar
                </h2>
              </div>
              <p className="mb-5 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                {notebookModelsAviso}
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                {notebookModels.map((model) => (
                  <div
                    key={model.faixa}
                    className="card-brutal rounded-2xl bg-white p-5"
                  >
                    <span className="inline-flex w-fit rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a]">
                      {model.faixa}
                    </span>
                    <p className="mt-3 text-sm text-slate-600">
                      {model.paraQuem}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {model.linhas.map((linha) => (
                        <span
                          key={linha}
                          className="rounded-full border-2 border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800"
                        >
                          {linha}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                      O que procurar: {model.oQueProcurar}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-5 flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-amber-700" />
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Dicas de compra
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notebookBuyingTips.map((tip) => (
                  <div
                    key={tip.titulo}
                    className="card-invite rounded-2xl border-amber-200 bg-white p-5 shadow-[5px_5px_0_#fbbf24]"
                  >
                    <h3 className="font-display text-lg font-black text-slate-950">
                      {tip.titulo}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

function DicaList({ dicas }: { dicas: string[] }) {
  const reduce = useReducedMotion();
  const container = reduce
    ? {}
    : {
        initial: "hidden",
        animate: "show",
        variants: {
          hidden: {},
          show: { transition: { staggerChildren: 0.05 } },
        },
      };
  const item = reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0 },
        },
      };

  return (
    <motion.ul {...container} className="grid gap-4 md:grid-cols-2">
      {dicas.map((dica) => (
        <motion.li
          {...item}
          key={dica}
          className="card-invite flex gap-3 rounded-2xl border-amber-200 bg-white p-5 shadow-[5px_5px_0_#fbbf24]"
        >
          <Lightbulb
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden
          />
          <span className="text-sm font-semibold text-slate-800">{dica}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
