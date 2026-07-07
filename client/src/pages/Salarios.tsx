import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Banknote,
  Check,
  Coins,
  DollarSign,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
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

const ac = getPageAccentUi("emerald");

const MONEY_ICONS = [Banknote, Coins, DollarSign];

const MONEY_ITEMS = [
  { left: "5%", top: "14%", delay: 0, duration: 7, icon: 0, rot: 10, size: "h-9 w-9", color: "text-emerald-400" },
  { left: "16%", top: "62%", delay: 1.1, duration: 8.5, icon: 1, rot: -12, size: "h-7 w-7", color: "text-emerald-500" },
  { left: "27%", top: "28%", delay: 2.2, duration: 6.5, icon: 2, rot: 8, size: "h-6 w-6", color: "text-emerald-300" },
  { left: "38%", top: "72%", delay: 0.6, duration: 9, icon: 0, rot: -8, size: "h-8 w-8", color: "text-emerald-400" },
  { left: "49%", top: "18%", delay: 1.7, duration: 7.5, icon: 1, rot: 14, size: "h-7 w-7", color: "text-emerald-500" },
  { left: "59%", top: "58%", delay: 2.8, duration: 8, icon: 2, rot: -10, size: "h-6 w-6", color: "text-emerald-300" },
  { left: "68%", top: "24%", delay: 0.9, duration: 9.5, icon: 0, rot: 12, size: "h-9 w-9", color: "text-emerald-400" },
  { left: "77%", top: "66%", delay: 2.0, duration: 7, icon: 1, rot: -14, size: "h-7 w-7", color: "text-emerald-500" },
  { left: "85%", top: "16%", delay: 1.3, duration: 8.5, icon: 2, rot: 9, size: "h-6 w-6", color: "text-emerald-300" },
  { left: "92%", top: "54%", delay: 2.5, duration: 6.8, icon: 0, rot: -9, size: "h-8 w-8", color: "text-emerald-400" },
  { left: "11%", top: "40%", delay: 1.5, duration: 8.2, icon: 2, rot: 11, size: "h-6 w-6", color: "text-emerald-300" },
  { left: "73%", top: "44%", delay: 0.3, duration: 7.8, icon: 1, rot: -11, size: "h-7 w-7", color: "text-emerald-500" },
];

const SPARKLE_ITEMS = [
  { left: "22%", top: "20%", delay: 0.4, duration: 3.2 },
  { left: "55%", top: "70%", delay: 1.2, duration: 3.8 },
  { left: "82%", top: "34%", delay: 2.0, duration: 3.4 },
  { left: "34%", top: "52%", delay: 0.9, duration: 4 },
];

