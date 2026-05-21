import SectionHeading from "./SectionHeading";

interface ResumoProps {
  resumo: string;
  title: string;
}

export default function ResumoProfissional({ resumo, title }: ResumoProps) {
  const text = resumo?.trim();
  if (!text) return null;
  return (
    <section className="mb-4 break-inside-avoid">
      <SectionHeading>{title}</SectionHeading>
      <p className="text-[11px] leading-[1.55] text-slate-800">{text}</p>
    </section>
  );
}
