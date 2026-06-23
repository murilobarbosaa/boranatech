import { useEffect, useState, type FormEvent } from "react";

import { apiUrl } from "@/lib/api";
import { setBetaToken } from "@/lib/betaGate";

type Status = "idle" | "submitting" | "invalid" | "unavailable" | "error";

// Porta interna do tester. Renderizada direto pelo LaunchGate, fora do Switch.
export default function Acesso() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submitCode(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setStatus("submitting");
    try {
      const res = await fetch(apiUrl("/api/beta/unlock"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      if (res.ok) {
        const data = (await res.json()) as { token?: string };
        if (data.token) {
          setBetaToken(data.token);
          // Reload completo pro LaunchGate reavaliar com o token novo.
          window.location.href = "/";
          return;
        }
        setStatus("error");
        return;
      }

      if (res.status === 401) {
        setStatus("invalid");
        return;
      }
      if (res.status === 503) {
        setStatus("unavailable");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  // Auto-submit quando o codigo vem por ?code= na URL.
  useEffect(() => {
    const codeFromUrl = new URLSearchParams(window.location.search).get("code");
    if (codeFromUrl) {
      setCode(codeFromUrl);
      void submitCode(codeFromUrl);
      // Tira o ?code= da URL pra nao vazar o codigo em historico/share.
      window.history.replaceState({}, "", "/acesso");
    }
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void submitCode(code);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8f4] px-6">
      <div className="w-full max-w-sm rounded-2xl border-2 border-slate-950 bg-white p-8 shadow-[5px_5px_0_#0f172a]">
        {/* TODO(Ana): copy da porta de acesso beta. */}
        <h1 className="font-display text-2xl font-black text-slate-950">
          Acesso beta
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Digite seu código de acesso para entrar.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Seu código"
            autoFocus
            className="rounded-lg border-2 border-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-lg border-2 border-slate-950 bg-yellow-400 px-4 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] disabled:opacity-60"
          >
            {/* TODO(Ana) */}
            {status === "submitting" ? "Verificando..." : "Entrar"}
          </button>
        </form>

        {/* TODO(Ana): mensagens de estado. */}
        {status === "invalid" ? (
          <p className="mt-4 text-sm font-bold text-red-600">
            Código inválido. Tente de novo.
          </p>
        ) : null}
        {status === "unavailable" ? (
          <p className="mt-4 text-sm font-bold text-slate-600">
            Acesso indisponível no momento.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-4 text-sm font-bold text-slate-600">
            Algo deu errado. Tente de novo.
          </p>
        ) : null}
      </div>
    </div>
  );
}
