import { useState } from "react";

interface TechnologyLogoProps {
  name: string;
  icon: string;
  logoUrl: string;
  className?: string;
  imageClassName?: string;
}

export default function TechnologyLogo({
  name,
  icon,
  logoUrl,
  className = "",
  imageClassName = "h-8 w-8",
}: TechnologyLogoProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0_#0f172a] ${className}`}
    >
      {logoUrl && !hasError ? (
        <img
          src={logoUrl}
          alt={`Logo ${name}`}
          loading="lazy"
          className={`${imageClassName} object-contain`}
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="font-display font-black text-violet-800">{icon}</span>
      )}
    </div>
  );
}
