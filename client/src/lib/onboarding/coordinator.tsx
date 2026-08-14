import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Coordenador de quem pode ocupar a tela nesta carga: o onboarding da rota ou
// o SuperInterstitial. A regra e "se o onboarding da rota abrir nesta carga, o
// SuperInterstitial NAO abre".
//
// E um CONTEXTO, e nao ordem de montagem nem setTimeout, por um motivo
// estrutural: o provider e PAI dos dois, entao ele ja existe e ja tem estado
// quando qualquer um dos dois renderiza. Coordenacao por ordem de irmaos
// dependeria de quem foi declarado primeiro no App.tsx, e por timer dependeria
// de o import dinamico dos steps caber na janela escolhida. Ambos falham em
// silencio, e falham para o lado errado: dois modais em cima um do outro.
//
// O estado comeca em "deciding" DE PROPOSITO. Enquanto o host nao sabe (esta
// esperando o AuthContext resolver, ou o import dinamico), ninguem abre. E o
// unico jeito de a garantia nao virar corrida: o SuperInterstitial nao pode
// abrir "porque o onboarding ainda nao tinha respondido".

export type OverlayDecision =
  /** O host ainda esta decidindo. Ninguem abre. */
  | "deciding"
  /** O onboarding da rota abriu (ou vai abrir) nesta carga. */
  | "onboarding"
  /** Nao ha onboarding para esta carga. O SuperInterstitial esta liberado. */
  | "free";

export interface OnboardingCoordinatorValue {
  decision: OverlayDecision;
  /** true so em "free". */
  superInterstitialAllowed: boolean;
  /** O host reivindica a tela. STICKY: vale ate o fim desta carga de pagina. */
  claimForOnboarding: () => void;
  /** O host decidiu que nao abre nesta rota. */
  releaseToOthers: () => void;
  /** Trocou de rota: volta a "deciding", a menos que ja tenha sido reivindicado. */
  beginDecision: () => void;
  /**
   * Contador de pedidos de abertura MANUAL (o botao "?" do Header). Contador, e
   * nao booleano, porque a pessoa pode pedir de novo depois de fechar, e o host
   * precisa distinguir o segundo pedido do primeiro.
   */
  pedidoManual: number;
  /** O botao "?" pede a abertura do onboarding da rota atual. */
  pedirOnboardingManual: () => void;
  /** Ha overlay de onboarding na tela agora. */
  overlayAberto: boolean;
  /** O host publica que abriu ou fechou. Quem le e o botao "?". */
  marcarOverlayAberto: (aberto: boolean) => void;
}

// Default PERMISSIVO: sem provider, o SuperInterstitial se comporta como antes
// deste modulo existir. Um default restritivo esconderia a ausencia do provider
// justamente como "o super parou de aparecer", que e dificil de atribuir.
const FALLBACK: OnboardingCoordinatorValue = {
  decision: "free",
  superInterstitialAllowed: true,
  claimForOnboarding: () => {},
  releaseToOthers: () => {},
  beginDecision: () => {},
  pedidoManual: 0,
  pedirOnboardingManual: () => {},
  overlayAberto: false,
  marcarOverlayAberto: () => {},
};

const OnboardingCoordinatorContext =
  createContext<OnboardingCoordinatorValue>(FALLBACK);

export function OnboardingCoordinatorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [decision, setDecision] = useState<OverlayDecision>("deciding");

  const claimForOnboarding = useCallback(() => {
    setDecision("onboarding");
  }, []);

  const releaseToOthers = useCallback(() => {
    // Nao regride de "onboarding": a reivindicacao vale para a carga inteira,
    // entao o host fechando o overlay nao devolve a vez ao SuperInterstitial.
    setDecision((current) => (current === "onboarding" ? current : "free"));
  }, []);

  const beginDecision = useCallback(() => {
    setDecision((current) => (current === "onboarding" ? current : "deciding"));
  }, []);

  const [pedidoManual, setPedidoManual] = useState(0);
  const [overlayAberto, setOverlayAberto] = useState(false);

  // Iniciativa da pessoa, e nao decisao de quem ocupa a tela: por isso NAO
  // consulta `decision`. O onboarding manual abre mesmo depois de o
  // SuperInterstitial ter tido a vez nesta carga.
  const pedirOnboardingManual = useCallback(() => {
    setPedidoManual((n) => n + 1);
  }, []);

  const marcarOverlayAberto = useCallback((aberto: boolean) => {
    setOverlayAberto(aberto);
  }, []);

  const value = useMemo<OnboardingCoordinatorValue>(
    () => ({
      decision,
      superInterstitialAllowed: decision === "free",
      claimForOnboarding,
      releaseToOthers,
      beginDecision,
      pedidoManual,
      pedirOnboardingManual,
      overlayAberto,
      marcarOverlayAberto,
    }),
    [
      decision,
      claimForOnboarding,
      releaseToOthers,
      beginDecision,
      pedidoManual,
      pedirOnboardingManual,
      overlayAberto,
      marcarOverlayAberto,
    ],
  );

  return (
    <OnboardingCoordinatorContext.Provider value={value}>
      {children}
    </OnboardingCoordinatorContext.Provider>
  );
}

export function useOnboardingCoordinator(): OnboardingCoordinatorValue {
  return useContext(OnboardingCoordinatorContext);
}
