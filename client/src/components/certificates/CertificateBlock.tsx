import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";

import { CompletionCtaLinks } from "@/components/roadmapV2/RoadmapCompletionModal";
import { useAuth } from "@/contexts/AuthContext";
import type { CompletionCta } from "@/lib/roadmapV2/completionCtas";
import type { RoadmapV2 } from "@/lib/roadmapV2/types";
import {
  getEligibility,
  getPublicCertificate,
  issueCertificate,
} from "@/services/certificateService";
import type {
  Eligibility,
  MissingProfileField,
  PublicCertificate,
} from "@shared/certificates/types";

import CertificateDownloadButtons from "./CertificateDownloadButtons";
import CertificateView from "./CertificateView";
import CompleteProfileModal from "./CompleteProfileModal";
import LinkedinButtons from "./LinkedinButtons";

// Maquina de estados do bloco de conclusao (item 1), dirigida pelo GET de
// elegibilidade. UM estado por vez. O botao do LinkedIn SO existe em
// already_issued. Auto-contido: busca a elegibilidade, emite e reavalia sozinho
// (RoadmapsV2.tsx nao muda).
type CertificateBlockProps = {
  roadmap: RoadmapV2;
  completedDate: string;
  // next-trail + projects, herdadas do card; sem quiz nem share.
  secondaryCtas: CompletionCta[];
};

const MISSING_LABEL: Record<MissingProfileField, string> = {
  full_name: "nome completo",
  cpf: "CPF",
};

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]";

function asSecondary(ctas: CompletionCta[]): CompletionCta[] {
  return ctas.map((cta) => ({ ...cta, variant: "secondary" as const }));
}

