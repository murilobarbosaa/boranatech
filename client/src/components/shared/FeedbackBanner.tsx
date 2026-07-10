import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Banner de feedback inline (anatomia brutal), unificando as copias de banner
// de erro (rose) e aviso (amber) espalhadas pelas paginas Pro.

interface FeedbackBannerProps {
  variant: "error" | "warn";
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<"error" | "warn", string> = {
  error: "border-red-400 bg-red-100 text-red-900",
  warn: "border-amber-400 bg-amber-100 text-amber-900",
};

export default function FeedbackBanner({
  variant,
  className,
  children,
}: FeedbackBannerProps) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border-2 px-3 py-2 text-sm font-bold",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}
