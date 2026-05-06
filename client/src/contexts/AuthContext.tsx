import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Profile } from "@/services/contracts";
import { getMyProfile } from "@/services/profileService";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

interface SignInInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

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

    supabase.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession: Session | null) => {
      setSession(nextSession);
      if (event === "SIGNED_OUT" || !nextSession) {
        setProfile(null);
      } else {
        void loadProfile(nextSession);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async ({ name, email, password }: SignUpInput) => {
    try {
      const client = assertSupabaseConfigured();
      const { error } = await client.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: {
            name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/perfil`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("[AuthContext] signUp failed", error);
      throw error;
    }
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInInput) => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo: `${window.location.origin}/nova-senha`,
    });

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
      signOut,
      resetPassword,
      updatePassword,
    }),
    [loading, profile, resetPassword, session, signIn, signOut, signUp, updatePassword]
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
