interface SectionHeadingProps {
  children: string;
}

/**
 * Heading H2 padrão de cada seção do currículo. Mesma cara em todos os
 * formatos (uppercase, tracking solto, semibold, com hairline cinza embaixo).
 */
export default function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h2 className="mb-2 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700">
      {children}
    </h2>
  );
}
