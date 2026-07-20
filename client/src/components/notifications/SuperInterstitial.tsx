import { useLocation } from "wouter";

import SuperModal from "@/components/notifications/SuperModal";
import { ctaTarget } from "@/components/notifications/NotificationsPanel";
import { useNotifications } from "@/contexts/NotificationsContext";

// Ponto ÚNICO de montagem do SuperModal. Montado em App.tsx como irmão do Router,
// DENTRO do ConsentGate — então só renderiza depois que consent/launch liberam os
// children, nunca por cima do modal de consentimento (z-90 do SuperModal < z-100
// do ConsentGate, mas a garantia real é estrutural: aqui só existe pós-gates).
// Lê o estado do contexto (durável, sobrevive à remontagem do sino por navegação).

// Exclusão de rota por PREFIXO (startsWith): o pop AUTOMÁTICO não aparece nessas
// áreas (admin, checkout/planos, auth/senha, renovar). A abertura MANUAL pelo
// sino ignora isto de propósito. Para as rotas abaixo, startsWith é inequívoco
// (nenhuma rota real do app colide, ex.: /plano-carreira não casa /planos).
const EXCLUDED_ROUTE_PREFIXES = [
  "/admin",
  "/planos",
  "/checkout",
  "/planos/sucesso",
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/trocar-senha",
  "/renovar",
];

function isExcludedRoute(location: string): boolean {
  return EXCLUDED_ROUTE_PREFIXES.some((prefix) => location.startsWith(prefix));
}

export default function SuperInterstitial() {
  const {
    superModalOpen,
    superModalItem,
    superModalSource,
    dismissSuper,
    closeSuperModal,
    markAsRead,
  } = useNotifications();
  const [location, navigate] = useLocation();

  if (!superModalOpen || !superModalItem) return null;
  // Pop automático (por carga) respeita a allowlist; abertura manual (sino) não.
  if (superModalSource === "auto" && isExcludedRoute(location)) return null;

  const item = superModalItem;

  return (
    <SuperModal
      super={item}
      // Fechar (X/overlay/Esc) = dismiss server-side. NÃO marca como lida: some
      // do interstitial, continua no sino até ser lida.
      onClose={() => void dismissSuper(item.id)}
      // CTA = engajamento: marca como LIDA (some do sino também) e navega.
      onCta={() => {
        void markAsRead(item.id);
        const target = ctaTarget(item.super_cta_url ?? "");
        closeSuperModal();
        if (target.internal) {
          navigate(target.href);
        } else if (target.href) {
          window.open(target.href, "_blank", "noopener,noreferrer");
        }
      }}
    />
  );
}
