import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Award, Search } from "lucide-react";

import { CERT_ISSUER_LEGAL } from "@/components/certificates/constants";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import {
  listCertificates,
  type CertificateListItem,
} from "@/services/certificateService";
import { normalizeCertificateCode } from "@shared/certificates/code";

// Pagina PUBLICA (sem RequireAuth): esta no sitemap e o prerender a visita.
// Deslogado ve so a explicacao e a busca; logado ve tambem seus certificados.
// Nenhuma rota autenticada e chamada sem sessao.

// Resolve o code digitado para a forma canonica BNT-XXXX-XXXX. Aceita com ou
// sem hifen (normalizeCertificateCode) e tambem sem o prefixo BNT: 8 caracteres
// do corpo viram BNT-XXXX-XXXX.
function resolveCode(raw: string): string {
  const normalized = normalizeCertificateCode(raw);
  const alnum = normalized.replace(/-/g, "");
  if (!alnum.startsWith("BNT") && alnum.length === 8) {
    return `BNT-${alnum.slice(0, 4)}-${alnum.slice(4)}`;
  }
  return normalized;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

export default function Certificados() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [codeInput, setCodeInput] = useState("");

  const [certs, setCerts] = useState<CertificateListItem[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  useEffect(() => {
    if (!user) {
      setCerts([]);
      return;
    }
    let cancelled = false;
    setLoadingCerts(true);
    listCertificates().then((list) => {
      if (cancelled) return;
      setCerts(list);
      setLoadingCerts(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const code = resolveCode(codeInput);
    if (!code) return;
    navigate(`/certificados/${code}`);
  }

  return (
    <Layout>
      <SEO
        title="Certificados · Bora na Tech"
        description="Verifique um certificado da Bora na Tech pelo código ou saiba como funciona a certificação das trilhas."
        url="/certificados"
      />
      <section className="bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div className="mx-auto max-w-[720px] px-5 pb-20 pt-10">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-900 shadow-[2px_2px_0_#0f172a]">
            <Award className="h-4 w-4" />
            {/* TODO(Ana): rotulo do cabecalho da pagina de certificados */}
            Certificados
          </span>
          <h1 className="mt-3.5 font-display text-3xl font-black leading-tight tracking-tight text-slate-950">
            {/* TODO(Ana): titulo da pagina de certificados */}
            Certificados Bora na Tech
          </h1>
          <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
            {/* TODO(Ana): revisar explicacao do certificado */}
            Cada trilha pode gerar um certificado de curso livre, emitido após a
            aprovação na prova final com a nota mínima. O certificado traz a
            carga horária e a ementa completa da trilha. Não é diploma, não
            confere título nem registro profissional.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]"
          >
            <label
              htmlFor="cert-code"
              className="block text-xs font-black uppercase tracking-wider text-slate-700"
            >
              {/* TODO(Ana): rotulo do campo de busca por codigo */}
              Verificar por código
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="cert-code"
                type="text"
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                placeholder="BNT-XXXX-XXXX"
                className="w-full rounded-[11px] border-[2.5px] border-slate-900 bg-white px-3.5 py-2.5 text-sm font-semibold uppercase text-slate-950 shadow-[3px_3px_0_#0f172a] outline-none focus:-translate-y-px focus:shadow-[4px_4px_0_#0f172a]"
              />
              <button
                type="submit"
                disabled={codeInput.trim() === ""}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {/* TODO(Ana): label do botao de verificar codigo */}
                Verificar
              </button>
            </div>
          </form>

          {user ? (
            <div className="mt-10">
              <h2 className="font-display text-xl font-black text-slate-950">
                {/* TODO(Ana): titulo da lista de certificados do usuario */}
                Meus certificados
              </h2>
              {loadingCerts ? (
                <div className="mt-4 flex justify-center py-6">
                  <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
                </div>
              ) : certs.length === 0 ? (
                <p className="mt-3 text-sm font-medium text-slate-600">
                  {/* TODO(Ana): estado vazio da lista de certificados */}
                  Você ainda não emitiu nenhum certificado. Conclua uma trilha e
                  seja aprovado na prova final para emitir o seu.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {certs.map((cert) => (
                    <li key={cert.code}>
                      <Link
                        href={`/certificados/${cert.code}`}
                        className="flex items-center justify-between gap-4 rounded-[12px] border-[2.5px] border-slate-900 bg-white px-4 py-3 shadow-[3px_3px_0_#7c3aed] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#7c3aed]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-display text-base font-black text-slate-950">
                            {cert.roadmapTitle}
                          </span>
                          <span className="block text-xs font-bold text-slate-500">
                            {cert.hours}h
                            {formatDate(cert.issuedAt)
                              ? ` · ${formatDate(cert.issuedAt)}`
                              : ""}{" "}
                            · {cert.code}
                          </span>
                        </span>
                        <Award className="h-5 w-5 shrink-0 text-violet-800" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          <p className="mt-10 text-center text-xs font-medium leading-relaxed text-slate-500">
            {CERT_ISSUER_LEGAL}
          </p>
        </div>
      </section>
    </Layout>
  );
}
