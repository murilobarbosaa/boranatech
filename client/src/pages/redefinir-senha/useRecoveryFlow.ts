import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hasAuthErrorInUrl, hasOAuthCallbackInUrl } from "@/lib/authCallback";
import { wasRecoverySeen } from "@/lib/recoverySnapshot";

export type RecoveryFlowState =
  | "checking" // ainda determinando
  | "ready" // recuperação confirmada -> mostrar form de nova senha
  | "redirect-change-password" // logado, sem recovery -> ir para /trocar-senha
  | "no-link" // visita direta, sem link -> "acesse pelo link"
  | "expired"; // link de recuperação expirado/invalido

const RECOVERY_TIMEOUT_MS = 5000;

// Detecta o modo de recuperação sem depender do hash (type=recovery), funcionando
// tanto no implicit quanto no PKCE. Sinal primário: o evento PASSWORD_RECOVERY
// (capturado cedo via recoverySnapshot e ao vivo aqui).
export function useRecoveryFlow(): RecoveryFlowState {
  const [state, setState] = useState<RecoveryFlowState>("checking");

  useEffect(() => {
    if (!supabase) {
      setState("no-link");
      return;
    }

    let resolved = false;
    let expiryTimer: number | undefined;

    const finish = (next: RecoveryFlowState) => {
      if (resolved) return;
      resolved = true;
      if (expiryTimer !== undefined) window.clearTimeout(expiryTimer);
      setState(next);
    };

    // PASSWORD_RECOVERY ao vivo (cobre PKCE, cuja troca conclui após a montagem).
    // Também aceita uma sessão que chegue via evento quando o recovery já foi visto
    // (cobre o caso de getSession resolver null antes da sessão de recuperação chegar).
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") finish("ready");
      else if (nextSession && wasRecoverySeen()) finish("ready");
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (resolved) return;

      // Flag durável capturado no load (cobre o implicit, cujo evento pode ter
      // disparado antes desta página montar).
      const recovery = wasRecoverySeen();

      if (session) {
        // Sessão estabelecida: recuperação (define nova senha sem a atual) vs
        // login normal (vai para /trocar-senha, que exige a senha atual).
        finish(recovery ? "ready" : "redirect-change-password");
        return;
      }

      // Sem sessão ainda.
      if (recovery) {
        // Evento de recovery já visto; a sessão deve chegar, aguarda.
        expiryTimer = window.setTimeout(() => finish("expired"), RECOVERY_TIMEOUT_MS);
      } else if (hasAuthErrorInUrl()) {
        finish("expired"); // erro explícito na URL (link expirado/invalido)
      } else if (hasOAuthCallbackInUrl()) {
        // Callback em processamento (PKCE ?code= / implicit token): aguarda o evento.
        expiryTimer = window.setTimeout(() => finish("expired"), RECOVERY_TIMEOUT_MS);
      } else {
        finish("no-link"); // visita direta, sem link
      }
    });

    return () => {
      resolved = true;
      data.subscription.unsubscribe();
      if (expiryTimer !== undefined) window.clearTimeout(expiryTimer);
    };
  }, []);

  return state;
}
