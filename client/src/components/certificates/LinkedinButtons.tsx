import { Linkedin } from "lucide-react";

import {
  CERT_LINKEDIN_ORG_ID,
  CERT_LINKEDIN_ORG_NAME,
  verificationUrl,
} from "./constants";

// Dois botoes distintos (item 4), so no estado already_issued:
// a) Add to Profile de certificacao, com os campos preenchidos;
// b) Share da URL publica (o LinkedIn ignora legenda ha anos, so a URL).
type LinkedinButtonsProps = {
  roadmapTitle: string;
  code: string;
  issuedAt: string;
};

function addToProfileUrl(
  roadmapTitle: string,
  code: string,
  issuedAt: string,
): string {
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: roadmapTitle,
    certId: code,
    certUrl: verificationUrl(code),
  });

  // organizationId ainda nao existe (Company Page pendente): enquanto null,
  // manda organizationName como texto.
  if (CERT_LINKEDIN_ORG_ID) {
    params.set("organizationId", CERT_LINKEDIN_ORG_ID);
  } else {
    params.set("organizationName", CERT_LINKEDIN_ORG_NAME);
  }

  const date = new Date(issuedAt);
  if (!Number.isNaN(date.getTime())) {
    params.set("issueYear", String(date.getFullYear()));
    params.set("issueMonth", String(date.getMonth() + 1));
  }

  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

function shareUrl(code: string): string {
  // Só a URL: passar texto de legenda nao funciona no LinkedIn.
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    verificationUrl(code),
  )}`;
}

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 px-4 py-2.5 text-sm font-black shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]";

export default function LinkedinButtons({
  roadmapTitle,
  code,
  issuedAt,
}: LinkedinButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={addToProfileUrl(roadmapTitle, code, issuedAt)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass} bg-[#0a66c2] text-white`}
      >
        <Linkedin className="h-4 w-4" />
        {/* TODO(Ana): copy do botao Add to Profile */}
        Adicionar ao perfil do LinkedIn
      </a>
      <a
        href={shareUrl(code)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass} bg-white text-slate-900`}
      >
        <Linkedin className="h-4 w-4" />
        {/* TODO(Ana): copy do botao compartilhar */}
        Compartilhar no LinkedIn
      </a>
    </div>
  );
}
