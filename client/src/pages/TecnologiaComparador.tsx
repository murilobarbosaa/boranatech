import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import CopyButton from "@/components/shared/CopyButton";
import PageHero from "@/components/shared/PageHero";
import { technologies } from "@/lib/technologyData";
import { getTechnologies } from "@/services/contentService";

export default function TecnologiaComparador() {
  const [technologyItems, setTechnologyItems] = useState(technologies);
  const [leftSlug, setLeftSlug] = useState(technologies[0]?.slug || "");
  const [rightSlug, setRightSlug] = useState(technologies[4]?.slug || "");

  useEffect(() => {
    getTechnologies()
      .then((items) => {
        setTechnologyItems(items);
        setLeftSlug((current) => current || items[0]?.slug || "");
        setRightSlug((current) => current || items[4]?.slug || items[1]?.slug || "");
      })
      .catch(() => setTechnologyItems(technologies));
  }, []);

  const left = technologyItems.find((item) => item.slug === leftSlug);
  const right = technologyItems.find((item) => item.slug === rightSlug);

  const rows = [
    ["Dificuldade", left?.difficulty, right?.difficulty],
    ["Mercado", left?.demand, right?.demand],
    ["Salário", left?.salaryRange, right?.salaryRange],
    ["Casos de uso", left?.useCases[0], right?.useCases[0]],
    ["Curva de aprendizado", `${left?.difficultyScore}/5`, `${right?.difficultyScore}/5`],
  ];

  return (
    <Layout>
      <PageHero title="Comparador de Tecnologias" subtitle="Compare dificuldade, mercado, salário e casos de uso antes de escolher onde focar." accent="emerald" />
      <section className="container py-12">
        <div className="card-brutal rounded-2xl bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[leftSlug, rightSlug].map((value, index) => (
              <select
                key={index}
                className="rounded-xl border-2 border-slate-900 bg-white p-3 font-bold"
                value={value}
                onChange={(event) => (index === 0 ? setLeftSlug(event.target.value) : setRightSlug(event.target.value))}
              >
                {technologyItems.map((technology) => (
                  <option key={technology.slug} value={technology.slug}>{technology.name}</option>
                ))}
              </select>
            ))}
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-violet-700 text-white">
                  <th className="border-2 border-slate-900 p-3 text-left">Critério</th>
                  <th className="border-2 border-slate-900 p-3 text-left">{left?.name}</th>
                  <th className="border-2 border-slate-900 p-3 text-left">{right?.name}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, a, b]) => (
                  <tr key={label}>
                    <td className="border-2 border-slate-900 p-3 font-black">{label}</td>
                    <td className="border-2 border-slate-900 p-3">{a}</td>
                    <td className="border-2 border-slate-900 p-3">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CopyButton className="mt-5" text={`Comparação: ${left?.name} vs ${right?.name}`} />
        </div>
      </section>
    </Layout>
  );
}
