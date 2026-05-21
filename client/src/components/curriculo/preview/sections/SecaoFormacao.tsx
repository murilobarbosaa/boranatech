import type { FormacaoItem } from "@shared/curriculo/schema";

import SectionHeading from "./SectionHeading";

interface SecaoFormacaoProps {
  title: string;
  items: FormacaoItem[];
  compact?: boolean;
}

export default function SecaoFormacao({ title, items, compact = false }: SecaoFormacaoProps) {
  if (!items || items.length === 0) return null;
  const gap = compact ? "space-y-1.5" : "space-y-2";
  return (
    <section className="mb-4">
      <SectionHeading>{title}</SectionHeading>
      <div className={gap}>
        {items.map((item, idx) => (
          <div key={idx} className="break-inside-avoid">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-[12px] font-bold text-slate-900">
                {item.curso}
                <span className="font-medium text-slate-700"> · {item.instituicao}</span>
              </h3>
              <span className="text-[10.5px] font-medium text-slate-500">{item.periodo}</span>
            </div>
            {item.status ? (
              <p className="mt-0.5 text-[10.5px] italic text-slate-600">{item.status}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
