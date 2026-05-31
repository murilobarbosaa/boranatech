import { Lock } from "lucide-react";
import { Link } from "wouter";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface ProGateProps {
  description: string;
  className?: string;
}

export default function ProGate({ description, className = "" }: ProGateProps) {
  const { loading } = useSubscription();

  if (loading) {
    return (
      <div
        className={`card-brutal rounded-2xl border-slate-300 bg-slate-100 p-6 text-center ${className}`}
      >
        <p className="font-display text-2xl font-black text-slate-950">
          Verificando acesso...
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-slate-600">
          Estamos conferindo sua assinatura e permissões administrativas.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`card-brutal rounded-2xl border-slate-300 bg-slate-100 p-6 text-center ${className}`}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[3px_3px_0_#0f172a]">
        <Lock className="h-7 w-7 text-violet-700" />
      </div>
      <h2 className="font-display text-2xl font-black text-slate-950">
        Disponível no Plano Pro
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-slate-600">
        {description}
      </p>
      <Link
        href="/planos"
        className="btn-brutal-accent mt-5 inline-flex rounded-full px-6 py-3 text-sm font-black"
      >
        Ver planos Pro
      </Link>
    </div>
  );
}
