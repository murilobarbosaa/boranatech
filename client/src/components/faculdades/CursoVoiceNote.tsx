import { useState } from "react";
import type { FaculdadeCursoDepoimento } from "@/lib/data";

export function CursoVoiceNote({ depoimento }: { depoimento: FaculdadeCursoDepoimento }) {
  const [hasError, setHasError] = useState(false);

  const initials = depoimento.nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50/90 p-3">
      <div className="flex items-start gap-3">
        {depoimento.fotoUrl && !hasError ? (
          <img
            src={depoimento.fotoUrl}
            alt={`Foto de perfil de ${depoimento.nome}`}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full border-2 border-slate-900 object-cover shadow-[2px_2px_0_#0f172a]"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-200 text-xs font-black text-violet-900 shadow-[2px_2px_0_#0f172a]">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-950">{depoimento.nome}</p>
          <p className="text-[11px] font-bold leading-snug text-violet-700">{depoimento.subtitulo}</p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-700">{depoimento.texto}</p>
    </div>
  );
}
