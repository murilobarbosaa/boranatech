import { Skeleton } from "@/components/ui/skeleton";
import { diaBrasilia } from "@shared/brasiliaDay";
import { gerarGradeDoMes } from "@shared/creatorCalendar";

// ESQUELETOS DA PAGINA /creator (lote 11c). Cada cartao que antes mostrava o
// `LoadingBlock` (a caixa tracejada "Carregando...") ou nada enquanto
// carregava passa a nascer com a FORMA do conteudo final, na altura certa, e
// vira conteudo no lugar: nenhum cartao some e volta, e a pagina nao pula.
// O molde e o do UserDetailSkeleton do admin: o `Skeleton` do site com
// `bg-slate-200`, dentro das mesmas cascas (raio, borda, padding) que o
// conteudo real usa. Cada esqueleto leva `aria-busy` e um test id proprio.

const OSSO = "bg-slate-200";

function Cabecalho() {
  return (
    <div className="space-y-3">
      <Skeleton className={`h-6 w-28 rounded-full ${OSSO}`} />
      <Skeleton className={`h-8 w-56 ${OSSO}`} />
      <Skeleton className={`h-4 w-full max-w-md ${OSSO}`} />
    </div>
  );
}

function Campo() {
  return (
    <div className="space-y-1.5">
      <Skeleton className={`h-2.5 w-24 ${OSSO}`} />
      <Skeleton className={`h-10 w-full rounded-[11px] ${OSSO}`} />
    </div>
  );
}

/** Aba Numeros: o painel (seis cards de metrica, o grafico e os cupons). */
export function EsqueletoDoPainel() {
  return (
    <div
      data-testid="creator-painel-esqueleto"
      aria-busy="true"
      className="space-y-6 md:space-y-8"
    >
      <section className="card-surface space-y-5 rounded-3xl bg-white p-6 md:p-8">
        <Cabecalho />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border-2 border-slate-200 p-4"
            >
              <Skeleton className={`h-6 w-6 rounded-full ${OSSO}`} />
              <Skeleton className={`mt-4 h-7 w-20 ${OSSO}`} />
              <Skeleton className={`mt-2 h-3 w-28 ${OSSO}`} />
            </div>
          ))}
        </div>
        <Skeleton className={`h-64 w-full rounded-2xl ${OSSO}`} />
      </section>
      <section className="card-surface space-y-5 rounded-3xl bg-white p-6 md:p-8">
        <Cabecalho />
        <Skeleton className={`h-24 w-full rounded-2xl ${OSSO}`} />
      </section>
    </div>
  );
}

/** Aba Perfil: os dois cartoes, Redes e Pagamento, lado a lado no desktop. */
export function EsqueletoDoPerfil() {
  return (
    <div
      data-testid="creator-perfil-esqueleto"
      aria-busy="true"
      className="grid gap-6 lg:grid-cols-2 lg:items-stretch"
    >
      {[0, 1].map((cartao) => (
        <section
          key={cartao}
          className="card-surface h-full space-y-5 rounded-3xl bg-white p-6 md:p-8"
        >
          <Cabecalho />
          <div className="space-y-4">
            {[0, 1, 2, 3].map((campo) => (
              <Campo key={campo} />
            ))}
            <Skeleton className={`h-11 w-40 rounded-[11px] ${OSSO}`} />
          </div>
        </section>
      ))}
    </div>
  );
}

/** Aba Calendario, segundo cartao: o formulario a esquerda e tres linhas a direita. */
export function EsqueletoDasPublicacoes() {
  return (
    <div
      data-testid="creator-publicacoes-esqueleto"
      aria-busy="true"
      className="space-y-5 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8 lg:space-y-0"
    >
      <div className="space-y-5">
        <Cabecalho />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className={`h-9 w-24 rounded-full ${OSSO}`} />
          ))}
        </div>
        <Campo />
        <Skeleton className={`h-11 w-32 rounded-[11px] ${OSSO}`} />
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={`h-12 w-full rounded-2xl ${OSSO}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Aba Calendario, primeiro cartao, na PRIMEIRA carga: cabecalho, seletor de
 * mes, e a grade com o mesmo numero de linhas do mes atual (a troca de mes ja
 * tem o proprio esqueleto, dentro do componente).
 */
export function EsqueletoDoCalendario({
  agora = () => new Date(),
}: {
  agora?: () => Date;
}) {
  const hoje = diaBrasilia(agora().toISOString()) ?? "2026-01-01";
  const grade = gerarGradeDoMes(
    Number(hoje.slice(0, 4)),
    Number(hoje.slice(5, 7)),
  );
  return (
    <div
      data-testid="creator-calendario-esqueleto"
      aria-busy="true"
      className="space-y-5"
    >
      <Cabecalho />
      <div className="flex items-center justify-between">
        <Skeleton className={`h-8 w-8 rounded-full ${OSSO}`} />
        <Skeleton className={`h-4 w-40 ${OSSO}`} />
        <Skeleton className={`h-8 w-8 rounded-full ${OSSO}`} />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={`d-${i}`} className={`mx-auto h-3 w-3 ${OSSO}`} />
        ))}
        {grade.flat().map((quadrado) => (
          <div
            key={quadrado.dia}
            className="min-h-14 animate-pulse rounded-xl border-2 border-slate-200 bg-slate-100"
          />
        ))}
      </div>
      <Skeleton className={`h-24 w-full rounded-2xl ${OSSO}`} />
    </div>
  );
}

/** Aba Numeros: o mini ranking (lote 11d), titulo, botao e tres linhas. */
export function EsqueletoDoCartaoDoRanking() {
  return (
    <section
      data-testid="creator-card-ranking-esqueleto"
      aria-busy="true"
      className="card-surface space-y-3 rounded-3xl bg-white p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className={`h-9 w-44 ${OSSO}`} />
        <Skeleton className={`h-8 w-40 rounded-full ${OSSO}`} />
      </div>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className={`h-12 w-full rounded-2xl ${OSSO}`} />
      ))}
    </section>
  );
}

/** Aba Ranking: o podio de tres cartoes e cinco linhas da lista. */
export function EsqueletoDoRanking() {
  return (
    <div
      data-testid="creator-ranking-carregando"
      aria-busy="true"
      className="space-y-5"
    >
      <Skeleton className={`h-5 w-48 rounded-full ${OSSO}`} />
      <ul className="grid gap-4 md:grid-cols-3">
        {[2, 1, 3].map((n) => (
          <li
            key={n}
            className="flex h-64 flex-col items-center rounded-3xl border-2 border-slate-200 p-5 pt-8"
          >
            <Skeleton className={`h-28 w-28 rounded-full ${OSSO}`} />
            <Skeleton className={`mt-4 h-4 w-24 rounded-full ${OSSO}`} />
            <Skeleton className={`mt-3 h-9 w-16 ${OSSO}`} />
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={`h-14 w-full rounded-2xl ${OSSO}`} />
        ))}
      </div>
    </div>
  );
}
