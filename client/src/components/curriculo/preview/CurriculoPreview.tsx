import type { Curriculo } from "@shared/curriculo/schema";

import CronologicoLayout from "./layouts/CronologicoLayout";
import HarvardLayout from "./layouts/HarvardLayout";
import HibridoLayout from "./layouts/HibridoLayout";

interface CurriculoPreviewProps {
  curriculo: Curriculo;
}

/**
 * Renderiza o currículo como folha A4 sóbria (preto/cinza/branco, sem
 * brutalist). O layout interno muda conforme o campo "formato" do JSON.
 *
 * Container externo:
 * - A4 (210mm x 297mm), padding 18mm de margem visual
 * - Background branco, sombra discreta na tela só pra dar profundidade
 * - Classe "curriculo-print-target" usada pelo @media print pra mostrar
 *   só o currículo na hora de imprimir
 *
 * Os sub-componentes (sections/*) são compartilhados entre os 3 layouts.
 */
export default function CurriculoPreview({ curriculo }: CurriculoPreviewProps) {
  return (
    <div
      className="curriculo-print-target mx-auto bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "18mm",
        maxWidth: "100%",
      }}
    >
      <article className="font-body text-[11px] leading-relaxed text-slate-900">
        {curriculo.formato === "cronologico" ? (
          <CronologicoLayout curriculo={curriculo} />
        ) : curriculo.formato === "harvard" ? (
          <HarvardLayout curriculo={curriculo} />
        ) : (
          <HibridoLayout curriculo={curriculo} />
        )}
      </article>
    </div>
  );
}
