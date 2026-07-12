import { ExternalLink, Landmark, Rocket } from "lucide-react";
import FreelanceGuide from "@/components/estagio/FreelanceGuide";
import SectionLabel from "@/components/shared/SectionLabel";
import { areasTI } from "@/lib/data";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { careerInstitutes } from "@/lib/platformData";
import { cn } from "@/lib/utils";

// Secoes herdadas da antiga pagina /estagio (abas Institutos e Freelance),
// em formato compacto no fim da pagina de vagas. O conteudo em si (dados de
// institutos e o FreelanceGuide) segue intacto; so o wrapper visual mudou.

const ac = getPageAccentUi("cyan");

const areaLabel = (slug: string) =>
  areasTI.find((a) => a.slug === slug)?.nome ?? "Diversas áreas";

const instituteGroups = careerInstitutes.reduce<
  { slug: string; items: (typeof careerInstitutes)[number][] }[]
>((groups, institute) => {
  const slug = institute.areas?.[0] ?? "geral";
  const existing = groups.find((g) => g.slug === slug);
  if (existing) existing.items.push(institute);
  else groups.push({ slug, items: [institute] });
  return groups;
}, []);

export default function VagasLegacySections() {
  return (
    <div className="space-y-14">
      <section>
        {/* TODO(Ana): titulo e copy da secao de institutos; decidir se esse
            conteudo continua na pagina de vagas ou sai. */}
        <SectionLabel icon={Landmark} ac={ac}>
          Institutos de carreira
        </SectionLabel>
        <h2 className="mt-2 font-display text-2xl font-black text-slate-950">
          Institutos e organizações para acompanhar
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Entrar em comunidades profissionais ajuda a conhecer eventos,
          mentorias, certificações e oportunidades.
        </p>
        <div className="mt-8 space-y-10">
          {instituteGroups.map((group) => (
            <div key={group.slug}>
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="h-6 w-1.5 shrink-0 rounded-full bg-cyan-600"
                  aria-hidden
                />
                <h3 className="font-display text-xl font-black text-slate-950">
                  {areaLabel(group.slug)}
                </h3>
                <span
                  className={cn(
                    "rounded-full border-2 border-slate-900 px-2.5 py-0.5 text-xs font-black",
                    ac.panelSoft,
                    ac.tbodyAccent,
                  )}
                >
                  {group.items.length}
                </span>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {group.items.map((institute) => (
                  <a
                    key={institute.name}
                    href={institute.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-brutal rounded-2xl border-2 border-slate-950 bg-white p-5"
                  >
                    <h4 className="font-display text-lg font-black text-slate-950">
                      {institute.name}
                    </h4>
                    <p className="mt-2 text-sm text-slate-600">
                      {institute.desc}
                    </p>
                    <span
                      className={cn(
                        "mt-4 inline-flex items-center gap-1 text-sm font-bold",
                        ac.tbodyAccent,
                      )}
                    >
                      Conhecer instituto{" "}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        {/* TODO(Ana): titulo e copy da secao de freelance; decidir se esse
            conteudo continua na pagina de vagas ou sai. */}
        <SectionLabel icon={Rocket} ac={ac}>
          Guia freelance
        </SectionLabel>
        <h2 className="mt-2 font-display text-2xl font-black text-slate-950">
          Freelance em Tech
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Como ganhar dinheiro com tecnologia antes do primeiro emprego.
        </p>
        <div className="mt-8">
          <FreelanceGuide />
        </div>
      </section>
    </div>
  );
}
