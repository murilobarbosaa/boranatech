import { createClient } from "@supabase/supabase-js";

import { env } from "./env";

const supabaseUrl = env.supabaseUrl || "http://localhost:54321";
const serviceRoleKey = env.supabaseServiceRoleKey || "service-role-key-not-configured";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
