import SectionHeading from "./SectionHeading";

interface SecaoHabilidadesProps {
  title: string;
  items: string[];
  variant?: "wrap" | "inline";
}

/**
 * Lista de habilidades. variant="wrap" (default) usa chips/pills leves;
 * variant="inline" (Harvard) usa texto corrido separado por · pra
 * economizar espaço vertical.
 */
export default function SecaoHabilidades({ title, items, variant = "wrap" }: SecaoHabilidadesProps) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-4 break-inside-avoid">
      <SectionHeading>{title}</SectionHeading>
      {variant === "inline" ? (
        <p className="text-[11px] leading-[1.5] text-slate-800">{items.join(" · ")}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((skill, idx) => (
            <li
              key={idx}
              className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10.5px] font-medium text-slate-800"
            >
              {skill}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
