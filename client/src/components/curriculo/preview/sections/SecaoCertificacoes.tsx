import type { CertificacaoItem } from "@shared/curriculo/schema";

import SectionHeading from "./SectionHeading";

interface SecaoCertificacoesProps {
  title: string;
  items: CertificacaoItem[] | null;
}

export default function SecaoCertificacoes({ title, items }: SecaoCertificacoesProps) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-4 break-inside-avoid">
      <SectionHeading>{title}</SectionHeading>
      <ul className="space-y-1 text-[11px] text-slate-800">
        {items.map((item, idx) => (
          <li key={idx} className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span>
              <span className="font-semibold">{item.nome}</span>
              {item.instituicao ? (
                <span className="text-slate-700"> · {item.instituicao}</span>
              ) : null}
            </span>
            {item.ano ? <span className="text-[10.5px] font-medium text-slate-500">{item.ano}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
