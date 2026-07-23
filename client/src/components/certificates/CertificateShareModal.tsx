import { useState } from "react";
import { Icon } from "@iconify/react";
import { Award, Check, Copy } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CERT_LINKEDIN_ORG_ID,
  verificationUrl,
} from "@/components/certificates/constants";

// Modal de compartilhar (dono-so). Areas, nesta ordem: (topo) adicionar ao
// perfil do LinkedIn destacado; link da pagina + copiar; texto pronto + copiar
// + dica; botoes de rede (LinkedIn, X, Email). Sem Instagram (nao ha share por
// link la). Reusa a construcao do Add to Profile e do share do LinkedIn.

function longText(
  trilha: string,
  horas: number,
  skills: string[],
  link: string,
): string {
  const skillLines = skills
    .slice(0, 4)
    .map((s) => `→ ${s}`)
    .join("\n");
  return `🎓 Trilha ${trilha} concluída na Bora na Tech!

Foram ${horas} horas de conteúdo, uma prova final com nota mínima e um certificado verificável no fim. Sem atalho.

O que eu levo dessa jornada:
${skillLines}

Se você está pensando em entrar (ou crescer) na área tech: o mais difícil é começar. O resto é constância.

Qual habilidade você está estudando agora? Me conta nos comentários 👇

Certificado verificável: ${link}

@Bora Na Tech #BoraNaTech #CarreiraTech #AprendizadoContinuo`;
}

function shortText(trilha: string, horas: number, link: string): string {
  return `🎓 Trilha ${trilha} concluída na Bora na Tech! ${horas}h de conteúdo e certificado verificável: ${link} #BoraNaTech`;
}

function addToProfileUrl(
  trilha: string,
  code: string,
  link: string,
  issuedAt: string,
): string {
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: trilha,
    certId: code,
    certUrl: link,
    organizationId: CERT_LINKEDIN_ORG_ID,
  });
  const date = new Date(issuedAt);
  if (!Number.isNaN(date.getTime())) {
    params.set("issueYear", String(date.getFullYear()));
    params.set("issueMonth", String(date.getMonth() + 1));
  }
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

const networkButtonClass =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-950 px-3 py-2.5 text-sm font-black shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]";

type CopyKey = "link" | "text" | null;

export default function CertificateShareModal({
  code,
  roadmapTitle,
  hours,
  issuedAt,
  skills,
  open,
  onOpenChange,
}: {
  code: string;
  roadmapTitle: string;
  hours: number;
  issuedAt: string;
  skills: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState<CopyKey>(null);

  const link = verificationUrl(code);
  const fullText = longText(roadmapTitle, hours, skills, link);
  const tweet = shortText(roadmapTitle, hours, link);
  const addUrl = addToProfileUrl(roadmapTitle, code, link, issuedAt);
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`Meu certificado Bora na Tech - ${roadmapTitle}`)}&body=${encodeURIComponent(fullText)}`;

  async function copy(value: string, key: Exclude<CopyKey, null>) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      // Sem clipboard (contexto inseguro): nao trava o modal; o usuario ainda
      // consegue selecionar o texto manualmente.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-black text-slate-950">
            {/* TODO(Ana): titulo do modal de compartilhar */}
            Compartilhar certificado
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* d. Adicionar ao perfil do LinkedIn (destacado, maior valor). */}
          <div className="rounded-[14px] border-[3px] border-slate-950 bg-[#EAF2FB] p-4 shadow-[4px_4px_0_#0a66c2]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[2.5px] border-slate-950 bg-white">
                <Award className="h-4 w-4 text-[#0a66c2]" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-950">
                  {/* TODO(Ana): titulo do bloco add to profile */}
                  Adicione às suas Licenças e Certificações
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-600">
                  {/* TODO(Ana): subtitulo do bloco add to profile */}
                  Registre esta conquista direto no seu perfil do LinkedIn.
                </p>
              </div>
            </div>
            <a
              href={addUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-950 bg-[#0a66c2] px-4 py-2.5 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
            >
              <Icon icon="ph:linkedin-logo-bold" className="text-lg" />
              {/* TODO(Ana): label do botao add to profile */}
              Adicionar ao perfil
            </a>
          </div>

          {/* a. Link da pagina + copiar. */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {/* TODO(Ana): rotulo do link */}
              Link do certificado
            </p>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={link}
                className="min-w-0 flex-1 rounded-[10px] border-[2.5px] border-slate-950 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
              />
              <button
                type="button"
                onClick={() => copy(link, "link")}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border-[2.5px] border-slate-950 bg-[#FFB800] px-3 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px"
              >
                {copied === "link" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "link" ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          {/* b. Texto pronto + copiar + dica. */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {/* TODO(Ana): rotulo do texto pronto */}
              Texto pronto para colar
            </p>
            <textarea
              readOnly
              value={fullText}
              rows={10}
              className="mt-2 w-full resize-none rounded-[12px] border-[2.5px] border-slate-950 bg-slate-50 p-3 text-sm font-medium leading-relaxed text-slate-700"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-500">
                No LinkedIn, digite @ e selecione Bora Na Tech para marcar a
                nossa página.
              </p>
              <button
                type="button"
                onClick={() => copy(fullText, "text")}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border-[2.5px] border-slate-950 bg-[#FFB800] px-3 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px"
              >
                {copied === "text" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "text" ? "Copiado" : "Copiar texto"}
              </button>
            </div>
          </div>

          {/* c. Botoes de rede. */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {/* TODO(Ana): rotulo dos botoes de rede */}
              Compartilhar em
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={linkedinShare}
                target="_blank"
                rel="noopener noreferrer"
                className={`${networkButtonClass} bg-[#0a66c2] text-white`}
              >
                <Icon icon="ph:linkedin-logo-bold" className="text-lg" />
                LinkedIn
              </a>
              <a
                href={xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${networkButtonClass} bg-slate-950 text-white`}
              >
                <Icon icon="ph:x-logo-bold" className="text-lg" />X
              </a>
              <a
                href={emailUrl}
                className={`${networkButtonClass} bg-white text-slate-950`}
              >
                <Icon icon="ph:envelope-simple-bold" className="text-lg" />
                Email
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
