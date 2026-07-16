import { ShieldCheck } from "lucide-react";

import type { SyllabusSection } from "@shared/certificates/types";

import { CERT_ISSUER_LEGAL, verificationUrl } from "./constants";

// Certificado desenhado em HTML (nao e PDF; PDF e a fase 3). Reusado no card de
// conclusao (visao do titular, sem CPF) e na pagina publica (com CPF mascarado
// e ementa). Marca da casa: font-display, sombra solida, violeta/amarelo.
type CertificateViewProps = {
  holderName: string;
  roadmapTitle: string;
  hours: number;
  issuedAt: string;
  code: string;
  // So na pagina publica: ja vem mascarado do server, nunca mascare no client.
  cpfMasked?: string;
  // So na pagina publica: a ementa (secoes + horas) e o que faz uma coordenacao
  // aceitar o certificado.
  syllabus?: SyllabusSection[];
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function CertificateView({
  holderName,
  roadmapTitle,
  hours,
  issuedAt,
  code,
  cpfMasked,
  syllabus,
}: CertificateViewProps) {
  const issued = formatDate(issuedAt);
  const verifyUrl = verificationUrl(code);

  return (
    <div className="overflow-hidden rounded-[16px] border-[3px] border-slate-950 bg-white shadow-[6px_6px_0_#7c3aed]">
      <div className="border-b-[3px] border-slate-950 bg-[#FFB800] px-6 py-4">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-950">
          <ShieldCheck className="h-4 w-4" />
          {/* TODO(Ana): rotulo do cabecalho do certificado */}
          Certificado de conclusão
        </span>
      </div>

      <div className="px-6 py-7">
        {/* TODO(Ana): rotulo "concedido a" */}
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Concedido a
        </p>
        <p className="mt-1 font-display text-3xl font-black leading-tight text-slate-950">
          {holderName}
        </p>
        {cpfMasked ? (
          <p className="mt-1 text-sm font-bold text-slate-500">
            {/* TODO(Ana): rotulo do CPF mascarado */}
            CPF {cpfMasked}
          </p>
        ) : null}

        {/* TODO(Ana): texto "pela conclusao da trilha" */}
        <p className="mt-5 text-sm font-semibold text-slate-600">
          pela conclusão da trilha
        </p>
        <p className="mt-1 font-display text-2xl font-black text-violet-800">
          {roadmapTitle}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-[10px] border-[2.5px] border-slate-950 bg-emerald-100 px-3 py-1.5 text-sm font-extrabold text-emerald-800 shadow-[3px_3px_0_#0f172a]">
            {/* TODO(Ana): rotulo da carga horaria */}
            {hours}h de carga horária
          </span>
          {issued ? (
            <span className="rounded-[10px] border-[2.5px] border-slate-950 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-900 shadow-[3px_3px_0_#0f172a]">
              {/* TODO(Ana): rotulo da data de emissao */}
              Emitido em {issued}
            </span>
          ) : null}
        </div>

        {syllabus && syllabus.length > 0 ? (
          <div className="mt-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {/* TODO(Ana): rotulo da ementa */}
              Ementa
            </p>
            <ul className="mt-3 divide-y-2 divide-slate-200 rounded-[12px] border-[2.5px] border-slate-950 shadow-[4px_4px_0_#0f172a]">
              {syllabus.map((section) => (
                <li
                  key={section.id}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                >
                  <span className="text-sm font-bold text-slate-800">
                    {section.title}
                  </span>
                  <span className="shrink-0 text-sm font-black text-slate-500">
                    {section.hours}h
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-7 border-t-2 border-dashed border-slate-300 pt-4">
          <p className="text-xs font-bold text-slate-500">
            {/* TODO(Ana): rotulo do codigo de verificacao */}
            Código: <span className="font-black text-slate-900">{code}</span>
          </p>
          <p className="mt-1 break-all text-xs font-medium text-slate-500">
            {/* TODO(Ana): rotulo da URL de verificacao */}
            Verifique em{" "}
            <a
              href={verifyUrl}
              className="font-bold text-violet-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {verifyUrl}
            </a>
          </p>
          <p className="mt-2 text-xs font-medium text-slate-400">
            {CERT_ISSUER_LEGAL}
          </p>
        </div>
      </div>
    </div>
  );
}
