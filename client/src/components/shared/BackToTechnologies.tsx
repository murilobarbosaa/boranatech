import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

import type { PageHeroAccent } from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

/** Link de volta para /tecnologias, no padrão visual do "voltar" das páginas de detalhe. */
export default function BackToTechnologies({
  accent = "violet",
}: {
  accent?: PageHeroAccent;
}) {
  const ac = getPageAccentUi(accent);
  return (
    <Link
      href="/tecnologias"
      className={cn(
        "inline-flex items-center gap-2 text-sm font-bold",
        ac.link,
        ac.linkHover,
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Voltar para Tecnologias
    </Link>
  );
}
