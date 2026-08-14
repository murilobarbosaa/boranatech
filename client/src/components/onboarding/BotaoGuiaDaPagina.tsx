import { HelpCircle } from "lucide-react";
import { useLocation } from "wouter";

import { useOnboardingCoordinator } from "@/lib/onboarding/coordinator";
import { resolveRouteOnboarding } from "@/lib/onboarding/registry";

// Botao "?" do Header: reabre, a pedido, o onboarding da pagina em que a pessoa
// esta. Ele NAO abre nada por conta propria; so registra o pedido no
// coordenador, e quem abre continua sendo o OnboardingHost, que e o unico ponto
// de montagem do overlay.
//
// So aparece onde ha o que rever: rota classificada como 'pendente' ou
// 'sem-onboarding' no registry nao renderiza botao nenhum. Botao que abre nada
// e pior do que botao ausente.
//
// Classe propria, fora do namespace `bnt-onb` do overlay: o botao e parte do
// Header e fica no HTML prerenderizado (UI legitima), enquanto `bnt-onb` e o
// marcador que a verificacao do prerender usa para achar overlay vazado.

export default function BotaoGuiaDaPagina({
  variant,
  onOpen,
}: {
  variant: "desktop" | "mobile";
  /** Chamado antes do pedido. No mobile, fecha o drawer. */
  onOpen?: () => void;
}) {
  const [location] = useLocation();
  const { pedirOnboardingManual, overlayAberto } = useOnboardingCoordinator();

  const resolved = resolveRouteOnboarding(location.split("?")[0]);
  if (!resolved || resolved.entry.type !== "onboarding") return null;

  function pedir() {
    onOpen?.();
    pedirOnboardingManual();
  }

  const rotulo = "Rever o guia desta página";
  const foco =
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200";

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={pedir}
        disabled={overlayAberto}
        aria-label={rotulo}
        className={`bnt-guia-botao mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-3 text-center text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] disabled:opacity-50 ${foco}`}
      >
        <HelpCircle className="h-4 w-4" />
        {rotulo}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={pedir}
      disabled={overlayAberto}
      aria-label={rotulo}
      title={rotulo}
      className={`bnt-guia-botao inline-flex items-center justify-center rounded-full border-2 border-slate-900 bg-white p-2 text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:opacity-50 disabled:hover:shadow-[2px_2px_0_#0f172a] ${foco}`}
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}
