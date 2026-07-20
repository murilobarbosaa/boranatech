import { supabaseAdmin } from "./supabaseAdmin";

export type AuthTimes = { lastSignInAt: string | null; createdAt: string | null };

// Varredura unica de auth.users -> mapa user_id -> {last_sign_in_at, created_at}.
// last_sign_in_at e created_at so existem em auth.users (nao em profiles), por
// isso a varredura do Auth. Erro propaga (o chamador transforma em estado/erro).
// Consumidores: metricas de retencao (server/lib/usageRetention.ts) e o filtro
// ATIVO da aba Usuarios (server/routes/admin.ts). Fonte unica: nao duplicar o
// scan.
export async function fetchAuthTimes(): Promise<Map<string, AuthTimes>> {
  const map = new Map<string, AuthTimes>();
  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    for (const user of data.users) {
      map.set(user.id, {
        lastSignInAt: user.last_sign_in_at ?? null,
        createdAt: user.created_at ?? null,
      });
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  return map;
}
