import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Download,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

import CertificateDownloadModal from "@/components/certificates/CertificateDownloadModal";
import CertificateShareModal from "@/components/certificates/CertificateShareModal";
import { CERT_ISSUER_LEGAL } from "@/components/certificates/constants";
import {
  certI18n,
  formatCertDate,
  type CertLang,
} from "@/components/certificates/i18n";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { roadmapsV2 } from "@shared/roadmapV2/content";
import { deriveTrilhaSkills } from "@shared/certificates/skills";
import { localizedRoadmapTitle } from "@shared/certificates/roadmapTitlesEn";
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

const actionButtonClass =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-950 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:bg-[#FFF9E9] hover:shadow-[4px_4px_0_#0f172a]";

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

// Bandeiras em SVG inline (emoji de bandeira nao renderiza como bandeira no
// Windows/Chrome; o publico e majoritariamente Windows, entao SVG e consistente).
function FlagBR() {
  return (
    <svg viewBox="0 0 28 20" className="h-4 w-6 rounded-[3px]" aria-hidden="true">
      <rect width="28" height="20" fill="#009B3A" />
      <path d="M14 2 L26 10 L14 18 L2 10 Z" fill="#FEDF00" />
      <circle cx="14" cy="10" r="4.3" fill="#002776" />
    </svg>
  );
}

function FlagUS() {
  return (
    <svg viewBox="0 0 28 20" className="h-4 w-6 rounded-[3px]" aria-hidden="true">
      <rect width="28" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} y={(y * 20) / 13} width="28" height={20 / 13} fill="#B22234" />
      ))}
      <rect width="12" height={(7 * 20) / 13} fill="#3C3B6E" />
    </svg>
  );
}

const LANGS = [
  { code: "pt" as const, label: "Português", Flag: FlagBR },
  { code: "en" as const, label: "English", Flag: FlagUS },
];

// Le o idioma do ?lang da URL (padrao do projeto: URLSearchParams sobre
// window.location.search). Ausente ou qualquer valor != "en" -> pt.
function readLangFromUrl(): CertLang {
  if (typeof window === "undefined") return "pt";
  return new URLSearchParams(window.location.search).get("lang") === "en"
    ? "en"
    : "pt";
}

// Escreve o idioma na URL sem recarregar (replaceState). EN -> ?lang=en; PT ->
// limpa o param. Preserva outros params/hash.
function writeLangToUrl(lang: CertLang): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (lang === "en") url.searchParams.set("lang", "en");
  else url.searchParams.delete("lang");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}

