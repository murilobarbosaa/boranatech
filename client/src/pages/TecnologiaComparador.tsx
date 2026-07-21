import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import BackToTechnologies from "@/components/shared/BackToTechnologies";
import CopyButton from "@/components/shared/CopyButton";
import PageHero from "@/components/shared/PageHero";
import { BntSelect } from "@/components/shared/BntSelect";
import { technologies } from "@/lib/technologyData";
import { getTechnologies } from "@/services/contentService";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function TecnologiaComparador() {
  const { isPro } = useSubscription();
  const search = useSearch();
  const fromTech = new URLSearchParams(search).get("from") === "tecnologias";
  const [technologyItems, setTechnologyItems] = useState(technologies);
  const [leftSlug, setLeftSlug] = useState(technologies[0]?.slug || "");
  const [rightSlug, setRightSlug] = useState(technologies[4]?.slug || "");

  useEffect(() => {
    getTechnologies()
      .then((items) => {
        setTechnologyItems(items);
        setLeftSlug((current) => current || items[0]?.slug || "");
        setRightSlug(
          (current) => current || items[4]?.slug || items[1]?.slug || "",
        );
      })
      .catch(() => setTechnologyItems(technologies));
  }, []);

  const left = technologyItems.find((item) => item.slug === leftSlug);
  const right = technologyItems.find((item) => item.slug === rightSlug);

  const rows = [
    ["Dificuldade", left?.difficulty, right?.difficulty],
    ["Salário", left?.salaryRange, right?.salaryRange],
    ["Casos de uso", left?.useCases[0], right?.useCases[0]],
    [
      "Curva de aprendizado",
      `${left?.difficultyScore}/5`,
      `${right?.difficultyScore}/5`,
    ],
  ];

  return (
    <Layout>
      <PageHero
        title="Comparador de Tecnologias"
        subtitle="Compare dificuldade, salário e casos de uso antes de escolher onde focar."
        accent="emerald"
        topSlot={fromTech ? <BackToTechnologies accent="emerald" /> : undefined}
      />
      {/* Comparador de tecnologias e recurso Pro, como o comparador geral. */}
      {!isPro ? (
        <section className="container py-12">
          {/* TODO(Ana): revisar copy do gate do comparador de tecnologias */}
          <ProGate
            feature="comparador_tecnologias"
            description="Compare duas tecnologias lado a lado: mercado, curva de aprendizado, salários e onde cada uma brilha, antes de escolher a sua."
          />
        </section>
      ) : (
        <section className="container py-12">
          <div className="card-brutal rounded-2xl bg-white p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[leftSlug, rightSlug].map((value, index) => (
                <BntSelect
                  accent="green"
                  key={index}
                  label={
                    index === 0 ? "Primeira tecnologia" : "Segunda tecnologia"
                  }
                  value={value}
                  onValueChange={(v) =>
                    index === 0 ? setLeftSlug(v) : setRightSlug(v)
                  }
                  options={technologyItems.map((technology) => ({
                    value: technology.slug,
                    label: technology.name,
                  }))}
                />
              ))}
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="bg-violet-700 text-white">
                    <th className="border-2 border-slate-900 p-3 text-left">
                      Critério
                    </th>
                    <th className="border-2 border-slate-900 p-3 text-left">
                      {left?.name}
                    </th>
                    <th className="border-2 border-slate-900 p-3 text-left">
                      {right?.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, a, b]) => (
                    <tr key={label}>
                      <td className="border-2 border-slate-900 p-3 font-black">
                        {label}
                      </td>
                      <td className="border-2 border-slate-900 p-3">{a}</td>
                      <td className="border-2 border-slate-900 p-3">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CopyButton
              className="mt-5"
              text={`Comparação: ${left?.name} vs ${right?.name}`}
            />
          </div>
        </section>
      )}
    </Layout>
  );
}
