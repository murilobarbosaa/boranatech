// Captures window.location.hash before any other module (notably the Supabase
// client) has a chance to consume and clear it. Must be the first import in
// main.tsx so this side effect runs ahead of supabase-js' detectSessionInUrl.
if (typeof window !== "undefined") {
  window.__BNT_INITIAL_HASH = window.location.hash;
}

export {};
