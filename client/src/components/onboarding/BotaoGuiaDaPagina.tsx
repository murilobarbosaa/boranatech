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
//
// VISUAL: os tokens sao do proprio Header, nao inventados aqui.
//   - moldura e sombra do pill "Entrar", vizinho imediato: `border-2
//     border-slate-900` e `shadow-[2px_2px_0_#0f172a]` crescendo para 3px no
//     hover, com `transition-all`;
//   - altura 40px, a mesma do "Entrar" e do "Cadastre-se agora" (py-2 +
//     text-sm + 2px de borda), para os tres alinharem;
//   - `bnt-pressable` e o foco por outline vem do sino, que e o outro botao de
//     icone circular do mesmo bloco.
// Fundo TRANSPARENTE de proposito: o botao e so um glifo, e o branco chapado
// dos pills de texto pesava mais que os vizinhos. O glifo e um "?" tipografico
// em vez do HelpCircle da lucide, que traz o proprio circulo e, dentro da
// pilula, virava borda dupla.

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
  // Mesmo foco do sino: outline, e nao o ring de 4px dos itens de menu, que num
  // alvo circular de 40px encostaria no vizinho.
  const foco =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";
  // `aria-hidden` porque o nome acessivel ja vem do aria-label; sem isso o
  // leitor de tela anunciaria a interrogacao solta depois do rotulo.
  const glifo = (
    <span aria-hidden="true" className="text-base font-black leading-none">
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
        className={`bnt-guia-botao bnt-pressable mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-3 text-center text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] disabled:opacity-50 ${foco}`}
      >
        {glifo}
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
      className={`bnt-guia-botao bnt-pressable inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-transparent text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:opacity-50 disabled:hover:shadow-[2px_2px_0_#0f172a] ${foco}`}
    >
      {glifo}
    </button>
  );
}
