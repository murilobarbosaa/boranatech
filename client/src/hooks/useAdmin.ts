import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { readAdminClaim } from "@/lib/adminClaim";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;

    if (!user || !client) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const {
          data: { session },
        } = await client!.auth.getSession();

        if (!session?.access_token) {
          if (!cancelled) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }

        // Caminho rapido: le a claim admin_role do token (sem rede). O backend
        // continua validando admin via RPC a cada request; isto e so para a UI.
        const claimRole = readAdminClaim(session.access_token);
        if (claimRole) {
          if (!cancelled) {
            setIsAdmin(true);
            setLoading(false);
          }
          return;
        }

        // Fallback: token sem a claim (sessao antiga) -> comportamento atual.
        const res = await fetch(apiUrl("/api/admin/me"), {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!cancelled) {
          setIsAdmin(res.ok);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { isAdmin, loading };
}
