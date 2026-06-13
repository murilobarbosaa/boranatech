import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LINKEDIN_CATEGORIES,
  LINKEDIN_CATEGORY_LABELS,
  type LinkedinCheckResult,
} from "@shared/linkedin/schema";

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
