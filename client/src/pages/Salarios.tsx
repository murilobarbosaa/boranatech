import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ExternalLink, X } from "lucide-react";
import Layout from "@/components/Layout";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import PageHero from "@/components/shared/PageHero";
import CountUp from "@/components/reactbits/CountUp";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  cities,
  levels,
  marketMonitor,
  salaryRows,
  workTypes,
} from "@/lib/marketData";

const ac = getPageAccentUi("amber");

const ABAS = [
  "Tabela salarial",
  "Calculadoras",
  "Mercado",
  "Entender salário",
];

const salarioGlossario = [
  {
    termo: "CLT",
    definicao:
      "Carteira assinada: tem férias, 13º, FGTS e benefícios, com descontos de INSS e IR no salário.",
  },
  {
    termo: "PJ",
    definicao:
      "Você emite nota como empresa. O bruto costuma ser maior, mas você banca impostos, férias e 13º por conta.",
  },
  {
    termo: "Bruto vs líquido",
    definicao:
      "Bruto é o valor cheio; líquido é o que cai na conta depois dos descontos (INSS, IR).",
  },
  {
    termo: "PLR",
    definicao:
      "Participação nos lucros e resultados: um valor extra anual ligado às metas da empresa.",
  },
  {
    termo: "VR e VA",
    definicao:
      "Vale-refeição e vale-alimentação, benefícios pra comida no dia a dia.",
  },
  {
    termo: "Bônus",
    definicao: "Pagamento variável por desempenho, fora do salário fixo.",
  },
  {
    termo: "Stock options e RSU",
    definicao:
      "Participação em ações da empresa, comum em startups e big techs.",
  },
  {
    termo: "FGTS",
    definicao:
      "Depósito mensal que o empregador faz numa conta do trabalhador, no regime CLT.",
  },
  {
    termo: "13º salário",
    definicao:
      "Um salário extra por ano, pago em duas parcelas, no regime CLT.",
  },
  {
    termo: "Dissídio",
    definicao: "Reajuste salarial negociado pelo sindicato da categoria.",
  },
];

const salarioCltPj = {
  clt: {
    titulo: "CLT",
    pros: [
      "Férias remuneradas, 13º e FGTS",
      "Benefícios (VR, VA, plano de saúde)",
      "Mais estabilidade",
    ],
    contras: ["Líquido menor que o PJ equivalente", "Menos flexibilidade"],
  },
  pj: {
    titulo: "PJ",
    pros: ["Bruto maior", "Mais flexibilidade"],
    contras: [
      "Sem benefícios automáticos",
      "Você provisiona férias e 13º e paga impostos",
      "Menos estabilidade",
    ],
  },
};

const salarioDicasNegociacao = [
  "Pesquise a faixa da sua área, nível e região antes de falar número.",
  "Negocie o pacote todo, não só o salário base: benefícios, PLR, remoto, equipamento.",
  "Tenha um número-âncora baseado em dado, não em achismo.",
  "Olhe o líquido e os benefícios, não só o bruto.",
  "Inglês, certificações e portfólio te movem pra cima dentro da faixa.",
];

