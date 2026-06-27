import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { TicketPercent } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { sanitizeReturnTo } from "@/lib/returnTo";
import { useAffiliate } from "@/hooks/useAffiliate";
import Auth from "@/pages/Auth";

export default function Cadastro() {
  const [, setLocation] = useLocation();
  const { loading, session } = useAuth();
  const { affiliateCode, discountPercent } = useAffiliate();

  const urlDiscount = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("desconto") || 0);
  }, []);
  const visibleDiscount = discountPercent || urlDiscount;

  useEffect(() => {
    if (loading || !session) return;
    const returnTo = sanitizeReturnTo(
      new URLSearchParams(window.location.search).get("returnTo"),
    );
    // Funil unico pos-auth: /bem-vindo decide se mostra a tela (onboarding
    // pendente) ou manda pro perfil (ja onboardado). Evita competir com o
    // redirect de cadastro.
    setLocation(returnTo ?? "/bem-vindo", { replace: true });
  }, [loading, session, setLocation]);

  if (loading || session) return null;

  return (
    <Auth
      mode="cadastro"
      signupBanner={
        visibleDiscount > 0 && affiliateCode ? (
          <div className="rounded-2xl border-2 border-slate-900 bg-[#FFB800] p-4 text-slate-950 shadow-[4px_4px_0_#0f172a]">
            <p className="flex items-center gap-2 text-sm font-black">
              <TicketPercent className="h-5 w-5" />
              {/* TODO(Ana): confirmar copy final */}
              Você vai assinar com {visibleDiscount}% de desconto na primeira
              cobrança, cupom {affiliateCode} aplicado automaticamente
            </p>
            <p className="mt-1 text-xs font-bold text-slate-950/80">
              {/* TODO(Ana): confirmar copy final */}
              Renovações no valor cheio.
            </p>
          </div>
        ) : null
      }
    />
  );
}
