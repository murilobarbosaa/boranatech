import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

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

const BENEFITS: Array<{ icon: string; text: string }> = [
  { icon: "🤖", text: "Ferramentas de IA pra acelerar a carreira" }, // TODO(Ana): revisar copy sem contagem
  { icon: "📚", text: "Roadmaps completos e plano de carreira personalizado" }, // TODO(Ana): validar copy
  { icon: "🎯", text: "Analisador de currículo, LinkedIn e portfólio com IA" },
  { icon: "💬", text: "Simulador de entrevistas técnicas e comportamentais" },
  { icon: "📈", text: "Análise de GitHub com IA" }, // TODO(Ana): revisar beneficio substituto
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

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0_#0f172a]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full border-2 border-[#1a1a1a] bg-white p-1.5 text-[#1a1a1a] shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
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
              {BENEFITS.map((benefit) => (
                <li
                  key={benefit.text}
                  className="flex items-start gap-3 rounded-2xl border-2 border-[#1a1a1a] bg-[#faf8f4] p-3"
                >
                  <span className="text-xl leading-none">{benefit.icon}</span>
                  <span className="text-sm font-bold text-[#1a1a1a]">
                    {benefit.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-5 py-3 font-display font-black text-[#1a1a1a] shadow-[3px_3px_0_#0f172a]"
              >
                Quero continuar Pro
              </button>
              <button
                type="button"
                onClick={() => setStep("reason")}
                className="flex-1 rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-3 font-display font-black text-slate-600 shadow-[3px_3px_0_#0f172a] hover:text-[#1a1a1a]"
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
                className="flex-1 rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-3 font-display font-black text-slate-600 shadow-[3px_3px_0_#0f172a] hover:text-[#1a1a1a] disabled:opacity-60"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isLoading}
                className="flex-1 rounded-full border-2 border-rose-900 bg-rose-100 px-5 py-3 font-display font-black text-rose-800 shadow-[3px_3px_0_#7f1d1d] disabled:opacity-60"
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
      </div>
    </div>
  );
}
