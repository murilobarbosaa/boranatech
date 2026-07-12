import { Star } from "lucide-react";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import type { VagaItem } from "@/services/vagasService";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("cyan");

// Fonte legivel do card: repo do GitHub extraido da url da issue, empresa nos
// boards de ATS, nome do agregador nos demais.
export function sourceLabel(job: VagaItem): string {
  if (job.source === "github") {
    const match = /github\.com\/([^/]+)\//.exec(job.url);
    return match ? `via ${match[1]}` : "via GitHub";
  }
  if (job.source === "ats_boards") {
    return job.company ? `via ${job.company}` : "via site da empresa";
  }
  if (job.source === "adzuna") return "via Adzuna";
  if (job.source === "jooble") return "via Jooble";
  return "indicada pela Bora na Tech";
}

const SENIORITY_LABELS: Record<string, string> = {
  estagio: "Estágio",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
};

const MODALITY_LABELS: Record<string, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

const CONTRACT_LABELS: Record<string, string> = {
  clt: "CLT",
  pj: "PJ",
};

export function seniorityLabel(value: string | null): string | null {
  return value ? (SENIORITY_LABELS[value] ?? null) : null;
}

export function modalityLabel(value: string | null): string | null {
  return value ? (MODALITY_LABELS[value] ?? null) : null;
}

export function contractLabel(value: string | null): string | null {
  return value ? (CONTRACT_LABELS[value] ?? null) : null;
}

// "há X dias" com Intl.RelativeTimeFormat pt-BR; hoje/data inválida viram
// null e a linha não renderiza.
export function publishedAgo(publishedAt: string | null): string | null {
  if (!publishedAt) return null;
  const ts = Date.parse(publishedAt);
  if (Number.isNaN(ts)) return null;
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return "hoje";
  return new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" }).format(
    -days,
    "day",
  );
}

// Faixa salarial na MOEDA ORIGINAL (nunca converter), separador "a". Sem
// valor, retorna null e a linha não existe (null nunca vira zero).
export function salaryLine(job: VagaItem): string | null {
  if (job.salaryMin === null && job.salaryMax === null) return null;
  if (!job.salaryCurrency) return null;
  const fmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: job.salaryCurrency,
    maximumFractionDigits: 0,
  });
  const min = job.salaryMin !== null ? fmt.format(job.salaryMin) : null;
  const max = job.salaryMax !== null ? fmt.format(job.salaryMax) : null;
  const range =
    min && max && min !== max ? `${min} a ${max}` : (min ?? max ?? "");
  if (!range) return null;
  return job.salaryIsPredicted ? `${range} (estimativa)` : range;
}

type VagasJobCardProps = {
  job: VagaItem;
  onOpen: (id: string) => void;
  highlight?: boolean;
};

export default function VagasJobCard({
  job,
  onOpen,
  highlight = false,
}: VagasJobCardProps) {
  const pills = [
    seniorityLabel(job.seniority),
    modalityLabel(job.modality),
    contractLabel(job.contract),
  ].filter((label): label is string => label !== null);
  const salary = salaryLine(job);
  const ago = publishedAgo(job.publishedAt);

  return (
    <button
      type="button"
      onClick={() => onOpen(job.id)}
      className={cn(
        "card-brutal flex w-full flex-col rounded-2xl border-2 p-5 text-left",
        highlight
          ? "border-slate-950 bg-cyan-50 shadow-[5px_5px_0_#0e7490]"
          : "border-slate-950 bg-white",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {highlight ? (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-slate-950 bg-[#FFB800] px-2 py-0.5 text-xs font-black text-slate-950">
            <Star className="h-3 w-3 fill-slate-950" aria-hidden />
            Destaque
          </span>
        ) : null}
        {job.country ? (
          <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-black uppercase text-slate-700">
            {job.country}
          </span>
        ) : null}
        {pills.map((label) => (
          <span
            key={label}
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              ac.panelSoft,
              ac.tbodyAccent,
            )}
          >
            {label}
          </span>
        ))}
      </div>
      <h3 className="font-display font-black text-slate-950">{job.title}</h3>
      <p className="mt-2 text-sm text-slate-600">
        {[job.company, job.location].filter(Boolean).join(" · ") ||
          "Empresa não informada"}
      </p>
      {salary ? (
        <p className="mt-2 text-sm font-bold text-emerald-700">{salary}</p>
      ) : null}
      <div className="flex-1" />
      <div className="mt-4 flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-500">{sourceLabel(job)}</span>
        {ago ? <span className="font-medium text-slate-400">{ago}</span> : null}
      </div>
    </button>
  );
}
