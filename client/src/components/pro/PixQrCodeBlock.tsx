import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";

import { getPixQrCode, type PixQrCode } from "@/services/subscriptionService";

/**
 * QR Code Pix na NOSSA tela, em vez da fatura hospedada do Asaas.
 *
 * HIERARQUIA POR DISPOSITIVO, e a razao e pratica: ninguem escaneia um QR
 * exibido na propria tela do celular. No mobile o copia-e-cola lidera e o QR
 * fica embaixo, para quem tem um segundo aparelho; no desktop o QR lidera,
 * porque ali o telefone e o leitor natural. Feito com a ordem do flex
 * (`flex-col-reverse` no mobile, `sm:flex-col`), sem duplicar markup: dois
 * blocos condicionais por breakpoint acabariam divergindo na primeira correcao.
 *
 * Tokens e formas da plataforma: borda `slate-950`, sombra flat, acento
 * `#FFB800`. Nenhuma dependencia nova, nada de `components/ui`.
 */

type Estado =
  | { fase: "carregando" }
  | { fase: "pronto"; qr: PixQrCode }
  | { fase: "erro" };

export default function PixQrCodeBlock({
  invoiceUrl,
}: {
  /** Fallback discreto: a fatura hospedada, quando o QR nao carrega. */
  invoiceUrl?: string | null;
}) {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    getPixQrCode()
      .then((qr) => {
        if (!cancelado) setEstado({ fase: "pronto", qr });
      })
      .catch(() => {
        if (!cancelado) setEstado({ fase: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiar(payload: string) {
    try {
      await navigator.clipboard.writeText(payload);
      setCopiado(true);
    } catch {
      // Clipboard bloqueado (contexto inseguro, permissao negada): o codigo
      // segue visivel e selecionavel na tela, entao a pessoa nao fica sem
      // caminho. Falhar aqui nao pode derrubar o bloco inteiro.
      setCopiado(false);
    }
  }

  if (estado.fase === "carregando") {
    return (
      <p className="mt-5 text-sm font-bold text-slate-600">
        {/* TODO(Ana): estado de carregamento do codigo Pix. */}
        Gerando seu código Pix...
      </p>
    );
  }

  if (estado.fase === "erro") {
    return (
      <div className="mt-5 rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[3px_3px_0_#0f172a]">
        {/* TODO(Ana): copy da falha ao gerar o codigo Pix. */}
        <p className="text-sm font-bold text-slate-800">
          Não foi possível gerar o código agora.
        </p>
        {invoiceUrl ? (
          <a
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-violet-800 underline"
          >
            {/* TODO(Ana): rotulo do fallback para a fatura. */}
            Abrir a fatura para pagar
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
          </a>
        ) : null}
      </div>
    );
  }

  const { qr } = estado;

  return (
    <div className="mt-5 flex flex-col-reverse gap-4 sm:flex-col">
      {/* COPIA-E-COLA. Primeiro no DOM em telas pequenas por causa do
          flex-col-reverse; no desktop desce para baixo do QR. */}
      <div className="rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[3px_3px_0_#0f172a]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
          {/* TODO(Ana): rotulo do copia-e-cola. */}
          Pix copia e cola
        </p>
        <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-slate-700">
          {qr.payload}
        </p>
        <button
          type="button"
          onClick={() => void copiar(qr.payload)}
          className="bnt-pressable mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-[#FFB800] px-4 py-2 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5"
        >
          {copiado ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={2.5} />
          )}
          {/* TODO(Ana): rotulos do botao de copiar (normal e copiado). */}
          {copiado ? "Copiado!" : "Copiar código"}
        </button>
      </div>

      {/* QR CODE. Lidera no desktop. */}
      <div className="flex flex-col items-center rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[3px_3px_0_#0f172a]">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
          <QrCode className="h-3.5 w-3.5" strokeWidth={2.5} />
          {/* TODO(Ana): rotulo do QR Code. */}
          Escaneie no app do banco
        </span>
        <img
          src={`data:image/png;base64,${qr.encodedImage}`}
          alt="QR Code do Pix"
          className="mt-3 h-44 w-44 rounded-xl border-2 border-slate-950"
        />
      </div>

      {invoiceUrl ? (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-center text-xs font-bold text-slate-500 underline"
        >
          {/* TODO(Ana): rotulo do fallback discreto da fatura. */}
          Preferir a fatura do provedor
        </a>
      ) : null}
    </div>
  );
}
