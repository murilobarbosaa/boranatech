import TrophyCard from "./TrophyCard";
import type { StationCertVM } from "./types";

interface GeneralShelfProps {
  certs: StationCertVM[];
  // true = plano antigo, sem ancoras: a prateleira e o unico lugar das certs
  // e o titulo muda (sem citar "ancoragem", conceito interno).
  unanchored: boolean;
  onToggleCert?: (itemId: string) => void;
  readonly?: boolean;
}

// Prateleira horizontal das certificacoes transversais (ou de todas, em
// planos antigos). Mesmo padrao de scroll nativo com snap do CareerTrail.
export default function GeneralShelf({
  certs,
  unanchored,
  onToggleCert,
  readonly = false,
}: GeneralShelfProps) {
  if (certs.length === 0) return null;

  // TODO(Ana): titulos da prateleira (plano antigo vs certs transversais)
  const title = unanchored
    ? "Certificações do plano"
    : "Certificações da rota inteira";

  return (
    <section
      role="region"
      // TODO(Ana): aria-label da prateleira
      aria-label={`${title}. Role para o lado para ver todas.`}
    >
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
        {title}
      </p>
      <div className="-mx-1 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
        {certs.map((cert) => (
          <div
            key={cert.itemId}
            className="w-[min(78vw,300px)] shrink-0 snap-start"
          >
            <TrophyCard
              cert={cert}
              onToggle={readonly ? undefined : onToggleCert}
              readonly={readonly}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
