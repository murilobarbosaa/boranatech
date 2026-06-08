import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { consumePendingIntent, type PendingIntent } from "@/lib/pendingIntent";

type Tab = "signin" | "signup";

export interface GateModalCopy {
  title?: ReactNode;
  description?: ReactNode;
  defaultTab?: Tab;
}

export interface OpenGateOptions {
  /** Intent persisted before an OAuth redirect, replayed on boot by the resumer. */
  intent?: PendingIntent;
  modalCopy?: GateModalCopy;
  /** Same-tab resume: runs after login succeeds AND `user` is present. No storage. */
  onAuthed?: () => void;
  /** Runs when the modal is dismissed without authenticating. */
  onDismiss?: () => void;
}

export interface ResumeContext {
  intent: PendingIntent;
}

export type ResumeHandler = (ctx: ResumeContext) => void | Promise<void>;

/** Registry key: "favorite" for favorites, "progress:<context>" per progress context. */
export type ResumeKey = "favorite" | `progress:${string}`;

interface AuthGateValue {
  openGate: (opts?: OpenGateOptions) => void;
  closeGate: () => void;
  registerResumeHandler: (key: ResumeKey, handler: ResumeHandler) => () => void;
}

const AuthGateContext = createContext<AuthGateValue | null>(null);

function resumeKeyOf(intent: PendingIntent): ResumeKey {
  return intent.kind === "favorite" ? "favorite" : `progress:${intent.context}`;
}

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState<GateModalCopy | undefined>(undefined);
  const [intentForModal, setIntentForModal] = useState<
    PendingIntent | undefined
  >(undefined);

  const onAuthedRef = useRef<(() => void) | null>(null);
  const onDismissRef = useRef<(() => void) | null>(null);
  const authedRef = useRef(false);
  const ranRef = useRef(false);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // --- Resume registry (single boot consumer of the pendingIntent slot) ---
  const handlersRef = useRef<Map<ResumeKey, ResumeHandler>>(new Map());
  const pendingResumeRef = useRef<PendingIntent | null>(null);
  const didConsumeRef = useRef(false);

  const tryDispatch = useCallback(() => {
    const intent = pendingResumeRef.current;
    if (!intent) return;
    const handler = handlersRef.current.get(resumeKeyOf(intent));
    if (!handler) return;
    // Clear before dispatching so a handler remount (re-register) never reapplies it.
    pendingResumeRef.current = null;
    void handler({ intent });
  }, []);

  const registerResumeHandler = useCallback(
    (key: ResumeKey, handler: ResumeHandler) => {
      handlersRef.current.set(key, handler);
      tryDispatch();
      return () => {
        if (handlersRef.current.get(key) === handler) {
          handlersRef.current.delete(key);
        }
      };
    },
    [tryDispatch],
  );

  // Consume the OAuth intent exactly once per logged-in session, on the first
  // observation of an authenticated user (mount-with-user OR null -> user).
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      didConsumeRef.current = false;
      return;
    }
    if (didConsumeRef.current) return;
    didConsumeRef.current = true;
    const intent = consumePendingIntent();
    if (intent) {
      pendingResumeRef.current = intent;
      tryDispatch();
    }
  }, [user, authLoading, tryDispatch]);

  // --- Same-tab resume (callback, no storage) ---
  const runOnAuthed = useCallback(() => {
    if (!authedRef.current || ranRef.current) return;
    ranRef.current = true;
    const cb = onAuthedRef.current;
    onAuthedRef.current = null;
    onDismissRef.current = null;
    cb?.();
  }, []);

  useEffect(() => {
    if (user) runOnAuthed();
  }, [user, runOnAuthed]);

  const openGate = useCallback((opts?: OpenGateOptions) => {
    setCopy(opts?.modalCopy);
    setIntentForModal(opts?.intent);
    onAuthedRef.current = opts?.onAuthed ?? null;
    onDismissRef.current = opts?.onDismiss ?? null;
    authedRef.current = false;
    ranRef.current = false;
    setOpen(true);
  }, []);

  const closeGate = useCallback(() => setOpen(false), []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next && !authedRef.current) {
      const onDismiss = onDismissRef.current;
      onAuthedRef.current = null;
      onDismissRef.current = null;
      onDismiss?.();
    }
  }, []);

  const handleAuthenticated = useCallback(() => {
    authedRef.current = true;
    if (userRef.current) runOnAuthed();
  }, [runOnAuthed]);

  const value = useMemo<AuthGateValue>(
    () => ({ openGate, closeGate, registerResumeHandler }),
    [openGate, closeGate, registerResumeHandler],
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <AuthModal
        open={open}
        onOpenChange={handleOpenChange}
        onAuthenticated={handleAuthenticated}
        title={copy?.title}
        description={copy?.description}
        defaultTab={copy?.defaultTab}
        pendingIntent={intentForModal}
      />
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error("useAuthGate must be used within AuthGateProvider");
  }
  return ctx;
}
