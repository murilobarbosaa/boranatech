import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { hasOAuthCallbackInUrl } from "@/lib/authCallback";
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
  useRef,
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

export type ProfileStatus = "idle" | "loading" | "ready" | "error";

// Backoff conservador para Railway cold-start (~8-15s típico).
// Duas tentativas, sem loop apertado. Esgotadas, espera próximo evento de auth natural.
const PROFILE_RETRY_DELAYS_MS = [3_000, 12_000];
const PROFILE_RETRY_JITTER = 0.25;
// Skeleton só no boot inicial sem perfil. Aos 6s força fallback visual sem matar retries.
const PROFILE_BOOT_SKELETON_TIMEOUT_MS = 6_000;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  profileStatus: ProfileStatus;
  profileError: Error | null;
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

// Superfície dedicada a teste: NÃO usar em código de produção. Existe apenas
// para permitir que testes comparem profileRef.current com profile estado a
// estado, travando a invariante anti-race da Questão 1.
interface AuthInternalsForTests {
  profileRef: React.RefObject<Profile | null>;
}
const AuthInternalsForTestsContext = createContext<AuthInternalsForTests | undefined>(undefined);

export function __useAuthInternalsForTests() {
  return useContext(AuthInternalsForTestsContext);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function authRedirectTo() {
  const redirectPath = import.meta.env.VITE_AUTH_REDIRECT_PATH || "/perfil";
  return `${window.location.origin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;
}

function computeRetryDelay(attempt: number): number | null {
  if (attempt >= PROFILE_RETRY_DELAYS_MS.length) return null;
  const base = PROFILE_RETRY_DELAYS_MS[attempt];
  const jitter = base * PROFILE_RETRY_JITTER * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(base + jitter));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("idle");
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // profileRef é mantido em sincronia SÍNCRONA com setProfile em cada caller
  // (fetchAndApply success, cancelProfileLifecycle, ambos ramos de refreshProfile).
  // NÃO usar useEffect espelho: o effect roda após commit, abrindo 1 render
  // de janela onde profile já mudou mas o ref ainda reflete o valor antigo —
  // exatamente a race que startProfileLifecycle observa via profileRef.current
  // para escolher mode='initial' vs 'background'.
  const profileRef = useRef<Profile | null>(null);
  // Geração compartilhada entre o fluxo interno (useEffect) e o refreshProfile
  // exportado. Cada início de busca incrementa; só aplica resultado se o ref
  // ainda for o mesmo. Fecha a Race B: SIGNED_OUT durante refreshProfile em
  // voo bumpa a geração via cancelProfileLifecycle, e a resolução tardia do
  // refreshProfile vê gen antigo e descarta -> não ressuscita perfil deslogado.
  const generationRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    let safetyTimer: number | undefined;
    let retryTimer: number | undefined;
    let skeletonTimer: number | undefined;
    let retryAttempt = 0;
    // generationRef é compartilhado com refreshProfile (escopo do componente).
    // Use sempre generationRef.current dentro deste effect para que qualquer
    // bump externo (refreshProfile) seja observado pelas chamadas em voo aqui.

    function clearSafetyTimer() {
      if (safetyTimer !== undefined) {
        window.clearTimeout(safetyTimer);
        safetyTimer = undefined;
      }
    }

    function clearRetryTimer() {
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
        retryTimer = undefined;
      }
    }

    function clearSkeletonTimer() {
      if (skeletonTimer !== undefined) {
        window.clearTimeout(skeletonTimer);
        skeletonTimer = undefined;
      }
    }

    async function fetchAndApply(targetSession: Session, gen: number) {
      try {
        const nextProfile = await getMyProfile();
        if (!mounted) return;
        if (gen !== generationRef.current) return; // suplantado por uma chamada mais nova
        clearRetryTimer();
        clearSkeletonTimer();
        retryAttempt = 0;
        profileRef.current = nextProfile;
        setProfile(nextProfile);
        setProfileStatus("ready");
        setProfileError(null);
      } catch (err) {
        if (!mounted) return;
        if (gen !== generationRef.current) return;
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[AuthContext] loadProfile failed", error);
        setProfileError(error);
        // NUNCA regride profile bom: se já há perfil cacheado, mantém.
        // Status também fica como estava ('ready'), o erro fica só no profileError.
        const attempt = retryAttempt;
        const delay = computeRetryDelay(attempt);
        if (delay === null) {
          // Retries esgotados. Estado terminal: se não há perfil, status='error'.
          if (!profileRef.current) {
            setProfileStatus("error");
          }
          return;
        }
        retryAttempt = attempt + 1;
        clearRetryTimer();
        retryTimer = window.setTimeout(() => {
          if (!mounted) return;
          if (gen !== generationRef.current) return;
          void fetchAndApply(targetSession, gen);
        }, delay);
      }
    }

    function startProfileLifecycle(targetSession: Session, mode: "initial" | "background") {
      generationRef.current += 1;
      const gen = generationRef.current;
      retryAttempt = 0;
      clearRetryTimer();
      clearSkeletonTimer();
      if (mode === "initial" && !profileRef.current) {
        setProfileStatus("loading");
        // Skeleton timeout muda só o que aparece na tela; NÃO cancela retries.
        // Se um retry chegar com sucesso depois, status='ready' restaura por cima.
        skeletonTimer = window.setTimeout(() => {
          if (!mounted) return;
          if (gen !== generationRef.current) return;
          if (profileRef.current) return;
          setProfileStatus((prev) => (prev === "loading" ? "error" : prev));
        }, PROFILE_BOOT_SKELETON_TIMEOUT_MS);
      }
      void fetchAndApply(targetSession, gen);
    }

    function cancelProfileLifecycle() {
      generationRef.current += 1;
      clearRetryTimer();
      clearSkeletonTimer();
      retryAttempt = 0;
      profileRef.current = null;
      setProfile(null);
      setProfileStatus("idle");
      setProfileError(null);
    }

    if (!supabase) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (!mounted) return;
        const initialSession = data.session;
        setSession(initialSession);

        if (initialSession) {
          startProfileLifecycle(initialSession, "initial");
        }

        // Callback de OAuth em andamento: getSession resolveu null mas a URL ainda
        // tem ?code= (PKCE) / token no hash (implicit). A troca vai concluir e
        // emitir SIGNED_IN — NÃO feche o loading agora, senão abrimos a janela
        // (loading=false, user=null) que faz os guards redirecionarem indevidamente.
        if (!initialSession && hasOAuthCallbackInUrl()) {
          console.info("[auth] holding loading for OAuth callback");
          // Salvaguarda: se o SIGNED_IN nunca chegar (ex.: troca PKCE falha), não
          // travar em spinner eterno — degrada graciosamente para "não autenticado".
          safetyTimer = window.setTimeout(() => {
            if (!mounted) return;
            console.warn("[auth] safety timeout fired; treating as unauthenticated");
            setSession(null);
            cancelProfileLifecycle();
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
        cancelProfileLifecycle();
      } else {
        if (nextSession.user) {
          posthog.identify(nextSession.user.id);
        }
        // Modo 'initial' apenas quando ainda não há perfil cacheado.
        // TOKEN_REFRESHED/USER_UPDATED com perfil presente entram em 'background'
        // e nunca acendem skeleton.
        const mode: "initial" | "background" = profileRef.current ? "background" : "initial";
        startProfileLifecycle(nextSession, mode);
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
      clearRetryTimer();
      clearSkeletonTimer();
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

  // One-shot. Não dispara retry interno; caller decide o que fazer com a falha.
  // Sucesso aplicado atualiza profile e zera profileError. Falha propaga.
  //
  // Participa do generation guard: bumpa antes de buscar, cheka antes de
  // aplicar. Se foi suplantado (SIGNED_OUT, ou outra busca mais nova chegou
  // antes), resolve sem aplicar — o estado já reflete dado >= este.
  // Log info-level para não virar silêncio (lembra do H3).
  const refreshProfile = useCallback(async () => {
    if (!session) {
      generationRef.current += 1;
      profileRef.current = null;
      setProfile(null);
      setProfileStatus("idle");
      setProfileError(null);
      return;
    }

    generationRef.current += 1;
    const gen = generationRef.current;
    const nextProfile = await getMyProfile();
    if (gen !== generationRef.current) {
      console.info("[AuthContext] refreshProfile suplantado; estado atual já reflete dado >= este");
      return;
    }
    profileRef.current = nextProfile;
    setProfile(nextProfile);
    setProfileStatus("ready");
    setProfileError(null);
  }, [session]);

  const signOut = useCallback(async () => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    // O listener onAuthStateChange recebe SIGNED_OUT e zera o ciclo de perfil
    // (timers, geração, profileError) via cancelProfileLifecycle.
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
      profileStatus,
      profileError,
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
      profileStatus,
      profileError,
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

  const internalsValue = useMemo<AuthInternalsForTests>(() => ({ profileRef }), []);

  return (
    <AuthInternalsForTestsContext.Provider value={internalsValue}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </AuthInternalsForTestsContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
