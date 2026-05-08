import { assertSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { AuthUser } from "./contracts";

function toAuthUser(user: User): AuthUser {
  const email = user.email ?? "";
  const name = typeof user.user_metadata.name === "string" ? user.user_metadata.name : email.split("@")[0] || "Usuária";

  return {
    id: user.id,
    name,
    email,
    handle: `@${email.split("@")[0] || "bora.na.tech"}`,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const client = assertSupabaseConfigured();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return toAuthUser(data.user);
}

export async function signInWithProvider(): Promise<void> {
  const client = assertSupabaseConfigured();
  const redirectPath = import.meta.env.VITE_AUTH_REDIRECT_PATH || "/perfil";
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`,
    },
  });

  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const client = assertSupabaseConfigured();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
