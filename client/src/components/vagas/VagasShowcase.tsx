import { Globe2, Layers, RefreshCw, SlidersHorizontal, Star } from "lucide-react";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

// Vitrine para free/deslogado. 100% ILUSTRATIVA: os cards abaixo sao
// constantes EXAMPLE_* com empresas FICTICIAS (nenhuma marca real) e selo de
// exemplo visivel, no molde do LinkedinAnalyzerIntro. Nada aqui toca a API.

const ac = getPageAccentUi("cyan");

// TODO(Ana): validar a copy dos cards de exemplo (titulos, empresas e locais
// ficticios).
const EXAMPLE_JOBS = [
  {
    title: "Desenvolvedor(a) Front-end Júnior",
    company: "TechNorte Sistemas",
    location: "São Paulo, SP",
    country: "BR",
    pills: ["Júnior", "Híbrido", "CLT"],
    source: "via repositório da comunidade",
  },
  {
    title: "Estágio em Análise de Dados",
    company: "Aurora Analytics",
    location: "Remoto",
    country: "BR",
    pills: ["Estágio", "Remoto"],
    source: "via site da empresa",
  },
  {
    title: "Junior Software Engineer",
    company: "Northlight Digital",
    location: "Berlim, Alemanha",
    country: "DE",
    pills: ["Júnior", "Presencial"],
    source: "via agregador internacional",
  },
];

// TODO(Ana): validar a copy das pills de beneficio.
const BENEFIT_PILLS = [
  { Icon: Layers, label: "Vagas de várias fontes num só feed" },
  { Icon: Globe2, label: "Brasil + vagas internacionais" },
  { Icon: SlidersHorizontal, label: "Busca e filtros por nível, modalidade e contrato" },
  { Icon: Star, label: "Vagas em destaque" },
  { Icon: RefreshCw, label: "Atualização automática ao longo do dia" },
];

export default function VagasShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_JOBS.map((job) => (
            <div
              key={job.title}
              className="card-brutal relative flex flex-col rounded-2xl border-2 border-slate-950 bg-white p-5"
            >
              <span className="absolute -top-3 right-4 rounded-full border-2 border-slate-900 bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600">
                Exemplo ilustrativo
              </span>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-black uppercase text-slate-700">
                  {job.country}
                </span>
                {job.pills.map((pill) => (
                  <span
                    key={pill}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      ac.panelSoft,
                      ac.tbodyAccent,
                    )}
                  >
                    {pill}
                  </span>
                ))}
              </div>
              <h3 className="font-display font-black text-slate-950">
                {job.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {job.company} · {job.location}
              </p>
              <div className="flex-1" />
              <p className="mt-4 text-xs font-bold text-slate-500">
                {job.source}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {BENEFIT_PILLS.map(({ Icon, label }) => (
          <span
            key={label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold",
              ac.panelBorder,
              "bg-white text-slate-700",
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", ac.iconMuted)} aria-hidden />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
