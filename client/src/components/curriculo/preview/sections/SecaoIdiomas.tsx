import type { IdiomaItem } from "@shared/curriculo/schema";

import SectionHeading from "./SectionHeading";

interface SecaoIdiomasProps {
  title: string;
  items: IdiomaItem[];
}

export default function SecaoIdiomas({ title, items }: SecaoIdiomasProps) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-4 break-inside-avoid">
      <SectionHeading>{title}</SectionHeading>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-800">
        {items.map((item, idx) => (
          <li key={idx}>
            <span className="font-semibold">{item.idioma}</span>
            <span className="text-slate-600"> · {item.nivel}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
