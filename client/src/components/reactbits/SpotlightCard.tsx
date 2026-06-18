import { useRef, type MouseEvent, type ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

export default function SpotlightCard({
  children,
  className,
  spotlightColor = "transparent",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`group relative ${className ?? ""}`}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(180px_circle_at_var(--mouse-x,_50%)_var(--mouse-y,_50%),_var(--spotlight-color,_transparent),_transparent_70%)]"
      />
    </div>
  );
}