function SuccessShell({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 rounded-[14px] border-[2.5px] border-slate-900 bg-emerald-50 p-5 shadow-[4px_4px_0_#10b981]">
      {title ? (
        <h2 className="font-display text-xl font-black text-slate-950">
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}

export default function CertificateBlock({
  roadmap,
  completedDate,
  secondaryCtas,
}: CertificateBlockProps) {
  const { user } = useAuth();
  const slug = roadmap.slug;

  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [issuedCert, setIssuedCert] = useState<PublicCertificate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getEligibility(slug);
    setEligibility(result);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  // already_issued: busca o certificado publico pelo code pra desenhar na tela.
  useEffect(() => {
    if (eligibility?.status !== "already_issued") {
      setIssuedCert(null);
      return;
    }
    let cancelled = false;
    getPublicCertificate(eligibility.code).then((cert) => {
      if (!cancelled) setIssuedCert(cert);
    });
    return () => {
      cancelled = true;
    };
  }, [eligibility]);

  const handleIssue = useCallback(async () => {
    setIssuing(true);
    setIssueError(false);
    const result = await issueCertificate(slug);
    if (result.ok) {
      // Nao monta o certificado com dado local otimista: reavalia do server e
      // cai em already_issued.
      await load();
    } else if ("reason" in result) {
      setEligibility(result.reason);
    } else {
      setIssueError(true);
    }
    setIssuing(false);
  }, [slug, load]);

  const completedTitle = `Você concluiu a trilha ${roadmap.title}!`;

  if (loading || !eligibility) {
    return (
      <SuccessShell title={completedTitle}>
        <div className="mt-4 flex justify-center py-2">
          <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
        </div>
      </SuccessShell>
    );
  }

  const dateLine = completedDate
    ? `Conclusão registrada em ${completedDate}.`
    : "Todos os passos obrigatórios estão concluídos.";

  switch (eligibility.status) {
    // Sem certificado possivel: bloco de conclusao simples, sem prova nem
    // LinkedIn. not_complete cai aqui de proposito (nao deveria acontecer).
    case "not_certifiable":
    case "no_quiz":
    case "not_complete":
      return (
        <SuccessShell title={completedTitle}>
          <p className="mt-1 text-sm font-semibold text-slate-600">{dateLine}</p>
          <div className="mt-4">
            <CompletionCtaLinks ctas={secondaryCtas} />
          </div>
        </SuccessShell>
      );

    case "quiz_required":
      return (
        <SuccessShell title={completedTitle}>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {/* TODO(Ana): a prova vale certificado */}
            Faça a prova final para conquistar seu certificado.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Link href={`/roadmaps/${slug}/prova`} className={primaryButtonClass}>
              {/* TODO(Ana): copy do botao de fazer a prova */}
              Fazer a prova final
            </Link>
            <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
          </div>
        </SuccessShell>
      );

    case "score_below_cert":
      return (
        <SuccessShell title={completedTitle}>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {/* TODO(Ana): nota atual vs barra do certificado */}
            Você passou com {eligibility.score}/10. O certificado exige{" "}
            {eligibility.certScore}/10.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Link href={`/roadmaps/${slug}/prova`} className={primaryButtonClass}>
              {/* TODO(Ana): copy do botao de refazer a prova */}
              Refazer a prova para certificar
            </Link>
            <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
          </div>
        </SuccessShell>
      );

    // Momento de maior conversao: celebra o que a pessoa conquistou, so entao
    // o upgrade. Sem LinkedIn (o certificado ainda nao existe).
    case "pro_required":
      return (
        <SuccessShell title={completedTitle}>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {/* TODO(Ana): certificado pronto, so falta o Pro */}
            Seu certificado de {eligibility.hours}h está pronto.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/planos" className={primaryButtonClass}>
              {/* TODO(Ana): copy do CTA de assinar */}
              Assinar o Pro para emitir
            </Link>
            <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
          </div>
        </SuccessShell>
      );

    // Aviso, nao erro: falta um passo.
    case "profile_incomplete":
      return (
        <>
          <SuccessShell title={completedTitle}>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {/* TODO(Ana): complete o perfil pra emitir */}
              Para emitir seu certificado de {eligibility.hours}h, complete seu
              perfil: {eligibility.missing.map((f) => MISSING_LABEL[f]).join(" e ")}
              .
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className={primaryButtonClass}
              >
                {/* TODO(Ana): copy do botao completar perfil */}
                Completar perfil
              </button>
              <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
            </div>
          </SuccessShell>
          <CompleteProfileModal
            open={modalOpen}
            missing={eligibility.missing}
            onClose={() => setModalOpen(false)}
            onSaved={() => {
              setModalOpen(false);
              void load();
            }}
          />
        </>
      );

    case "eligible":
      return (
        <SuccessShell title={completedTitle}>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {/* TODO(Ana): tudo pronto para emitir */}
            Está tudo pronto. Emita seu certificado quando quiser.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleIssue}
              disabled={issuing}
              className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {/* TODO(Ana): label do botao emitir */}
              {issuing
                ? "Emitindo..."
                : `Emitir certificado (${eligibility.hours}h)`}
            </button>
            {issueError ? (
              <p className="text-xs font-bold text-red-600">
                {/* TODO(Ana): erro ao emitir */}
                Não deu pra emitir agora. Tente de novo.
              </p>
            ) : null}
            <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
          </div>
        </SuccessShell>
      );

    case "already_issued":
      return (
        <SuccessShell title={completedTitle}>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {/* TODO(Ana): certificado emitido */}
            Seu certificado está emitido.
          </p>
          {issuedCert ? (
            <div className="mt-4">
              <CertificateView
                holderName={issuedCert.holderName}
                roadmapTitle={issuedCert.roadmapTitle}
                hours={issuedCert.hours}
                issuedAt={issuedCert.issuedAt}
                code={issuedCert.code}
              />
            </div>
          ) : null}
          <div className="mt-4 flex flex-col gap-3">
            {/* Aqui o usuario ja e o dono (acabou de emitir), entao os botoes
                aparecem direto; a rota reconfirma a posse server-side. */}
            <CertificateDownloadButtons code={eligibility.code} />
            <LinkedinButtons
              roadmapTitle={roadmap.title}
              code={eligibility.code}
              issuedAt={issuedCert?.issuedAt ?? ""}
            />
            <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
          </div>
        </SuccessShell>
      );

    // Erro e erro: nao esconde o bloco, nao finge sucesso, nao trata como
    // perfil incompleto.
    case "unavailable":
      return (
        <div className="mt-6 rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#ef4444]">
          <p className="text-sm font-bold text-slate-900">
            {/* TODO(Ana): erro ao verificar certificado */}
            Não conseguimos verificar seu certificado agora.
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className={`${primaryButtonClass} mt-4`}
          >
            {/* TODO(Ana): label do botao tentar de novo */}
            Tentar novamente
          </button>
        </div>
      );

    default:
      return null;
  }
}
