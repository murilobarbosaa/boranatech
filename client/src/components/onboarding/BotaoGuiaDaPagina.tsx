import { useLocation } from "wouter";

import { HEADER_ICON_BUTTON_CLASS } from "@/lib/headerIconButton";
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
//
// VISUAL: nao ha token proprio aqui. O botao veste
// `HEADER_ICON_BUTTON_CLASS`, a familia dos botoes-icone circulares do header,
// a mesma que o sino veste. Foi assim que os dois pararam de divergir.
//
// O glifo e um "?" TIPOGRAFICO, e nao o HelpCircle da lucide: o icone ja traz o
// proprio circulo, que dentro da pilula virava borda dupla.

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
  // `aria-hidden` porque o nome acessivel ja vem do aria-label; sem isso o
  // leitor de tela anunciaria a interrogacao solta depois do rotulo.
  //
  // No circulo de 40px o glifo vai a text-2xl (24px): medido contra o icone do
  // sino, que ocupa 20x20, o "?" a 20px ficava visivelmente mais leve, porque a
  // altura da letra e menor que a caixa da fonte. Na pilula do drawer ele
  // acompanha o rotulo ao lado, que e text-sm, e fica em text-base.
  const glifo = (tamanho: string) => (
    <span aria-hidden="true" className={`${tamanho} font-black leading-none`}>
      ?
    </span>
  );

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={pedir}
        disabled={overlayAberto}
        aria-label={rotulo}
        className="bnt-guia-botao bnt-pressable mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-3 text-center text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
      >
        {glifo("text-base")}
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
      className={`bnt-guia-botao ${HEADER_ICON_BUTTON_CLASS} disabled:opacity-50 disabled:hover:shadow-[2px_2px_0_#0f172a]`}
    >
      {glifo("text-2xl")}
    </button>
  );
}
