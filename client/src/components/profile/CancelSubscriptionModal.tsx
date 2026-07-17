import { useEffect, useState } from "react";
import { AlertTriangle, X, type LucideIcon } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PRO_TOOL_ICONS } from "@/lib/proToolIcons";

type CancelReasonCode =
  | "expensive"
  | "unused"
  | "missing_feature"
  | "paused"
  | "other";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    reason_code?: CancelReasonCode;
    reason_text?: string;
  }) => Promise<void>;
  periodEnd?: string | null;
  isLoading?: boolean;
  // "cancel" = cartao (cancela a recorrencia). "non_renewal" = boleto (avisa que
  // nao vai renovar; nao ha recorrencia a cancelar). So muda a copy; o motivo e
  // coletado nos dois casos.
  mode?: "cancel" | "non_renewal";
}

const REASONS: Array<{ code: CancelReasonCode; label: string }> = [
  { code: "expensive", label: "Está caro pra mim agora" },
  { code: "unused", label: "Não estou usando o suficiente" },
  { code: "missing_feature", label: "Faltou alguma funcionalidade" },
  { code: "paused", label: "Vou pausar, volto depois" },
  { code: "other", label: "Outro motivo" },
];

const BENEFITS: Array<{ Icon: LucideIcon; text: string }> = [
  { Icon: PRO_TOOL_ICONS.iaPessoal, text: "Ferramentas de IA pra acelerar a carreira" }, // TODO(Ana): revisar copy sem contagem
  { Icon: PRO_TOOL_ICONS.roadmapIA, text: "Roadmaps completos e plano de carreira personalizado" }, // TODO(Ana): validar copy
  { Icon: PRO_TOOL_ICONS.avaliadorCurriculo, text: "Analisador de currículo, LinkedIn e portfólio com IA" },
  { Icon: PRO_TOOL_ICONS.simuladorEntrevistas, text: "Simulador de entrevistas técnicas e comportamentais" },
  { Icon: PRO_TOOL_ICONS.avaliadorGithub, text: "Análise de GitHub com IA" }, // TODO(Ana): revisar beneficio substituto
];

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  periodEnd,
  isLoading,
  mode = "cancel",
}: CancelSubscriptionModalProps) {
  const isNonRenewal = mode === "non_renewal";
  const [step, setStep] = useState<"retain" | "reason">("retain");
  const [reasonCode, setReasonCode] = useState<CancelReasonCode | "">("");
  const [reasonText, setReasonText] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setStep("retain");
      setReasonCode("");
      setReasonText("");
    }
  }, [isOpen]);

  const formattedDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const handleSubmit = async () => {
    await onConfirm({
      reason_code: reasonCode || undefined,
      reason_text: reasonText.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-h-[85vh] gap-0 overflow-y-auto rounded-3xl border-2 border-[#1a1a1a] bg-white p-0 shadow-[4px_4px_0_#0f172a]"
      >
        <DialogTitle className="sr-only">
          {isNonRenewal ? "Não renovar assinatura" : "Cancelar assinatura"}
        </DialogTitle>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full border-2 border-[#1a1a1a] bg-white p-1.5 text-[#1a1a1a] shadow-[2px_2px_0_#0f172a] transition-colors duration-200 hover:border-rose-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          <X className="h-4 w-4" strokeWidth={3} />
        </button>

        {step === "retain" ? (
          <div className="p-6 md:p-8">
            {/* TODO(Ana): copy do topo do modal (cartao vs boleto). */}
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {isNonRenewal ? "Não renovar" : "Cancelamento"}
            </p>
            <h2 className="font-display mt-2 text-3xl font-black text-[#1a1a1a] md:text-4xl">
              {isNonRenewal
                ? "Espera, antes de decidir..."
                : "Espera, antes de cancelar..."}
            </h2>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {isNonRenewal ? (
                <>
                  Sua assinatura por boleto não renova sozinha. Se você avisar
                  que não vai continuar, seu acesso Pro segue até{" "}
                  {formattedDate ?? "o fim do período"}. Olha o que você ainda
                  tem disponível:
                </>
              ) : (
                <>
                  Você vai perder acesso ao Pro{" "}
                  {formattedDate ? `em ${formattedDate}` : "no fim do período"}.
                  Tem certeza? Olha o que você ainda tem disponível:
                </>
              )}
            </p>

            <ul className="mt-6 space-y-3">
              {BENEFITS.map(({ Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-2xl border-2 border-[#1a1a1a] bg-[#faf8f4] p-3"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[#1a1a1a] bg-[#FFB800] text-slate-950">
                    <Icon className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold text-[#1a1a1a]">
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="pro-glare bnt-pressable inline-flex flex-1 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full border-2 border-slate-900 bg-[#FFB800] px-5 py-3 font-display font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a]"
              >
                Quero continuar Pro
              </button>
              <button
                type="button"
                onClick={() => setStep("reason")}
                className="bnt-pressable inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-3 font-display font-black text-slate-600 shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#1a1a1a] hover:shadow-[5px_5px_0_#0f172a]"
              >
                {/* TODO(Ana): rotulo do botao de avancar (cartao vs boleto). */}
                {isNonRenewal ? "Não vou renovar" : "Cancelar mesmo assim"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[#1a1a1a] bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-black text-[#1a1a1a] md:text-3xl">
                  {/* TODO(Ana): titulo do passo de motivo (cartao vs boleto). */}
                  {isNonRenewal
                    ? "Por que você não vai renovar?"
                    : "Por que você está cancelando?"}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Sua resposta é opcional e nos ajuda a melhorar o produto.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {REASONS.map((reason) => {
                const selected = reasonCode === reason.code;
                return (
                  <label
                    key={reason.code}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-colors ${
                      selected
                        ? "border-[#1a1a1a] bg-[#faf8f4] shadow-[2px_2px_0_#0f172a]"
                        : "border-slate-200 bg-white hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.code}
                      checked={selected}
                      onChange={(event) =>
                        setReasonCode(event.target.value as CancelReasonCode)
                      }
                      className="h-4 w-4 accent-[#1a1a1a]"
                    />
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {reason.label}
                    </span>
                  </label>
                );
              })}
            </div>

            <textarea
              placeholder="Quer contar mais? (opcional)"
              value={reasonText}
              onChange={(event) => setReasonText(event.target.value)}
              rows={3}
              maxLength={500}
              className="mt-4 w-full resize-none rounded-2xl border-2 border-[#1a1a1a] bg-white px-3 py-2 text-sm font-semibold text-[#1a1a1a] outline-none focus:ring-4 focus:ring-yellow-200"
            />

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep("retain")}
                disabled={isLoading}
                className="bnt-pressable inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-3 font-display font-black text-slate-600 shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#1a1a1a] hover:shadow-[5px_5px_0_#0f172a] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_#0f172a]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isLoading}
                className="bnt-pressable inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full border-2 border-slate-950 bg-red-600 px-5 py-3 font-display font-black text-white shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[5px_5px_0_#0f172a] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_#0f172a]"
              >
                {/* TODO(Ana): rotulo do botao de confirmar (cartao vs boleto). */}
                {isLoading
                  ? isNonRenewal
                    ? "Salvando..."
                    : "Cancelando..."
                  : isNonRenewal
                    ? "Confirmar"
                    : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
