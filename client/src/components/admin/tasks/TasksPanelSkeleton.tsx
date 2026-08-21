import { Skeleton } from "@/components/ui/skeleton";

import { columnShellClass } from "./taskBoardStyles";

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

/**
 * So a AREA DAS COLUNAS.
 *
 * Existe separado porque a TROCA de quadro precisa dele sozinho: la a barra de
 * quadros continua montada (a pessoa acabou de clicar nela) e apenas as colunas
 * viram esqueleto. E o mesmo desenho do painel inteiro pela razao do comentario
 * acima, agora com um terceiro uso: dois desenhos fariam a troca piscar de um
 * esqueleto para outro.
 */
export function BoardColumnsSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          // A MESMA moldura da coluna real (ver columnShellClass): o
          // carregamento tem que parecer a tela chegando, nao outra tela, e a
          // largura compartilhada e o que impede o salto quando os dados
          // entram. `bg-slate-50` e o fundo da coluna real em repouso.
          className={`${columnShellClass} bg-slate-50`}
          // A faixa do topo da coluna real tem a COR DA ETAPA, que e dado que
          // ainda nao chegou. Faixa neutra e a ausencia honesta: inventar uma
          // cor aqui seria afirmar um estado que ninguem carregou.
          style={{ borderTopColor: "#cbd5e1", borderTopWidth: 6 }}
        >
          {/* Silhueta do cabecalho: titulo da etapa e a pilula de contagem. */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-32 bg-slate-200" />
            <Skeleton className="h-5 w-8 rounded-full bg-slate-200" />
          </div>
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

export function TasksPanelSkeleton() {
  return <BoardColumnsSkeleton />;
}
