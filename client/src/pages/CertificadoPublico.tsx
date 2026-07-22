import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { ShieldAlert, ShieldX } from "lucide-react";

import CertificateDownloadButtons from "@/components/certificates/CertificateDownloadButtons";
import CertificateView from "@/components/certificates/CertificateView";
import { CERT_ISSUER_LEGAL } from "@/components/certificates/constants";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPublicCertificate,
  listCertificates,
} from "@/services/certificateService";
import type { PublicCertificate } from "@shared/certificates/types";

// Pagina PUBLICA de verificacao (/certificados/:code), sem auth. Consome o
// endpoint publico. Estados: carregando, 404, revogado e valido. Segue o
// precedente de /projetos/:id (rota publica com param dinamico).

function CenteredSpinner() {
  return (
    <div className="flex justify-center py-20">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
    </div>
  );
}

// Rodape legal do emissor, comum a todos os estados.
function Disclaimer() {
  return (
    <p className="mt-6 text-center text-xs font-medium leading-relaxed text-slate-500">
      {CERT_ISSUER_LEGAL}
    </p>
  );
}

export default function CertificadoPublico() {
  const params = useParams();
  const code = params.code ?? "";

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<PublicCertificate | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublicCertificate(code).then((result) => {
      if (cancelled) return;
      setCert(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  // "Sou o dono?" sem expor user_id no payload publico: se logado, cruzo o code
  // com a lista dos MEUS certificados (GET /api/certificates ja e dono-so). Os
  // botoes de download so aparecem quando o code esta nela.
  useEffect(() => {
    if (!user || !cert || cert.revoked) {
      setIsOwner(false);
      return;
    }
    let cancelled = false;
    listCertificates().then((list) => {
      if (!cancelled) setIsOwner(list.some((item) => item.code === cert.code));
    });
    return () => {
      cancelled = true;
    };
  }, [user, cert]);

  return (
    <Layout>
      <SEO
        title="Verificação de certificado · Bora na Tech"
        description="Verifique a autenticidade de um certificado da Bora na Tech."
        url={`/certificados/${code}`}
      />
      <section className="bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div className="mx-auto max-w-[680px] px-5 pb-20 pt-10">
          {loading ? (
            <CenteredSpinner />
          ) : !cert ? (
            <div className="rounded-[16px] border-[3px] border-slate-950 bg-white p-8 text-center shadow-[6px_6px_0_#0f172a]">
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
            <div className="rounded-[16px] border-[3px] border-red-600 bg-white p-8 text-center shadow-[6px_6px_0_#dc2626]">
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
              <p className="mt-4 text-xs font-bold text-slate-400">
                {cert.code}
              </p>
              <Disclaimer />
            </div>
          ) : (
            <>
              <CertificateView
                holderName={cert.holderName}
                roadmapTitle={cert.roadmapTitle}
                hours={cert.hours}
                issuedAt={cert.issuedAt}
                code={cert.code}
                cpfMasked={cert.cpfMasked}
                syllabus={cert.syllabus}
              />
              {isOwner ? (
                <div className="mt-5">
                  <CertificateDownloadButtons code={cert.code} />
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
