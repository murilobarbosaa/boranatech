import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Profile } from "@/services/contracts";
import { getMyProfile } from "@/services/profileService";
import type { Gender } from "@shared/gender";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import posthog from "posthog-js";

interface SignUpInput {
  name: string;
  email: string;
  password: string;
  gender: Gender;
}

interface SignInInput {
  email: string;
  password: string;
}

type OAuthProvider = "google";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signInWithOAuth: (
    provider: OAuthProvider,
    options?: { redirectTo?: string },
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function authRedirectTo() {
  const redirectPath = import.meta.env.VITE_AUTH_REDIRECT_PATH || "/perfil";
  return `${window.location.origin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;
}

// Detecta um callback de OAuth em andamento na URL atual.
// PKCE usa ?code= na query string; o fluxo implicit usa access_token/refresh_token
// no hash. Cobrimos os dois.
function hasOAuthCallbackInUrl() {
  if (typeof window === "undefined") return false;
  const hasCode = new URLSearchParams(window.location.search).has("code");
  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(rawHash);
  const hasToken = hashParams.has("access_token") || hashParams.has("refresh_token");
  return hasCode || hasToken;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let safetyTimer: number | undefined;

    function clearSafetyTimer() {
      if (safetyTimer !== undefined) {
        window.clearTimeout(safetyTimer);
        safetyTimer = undefined;
      }
    }

    async function loadProfile(nextSession: Session | null) {
      if (!nextSession) {
        setProfile(null);
        return;
      }

      try {
        const nextProfile = await getMyProfile();
        if (mounted) setProfile(nextProfile);
      } catch (error) {
        console.error("[AuthContext] loadProfile failed", error);
        if (mounted) setProfile(null);
      }
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(async ({ data }: { data: { session: Session | null } }) => {
        if (!mounted) return;
        const session = data.session;
        setSession(session);
        await loadProfile(session);
        if (!mounted) return;

        // Callback de OAuth em andamento: getSession resolveu null mas a URL ainda
        // tem ?code= (PKCE) / token no hash (implicit). A troca vai concluir e
        // emitir SIGNED_IN — NÃO feche o loading agora, senão abrimos a janela
        // (loading=false, user=null) que faz os guards redirecionarem indevidamente.
        // Deixe o SIGNED_IN subsequente fechar o loading.
        if (!session && hasOAuthCallbackInUrl()) {
          console.info("[auth] holding loading for OAuth callback");
          // Salvaguarda: se o SIGNED_IN nunca chegar (ex.: troca PKCE falha), não
          // travar em spinner eterno — degrada graciosamente para "não autenticado".
          safetyTimer = window.setTimeout(() => {
            if (!mounted) return;
            console.warn("[auth] safety timeout fired; treating as unauthenticated");
            setSession(null);
            setProfile(null);
            setLoading(false);
          }, 5000);
          return;
        }

        setLoading(false);
      });

    function handleAuthChange(event: AuthChangeEvent, nextSession: Session | null) {
      // Durante um callback de OAuth, um INITIAL_SESSION(null) pode chegar antes
      // do SIGNED_IN. Ignore esse estado transitório para não fechar o loading
      // (e reabrir a janela). O SIGNED_IN — ou a salvaguarda — resolve depois.
      if (!nextSession && event !== "SIGNED_OUT" && hasOAuthCallbackInUrl()) {
        return;
      }

      clearSafetyTimer();
      setSession(nextSession);
      if (event === "SIGNED_OUT" || !nextSession) {
        setProfile(null);
      } else {
        if (nextSession.user) {
          posthog.identify(nextSession.user.id);
        }
        void loadProfile(nextSession);
        if (event === "SIGNED_IN" && localStorage.getItem("bnt_social_signup_pending") === "true") {
          localStorage.removeItem("bnt_social_signup_pending");
          localStorage.setItem("bnt_signup_completed", "true");
          window.setTimeout(() => {
            if (window.location.pathname !== "/planos") window.location.assign("/planos");
          }, 0);
        }
      }
      setLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      mounted = false;
      clearSafetyTimer();
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async ({ name, email, password, gender }: SignUpInput) => {
    try {
      const client = assertSupabaseConfigured();
      const { error } = await client.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: {
            name: name.trim(),
            gender,
          },
          emailRedirectTo: `${window.location.origin}/perfil`,
        },
      });

      if (error) throw error;

      posthog.capture("user_signed_up");
    } catch (error) {
      console.error("[AuthContext] signUp failed", error);
      throw error;
    }
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInInput) => {
    const client = assertSupabaseConfigured();
    const { data, error } = await client.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) throw error;

    if (data.user) {
      posthog.identify(data.user.id);
      posthog.capture("user_signed_in");
    }
  }, []);

  const signInWithOAuth = useCallback(
    async (
      provider: OAuthProvider,
      options?: { redirectTo?: string },
    ) => {
      const client = assertSupabaseConfigured();
      posthog.capture("oauth_sign_in_started", { provider });

      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: options?.redirectTo ?? authRedirectTo(),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }

    const nextProfile = await getMyProfile();
    setProfile(nextProfile);
  }, [session]);

  const signOut = useCallback(async () => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    setProfile(null);
    posthog.capture("user_signed_out");
    posthog.reset();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.resetPasswordForEmail(
      normalizeEmail(email),
      {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      },
    );

    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signInWithOAuth,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
    }),
    [
      loading,
      profile,
      resetPassword,
      refreshProfile,
      session,
      signIn,
      signInWithOAuth,
      signOut,
      signUp,
      updatePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
