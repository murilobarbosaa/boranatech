import { ExternalLink } from "lucide-react";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

// Shape espelhado do jobFromApi de services/contentApi.ts (rota GET /jobs do
// server). A fonte nao vem da API; e derivada do hostname da url da vaga.
export type VagasJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  seniority: string;
  url: string;
  areaSlug: string;
  publishedAt: string | null;
};

const ac = getPageAccentUi("cyan");

function jobSource(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function VagasJobCard({ job }: { job: VagasJob }) {
  const source = jobSource(job.url);
  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card-brutal flex flex-col rounded-2xl border-2 border-slate-950 bg-white p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold",
            ac.panelSoft,
            ac.tbodyAccent,
          )}
        >
          {job.seniority}
        </span>
        {job.remote ? (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
            remoto
          </span>
        ) : null}
      </div>
      <h3 className="font-display font-black text-slate-950">{job.title}</h3>
      <p className="mt-2 text-sm text-slate-600">
        {job.company} · {job.location}
      </p>
      <div className="flex-1" />
      <div className="mt-4 flex items-center justify-between gap-2">
        {source ? (
          <span className="text-xs font-bold text-slate-500">{source}</span>
        ) : (
          <span aria-hidden />
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-black",
            ac.tbodyAccent,
          )}
        >
          Ver vaga <ExternalLink className="h-3 w-3" aria-hidden />
        </span>
      </div>
    </a>
  );
}
