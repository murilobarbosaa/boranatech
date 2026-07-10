import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveCheckActionUrl } from "@shared/linkedin/checkLinks";
import {
  LINKEDIN_CATEGORIES,
  LINKEDIN_CATEGORY_LABELS,
  LINKEDIN_CHECK_CATALOG,
  type LinkedinCheckResult,
} from "@shared/linkedin/schema";

// Hints do catalogo (fonte unica em shared): renderizados como "como
// resolver" nos checks reprovados. Lookup por id, sem duplicar textos.
const HINT_BY_ID = new Map(
  LINKEDIN_CHECK_CATALOG.filter((entry) => entry.hint).map((entry) => [
    entry.id,
    entry.hint as string,
  ]),
);

interface LinkedinChecklistProps {
  checks: LinkedinCheckResult[];
}

export default function LinkedinChecklist({ checks }: LinkedinChecklistProps) {
  const groups = LINKEDIN_CATEGORIES.map((category) => ({
    category,
    items: checks.filter((check) => check.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div
          key={group.category}
          className="card-brutal rounded-2xl border-slate-950 bg-white p-5"
        >
          <h3 className="mb-4 font-display text-lg font-black text-slate-950">
            {LINKEDIN_CATEGORY_LABELS[group.category]}
          </h3>
          <ul className="space-y-3">
            {group.items.map((check) => {
              const Icon = check.aprovado ? CheckCircle2 : XCircle;
              // Deep link honesto de "Resolver agora" (shared/linkedin/
              // checkLinks): so nos reprovados e so quando a correcao e
              // edicao do proprio perfil; sem URL, fica so o hint textual.
              const actionUrl = !check.aprovado
                ? resolveCheckActionUrl(check.id)
                : null;
              return (
                <li key={check.id} className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0",
                      check.aprovado ? "text-emerald-600" : "text-red-600",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">
                      {check.label}
                    </p>
                    <p className="text-sm text-slate-500">{check.detail}</p>
                    {!check.aprovado && HINT_BY_ID.has(check.id) ? (
                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {/* TODO(Ana): revisar o rotulo "como resolver". */}
                        <span className="font-bold text-slate-500">
                          como resolver:
                        </span>{" "}
                        {HINT_BY_ID.get(check.id)}
                      </p>
                    ) : null}
                    {actionUrl ? (
                      <a
                        href={actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full border-2 border-slate-950 bg-white px-2.5 py-0.5 text-[11px] font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-colors hover:bg-yellow-100"
                      >
                        {/* TODO(Ana): revisar o rotulo "Resolver agora". */}
                        Resolver agora
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
