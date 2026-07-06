import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

import type { AuthGateModalProps } from "@/components/gate/AuthGateModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  clearPendingGate,
  savePendingGate,
  type AuthGateIntent,
} from "@/lib/authGate";

export type AuthGateStatus = "loading" | "authenticated" | "anonymous";

export interface RequireAuthConfig {
  // Pra "abrir conteudo": pra onde ir depois de autenticar.
  destination?: string;
  // Payload de re-execucao de dominio, opcional.
  intent?: AuthGateIntent;
  // Acao in-place a executar SE ja autenticado agora.
  run?: () => void;
}

export interface UseAuthGateResult {
  requireAuth: (config: RequireAuthConfig) => void;
  gateNavigate: (to: string) => void;
  gateAction: (opts: {
    intent: AuthGateIntent;
    run: () => void;
    destination?: string;
  }) => void;
  status: AuthGateStatus;
  isAuthenticated: boolean;
  modalProps: AuthGateModalProps;
}

export function useAuthGate(): UseAuthGateResult {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Estado LOCAL ao hook: duas instancias nao compartilham nada.
  const [open, setOpen] = useState(false);
  const pendingDestinationRef = useRef<string | null>(null);
  const proceedingRef = useRef(false);

  const status: AuthGateStatus = loading
    ? "loading"
    : user
      ? "authenticated"
      : "anonymous";

  const requireAuth = useCallback(
    (config: RequireAuthConfig) => {
      // Trava fail-open: enquanto indefinido, NO-OP total.
      if (loading) return;

      if (user) {
        if (config.run) config.run();
        else if (config.destination) setLocation(config.destination);
        return;
      }

      // Anonimo: persiste a intencao e abre o modal. NAO roda run, NAO navega.
      const persisted = savePendingGate({
        destination: config.destination ?? location,
        intent: config.intent,
      });
      // ref e returnTo sempre carregam o destino ja saneado; fallback no location
      // atual (sempre interno) se o destino for invalido ou o storage falhar.
      pendingDestinationRef.current = persisted?.destination ?? location;
      proceedingRef.current = false;
      setOpen(true);
    },
    [loading, user, location, setLocation],
  );

  const gateNavigate = useCallback(
    (to: string) => {
      requireAuth({ destination: to, run: () => setLocation(to) });
    },
    [requireAuth, setLocation],
  );

  const gateAction = useCallback(
    (opts: {
      intent: AuthGateIntent;
      run: () => void;
      destination?: string;
    }) => {
      requireAuth({
        destination: opts.destination ?? location,
        intent: opts.intent,
        run: opts.run,
      });
    },
    [requireAuth, location],
  );

  const onOpenChange = useCallback((next: boolean) => {
    // Dismiss explicito (X/Esc/overlay) descarta a intencao. Ir autenticar
    // (Entrar/Criar conta) seta proceedingRef e NAO passa por aqui pra limpar.
    if (!next && !proceedingRef.current) clearPendingGate();
    setOpen(next);
    if (!next) proceedingRef.current = false;
  }, []);

  const onEntrar = useCallback(() => {
    proceedingRef.current = true;
    const dest = pendingDestinationRef.current ?? location;
    setOpen(false);
    setLocation(`/login?returnTo=${encodeURIComponent(dest)}`);
  }, [location, setLocation]);

  const onCriarConta = useCallback(() => {
    proceedingRef.current = true;
    const dest = pendingDestinationRef.current ?? location;
    setOpen(false);
    setLocation(`/cadastro?returnTo=${encodeURIComponent(dest)}`);
  }, [location, setLocation]);

  const modalProps = useMemo<AuthGateModalProps>(
    () => ({ open, onOpenChange, onEntrar, onCriarConta }),
    [open, onOpenChange, onEntrar, onCriarConta],
  );

  return {
    requireAuth,
    gateNavigate,
    gateAction,
    status,
    isAuthenticated: status === "authenticated",
    modalProps,
  };
}
