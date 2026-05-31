import type { ExperienciaItem } from "@shared/curriculo/schema";

import SectionHeading from "./SectionHeading";

interface SecaoExperienciaProps {
  title: string;
  items: ExperienciaItem[];
  compact?: boolean;
}

/**
 * Lista de experiências profissionais. O título é injetado pelo layout
 * (pode ser "Experiência Profissional" ou "Projetos e Atividades" pra
 * persona estudante, respeitando idioma).
 */
export default function SecaoExperiencia({
  title,
  items,
  compact = false,
}: SecaoExperienciaProps) {
  if (!items || items.length === 0) return null;
  const gap = compact ? "space-y-2.5" : "space-y-3.5";
  return (
    <section className="mb-4">
      <SectionHeading>{title}</SectionHeading>
      <div className={gap}>
        {items.map((item, idx) => (
          <article key={idx} className="break-inside-avoid">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-[12.5px] font-bold text-slate-900">
                {item.cargo}
                <span className="font-medium text-slate-700">
                  {" "}
                  · {item.empresa}
                </span>
              </h3>
              {item.periodo ? (
                <span className="text-[10.5px] font-medium text-slate-500">
                  {item.periodo}
                </span>
              ) : null}
            </div>
            {item.responsabilidades.length > 0 || item.conquistas.length > 0 ? (
              <ul className="mt-1.5 list-outside list-disc pl-4 text-[11px] leading-[1.5] text-slate-800 marker:text-slate-400">
                {item.responsabilidades.map((bullet, b) => (
                  <li key={`r${b}`}>{bullet}</li>
                ))}
                {item.conquistas.map((bullet, b) => (
                  <li key={`c${b}`} className="font-medium">
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
