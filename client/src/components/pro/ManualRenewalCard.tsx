import { RefreshCw } from "lucide-react";

import type { EstadoDaRenovacaoManual } from "@/lib/manualRenewalState";

/**
 * O bloco de renovacao manual do Perfil: a linha "vence em", o botao de
 * renovar e, quando vencida, o cartao de termino. Recebe o estado ja decidido
 * (client/src/lib/manualRenewalState.ts) e so renderiza.
 */
function formatarData(iso: string | null): string {
  if (!iso) return "em breve";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "em breve";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const BOTAO =
  "inline-flex items-center gap-2 rounded-full border-2 border-[var(--bnt-ink)] bg-[var(--brand-yellow)] px-4 py-2 font-display text-sm font-black text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export default function ManualRenewalCard({
  estado,
  paymentMethod,
  renewing,
  onRenew,
}: {
  estado: EstadoDaRenovacaoManual;
  /** Meio pelo qual a renovacao vai ser cobrada (shared/renewalMethod.ts). */
  paymentMethod: "pix" | "boleto";
  renewing: boolean;
  onRenew: () => void;
}) {
  const botao = (
    <button
      type="button"
      onClick={onRenew}
      disabled={renewing}
      className={`mt-3 ${BOTAO}`}
    >
      <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
      {/* TODO(Ana) */}
      {renewing ? "Gerando..." : "Renovar agora"}
    </button>
  );

  if (estado.kind === "expired") {
    return (
      <div className="mt-5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-3">
        {/* TODO(Ana) */}
        <p className="text-sm font-bold text-amber-900">
          Seu Pro terminou em {formatarData(estado.periodEnd)}. Renove por{" "}
          {paymentMethod === "pix" ? "Pix" : "boleto"} para voltar.
        </p>
        {botao}
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border-2 border-slate-950 bg-white p-3 shadow-[3px_3px_0_var(--bnt-shadow)]">
      {/* TODO(Ana) */}
      <p className="text-sm font-bold text-slate-800">
        Renovação manual. Vence em {formatarData(estado.periodEnd)} (
        {estado.days} {estado.days === 1 ? "dia" : "dias"}).
      </p>
      {botao}
      {/* TODO(Ana) */}
      <p className="mt-2 text-xs font-medium text-slate-500">
        Pagar antes não perde dias: o novo período começa quando o atual
        termina.
      </p>
    </div>
  );
}
