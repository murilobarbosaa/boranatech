import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

import CopyButton from "@/components/shared/CopyButton";
import type { ProximoProjeto } from "@/components/projects/ProjetoLateral";

export default function ProjetoDepois({
  sugestaoLinkedIn,
  url,
  proximo,
  textoLivre,
}: {
  sugestaoLinkedIn: string;
  url: string;
  proximo: ProximoProjeto | null;
  textoLivre: string;
}) {
  return (
    <div className="mt-3 grid gap-4">
      <div className="rounded-xl border-2 border-accent/60 bg-accent/10 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-sm font-bold text-foreground">
            Post pronto para o LinkedIn
          </span>
          <CopyButton
            text={`${sugestaoLinkedIn}\n\n${url}`}
            className="border-border shadow-none"
          />
        </div>
        <p className="whitespace-pre-line text-sm italic text-foreground">
          {sugestaoLinkedIn}
        </p>
      </div>

      {proximo ? (
        <Link
          href={`/projetos/${proximo.id}`}
          className="flex items-center gap-3 rounded-xl border-2 border-border bg-card p-4 transition-colors hover:border-ink"
        >
          <span className="min-w-0">
            <span className="block text-xs font-bold text-muted-foreground">
              Próximo projeto
            </span>
            <span className="block font-display text-base font-bold text-foreground">
              {proximo.nome}
            </span>
            <span className="block text-xs text-muted-foreground">
              {proximo.area} · {proximo.nivel}
            </span>
          </span>
          <ArrowRight
            className="ml-auto h-5 w-5 shrink-0 text-violet-600"
            aria-hidden
          />
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground">{textoLivre}</p>
      )}
    </div>
  );
}
