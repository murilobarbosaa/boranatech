import {
  displayName,
  fmtBrl,
  fmtDataBrasilia,
  fmtDate,
  fmtInstanteBrasilia,
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
// REGUA (2026-08-30, segunda versao): SEIS colunas distribuindo a largura em
// fracoes.
//
// A primeira versao encolheu as trilhas com `max-content` para fechar o vazio
// horizontal, e a Ana vetou: "feio e desalinhado". O experimento respondeu a
// pergunta certa pelo caminho errado. O problema nunca foi a REGUA: com quatro
// colunas e uma tela larga, encolher as trilhas so muda o vazio de lugar, de
// dentro das colunas para depois delas. O que faltava era DADO.
//
// Com area de interesse e total pago, ha o que distribuir, e distribuir volta a
// ser o certo: cada trilha recebe uma fracao proporcional ao que costuma
// carregar (o bloco de usuario e o maior; data e dinheiro sao os menores) e a
// linha ocupa a largura sem oceano em trilha nenhuma.
//
// `minmax(0,Nfr)` e nao `Nfr`: sem o minimo zero o `truncate` do nome, do
// e-mail e da area para de funcionar, porque item de grade tem `min-width:auto`
// e se recusa a encolher abaixo do conteudo.
const GRID =
  "flex flex-wrap items-center gap-x-3 gap-y-1.5 md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.9fr)] md:items-center md:gap-x-5 md:gap-y-1.5";

// MARCADOR DE VAZIO da linha, num lugar so. Ele ja existia solto na celula de
// Assinatura; com tres celulas podendo ficar vazias, repetir o glifo seria a
// forma de duas delas divergirem na primeira mudanca de estilo.
//
// Nao e `NAO_INFORMADO` ("Nao informado") de proposito: aquele texto e para
// campo de FORMULARIO, onde ha espaco para uma frase. Numa celula de tabela
// densa ele empurraria a coluna inteira para caber uma explicacao que o
// cabecalho ja da.
const VAZIO = "—";

/**
 * Marcador de celula vazia, SO no desktop.
 *
 * No desktop ele fica porque a coluna precisa de conteudo para a grade nao
 * desalinhar, e o cabecalho da o significado. No MOBILE nao ha cabecalho: um
 * "—" solto no meio dos metadados nao diz de que campo ele e, e vira andaime
 * sem informacao. A regra ja valia para a celula de Assinatura desde o
 * polimento mobile; com tres celulas podendo esvaziar, ela vira componente
 * para nao depender de alguem lembrar de repetir as classes.
 */
function Vazio({ title }: { title?: string }) {
  return (
    <span
      data-testid="linha-vazio"
      title={title}
      className="hidden text-sm font-medium text-slate-400 md:inline"
    >
      {VAZIO}
    </span>
  );
}

// O cabecalho carrega o ALINHAMENTO de cada trilha junto com o rotulo, porque
// desalinhar cabecalho e celula e o defeito classico de grade sem <table>: o
// titulo fica num canto da trilha e o dado no outro, e a coluna parece torta
// sem que nada esteja errado no CSS.
// ANCORA POR PAR. Cada entrada aqui carrega o alinhamento do ROTULO, e a celula
// correspondente na linha usa o par dele (`md:items-*` mais `md:text-*`). Sao
// duas pontas da mesma decisao, e desalinhar uma delas e o defeito que a Ana
// pegou na captura: badge encostada num canto da trilha e cabecalho no outro,
// com o CSS inteiro correto.
//
// POR QUE CENTRO em Acesso e Assinatura, e nao esquerda: o conteudo das duas e
// um CHIP de largura variavel ("PRO" contra "GRATIS", "ATIVA" contra "AGUARDANDO
// PAGAMENTO"). Encostado a esquerda, cada linha comeca o chip no mesmo x mas
// termina em outro, e a coluna vira uma serra. Centrado, a massa visual fica no
// eixo da trilha e o cabecalho pousa em cima dela.
//
// Numero continua a DIREITA: alinhar dinheiro e data pelo inicio deixa a virgula
// em posicoes diferentes a cada linha, e comparar valores de relance passaria a
// exigir leitura.
const COLUNAS = [
  { rotulo: "Usuário", alinhamento: "" },
  { rotulo: "Acesso", alinhamento: "md:text-center" },
  { rotulo: "Assinatura", alinhamento: "md:text-center" },
  /* TODO(Ana) */
  { rotulo: "Total pago", alinhamento: "md:text-right" },
  { rotulo: "Cadastro", alinhamento: "md:text-right" },
  // DATA a direita, como os outros dois numeros: alinhar pelo inicio deixa a
  // barra da data em posicoes diferentes a cada linha.
  /* TODO(Ana) */
  { rotulo: "Último acesso", alinhamento: "md:text-right" },
] as const;

const BADGE_BASE =
  "inline-flex w-fit items-center rounded-full border-2 px-2.5 py-0.5 text-xs font-black uppercase";

export function UserListHeader() {
  return (
    <div
      data-testid="users-header"
      className={`${GRID} hidden border-b-2 border-slate-900 bg-[var(--brand-cream-deep)] px-4 py-2 md:grid`}
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
  const ultimoAcesso = row.last_sign_in_at ?? null;
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

      {/* A coluna de AREA saiu por decisao da Ana em 2026-08-30: esta vazia na
          base real e nao e informacao de decisao hoje. O CAMPO continua no
          payload e no tipo de proposito (custo zero, ja testado, e o modal usa
          a informacao), e o espaco da trilha fica reservado para o que vier no
          lugar. */}
      <span
        data-testid="linha-acesso"
        className="flex flex-col gap-1 md:items-center"
      >
        <span className={`${BADGE_BASE} ${pro.className}`}>{pro.label}</span>
      </span>

      <span
        data-testid="linha-assinatura"
        className="flex flex-wrap items-center gap-x-2 gap-y-1 md:flex-col md:items-center md:gap-1 md:text-center"
      >
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
          <Vazio />
        )}
      </span>

      {/* TRES estados, tres desenhos. Um numero (inclusive R$ 0,00, que e
          afirmacao: nunca pagou) sai como numero; `null` sai como marcador de
          vazio COM title, porque a diferenca entre "nao pagou" e "nao consegui
          somar" e a unica coisa que essa celula nao pode borrar. */}
      <span
        data-testid="linha-total-pago"
        className="flex flex-col gap-1 md:items-end"
      >
        {typeof row.total_pago_cents === "number" ? (
          <span className="text-xs font-bold text-slate-700 md:text-sm">
            {fmtBrl(row.total_pago_cents)}
          </span>
        ) : (
          /* TODO(Ana) */
          <Vazio title="Não foi possível somar as compras deste usuário agora." />
        )}
      </span>

      <span
        data-testid="linha-cadastro"
        className="flex flex-col gap-1 md:items-end"
      >
        <span className="text-xs font-bold text-slate-500 md:text-sm md:text-slate-600">
          <span className="md:hidden">desde </span>
          {fmtDate(row.created_at)}
        </span>
      </span>

      {/* ULTIMO ACESSO. `null` aqui tem UM significado: nunca logou. Nao existe
          "nao consegui olhar", porque o dado vem na mesma linha do resto e uma
          falha do RPC derruba a rota inteira. Por isso o marcador de vazio
          padrao serve, sem `title` de erro como o do total pago. */}
      <span
        data-testid="linha-ultimo-acesso"
        className="flex flex-col gap-1 md:items-end"
      >
        {ultimoAcesso ? (
          <span
            // O instante COMPLETO no hover: a coluna mostra o dia, e "hoje" e
            // "hoje as 3h" sao coisas diferentes para quem investiga um acesso.
            title={fmtInstanteBrasilia(ultimoAcesso)}
            className="text-xs font-bold text-slate-500 md:text-sm md:text-slate-600"
          >
            <span className="md:hidden">acesso </span>
            {fmtDataBrasilia(ultimoAcesso)}
          </span>
        ) : (
          <Vazio />
        )}
      </span>
    </button>
  );
}
