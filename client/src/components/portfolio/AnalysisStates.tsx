import { AlertCircle, RefreshCw } from "lucide-react";
import ProGate from "@/components/pro/ProGate";

// O skeleton foi promovido para components/shared (fundacao do redesign);
// o re-export mantem o caminho antigo funcionando.
export { default as AnalysisSkeleton } from "@/components/shared/AnalysisSkeleton";

function resolveError(error: string): string {
  if (error === "LOGIN_REQUIRED") return "Faça login pra usar a análise.";
  if (error.startsWith("RATE_LIMITED")) {
    const detail = error.replace("RATE_LIMITED:", "").trim();
    return detail || "Você atingiu o limite diário de análises. Tente amanhã.";
  }
  if (error === "NOT_FOUND") {
    return "Repositório ou perfil não encontrado, ou é privado. Deixe público e tente de novo.";
  }
  if (error === "GITHUB_BUSY")
    return "O GitHub está limitando as requisições agora. Tente em instantes.";
  if (error === "ANALYSIS_FAILED")
    return "Não consegui completar a análise agora. Tente de novo.";
  return error || "Não consegui completar a análise agora. Tente de novo.";
}

interface AnalysisErrorProps {
  error: string;
  onRetry?: () => void;
}

export function AnalysisError({ error, onRetry }: AnalysisErrorProps) {
  if (error === "PRO_REQUIRED") {
    return (
      <ProGate description="O analisador de GitHub faz parte do Plano Pro. Assine para liberar a análise completa." />
    );
  }

  return (
    <div className="card-brutal rounded-2xl border-slate-300 bg-red-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[3px_3px_0_#0f172a]">
        <AlertCircle className="h-7 w-7 text-red-600" />
      </div>
      <p className="mx-auto max-w-2xl text-base font-bold text-slate-800">
        {resolveError(error)}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="btn-brutal-primary mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-900"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}