const salarioFontes = [
  {
    nome: "Glassdoor",
    desc: "Faixas e avaliações reportadas por funcionários.",
    url: "https://www.glassdoor.com.br/",
  },
  {
    nome: "Levels.fyi",
    desc: "Remuneração de big techs, foco internacional.",
    url: "https://www.levels.fyi/",
  },
  {
    nome: "Robert Half",
    desc: "Guia salarial anual de tecnologia.",
    url: "https://www.roberthalf.com.br/guia-salarial",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

export default function Salarios() {
  const [aba, setAba] = useState("Tabela salarial");
  const [area, setArea] = useState("Todas");
  const [level, setLevel] = useState("Todos");
  const [city, setCity] = useState("Todas");
  const [type, setType] = useState("Todos");
  const [pj, setPj] = useState(9000);
  const [negotiationArea, setNegotiationArea] = useState("Front-end");
  const [experience, setExperience] = useState(1);

  const areas = [
    "Todas",
    ...Array.from(new Set(salaryRows.map((row) => String(row.area)))),
  ];
  const filtered = useMemo(
    () =>
      salaryRows.filter(
        (row) =>
          (area === "Todas" || row.area === area) &&
          (level === "Todos" || row.level === level) &&
          (city === "Todas" || row.city === city),
      ),
    [area, city, level],
  );
  const cltEquivalent = Math.round(pj * 0.68);
  const askMin = 3200 + experience * 900;
  const askMax = askMin + 1800;

  return (
    <Layout>
      <PageHero
        accent="amber"
        eyebrow="referência de mercado"
        title="Salários em TI"
        subtitle="Quanto você pode ganhar em cada área, nível e cidade."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-8">
          <div className="flex flex-wrap gap-2">
            {ABAS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={aba === item}
                onClick={() => setAba(item)}
                className={cn(
                  "rounded-full border-2 px-4 py-2 text-sm font-black transition-all",
                  aba === item
                    ? "border-slate-900 bg-amber-400 text-slate-950 shadow-[2px_2px_0_#0f172a]"
                    : "border-slate-300 bg-white text-slate-700 hover:border-amber-400",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <motion.div key={aba} {...fadeUp} className="space-y-8">
            {aba === "Tabela salarial" ? (
              <div className="card-brutal rounded-2xl bg-white p-6">
                <h2 className="font-display text-2xl font-black">
                  Tabela salarial interativa
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  {[
                    ["Área", area, setArea, areas],
                    ["Nível", level, setLevel, levels],
                    ["Cidade", city, setCity, cities],
                    ["Tipo", type, setType, workTypes],
                  ].map(([label, value, setter, options]) => (
                    <label key={String(label)} className="text-sm font-black">
                      {String(label)}
                      <select
                        className={cn(
                          "mt-1 w-full rounded-xl border-2 bg-white p-3",
                          ac.input,
                        )}
                        value={String(value)}
                        onChange={(event) =>
                          (setter as (v: string) => void)(event.target.value)
                        }
                      >
                        {(options as string[]).map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className={cn(ac.tableBanner)}>
                      <tr>
                        <th className="p-3 text-left">Área</th>
                        <th className="p-3 text-left">Nível</th>
                        <th className="p-3 text-left">Cidade</th>
                        <th className="p-3 text-left">CLT Médio</th>
                        <th className="p-3 text-left">PJ Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr className="border-t">
                          <td
                            colSpan={5}
                            className="p-6 text-center text-sm font-bold text-slate-500"
                          >
                            Nenhum dado salarial para esse recorte. Tente
                            ampliar a área, o nível ou a cidade.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((row) => (
                          <tr
                            key={`${row.area}-${row.level}-${row.city}`}
                            className="border-t"
                          >
                            <td className="p-3">{row.area}</td>
                            <td className="p-3">{row.level}</td>
                            <td className="p-3">{row.city}</td>
                            <td className="p-3">
                              {Number(row.clt).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                            <td className="p-3">
                              {Number(row.pj).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {type !== "Todos" && (
                  <p className="mt-3 text-xs font-bold text-slate-500">
                    Filtro de tipo selecionado: {type}.
                  </p>
                )}
              </div>
            ) : null}

            {aba === "Calculadoras" ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card-brutal rounded-2xl bg-amber-100 p-6">
                  <h2 className="font-display text-2xl font-black">
                    Calculadora CLT vs PJ
                  </h2>
                  <label className="mt-4 block text-sm font-black">
                    Proposta PJ (R$)
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      className="mt-1 w-full rounded-xl border-2 border-slate-900 p-3"
                      value={pj}
                      onChange={(event) => {
                        const normalized = event.target.value
                          .replace(/\D/g, "")
                          .replace(/^0+(?=\d)/, "");
                        event.target.value = normalized;
                        setPj(normalized === "" ? 0 : Number(normalized));
                      }}
                    />
                  </label>
                  <label className="mt-3 block text-sm font-black">
                    Estado
                    <select className="mt-1 w-full rounded-xl border-2 border-slate-900 p-3">
                      <option>SP</option>
                      <option>RJ</option>
                      <option>MG</option>
                    </select>
                  </label>
                  <div className="mt-5 rounded-2xl border-2 border-slate-900 bg-white p-5">
                    <p className="text-sm font-bold">
                      Essa proposta PJ equivale a um salário CLT de
                    </p>
                    <p
                      className={cn("font-display text-3xl font-black", ac.link)}
                    >
                      {cltEquivalent.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                  {[
                    "INSS",
                    "FGTS (8%)",
                    "Férias + 1/3",
                    "13º salário",
                    "Benefícios médios",
                  ].map((item) => (
                    <DetailsChevronOnly
                      key={item}
                      className="mt-3 rounded-xl border-2 border-slate-900 bg-white p-3"
                      title={<span className="font-black">{item}</span>}
                    >
                      <p className="mt-2 text-sm text-slate-600">
                        Estimativa simplificada para comparação inicial. Valide
                        com contador antes de decidir.
                      </p>
                    </DetailsChevronOnly>
                  ))}
                </div>

                <div className="card-brutal rounded-2xl bg-white p-6">
                  <h2 className="font-display text-2xl font-black">
                    Calculadora de negociação salarial
                  </h2>
                  <label className="mt-4 block text-sm font-black">
                    Área
                    <input
                      className="mt-1 w-full rounded-xl border-2 border-slate-900 p-3"
                      value={negotiationArea}
                      onChange={(event) =>
                        setNegotiationArea(event.target.value)
                      }
                    />
                  </label>
                  <label className="mt-3 block text-sm font-black">
                    Tempo de experiência
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-xl border-2 border-slate-900 p-3"
                      value={experience}
                      onChange={(event) => {
                        const next =
                          event.target.value === ""
                            ? 0
                            : Number(event.target.value);
                        setExperience(
                          Number.isNaN(next) || next < 0 ? 0 : next,
                        );
                      }}
                    />
                  </label>
                  <div
                    className={cn(
                      "mt-5 rounded-2xl border-2 p-5",
                      ac.panelBorder,
                      ac.panelSoft,
                    )}
                  >
                    <p className="font-black">
                      Você pode pedir entre R${" "}
                      {askMin.toLocaleString("pt-BR")} e R${" "}
                      {askMax.toLocaleString("pt-BR")}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li>
                        Tenho projetos práticos alinhados com {negotiationArea}.
                      </li>
                      <li>Trago repertório das tecnologias pedidas na vaga.</li>
                      <li>Posso mostrar evolução e entregas documentadas.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            {aba === "Mercado" ? (
              <div className="grid gap-5 md:grid-cols-3">
                <div className="card-brutal rounded-2xl bg-white p-5">
                  <h3 className="font-display text-xl font-black">
                    Áreas com mais vagas
                  </h3>
                  {marketMonitor.hotAreas.map((item) => (
                    <p key={item.name} className="mt-2 text-sm font-bold">
                      {item.name}:{" "}
                      <CountUp to={Number(item.jobs)} separator="." /> vagas (
                      {item.change > 0 ? "+" : ""}
                      {item.change}%)
                    </p>
                  ))}
                </div>
                <div className="card-brutal rounded-2xl bg-white p-5">
                  <h3 className="font-display text-xl font-black">
                    Tecnologias mais pedidas
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {marketMonitor.hotTechnologies.map((item) => (
                      <span
                        key={item}
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-bold",
                          ac.panelSoft,
                          ac.tbodyAccent,
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="card-brutal rounded-2xl bg-white p-5">
                  <h3 className="font-display text-xl font-black">
                    Cidades que mais contratam
                  </h3>
                  {marketMonitor.hotCities.map((item) => (
                    <p key={item.name} className="mt-2 text-sm font-bold">
                      {item.name}:{" "}
                      <CountUp to={Number(item.jobs)} separator="." />
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {aba === "Entender salário" ? (
              <div className="space-y-8">
                <div className="card-brutal rounded-2xl bg-white p-6">
                  <h2 className="font-display text-2xl font-black">
                    Como ler uma faixa salarial
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Uma faixa mostra o piso e o teto que o mercado costuma pagar
                    pra um cargo, considerando área, nível e região. O começo da
                    faixa costuma valer pra quem está entrando; o topo, pra quem
                    já tem experiência e entrega. Use a faixa como referência pra
                    negociar e pra entender onde você está, não como promessa.
                  </p>
                </div>

                <div>
                  <h2 className="mb-4 font-display text-2xl font-black">
                    Glossário do salário
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {salarioGlossario.map((item) => (
                      <div
                        key={item.termo}
                        className={cn(
                          "rounded-2xl border-2 p-4",
                          ac.panelBorder,
                          ac.panelSoft,
                        )}
                      >
                        <p className="font-display text-sm font-black text-slate-950">
                          {item.termo}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.definicao}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="mb-4 font-display text-2xl font-black">
                    CLT vs PJ
                  </h2>
                  <div className="grid gap-5 md:grid-cols-2">
                    {[salarioCltPj.clt, salarioCltPj.pj].map((bloco) => (
                      <div
                        key={bloco.titulo}
                        className="card-brutal rounded-2xl bg-white p-5"
                      >
                        <h3 className="font-display text-xl font-black text-slate-950">
                          {bloco.titulo}
                        </h3>
                        <p className="mt-3 text-xs font-black uppercase tracking-wide text-emerald-700">
                          Prós
                        </p>
                        <ul className="mt-1 space-y-1">
                          {bloco.pros.map((p) => (
                            <li
                              key={p}
                              className="flex items-start gap-2 text-sm text-slate-700"
                            >
                              <Check
                                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                                aria-hidden
                              />
                              {p}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-xs font-black uppercase tracking-wide text-red-600">
                          Contras
                        </p>
                        <ul className="mt-1 space-y-1">
                          {bloco.contras.map((c) => (
                            <li
                              key={c}
                              className="flex items-start gap-2 text-sm text-slate-700"
                            >
                              <X
                                className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                                aria-hidden
                              />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-brutal rounded-2xl bg-amber-100 p-6">
                  <h2 className="font-display text-2xl font-black">
                    Dicas de negociação
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {salarioDicasNegociacao.map((dica) => (
                      <li
                        key={dica}
                        className="flex items-start gap-2 text-sm font-bold text-slate-800"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                          aria-hidden
                        />
                        {dica}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="mb-4 font-display text-2xl font-black">
                    Onde pesquisar salário
                  </h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    {salarioFontes.map((fonte) => (
                      <a
                        key={fonte.nome}
                        href={fonte.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-brutal flex flex-col rounded-2xl bg-white p-5 transition-transform motion-safe:hover:-translate-y-1"
                      >
                        <span className="flex items-center gap-1 font-display text-lg font-black text-slate-950">
                          {fonte.nome}
                          <ExternalLink className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="mt-2 text-sm text-slate-600">
                          {fonte.desc}
                        </span>
                      </a>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-500">
                    As fontes são referências externas; os valores variam com o
                    tempo e a metodologia de cada uma.
                  </p>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
