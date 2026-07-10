import { Skeleton } from "@/components/ui/skeleton";

// Skeleton de analise com IA, promovido do Portfolio (o melhor dos tres) para
// uso compartilhado: silhueta do cabecalho de resultado (icone, titulo, chips
// e painel de nota) seguida de blocos de conteudo. trailingBlocks parametriza
// so a quantidade de blocos abaixo do cabecalho.

interface AnalysisSkeletonProps {
  trailingBlocks?: number;
}

export default function AnalysisSkeleton({
  trailingBlocks = 3,
}: AnalysisSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="card-brutal overflow-hidden rounded-2xl border-slate-950 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24 bg-slate-200" />
                <Skeleton className="h-6 w-48 bg-slate-200" />
                <Skeleton className="h-6 w-32 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-7 w-28 rounded-full bg-slate-200" />
              <Skeleton className="h-7 w-24 rounded-full bg-slate-200" />
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
      {Array.from({ length: trailingBlocks }, (_, index) => (
        <Skeleton
          key={index}
          className={
            index === 0
              ? "h-28 w-full rounded-2xl bg-slate-200"
              : "h-40 w-full rounded-2xl bg-slate-200"
          }
        />
      ))}
    </div>
  );
}