function MoneyRain() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {MONEY_ITEMS.map((item, index) => {
        const Icon = MONEY_ICONS[item.icon];
        return (
          <motion.span
            key={`m-${index}`}
            className={cn("absolute", item.color)}
            style={{ left: item.left, top: item.top }}
            initial={{ opacity: 0 }}
            animate={{
              y: [0, -18, 0],
              x: [0, 8, 0],
              rotate: [0, item.rot, 0],
              opacity: [0.18, 0.34, 0.18],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon className={item.size} aria-hidden />
          </motion.span>
        );
      })}
      {SPARKLE_ITEMS.map((item, index) => (
        <motion.span
          key={`s-${index}`}
          className="absolute text-emerald-300"
          style={{ left: item.left, top: item.top }}
          animate={{ opacity: [0.15, 0.5, 0.15], scale: [1, 1.25, 1] }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="h-5 w-5" aria-hidden />
        </motion.span>
      ))}
    </div>
  );
}

const ABAS = [
  "Tabela salarial",
  "Calculadoras",
  "Mercado",
  "Entender salário",
];

const fontesReferencia = [
  {
    nome: "Guia Salarial Robert Half",
    desc: "Faixas por cargo em percentis, atualizado todo ano.",
    url: "https://www.roberthalf.com/br/pt/insights/guia-salarial/tecnologia",
  },
  {
    nome: "Glassdoor",
    desc: "Salários informados por quem trabalha na área.",
    url: "https://www.glassdoor.com.br/",
  },
  {
    nome: "Pesquisa Salarial Código Fonte TV",
    desc: "Levantamento anual com milhares de devs no Brasil.",
    url: "https://pesquisa.codigofonte.com.br/",
  },
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

// TODO(Ana): revisar a copy do titulo, subtitulo e rodape da tabela salarial.
const TABELA_TITULO = "Quanto ganha cada área e nível";
const TABELA_SUBTITULO =
  "Filtre por área, nível e cidade e veja a faixa de CLT a PJ de cada vaga.";

const LEVEL_RANK: Record<string, number> = {
  Estágio: 0,
  Trainee: 1,
  Júnior: 2,
  Pleno: 3,
  Sênior: 4,
  Especialista: 5,
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

type SalaryRow = (typeof salaryRows)[number];

function SalaryRangeCard({
  row,
  maxSalary,
  type,
}: {
  row: SalaryRow;
  maxSalary: number;
  type: string;
}) {
  const clt = Number(row.clt);
  const pj = Number(row.pj);
  const leftPct = maxSalary > 0 ? (clt / maxSalary) * 100 : 0;
  const rightPct = maxSalary > 0 ? 100 - (pj / maxSalary) * 100 : 0;
  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_#0f172a] transition-shadow duration-200 hover:shadow-[5px_5px_0_#6ee7b7]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded-full border-2 border-slate-900 bg-emerald-100 px-2.5 py-0.5 text-xs font-black">
          {String(row.area)}
        </span>
        <span className="text-sm font-black text-slate-900">
          {String(row.level)}
        </span>
        <span className="text-xs font-bold text-slate-500">
          {String(row.city)}
        </span>
      </div>
      <div
        className="relative mt-3 h-3 w-full rounded-full bg-slate-100"
        role="img"
        aria-label={`Faixa de ${String(row.area)} ${String(row.level)} em ${String(row.city)}: CLT ${formatBRL(clt)} a PJ ${formatBRL(pj)}`}
      >
        <div
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300 motion-reduce:transition-none"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span
          className={cn(
            "font-black",
            type === "PJ"
              ? "text-slate-400"
              : type === "CLT"
                ? "text-emerald-700"
                : "text-slate-700",
          )}
        >
          CLT {formatBRL(clt)}
        </span>
        <span
          className={cn(
            "font-black",
            type === "CLT"
              ? "text-slate-400"
              : type === "PJ"
                ? "text-emerald-700"
                : "text-slate-700",
          )}
        >
          PJ {formatBRL(pj)}
        </span>
      </div>
    </div>
  );
}

export default function Salarios() {
  const reduce = useReducedMotion();
  const [aba, setAba] = useState("Tabela salarial");
  const [area, setArea] = useState("Todas");
  const [level, setLevel] = useState("Todos");
  const [city, setCity] = useState("Todas");
  const [type, setType] = useState("Todos");
  const [pj, setPj] = useState(9000);
  const [negArea, setNegArea] = useState(String(salaryRows[0].area));
  const [negLevel, setNegLevel] = useState(String(salaryRows[0].level));

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
  const ordered = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          String(a.area).localeCompare(String(b.area)) ||
          (LEVEL_RANK[String(a.level)] ?? 99) -
            (LEVEL_RANK[String(b.level)] ?? 99),
      ),
    [filtered],
  );
  const maxSalary = filtered.length
    ? Math.max(...filtered.map((row) => Number(row.pj)))
    : 0;
  const cltEquivalent = Math.round(pj * 0.68);
  const negAreaOptions = areas.filter((option) => option !== "Todas");
  const negLevelOptions = levels.filter((option) => option !== "Todos");
  const negRows = salaryRows.filter(
    (row) => row.area === negArea && row.level === negLevel,
  );
  const negBase = negRows.length
    ? Math.min(...negRows.map((row) => Number(row.clt)))
    : null;
  const negTeto =
    negBase !== null
      ? Math.round(Math.max(...negRows.map((row) => Number(row.clt))) * 1.15)
      : null;

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Salários em TI · Quanto ganha cada área e nível"
        description="Explore salários de tecnologia por área, nível e cidade. Veja quanto você pode ganhar como júnior e como a remuneração evolui ao longo da carreira."
        url="/salarios"
      />
      <PageHero
        accent="emerald"
        eyebrow="referência de mercado"
        title={
          reduce ? (
            "Salários em TI"
          ) : (
            <motion.span
              className="inline-block bg-[length:200%_100%] bg-clip-text text-transparent [background-image:linear-gradient(110deg,#065f46_0%,#10b981_35%,#065f46_65%)]"
              animate={{ backgroundPositionX: ["0%", "200%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              Salários em TI
            </motion.span>
          )
        }
        subtitle="Quanto você pode ganhar em cada área, nível e cidade."
        backgroundSlot={<MoneyRain />}
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
                    ? "border-slate-900 bg-emerald-600 text-white shadow-[2px_2px_0_#0f172a]"
                    : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <motion.div key={aba} {...fadeUp} className="space-y-8">
            {aba === "Tabela salarial" ? (
              <>
              <div className="card-brutal rounded-2xl bg-white p-6">
                <h2 className="font-display text-2xl font-black">
                  {TABELA_TITULO}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{TABELA_SUBTITULO}</p>
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
                <div
                  className={cn(
                    "mt-6 grid gap-3",
                    area === "Todas" ? "sm:grid-cols-2" : "grid-cols-1",
                  )}
                >
                  {ordered.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500 sm:col-span-2">
                      Nenhuma faixa pra esse recorte. Tente ampliar a área, o
                      nível ou a cidade.
                    </div>
                  ) : (
                    ordered.map((row) => (
                      <SalaryRangeCard
                        key={`${String(row.area)}-${String(row.level)}-${String(row.city)}`}
                        row={row}
                        maxSalary={maxSalary}
                        type={type}
                      />
                    ))
                  )}
                </div>
                <p className="mt-4 text-xs font-bold text-slate-500">
                  {ordered.length} {ordered.length === 1 ? "faixa" : "faixas"} ·
                  valores de referência, variam por empresa, região e momento do
                  mercado.
                </p>
              </div>
              <div className="card-brutal rounded-2xl bg-white p-6">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                  Fontes de referência
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Estas são faixas de referência da BoraNaTech, um ponto de
                  partida. Os valores reais variam por empresa, região,
                  senioridade e momento do mercado. Para comparar com dados
                  atualizados, consulte:
                </p>
                <ul className="mt-4 space-y-3">
                  {fontesReferencia.map((fonte) => (
                    <li key={fonte.nome} className="text-sm text-slate-700">
                      <a
                        href={fonte.url}
                        target="_blank"
                        rel="noreferrer"
                        className={cn("font-black underline", ac.link)}
                      >
                        {fonte.nome}
                      </a>{" "}
                      {fonte.desc}
                    </li>
                  ))}
                </ul>
              </div>
              </>
            ) : null}

            {aba === "Calculadoras" ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4 }}
                  className="card-brutal rounded-2xl bg-emerald-100 p-6 transition-shadow duration-200 hover:shadow-[8px_8px_0_#6ee7b7]"
                >
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
                  <div className="mt-5 rounded-2xl border-2 border-slate-900 bg-white p-5">
                    <p className="text-xs font-bold text-slate-500">
                      Estimativa simplificada. Valide com um contador antes de
                      decidir.
                    </p>
                    <p className="mt-2 text-sm font-bold">
                      Essa proposta PJ equivale a um salário CLT de
                    </p>
                    <p
                      className={cn("font-display text-3xl font-black", ac.link)}
                    >
                      R$ <CountUp to={cltEquivalent} separator="." />
                    </p>
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-700">
                    Por que menos que o PJ? Porque o CLT já inclui o que está
                    abaixo, e no PJ você banca tudo isso.
                  </p>
                  {[
                    {
                      item: "FGTS (8%)",
                      desc: "No CLT, a empresa deposita 8% do salário numa conta sua. No PJ, isso não existe.",
                    },
                    {
                      item: "13º salário",
                      desc: "Um salário extra por ano no CLT. No PJ, você teria que guardar por conta.",
                    },
                    {
                      item: "Férias + 1/3",
                      desc: "No CLT você tira férias pagas com adicional de 1/3. No PJ, férias saem do seu bolso.",
                    },
                    {
                      item: "INSS",
                      desc: "No CLT o desconto já entra na folha. No PJ, você recolhe por conta.",
                    },
                    {
                      item: "Benefícios médios",
                      desc: "VR, VA e plano de saúde costumam vir no CLT. No PJ, normalmente não.",
                    },
                  ].map(({ item, desc }) => (
                    <DetailsChevronOnly
                      key={item}
                      className="mt-3 rounded-xl border-2 border-slate-900 bg-white p-3"
                      title={<span className="font-black">{item}</span>}
                    >
                      <p className="mt-2 text-sm text-slate-600">{desc}</p>
                    </DetailsChevronOnly>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4 }}
                  className="card-brutal rounded-2xl bg-white p-6 transition-shadow duration-200 hover:shadow-[8px_8px_0_#6ee7b7]"
                >
                  <h2 className="font-display text-2xl font-black">
                    Calculadora de negociação salarial
                  </h2>
                  <label className="mt-4 block text-sm font-black">
                    Área
                    <select
                      className="mt-1 w-full rounded-xl border-2 border-slate-900 p-3"
                      value={negArea}
                      onChange={(event) => setNegArea(event.target.value)}
                    >
                      {negAreaOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-3 block text-sm font-black">
                    Nível
                    <select
                      className="mt-1 w-full rounded-xl border-2 border-slate-900 p-3"
                      value={negLevel}
                      onChange={(event) => setNegLevel(event.target.value)}
                    >
                      {negLevelOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <div
                    className={cn(
                      "mt-5 rounded-2xl border-2 p-5",
                      ac.panelBorder,
                      ac.panelSoft,
                    )}
                  >
                    {negBase !== null && negTeto !== null ? (
                      <>
                        <p className="font-black">
                          Referência da tabela: R${" "}
                          <CountUp to={negBase} separator="." />. Você pode pedir
                          entre R$ <CountUp to={negBase} separator="." /> e R${" "}
                          <CountUp to={negTeto} separator="." />.
                        </p>
                        <p className="mt-2 text-xs font-bold text-slate-500">
                          Faixa baseada na tabela acima, com até 15% de margem de
                          negociação.
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-slate-700">
                        Ainda não temos {negArea} {negLevel} na tabela. Use os
                        recortes disponíveis como referência.
                      </p>
                    )}
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li>Tenho projetos práticos alinhados com {negArea}.</li>
                      <li>Trago repertório das tecnologias pedidas na vaga.</li>
                      <li>Posso mostrar evolução e entregas documentadas.</li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            ) : null}

            {aba === "Mercado" ? (
              <div className="grid gap-5 md:grid-cols-3">
                <div className="card-brutal rounded-2xl bg-white p-5 transition-transform duration-200 motion-safe:hover:-translate-y-1 hover:shadow-[6px_6px_0_#6ee7b7]">
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
                <div className="card-brutal rounded-2xl bg-white p-5 transition-transform duration-200 motion-safe:hover:-translate-y-1 hover:shadow-[6px_6px_0_#6ee7b7]">
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
                <div className="card-brutal rounded-2xl bg-white p-5 transition-transform duration-200 motion-safe:hover:-translate-y-1 hover:shadow-[6px_6px_0_#6ee7b7]">
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
                        className="card-brutal rounded-2xl bg-white p-5 transition-transform duration-200 motion-safe:hover:-translate-y-1 hover:shadow-[6px_6px_0_#6ee7b7]"
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

                <div className="card-brutal rounded-2xl bg-emerald-100 p-6">
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
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
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
