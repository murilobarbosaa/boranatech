// Captura o evento PASSWORD_RECOVERY o mais cedo possível.
//
// O supabase emite PASSWORD_RECOVERY durante a init (no implicit, via setTimeout(0)
// que pode disparar ANTES da página de recovery montar). Quem assina só ao montar
// pode perder o evento. Por isso assinamos aqui, no carregamento do módulo
// (importado cedo em main.tsx), e guardamos um flag durável.
//
// Funciona nos dois fluxos: implicit e PKCE ambos emitem PASSWORD_RECOVERY.
// Substitui o papel do antigo hashSnapshot (que dependia de type=recovery no hash).
import { supabase } from "@/lib/supabase";

let recoverySeen = false;

export function wasRecoverySeen(): boolean {
  return recoverySeen;
}

if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      recoverySeen = true;
    }
  });
}
