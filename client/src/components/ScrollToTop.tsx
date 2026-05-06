import { useLayoutEffect } from "react";
import { useLocation } from "wouter";

/**
 * Em SPAs, o scroll do documento não é resetado ao navegar. Garante topo em toda mudança de rota.
 */
export default function ScrollToTop() {
  const [pathname] = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
