import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto do board, em arquivo proprio porque tem DOIS usos que precisam ser
// o mesmo desenho:
//   1. o primeiro carregamento do snapshot, dentro do TasksDashboard;
//   2. o fallback do Suspense em Admin.tsx, enquanto o chunk do modulo baixa.
// Se fossem dois desenhos, abrir a aba mostraria um esqueleto, trocaria por
// outro e so entao pelo board.
//
// Fica FORA do TasksDashboard de propósito: importa-lo do Admin.tsx puxaria o
// modulo inteiro (e o dnd-kit junto) para o chunk do Admin, desfazendo
// exatamente o lazy que ele existe para servir.

export function TasksPanelSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="w-[19rem] shrink-0 rounded-3xl border-2 border-slate-900 bg-slate-50 p-3 shadow-[3px_3px_0_#0f172a]"
        >
          <Skeleton className="mb-3 h-5 w-32 bg-slate-200" />
          <div className="space-y-2.5">
            <Skeleton className="h-24 w-full rounded-2xl bg-slate-200" />
            <Skeleton className="h-24 w-full rounded-2xl bg-slate-200" />
            <Skeleton className="h-16 w-full rounded-2xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
