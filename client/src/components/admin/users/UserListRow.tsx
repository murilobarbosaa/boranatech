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
// No MOBILE isto e flex-wrap, nao grade: os metadados fluem na horizontal e
// quebram sozinhos, em vez de virarem uma coluna de rotulo-acima-de-valor. A
// partir de md volta a ser exatamente a grade de 4 colunas de antes, entao o
// desktop nao muda.
//
// Continua sendo UMA arvore. Duas (tabela + cards escondidos por media query)
// duplicariam cada texto no DOM, que e o que o comentario de UserListRow
// sempre disse e continua valendo.
// DENSIDADE (2026-08-29): o respiro vertical foi cortado a partir de md, onde
// a grade poe a linha inteira numa faixa so e o py-3 sobrava. No MOBILE nada
// muda: la a linha EMPILHA, e apertar o vertical de uma pilha e o que produz
// aquele bloco de texto sem ar que ninguem consegue varrer com o olho.
// REGUA (2026-08-30): as tres colunas da direita ABRACAM o conteudo
// (`max-content`) em vez de dividirem a largura em frs. Com quatro trilhas
// elasticas, cada uma esticava junto com a tela e o conteudo compacto (um chip,
// um travessao, uma data) boiava no meio do proprio vazio; quanto mais larga a
// janela, mais longe o Acesso ficava do e-mail e a Assinatura do Cadastro.
//
// Agora sobra UM vazio so, entre o e-mail e o bloco da direita, absorvido pelo
// `minmax(0,1fr)` da coluna do usuario. Vazio ali nao incomoda: e a separacao
// entre quem a pessoa e e o que ela tem.
//
// `minmax(0,1fr)` e nao `1fr` na primeira: sem o minimo zero o `truncate` do
// nome e do e-mail para de funcionar, porque item de grade tem `min-width:auto`
// e se recusa a encolher abaixo do conteudo.
//
// `max-content` deixa o CONTEUDO ditar a largura, entao "ATIVA + Pro Mensal"
// alarga a trilha em vez de quebrar o chip em duas linhas. Quando o rotulo do
// cabecalho e maior que o dado (o caso de "Assinatura" sobre uma celula vazia),
// e ele que manda, porque as duas pontas compartilham esta mesma constante.
const GRID =
  "flex flex-wrap items-center gap-x-3 gap-y-1.5 md:grid md:grid-cols-[minmax(0,1fr)_repeat(3,max-content)] md:items-center md:gap-x-8 md:gap-y-1.5";

// O cabecalho carrega o ALINHAMENTO de cada trilha junto com o rotulo, porque
// desalinhar cabecalho e celula e o defeito classico de grade sem <table>: o
// titulo fica num canto da trilha e o dado no outro, e a coluna parece torta
// sem que nada esteja errado no CSS.
const COLUNAS = [
  { rotulo: "Usuário", alinhamento: "" },
  { rotulo: "Acesso", alinhamento: "" },
  { rotulo: "Assinatura", alinhamento: "" },
  // Data alinhada a direita, como numero em borda de tabela: e a ultima trilha,
  // e alinhar pelo inicio deixaria uma serra de datas de larguras diferentes.
  { rotulo: "Cadastro", alinhamento: "md:text-right" },
] as const;

const BADGE_BASE =
  "inline-flex w-fit items-center rounded-full border-2 px-2.5 py-0.5 text-xs font-black uppercase";

export function UserListHeader() {
  return (
    <div
      data-testid="users-header"
      className={`${GRID} hidden border-b-2 border-slate-900 bg-[#f6f0df] px-4 py-2 md:grid`}
    >
      {COLUNAS.map((coluna) => (
        <span
          key={coluna.rotulo}
          className={`text-xs font-black uppercase tracking-[0.14em] text-slate-600 ${coluna.alinhamento}`}
        >
          {coluna.rotulo}
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
      className={`${GRID} w-full border-b-2 border-slate-100 px-4 py-3 text-left transition hover:bg-yellow-50 md:py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span className="flex w-full min-w-0 items-center gap-3 md:w-auto">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-700 text-xs font-black text-white"
        >
          {initialsOf(row.name || row.email)}
        </span>
        <span className="min-w-0">
          <span className="font-display block truncate text-base font-black text-slate-950 md:text-sm">
            {displayName(row)}
          </span>
          <span className="block truncate text-sm font-semibold text-slate-500">
            {row.email || "sem e-mail"}
          </span>
        </span>
      </span>

      <span className="flex flex-col gap-1">
        <span className={`${BADGE_BASE} ${pro.className}`}>{pro.label}</span>
      </span>

      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 md:flex-col md:items-start md:gap-1">
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
          <span className="hidden text-sm font-medium text-slate-400 md:inline">
            —
          </span>
        )}
      </span>

      <span className="flex flex-col gap-1 md:items-end">
        <span className="text-xs font-bold text-slate-500 md:text-sm md:text-slate-600">
          <span className="md:hidden">desde </span>
          {fmtDate(row.created_at)}
        </span>
      </span>
    </button>
  );
}
