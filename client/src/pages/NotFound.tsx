import { Link } from "wouter";
import { ArrowLeft, Rocket } from "lucide-react";
import Layout from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-violet-100 border-2 border-violet-300 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_#0f172a]">
            <Rocket className="w-10 h-10 text-violet-600" />
          </div>
          <h1 className="font-display font-bold text-6xl text-slate-900 mb-2">
            404
          </h1>
          <h2 className="font-display font-bold text-2xl text-slate-700 mb-3">
            Página não encontrada
          </h2>
          <p className="text-slate-950 mb-8">
            Essa página não existe ou foi movida. Mas não se preocupe — tem
            muito conteúdo esperando por você!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-700 text-white font-bold rounded-lg border-2 border-slate-900 shadow-[4px_4px_0_#0f172a] hover:shadow-[6px_6px_0_#0f172a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>
        </div>
      </div>
    </Layout>
  );
}
