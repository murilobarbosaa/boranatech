import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Profile, ProfileSnapshot } from "./contracts";

const API_BASE = apiUrl("/api");

// Item 5.1. Aqui viviam `PENDING_MARKETING_OPTIN_KEY` e
// `recordPendingMarketingOptIn`, o par que carregava o opt-in de marketing do
// formulario de cadastro ate o SIGNED_IN. Removidos com os checkboxes que os
// alimentavam: consentimento de marketing precisa ser especifico e destacado
// (LGPD art. 8 par. 4) e nao pode vir empacotado com o aceite dos termos.
//
// A chave `bnt_pending_marketing_optin` pode existir no sessionStorage de quem
// estava no meio de um cadastro durante o deploy. Ninguem le mais, e
// sessionStorage morre com a aba: nao ha nada a limpar.
//
// A escolha de marketing acontece em /bem-vindo (card dispensavel) e no perfil.

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getProfileSnapshot(): Promise<ProfileSnapshot> {
  const profile = await getMyProfile();

  return {
    trails: profile.area_interesse ? [profile.area_interesse] : [],
    roadmaps: [],
    savedCourses: [],
    savedProjects: [],
    favoriteJobs: [],
    communities: [],
  };
}

// Erro de leitura de perfil com o status HTTP ANEXADO, mesmo padrao do
// `consentError` em consentService.ts. O status ja aparecia dentro do texto da
// mensagem, mas texto de mensagem nao e campo: recuperar o numero de volta exigiria
// casar `/HTTP (\d+)/` na string, ou seja, um parser sobre a saida de outro trecho
// nosso, que e a classe de instrumento que falha PASSANDO (casa menos do que
// deveria e ninguem percebe). Como campo, quem loga le `err.status` direto.
// O `kind` existe porque o `status` sozinho NAO distingue os tres desfechos no
// consumidor. `AuthContext` le `?.status ?? null`, entao "status null" (200 com
// corpo invalido) e "sem propriedade status" (fetch rejeitou, erro que nem
// passou por aqui) chegam identicos ao Sentry, e a issue de
// `profile_fetch_exhausted` mistura problema nosso com problema de rede. Pelo
// mesmo motivo do `status`: em campo, nunca so dentro do texto da mensagem.
type ProfileErrorKind = "http" | "invalid_body";

function profileError(
  status: number | null,
  message: string,
  kind: ProfileErrorKind,
): Error {
  const err = new Error(message) as Error & {
    status?: number | null;
    authErrorKind?: ProfileErrorKind;
  };
  err.status = status;
  err.authErrorKind = kind;
  return err;
}

export async function getMyProfile(): Promise<Profile> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/me`, { headers });
  if (!res.ok) {
    throw profileError(
      res.status,
      `Erro ao buscar perfil (HTTP ${res.status}).`,
      "http",
    );
  }
  const json = (await res.json().catch(() => null)) as {
    data?: Profile | null;
  } | null;
  if (!json?.data?.id) {
    // 200 com corpo invalido: status null distingue do caso de falha HTTP.
    throw profileError(
      null,
      "Erro ao buscar perfil (resposta vazia ou inválida).",
      "invalid_body",
    );
  }
  return json.data;
}

export async function updateMyProfile(
  updates: Record<string, unknown>,
): Promise<Profile> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/me`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error("Erro ao atualizar perfil");
  const json = (await res.json()) as { data: Profile };
  return json.data;
}
