import { Map as MapIcon } from "lucide-react";
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
// O icone e o `Map` da LUCIDE, e nao o `map` da biblioteca do onboarding
// (`client/src/lib/onboarding/icons.ts`), por duas razoes:
//   1. vizinhanca: o sino ao lado e lucide, no mesmo tamanho e no mesmo peso de
//      traco (h-5, strokeWidth 2.5). Os icones do onboarding sao transcricao dos
//      HTMLs de design, com traco ~1.9, e o proprio arquivo deles diz que aquele
//      peso e identidade dos CARDS. Misturar as duas familias lado a lado no
//      header apareceria como dois pesos de linha diferentes;
//   2. custo: `ONBOARDING_ICONS` e o `<OnbIcon>` moram atras do lazy() do
//      overlay. Importa-los aqui puxaria a biblioteca inteira para o bundle
//      inicial de TODA pagina, para desenhar um icone.
// O HelpCircle, que estava aqui antes, saiu por trazer o proprio circulo e
// virar borda dupla dentro da pilula.

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

  // O rotulo continua o mesmo: o icone mudou a metafora do desenho, nao o que o
  // botao faz. `aria-hidden` no icone porque o nome acessivel vem do aria-label.
  //
  // 20x20 no circulo de 40px, exatamente o do sino. Na pilula do drawer ele
  // acompanha o rotulo ao lado, que e text-sm, e cai para 16x16.
  const rotulo = "Rever o guia desta página";
  const icone = (tamanho: string) => (
    <MapIcon className={tamanho} strokeWidth={2.5} aria-hidden="true" />
  );

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={pedir}
        disabled={overlayAberto}
        aria-label={rotulo}
        className="bnt-guia-botao bnt-pressable mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-3 text-center text-sm font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
      >
        {icone("h-4 w-4")}
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
      className={`bnt-guia-botao ${HEADER_ICON_BUTTON_CLASS} disabled:opacity-50 disabled:hover:shadow-[2px_2px_0_var(--bnt-shadow)]`}
    >
      {icone("h-5 w-5")}
    </button>
  );
}
