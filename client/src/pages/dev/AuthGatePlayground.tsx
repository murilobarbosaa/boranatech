import { toast } from "sonner";

import AuthGateModal from "@/components/gate/AuthGateModal";
import { useAuthGate } from "@/hooks/useAuthGate";

// PROTOTIPO DESCARTAVEL: pagina dev-only pra validar o fluxo do gate manualmente
// (abrir modal -> /login -> voltar via returnTo). Texto dev-only, nao embarca.
export default function AuthGatePlayground() {
  const { status, gateNavigate, gateAction, modalProps } = useAuthGate();

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <h1 className="font-display text-2xl font-black text-slate-950">
        Auth Gate Playground
      </h1>

      <p className="text-sm font-bold text-slate-700">
        status: <code className="rounded bg-slate-100 px-2 py-1">{status}</code>
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => gateNavigate("/perfil")}
          className="rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-3 font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
        >
          abrir conteudo (gateNavigate /perfil)
        </button>

        <button
          type="button"
          onClick={() =>
            gateAction({
              intent: {
                kind: "domain",
                domain: "demo",
                payload: { ts: "playground" },
              },
              run: () => {
                console.log("[AuthGatePlayground] run executado (autenticado)");
                toast.success("Acao in-place executada (autenticado).");
              },
            })
          }
          className="rounded-full border-2 border-slate-950 bg-white px-5 py-3 font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
        >
          acao in-place (gateAction demo)
        </button>
      </div>

      <AuthGateModal {...modalProps} />
    </div>
  );
}
