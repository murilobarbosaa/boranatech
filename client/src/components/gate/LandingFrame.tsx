import { useEffect } from "react";
import posthog from "posthog-js";

import { API_BASE } from "@/lib/api";

// Landing de lancamento embutida como documento estatico (/lancamento.html) num
// iframe full-viewport. Design byte-a-byte igual ao arquivo de referencia. A base
// da API vai por query param pro form interno postar em {API}/api/waitlist.
export default function LandingFrame() {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; source?: string } | null;
      if (data?.type === "bnt:waitlist_signup") {
        posthog.capture("waitlist_signup", { source: data.source });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const src = `/lancamento.html?api=${encodeURIComponent(API_BASE)}`;

  return (
    <iframe
      title="Bora na Tech"
      src={src}
      className="fixed inset-0 h-full w-full border-0"
    />
  );
}
