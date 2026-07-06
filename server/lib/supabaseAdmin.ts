import { createClient } from "@supabase/supabase-js";

import { env } from "./env";

const supabaseUrl = env.supabaseUrl || "http://localhost:54321";
const serviceRoleKey =
  env.supabaseServiceRoleKey || "service-role-key-not-configured";

// Teto por request HTTP ao PostgREST/Storage/Auth. Sem isso, uma trava do
// lado do Supabase segura qualquer rota indefinidamente (fetch nativo nao tem
// timeout). AbortSignal.any encadeia com o signal que o supabase-js passar.
const SUPABASE_FETCH_TIMEOUT_MS = 15_000;

const fetchWithDeadline: typeof fetch = (input, init = {}) => {
  const timeoutSignal = AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(input, { ...init, signal });
};

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: fetchWithDeadline,
  },
});
