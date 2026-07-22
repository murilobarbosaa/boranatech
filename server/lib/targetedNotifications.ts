import { supabaseAdmin } from "./supabaseAdmin";

// Notificacao in-app direcionada a UM usuario, criada por fluxo interno do
// server (hoje: bugs do admin), fora do CRUD do adminNotifications. Reusa o
// mecanismo existente audience='custom' + notification_recipients (lista
// materializada na criacao, visibilidade resolvida na leitura por
// notificationAudience.ts): nada novo na resolucao de audiencia, e a listagem
// do admin enxerga estas linhas como qualquer custom.
//
// Diferente do fluxo do admin (draft -> publish), nasce ja published: e um
// aviso automatico de sistema, sem etapa humana de revisao.

type TargetedNotificationParams = {
  email: string;
  title: string;
  body: string;
  type?: "announcement" | "coupon" | "optin" | "system";
  category?: "product" | "promotional";
  createdBy?: string | null;
};

export async function createTargetedNotification(
  params: TargetedNotificationParams,
): Promise<void> {
  // Mesma normalizacao do adminNotifications (recipientEmailsSchema): emails
  // em profiles casam em lowercase exato, entao lowercase aqui = lookup
  // case-insensitive sem ilike (que trataria _ e % de emails como wildcard).
  const email = params.email.trim().toLowerCase();
  if (!email) {
    console.warn(
      "[targetedNotification] email de destino vazio, notificação não criada.",
    );
    return;
  }

  const { data: profile, error: lookupError } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .not("user_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    throw new Error(lookupError.message);
  }
  if (!profile?.user_id) {
    console.warn(
      `[targetedNotification] email sem cadastro na plataforma, notificação não criada: ${email}`,
    );
    return;
  }

  // Clamp defensivo nos checks do banco (title 1..200, body 1..2000). O
  // char_length do Postgres conta code points e o slice do JS conta UTF-16
  // (emoji = 2), entao o slice nunca estoura o limite do check.
  const { data: created, error: insertError } = await supabaseAdmin
    .from("notifications")
    .insert({
      title: params.title.slice(0, 200),
      body: params.body.slice(0, 2000),
      type: params.type ?? "system",
      category: params.category ?? "product",
      audience: "custom",
      status: "published",
      published_at: new Date().toISOString(),
      created_by: params.createdBy ?? null,
    })
    .select("id")
    .single();
  if (insertError || !created) {
    throw new Error(insertError?.message ?? "Insert da notificação falhou.");
  }

  const { error: recipientError } = await supabaseAdmin
    .from("notification_recipients")
    .insert({ notification_id: created.id, user_id: profile.user_id });
  if (recipientError) {
    // Espelho do rollback do adminNotifications: custom sem destinatario
    // quebra a invariante do mecanismo (publicada porem invisivel no feed).
    await supabaseAdmin.from("notifications").delete().eq("id", created.id);
    throw new Error(recipientError.message);
  }
}
