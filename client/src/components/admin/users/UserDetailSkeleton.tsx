import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto do corpo do modal, no molde do TasksPanelSkeleton (arquivo proprio,
// desenho unico). LOCAL a users/: nada foi promovido de tasks/.
//
// Por que esqueleto e nao o LoadingBlock generico: com o cabecalho fixo, o nome
// e o selo do usuario ja estao na tela enquanto o corpo carrega. Uma caixa
// tracejada de "Carregando dados..." embaixo de um cabecalho preenchido parece
// falha, nao espera. O esqueleto mantem a FORMA das secoes, entao o layout nao
// pula quando o dado chega.
export function UserDetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="user-detail-skeleton">
      {[0, 1].map((secao) => (
        <div key={secao} className="space-y-3">
          <Skeleton className="h-3 w-40 bg-slate-200" />
          <div className="rounded-2xl border-2 border-slate-200 p-4">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((campo) => (
                <div key={campo} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-24 bg-slate-200" />
                  <Skeleton className="h-4 w-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
