import type { ComponentType } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  resolveCheckActionUrl,
  type CheckLinkTarget,
} from "@shared/github/checkLinks";
import {
  CHECK_CATALOG,
  type CheckCategory,
  type CheckStatus,
  type GithubCheckResult,
} from "@shared/github/schema";

const ac = getPageAccentUi("violet");

// Hints do catalogo (fonte unica em shared): renderizados como "como
// resolver" nos checks warn/fail. Lookup por id, sem duplicar textos.
const HINT_BY_ID = new Map(
  CHECK_CATALOG.filter((entry) => entry.hint).map((entry) => [
    entry.id,
    entry.hint as string,
  ]),
);

const CATEGORY_ORDER: CheckCategory[] = [
  "essenciais",
  "profissionalismo",
  "saude",
  "perfil",
];

const CATEGORY_LABEL: Record<CheckCategory, string> = {
  essenciais: "Essenciais",
  profissionalismo: "Profissionalismo",
  saude: "Saúde do projeto",
  perfil: "Perfil",
};

const STATUS_UI: Record<
  CheckStatus,
  { Icon: ComponentType<{ className?: string }>; color: string }
> = {
  pass: { Icon: CheckCircle2, color: "text-emerald-600" },
  warn: { Icon: AlertTriangle, color: "text-amber-500" },
  fail: { Icon: XCircle, color: "text-red-600" },
  na: { Icon: MinusCircle, color: "text-slate-400" },
};

interface ChecklistByCategoryProps {
  checks: GithubCheckResult[];
  /** Densidade leve pro trilho lateral do resultado; default mantem o atual. */
  compact?: boolean;
  /** Alvo da analise para os deep links deterministas de "Resolver agora"
   * (shared/github/checkLinks). Ausente = sem botoes, so os hints. */
  linkTarget?: CheckLinkTarget | null;
}

export default function ChecklistByCategory({
  checks,
  compact = false,
  linkTarget = null,
}: ChecklistByCategoryProps) {
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: checks.filter((check) => check.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {groups.map((group) => (
        <div
          key={group.category}
          className={cn(
            "card-brutal rounded-2xl border-slate-950 bg-white",
            compact ? "p-4" : "p-5",
            ac.liftShadow,
          )}
        >
          <h3
            className={cn(
              "font-display font-black text-slate-950",
              compact ? "mb-3 text-base" : "mb-4 text-lg",
            )}
          >
            {CATEGORY_LABEL[group.category]}
          </h3>
          <ul className={compact ? "space-y-2.5" : "space-y-3"}>
            {group.items.map((check) => {
              const ui = STATUS_UI[check.status];
              const actionable =
                check.status === "warn" || check.status === "fail";
              const actionUrl =
                actionable && linkTarget
                  ? resolveCheckActionUrl(check.id, linkTarget)
                  : null;
              return (
                <li key={check.id} className="flex items-start gap-3">
                  <ui.Icon
                    className={cn("mt-0.5 h-5 w-5 shrink-0", ui.color)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">
                      {check.label}
                    </p>
                    <p className="text-sm text-slate-500">{check.detail}</p>
                    {actionable && HINT_BY_ID.has(check.id) ? (
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
