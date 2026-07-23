import { useState } from "react";
import { FileText, ImageDown, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { certI18n, type CertLang } from "@/components/certificates/i18n";
import { downloadCertificateFile } from "@/services/certificateService";

// Modal de download (dono-so). Duas opcoes grandes: PDF e PNG. Cada uma dispara
// o download ja existente (rotas inalteradas, com ?lang). Falha de geracao
// (503/429) vira aviso amigavel; a pagina/visualizacao nao dependem disto.
type Busy = "pdf" | "image" | null;

export default function CertificateDownloadModal({
  code,
  lang,
  open,
  onOpenChange,
}: {
  code: string;
  lang: CertLang;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [busy, setBusy] = useState<Busy>(null);
  const [failed, setFailed] = useState(false);
  const t = certI18n(lang).dl;

  const options = [
    { format: "pdf" as const, label: "PDF", hint: t.pdfHint, Icon: FileText },
    { format: "image" as const, label: "PNG", hint: t.pngHint, Icon: ImageDown },
  ];

  async function handle(format: "pdf" | "image") {
    setBusy(format);
    setFailed(false);
    const result = await downloadCertificateFile(code, format, lang);
    if (!result.ok) setFailed(true);
    setBusy(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-black text-slate-950">
            {/* TODO(Ana): titulo do modal de download */}
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500">
            {/* TODO(Ana): subtitulo do modal de download */}
            {t.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {options.map(({ format, label, hint, Icon }) => (
            <button
              key={format}
              type="button"
              onClick={() => handle(format)}
              disabled={busy !== null}
              className="flex flex-col items-center gap-2 rounded-[14px] border-[2.5px] border-slate-950 bg-white px-4 py-6 text-center shadow-[4px_4px_0_#0f172a] transition-all hover:-translate-y-px hover:bg-[#FFF9E9] hover:shadow-[5px_5px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] border-slate-950 bg-[#FFB800]">
                {busy === format ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-950" />
                ) : (
                  <Icon className="h-5 w-5 text-slate-950" />
                )}
              </span>
              <span className="font-display text-lg font-black text-slate-950">
                {label}
              </span>
              <span className="text-xs font-semibold text-slate-500">{hint}</span>
            </button>
          ))}
        </div>

        {failed ? (
          <p className="text-center text-xs font-bold text-red-600">
            {/* TODO(Ana): copy do erro de geracao do arquivo */}
            {t.error}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
