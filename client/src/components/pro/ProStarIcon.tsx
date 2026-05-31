import { Star } from "lucide-react";

export function ProStarIcon({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center text-[#1a1a1a] ${className}`}
      aria-hidden="true"
    >
      <Star className="h-3.5 w-3.5" strokeWidth={2.8} fill="#F59E0B" />
    </span>
  );
}

export function ProInlineBadge({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span>{label}</span>
      <ProStarIcon />
    </span>
  );
}