// Seletor de bandeiras (DONO-SO) + balao de quadrinho ancorado absoluto (nao
// empurra a altura). No mobile o balao some (hidden sm:block) pra nao sobrepor
// o titulo.
function LangSelector({
  lang,
  onChange,
}: {
  lang: CertLang;
  onChange: (lang: CertLang) => void;
}) {
  return (
    <div className="relative shrink-0">
      <div className="absolute bottom-full right-0 mb-2 hidden sm:block">
        <div className="relative w-max max-w-[230px] rounded-[10px] border-[2.5px] border-slate-950 bg-white px-3 py-1.5 text-xs font-black leading-snug text-slate-800 shadow-[2px_2px_0_#0f172a]">
          {/* TODO(Ana): copy do balao */}
          Qual linguagem você quer o seu certificado?
          <span className="absolute -bottom-[7px] right-6 h-3 w-3 rotate-45 border-b-[2.5px] border-r-[2.5px] border-slate-950 bg-white" />
        </div>
      </div>
      <div className="inline-flex items-center gap-1 rounded-full border-[2.5px] border-slate-950 bg-white p-1 shadow-[2px_2px_0_#0f172a]">
        {LANGS.map(({ code, label, Flag }) => (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            aria-label={label}
            title={label}
            aria-pressed={lang === code}
            className={`flex items-center justify-center rounded-full p-1.5 transition-all ${
              lang === code
                ? "bg-[#FFB800]"
                : "opacity-40 grayscale hover:opacity-80"
            }`}
          >
            <Flag />
          </button>
        ))}
      </div>
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
  const [shareOpen, setShareOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  // Idioma da APRESENTACAO, INICIALIZADO PELA URL (?lang=en). So estado local +
  // querystring, sem persistir em banco; o snapshot fica PT. Quem abre um link
  // com ?lang=en ve a pagina em EN direto, sem interacao.
  const [lang, setLang] = useState<CertLang>(readLangFromUrl);

  // Troca de idioma (so o dono usa): atualiza o estado E a URL (replaceState),
  // pra o link da barra de endereco / copiar ja levar o idioma.
  const changeLang = useCallback((next: CertLang) => {
    setLang(next);
    writeLangToUrl(next);
  }, []);

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
  // pagina). Refaz o fetch ao trocar o idioma (o EN e gerado na hora no server;
  // o ?lang separa o cache). So busca quando o certificado existe e nao revogado.
  useEffect(() => {
    if (!cert || cert.revoked) {
      setSvgMarkup(null);
      return;
    }
    let cancelled = false;
    setSvgMarkup(null);
    getPublicCertificateSvg(cert.code, lang).then((markup) => {
      if (!cancelled) setSvgMarkup(markup);
    });
    return () => {
      cancelled = true;
    };
  }, [cert, lang]);

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

  // Habilidades + texto de contexto DERIVADOS do conteudo REAL da trilha
  // (secoes + topicos + descricao), via um reconhecedor deterministico. Exibido
  // AO VIVO (nao entra no SVG/PDF congelado), entao derivar da trilha e ok.
  const trilhaSkills = useMemo(() => {
    if (!cert) return { context: "", tags: [] as string[] };
    const roadmap = roadmapsV2.find((r) => r.slug === cert.roadmapSlug);
    return roadmap
      ? deriveTrilhaSkills(roadmap, lang)
      : { context: "", tags: [] as string[] };
  }, [cert, lang]);

  const t = certI18n(lang);
  // Titulo da trilha no idioma atual (h1, prosa, modais). O EN vem do mapa.
  const trilhaTitle = cert
    ? localizedRoadmapTitle(cert.roadmapSlug, cert.roadmapTitle, lang)
    : "";
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
          className={`mx-auto px-5 pb-20 pt-6 ${wide ? "max-w-6xl" : "max-w-[680px]"}`}
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
                {t.notFoundTitle}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {/* TODO(Ana): corpo do 404 de certificado */}
                {t.notFoundBody}
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
                {t.revokedTitle}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {/* TODO(Ana): corpo do certificado revogado */}
                {t.revokedBody}
              </p>
              {cert.revokedReason ? (
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {/* TODO(Ana): rotulo do motivo da revogacao */}
                  {t.revokedReason} {cert.revokedReason}
                </p>
              ) : null}
              <p className="mt-4 text-xs font-bold text-slate-400">{cert.code}</p>
              <Disclaimer />
            </div>
          ) : (
            <>
              {/* TOPO: voltar; depois titulo (esquerda) + seletor de idioma na
                  MESMA linha do titulo (direita), pra ficar perto do certificado
                  e nao empurrar tudo pra baixo. */}
              <Link
                href={`/roadmaps/${cert.roadmapSlug}`}
                className="inline-flex items-center gap-1.5 text-sm font-black text-violet-800 transition-colors hover:text-violet-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {/* TODO(Ana): copy do voltar para a trilha */}
                {t.backToTrail}
              </Link>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                    {/* TODO(Ana): rotulo acima do titulo */}
                    {t.certificateOfCompletion}
                  </p>
                  <h1 className="mt-1 font-display text-4xl font-black leading-tight text-slate-950">
                    {trilhaTitle}
                  </h1>
                </div>
                {/* Seletor de idioma (bandeiras) + balao: SO PARA O DONO. O
                    visitante nao escolhe (a lingua vem da URL); sem seletor, o
                    titulo ocupa a linha inteira, sem buraco nem flicker. */}
                {isOwner === true ? (
                  <LangSelector lang={lang} onChange={changeLang} />
                ) : null}
              </div>

              {/* Certificado (heroi) a DIREITA no desktop, painel a esquerda
                  (estilo Coursera). O certificado vem PRIMEIRO no DOM (heroi
                  primeiro no mobile empilhado); no desktop, order inverte pra
                  ele ficar na coluna maior a direita. As acoes ficam ABAIXO do
                  certificado (coluna direita). */}
              <div className="mt-6 grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
                {/* COLUNA DO CERTIFICADO: o SVG (integro, sem clip) + acoes. */}
                <div className="flex flex-col gap-4 lg:order-last">
                  {/* SVG inline. aspect-ratio reserva o espaco (mesma proporcao
                      do SVG) ANTES de carregar -> sem layout shift. Sem
                      rounded/overflow: o SVG aparece integro (nao corta o topo);
                      o proprio design ja tem moldura e sombra. */}
                  {svgMarkup ? (
                    <div
                      className="aspect-[3508/2480] w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                      aria-label={`Certificado de ${cert.holderName}`}
                      dangerouslySetInnerHTML={{ __html: svgMarkup }}
                    />
                  ) : (
                    <div className="aspect-[3508/2480] w-full animate-pulse rounded-[12px] bg-slate-200" />
                  )}

                  {/* Acoes DONO-SO abaixo do certificado. isOwner === null ->
                      ainda verificando: reserva a altura (skeleton) pra nao dar
                      layout shift ao aparecer. Dois botoes -> modais. */}
                  {isOwner === null ? (
                    <div className="h-[52px] w-full animate-pulse rounded-[11px] bg-slate-100" />
                  ) : isOwner ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setShareOpen(true)}
                        className={actionButtonClass}
                      >
                        <Share2 className="h-4 w-4" />
                        {/* TODO(Ana): label do botao compartilhar */}
                        {t.shareBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDownloadOpen(true)}
                        className={actionButtonClass}
                      >
                        <Download className="h-4 w-4" />
                        {/* TODO(Ana): label do botao baixar */}
                        {t.downloadBtn}
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* PAINEL (esquerda): verificacao (prosa) + infos. Sem acoes. */}
                <div className="flex flex-col gap-6 lg:order-first">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">
                      <ShieldCheck className="h-4 w-4" />
                      {/* TODO(Ana): selo de valido */}
                      {t.verified}
                    </span>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700">
                      {/* TODO(Ana): texto de verificacao em prosa */}
                      {(() => {
                        const prose = t.verificationProse(
                          cert.holderName,
                          trilhaTitle,
                        );
                        return (
                          <>
                            {prose.before}
                            <span className="font-black text-slate-950">
                              {prose.name}
                            </span>
                            {prose.after}
                          </>
                        );
                      })()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-5 rounded-[16px] border-[3px] border-slate-950 bg-white p-6 shadow-[5px_5px_0_#0f172a]">
                    <InfoRow label={t.recipient} value={cert.holderName} />
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow
                        label={t.completedOn}
                        value={formatCertDate(cert.issuedAt, lang)}
                      />
                      <InfoRow label={t.totalHours} value={`${cert.hours}h`} />
                    </div>
                    <p className="border-t-2 border-dashed border-slate-200 pt-3 text-xs font-bold text-slate-500">
                      {/* TODO(Ana): rotulo do codigo */}
                      {t.code}:{" "}
                      <span className="font-black text-slate-900">
                        {cert.code}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* HABILIDADES: tags limpas (so tecnologias/habilidades reais,
                  derivadas do conteudo da trilha). Sem texto de contexto por
                  enquanto (o roadmap.description carrega copy de navegacao da
                  trilha, fora de lugar aqui). */}
              {trilhaSkills.tags.length > 0 ? (
                <div className="mt-12">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                    {/* TODO(Ana): titulo da secao de habilidades */}
                    {t.skillsTitle}
                  </p>
                  {/* TODO(Ana): texto de contexto proprio do certificado */}
                  <ul className="mt-4 flex flex-wrap gap-2.5">
                    {trilhaSkills.tags.map((skill) => (
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

              {/* Modais dono-so (renderizados fechados; abertos pelos botoes).
                  Recebem o idioma atual; o titulo ja vai localizado. */}
              <CertificateShareModal
                code={cert.code}
                roadmapTitle={trilhaTitle}
                hours={cert.hours}
                issuedAt={cert.issuedAt}
                skills={trilhaSkills.tags}
                lang={lang}
                open={shareOpen}
                onOpenChange={setShareOpen}
              />
              <CertificateDownloadModal
                code={cert.code}
                lang={lang}
                open={downloadOpen}
                onOpenChange={setDownloadOpen}
              />
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
