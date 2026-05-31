import type { AuthUser } from "../middleware/auth";
import type { Gender } from "../../shared/gender";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Monta a mensagem de contexto "[dados do cadastro] ..." que vai como system
 * antes do histórico em tools que pedem injectLoginContext (resume-builder, etc).
 *
 * Fonte autoritativa: tabela profiles (name + gender). Fallback pro
 * userMetadata e por fim pro prefixo do email, mesmo padrão de
 * server/routes/me.ts:profileNameFromAuth.
 */
export async function buildLoginContextMessage(
  user: AuthUser,
): Promise<string> {
  const { name, gender } = await fetchProfileBasics(user);
  const generoLabel = describeGender(gender);
  return `[dados do cadastro] Nome: ${name}, Email: ${user.email}, Gênero: ${generoLabel}`;
}

async function fetchProfileBasics(
  user: AuthUser,
): Promise<{ name: string; gender: Gender | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("name, gender")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      const profileName = typeof data.name === "string" ? data.name.trim() : "";
      if (profileName) {
        return {
          name: profileName,
          gender: (data.gender as Gender | null) ?? null,
        };
      }
      return {
        name: nameFromMetadataOrEmail(user),
        gender: (data.gender as Gender | null) ?? null,
      };
    }
  } catch (err) {
    console.warn(
      "[loginContext] Falha ao ler profiles, caindo pra fallback:",
      err,
    );
  }

  return { name: nameFromMetadataOrEmail(user), gender: null };
}

function nameFromMetadataOrEmail(user: AuthUser): string {
  const metadata = user.userMetadata || {};
  const candidates = [metadata.name, metadata.full_name, metadata.user_name];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim())
      return candidate.trim();
  }
  return user.email.split("@")[0];
}

function describeGender(gender: Gender | null): string {
  if (gender === "masculino") return "masculino";
  if (gender === "feminino") return "feminino";
  return "não informado";
}
