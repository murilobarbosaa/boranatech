import { AlertCircle, FileText, RefreshCw } from "lucide-react";
import ProGate from "@/components/pro/ProGate";
import { Skeleton } from "@/components/ui/skeleton";

export function LinkedinSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card-brutal overflow-hidden rounded-2xl border-slate-950 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-slate-200" />
              <Skeleton className="h-6 w-56 bg-slate-200" />
              <Skeleton className="h-4 w-72 bg-slate-200" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full bg-slate-200" />
              <Skeleton className="h-7 w-20 rounded-full bg-slate-200" />
              <Skeleton className="h-7 w-28 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="border-t-2 border-slate-950 md:w-56 md:border-l-2 md:border-t-0">
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
              <Skeleton className="h-14 w-24 bg-slate-200" />
              <Skeleton className="h-6 w-24 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-2xl bg-slate-200" />
      <Skeleton className="h-40 w-full rounded-2xl bg-slate-200" />
      <Skeleton className="h-40 w-full rounded-2xl bg-slate-200" />
    </div>
  );
}

function resolveError(error: string): string {
  if (error === "LOGIN_REQUIRED") return "Faça login para usar a análise.";
  if (error.startsWith("RATE_LIMITED")) {
    const detail = error.replace("RATE_LIMITED:", "").trim();
    return detail || "Você atingiu o limite diário de análises. Tente amanhã.";
  }
  if (error === "INVALID_REQUEST") {
    return "Confira os campos do formulário e tente de novo.";
  }
  if (error === "ANALYSIS_FAILED") {
    return "Não consegui completar a análise agora. Tente de novo.";
  }
  return error || "Não consegui completar a análise agora. Tente de novo.";
}

interface LinkedinErrorProps {
  error: string;
  onRetry?: () => void;
}

export function LinkedinError({ error, onRetry }: LinkedinErrorProps) {
  if (error === "PRO_REQUIRED") {
    return (
      <ProGate description="O analisador de LinkedIn faz parte do Plano Pro. Assine para liberar a análise completa." />
    );
  }

  if (error === "UNREADABLE") {
    return (
      <div className="card-brutal rounded-2xl border-slate-300 bg-amber-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[3px_3px_0_#0f172a]">
          <FileText className="h-7 w-7 text-amber-600" />
        </div>
        <p className="mx-auto max-w-2xl text-base font-bold text-slate-800">
          Não consegui ler seu perfil a partir do texto enviado. Tente colar o
          texto do perfil manualmente no campo de texto, copiando direto das
          seções do seu LinkedIn (headline, Sobre e experiências).
        </p>
      </div>
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
