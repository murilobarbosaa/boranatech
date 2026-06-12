import type { ComponentType } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CheckCategory,
  CheckStatus,
  GithubCheckResult,
} from "@shared/github/schema";

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
}

export default function ChecklistByCategory({
  checks,
}: ChecklistByCategoryProps) {
  const groups = CATEGORY_ORDER.map((category) => ({
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
            {CATEGORY_LABEL[group.category]}
          </h3>
          <ul className="space-y-3">
            {group.items.map((check) => {
              const ui = STATUS_UI[check.status];
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
