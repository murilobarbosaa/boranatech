import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import PageHero from "@/components/shared/PageHero";
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

export default function Salarios() {
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
        <div className="container space-y-10">
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
                        Nenhum dado salarial para esse recorte. Tente ampliar a
                        área, o nível ou a cidade.
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
                <p className={cn("font-display text-3xl font-black", ac.link)}>
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
                    Estimativa simplificada para comparação inicial. Valide com
                    contador antes de decidir.
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
                  onChange={(event) => setNegotiationArea(event.target.value)}
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
                    setExperience(Number.isNaN(next) || next < 0 ? 0 : next);
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
                  Você pode pedir entre R$ {askMin.toLocaleString("pt-BR")} e R${" "}
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

          <div className="grid gap-5 md:grid-cols-3">
            <div className="card-brutal rounded-2xl bg-white p-5">
              <h3 className="font-display text-xl font-black">
                Áreas com mais vagas
              </h3>
              {marketMonitor.hotAreas.map((item) => (
                <p key={item.name} className="mt-2 text-sm font-bold">
                  {item.name}: {item.jobs} vagas ({item.change > 0 ? "+" : ""}
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
                  {item.name}: {item.jobs}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
