import {
  displayName,
  fmtDate,
  initialsOf,
  proBadgeOf,
  subscriptionStatusBadgeOf,
  planLabelOf,
} from "./userFormat";
import type { UserRow } from "./types";

// Grade compartilhada pelo cabecalho e pelas linhas, para as colunas alinharem
// sem <table>. Ver o comentario de UserListRow sobre por que nao e tabela.
const GRID =
  "grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.7fr)] md:items-center";

const BADGE_BASE =
  "inline-flex w-fit items-center rounded-full border-2 px-2.5 py-0.5 text-xs font-black uppercase";

// Rotulo que so aparece no MOBILE, onde as colunas viram pilha e o valor
// sozinho perde o significado. No desktop o cabecalho da a semantica.
function RotuloMobile({ children }: { children: string }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 md:hidden">
      {children}
    </span>
  );
}

export function UserListHeader() {
  return (
    <div
      data-testid="users-header"
      className={`${GRID} hidden border-b-2 border-slate-900 bg-[#f6f0df] px-4 py-3 md:grid`}
    >
      {["Usuário", "Acesso", "Assinatura", "Cadastro"].map((coluna) => (
        <span
          key={coluna}
          className="text-xs font-black uppercase tracking-[0.14em] text-slate-600"
        >
          {coluna}
        </span>
      ))}
    </div>
  );
}

// Uma linha da lista.
//
// NAO e <table>. A linha inteira e clicavel (abre o modal), e um <tr> clicavel
// nao e focavel nem responde a Enter sem recriar a mao o que um <button> ja da
// de graca. Mantendo <button> por linha, o comportamento de teclado que a lista
// ja tinha continua valendo.
//
// A responsividade vem de UMA grade que reflui (pilha no mobile, colunas a
// partir de md), nao de duas arvores (tabela + cards) escondidas por media
// query. Duas arvores duplicariam cada texto no DOM, e o admin e usado no
// celular: <table> a 380px so funciona com rolagem horizontal, que e
// exatamente o que nao se quer aqui.
export function UserListRow({
  row,
  onOpen,
}: {
  row: UserRow;
  onOpen: (userId: string) => void;
}) {
  const pro = proBadgeOf(row.pro_source);
  const status = subscriptionStatusBadgeOf(row.subscription_status);

  return (
    <button
      type="button"
      onClick={() => row.user_id && onOpen(row.user_id)}
      disabled={!row.user_id}
      className={`${GRID} w-full border-b-2 border-slate-100 px-4 py-3 text-left transition hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-700 text-xs font-black text-white"
        >
          {initialsOf(row.name || row.email)}
        </span>
        <span className="min-w-0">
          <span className="font-display block truncate text-base font-black text-slate-950">
            {displayName(row)}
          </span>
          <span className="block truncate text-sm font-semibold text-slate-500">
            {row.email || "sem e-mail"}
          </span>
        </span>
      </span>

      <span className="flex flex-col gap-1">
        <RotuloMobile>Acesso</RotuloMobile>
        <span className={`${BADGE_BASE} ${pro.className}`}>{pro.label}</span>
      </span>

      <span className="flex flex-col gap-1">
        <RotuloMobile>Assinatura</RotuloMobile>
        {status ? (
          <>
            <span className={`${BADGE_BASE} ${status.className}`}>
              {status.label}
            </span>
            {row.plan_code ? (
              <span className="text-xs font-bold text-slate-500">
                {planLabelOf(row.plan_code)}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-sm font-medium text-slate-400">—</span>
        )}
      </span>

      <span className="flex flex-col gap-1">
        <RotuloMobile>Cadastro</RotuloMobile>
        <span className="text-sm font-bold text-slate-600">
          {fmtDate(row.created_at)}
        </span>
      </span>
    </button>
  );
}
