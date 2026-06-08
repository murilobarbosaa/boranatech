import type { ProjetoItem } from "@shared/curriculo/schema";

import SectionHeading from "./SectionHeading";

interface SecaoProjetosProps {
  title: string;
  items: ProjetoItem[];
  compact?: boolean;
}

export default function SecaoProjetos({
  title,
  items,
  compact = false,
}: SecaoProjetosProps) {
  if (!items || items.length === 0) return null;
  const gap = compact ? "space-y-2" : "space-y-2.5";
  return (
    <section className="mb-4">
      <SectionHeading>{title}</SectionHeading>
      <div className={gap}>
        {items.map((item, idx) => (
          <article key={idx} className="break-inside-avoid">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-[12px] font-bold text-slate-900">
                {item.nome}
              </h3>
              {item.link ? (
                <span className="text-[10.5px] font-medium text-slate-500">
                  {stripUrl(item.link)}
                </span>
              ) : null}
            </div>
            {item.descricao ? (
              <p className="mt-0.5 text-[11px] leading-[1.5] text-slate-800">
                {item.descricao}
              </p>
            ) : null}
            {item.tecnologias.length > 0 ? (
              <p className="mt-0.5 text-[10.5px] font-medium text-slate-600">
                {item.tecnologias.join(" · ")}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function stripUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}
