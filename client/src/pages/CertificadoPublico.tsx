import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";

import CertificateDownloadButtons from "@/components/certificates/CertificateDownloadButtons";
import { CERT_ISSUER_LEGAL } from "@/components/certificates/constants";
import LinkedinButtons from "@/components/certificates/LinkedinButtons";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPublicCertificate,
  getPublicCertificateSvg,
  listCertificates,
} from "@/services/certificateService";
import type { PublicCertificate } from "@shared/certificates/types";

// Pagina PUBLICA de verificacao (/certificados/:code), sem auth. Layout estilo
// Coursera: titulo da trilha + voltar no topo; o certificado (SVG de TELA, leve,
// renderizado INLINE para usar as fontes da pagina) em destaque de um lado;
// verificacao em prosa + infos + acoes do outro; habilidades em tags embaixo. O
// CPF NAO aparece (continua no snapshot). Estados: carregando, 404, revogado e
// valido.

function CenteredSpinner() {
  return (
    <div className="flex justify-center py-20">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="mt-10 text-center text-xs font-medium leading-relaxed text-slate-500">
      {CERT_ISSUER_LEGAL}
    </p>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Habilidades DERIVADAS do conteudo REAL da trilha: os titulos das secoes do
// snapshot congelado (a mesma ementa, sem as horas). Nao inventa tema novo;
// so normaliza espacos e deduplica. Exibido AO VIVO na pagina (nao entra no
// SVG/PDF congelado), entao derivar da trilha aqui e aceitavel.
function deriveSkills(syllabus: PublicCertificate["syllabus"]): string[] {
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const section of syllabus) {
    const name = section.title.replace(/\s+/g, " ").trim();
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      skills.push(name);
    }
  }
  return skills;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

export default function CertificadoPublico() {
  const params = useParams();
  const code = params.code ?? "";

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<PublicCertificate | null>(null);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  // null = ainda verificando (reserva espaco das acoes para nao dar layout shift).
  const [isOwner, setIsOwner] = useState<boolean | null>(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSvgMarkup(null);
    getPublicCertificate(code).then((result) => {
      if (cancelled) return;
      setCert(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  // SVG de tela, buscado em paralelo e renderizado inline (usa as fontes da
  // pagina). So faz sentido buscar quando o certificado existe e nao e revogado.
  useEffect(() => {
    if (!cert || cert.revoked) {
      setSvgMarkup(null);
      return;
    }
    let cancelled = false;
    getPublicCertificateSvg(cert.code).then((markup) => {
      if (!cancelled) setSvgMarkup(markup);
    });
    return () => {
      cancelled = true;
    };
  }, [cert]);

  // "Sou o dono?" sem expor user_id no payload publico: se logado, cruzo o code
  // com a lista dos MEUS certificados. Enquanto verifica, isOwner = null (reserva
  // o espaco das acoes). As acoes so aparecem quando o code esta na lista.
  useEffect(() => {
    if (!user || !cert || cert.revoked) {
      setIsOwner(false);
      return;
    }
    let cancelled = false;
    setIsOwner(null);
    listCertificates().then((list) => {
      if (!cancelled) setIsOwner(list.some((item) => item.code === cert.code));
    });
    return () => {
      cancelled = true;
    };
  }, [user, cert]);

  const skills = useMemo(
    () => (cert ? deriveSkills(cert.syllabus) : []),
    [cert],
  );

  const wide = !loading && cert !== null && !cert.revoked;

  return (
    <Layout>
      <SEO
        title="Verificação de certificado · Bora na Tech"
        description="Verifique a autenticidade de um certificado da Bora na Tech."
        url={`/certificados/${code}`}
      />
      <section className="bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div
          className={`mx-auto px-5 pb-20 pt-8 ${wide ? "max-w-6xl" : "max-w-[680px]"}`}
        >
          {loading ? (
            <CenteredSpinner />
          ) : !cert ? (
            <div className="mt-4 rounded-[16px] border-[3px] border-slate-950 bg-white p-8 text-center shadow-[6px_6px_0_#0f172a]">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] border-slate-900 bg-slate-100 shadow-[3px_3px_0_#0f172a]">
                <ShieldAlert className="h-6 w-6 text-slate-700" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-black text-slate-950">
                {/* TODO(Ana): titulo do 404 de certificado */}
                Certificado não encontrado.
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {/* TODO(Ana): corpo do 404 de certificado */}
                Confira o código e tente novamente.
              </p>
              <Disclaimer />
            </div>
          ) : cert.revoked ? (
            <div className="mt-4 rounded-[16px] border-[3px] border-red-600 bg-white p-8 text-center shadow-[6px_6px_0_#dc2626]">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] border-red-600 bg-red-100 shadow-[3px_3px_0_#dc2626]">
                <ShieldX className="h-6 w-6 text-red-700" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-black text-red-700">
                {/* TODO(Ana): titulo do certificado revogado */}
                Certificado revogado.
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {/* TODO(Ana): corpo do certificado revogado */}
                Este certificado foi revogado e não é válido.
              </p>
              {cert.revokedReason ? (
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {/* TODO(Ana): rotulo do motivo da revogacao */}
                  Motivo: {cert.revokedReason}
                </p>
              ) : null}
              <p className="mt-4 text-xs font-bold text-slate-400">{cert.code}</p>
              <Disclaimer />
            </div>
          ) : (
            <>
              {/* TOPO: voltar + subtitulo + titulo da trilha (estilo Coursera). */}
              <Link
                href={`/roadmaps/${cert.roadmapSlug}`}
                className="inline-flex items-center gap-1.5 text-sm font-black text-violet-800 transition-colors hover:text-violet-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {/* TODO(Ana): copy do voltar para a trilha */}
                Voltar para a trilha
              </Link>
              <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                {/* TODO(Ana): rotulo acima do titulo */}
                Certificado de conclusão
              </p>
              <h1 className="mt-1 font-display text-4xl font-black leading-tight text-slate-950">
                {cert.roadmapTitle}
              </h1>

              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                {/* COLUNA A: o certificado (SVG inline). aspect-ratio reserva o
                    espaco ANTES de carregar -> sem layout shift. */}
                <div className="overflow-hidden rounded-[16px] bg-[#3E1076] shadow-[8px_8px_0_#7c3aed]">
                  <div
                    className="aspect-[3508/2480] w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                    aria-label={`Certificado de ${cert.holderName}`}
                    {...(svgMarkup
                      ? { dangerouslySetInnerHTML: { __html: svgMarkup } }
                      : {})}
                  />
                </div>

                {/* COLUNA B: verificacao (prosa) + infos + acoes. */}
                <div className="flex flex-col gap-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">
                      <ShieldCheck className="h-4 w-4" />
                      {/* TODO(Ana): selo de valido */}
                      Verificado
                    </span>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700">
                      {/* TODO(Ana): texto de verificacao em prosa */}
                      A conta de{" "}
                      <span className="font-black text-slate-950">
                        {cert.holderName}
                      </span>{" "}
                      foi verificada. A Bora na Tech certifica a conclusão da
                      trilha {cert.roadmapTitle}.
                    </p>
                  </div>

                  <div className="flex flex-col gap-5 rounded-[16px] border-[3px] border-slate-950 bg-white p-6 shadow-[5px_5px_0_#0f172a]">
                    <InfoRow label="Titular" value={cert.holderName} />
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow
                        label="Concluído em"
                        value={formatDate(cert.issuedAt)}
                      />
                      <InfoRow label="Carga horária" value={`${cert.hours}h`} />
                    </div>
                    <p className="border-t-2 border-dashed border-slate-200 pt-3 text-xs font-bold text-slate-500">
                      {/* TODO(Ana): rotulo do codigo */}
                      Código:{" "}
                      <span className="font-black text-slate-900">
                        {cert.code}
                      </span>
                    </p>
                  </div>

                  {/* Acoes DONO-SO. isOwner === null -> ainda verificando: reserva
                      o espaco (skeleton) pra nao dar layout shift ao aparecer. */}
                  {isOwner === null ? (
                    <div className="h-[168px] animate-pulse rounded-[16px] border-[3px] border-slate-200 bg-slate-50" />
                  ) : isOwner ? (
                    <div className="rounded-[16px] border-[3px] border-slate-950 bg-[#FFF9E9] p-6 shadow-[5px_5px_0_#FFB800]">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        {/* TODO(Ana): titulo do bloco de acoes do dono */}
                        Compartilhe seu certificado
                      </p>
                      <div className="mt-4 flex flex-col gap-3">
                        <CertificateDownloadButtons code={cert.code} />
                        <LinkedinButtons
                          roadmapTitle={cert.roadmapTitle}
                          code={cert.code}
                          issuedAt={cert.issuedAt}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* HABILIDADES: tags leves (estilo "Skills you'll gain"), no lugar
                  do paredao de ementa. Derivadas das secoes da trilha. */}
              {skills.length > 0 ? (
                <div className="mt-10">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                    {/* TODO(Ana): titulo da secao de habilidades */}
                    Habilidades desenvolvidas
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2.5">
                    {skills.map((skill) => (
                      <li
                        key={skill}
                        className="rounded-full border-2 border-slate-950 bg-white px-3.5 py-1.5 text-sm font-bold text-slate-800 shadow-[2px_2px_0_#0f172a]"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <Disclaimer />
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
