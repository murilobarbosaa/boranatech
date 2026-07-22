import { useState } from "react";
import { Download, ImageDown } from "lucide-react";

import { downloadCertificateFile } from "@/services/certificateService";

// Botoes de download DONO-SO (PDF + imagem PNG). So devem ser renderizados
// quando o requisitante e o dono; a trava REAL e no server (403 pro nao-dono).
// Falha de geracao (Chromium indisponivel, 503/429) vira aviso amigavel, nunca
// quebra a pagina nem some com o certificado visivel.
type Busy = "pdf" | "image" | null;

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-50";

export default function CertificateDownloadButtons({ code }: { code: string }) {
  const [busy, setBusy] = useState<Busy>(null);
  const [failed, setFailed] = useState(false);

  async function handle(format: "pdf" | "image") {
    setBusy(format);
    setFailed(false);
    const result = await downloadCertificateFile(code, format);
    if (!result.ok) setFailed(true);
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handle("pdf")}
          disabled={busy !== null}
          className={buttonClass}
        >
          <Download className="h-4 w-4" />
          {/* TODO(Ana): label do botao baixar PDF */}
          {busy === "pdf" ? "Gerando..." : "Baixar PDF"}
        </button>
        <button
          type="button"
          onClick={() => handle("image")}
          disabled={busy !== null}
          className={buttonClass}
        >
          <ImageDown className="h-4 w-4" />
          {/* TODO(Ana): label do botao baixar imagem */}
          {busy === "image" ? "Gerando..." : "Baixar imagem"}
        </button>
      </div>
      {failed ? (
        <p className="text-xs font-bold text-red-600">
          {/* TODO(Ana): copy do erro ao gerar o arquivo do certificado */}
          Não foi possível gerar o arquivo agora. Tente mais tarde.
        </p>
      ) : null}
    </div>
  );
}
