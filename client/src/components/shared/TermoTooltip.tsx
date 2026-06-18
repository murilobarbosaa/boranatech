import type { ReactNode } from "react";
import { Link } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getGlossaryTerm } from "@/lib/glossary";
import { cn } from "@/lib/utils";

interface TermoTooltipProps {
  termo: string;
  children?: ReactNode;
  className?: string;
}

export default function TermoTooltip({
  termo,
  children,
  className,
}: TermoTooltipProps) {
  const entry = getGlossaryTerm(termo);
  const display = children ?? termo;

  if (!entry) {
    return <>{display}</>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`O que é ${entry.term}?`}
          className={cn(
            "cursor-help border-0 bg-transparent p-0 align-baseline text-inherit underline decoration-dotted underline-offset-2 [font:inherit]",
            className,
          )}
        >
          {display}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm">
        <p className="text-slate-700">{entry.meaning}</p>
        <Link
          href={`/dicionario?termo=${entry.slug}`}
          className="mt-3 inline-flex font-bold text-violet-700 hover:text-violet-800"
        >
          ver no Dicionário →
        </Link>
      </PopoverContent>
    </Popover>
  );
}
