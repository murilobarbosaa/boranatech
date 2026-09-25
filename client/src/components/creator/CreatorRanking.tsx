import { Fragment, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Medal,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useSearch } from "wouter";

import { ErrorBlock } from "@/components/admin/StateBlocks";
import { AvatarDoCreator } from "@/components/creator/AvatarDoCreator";
import { EsqueletoDoRanking } from "@/components/creator/Esqueletos";
import { CabecalhoDeSecao } from "@/components/creator/CabecalhoDeSecao";
import { IconeDaRede } from "@/components/creator/IconeDaRede";
import { AdminApiError, adminFetch, contentFetch } from "@/lib/adminApi";
import { diaBrasilia } from "@shared/brasiliaDay";
import {
  detalharPontuacao,
  mesDoDia,
  mesTemRanking,
  mesVizinho,
  PRIMEIRO_MES_DO_RANKING,
  tabelaDePontos,
  type PosicaoDoRanking,
  type RankingDoMes,
} from "@shared/creatorRanking";

// RANKING MENSAL (lote 11), no lugar do cartao "em breve" da aba Ranking.
//
// O MES VIVE NA URL (`?aba=ranking&mes=AAAA-MM`), como a aba: um link para o
// ranking de agosto abre agosto, e o seletor escreve com `replace` para nao
// encher o historico. Mes fora da faixa (antes do programa, depois de hoje ou
// mal escrito) cai no mes atual sem avisar: o link errado nao merece uma tela
// de erro, merece o ranking de hoje.
//
// O PODIO e o unico lugar onde a tela gasta ousadia: o primeiro no centro e
// mais alto, e cada cartao tem a identidade do seu metal (lote 11b): ouro,
// prata e bronze, com a medalha montada na borda de cima e uma marca d'agua
// discreta no canto. Desde o lote 11c o METAL e um token fixo do index.css
// (`--metal-ouro`, `--metal-prata`, `--metal-bronze`, so no `:root`): no
// escuro o slate-300 escurecia e o chip "PRATA" ficava cinza com texto
// amarelo, e a marca d'agua na cor do texto sumia. Medalha, chip e
// marca d'agua usam o metal; a tinta sobre o metal e a `--avatar-ink-amarelo`,
// escura e fixa. Os FUNDOS dos cartoes (amber-100, slate-200, orange-100)
// continuam pela paleta, porque ali a inversao do tema e desejada. O resto e
// lista, quieta, na mesma linguagem dos outros cartoes. Os tres do podio NAO
// repetem na lista; quem esta com zero fica no fim, dizendo isso em palavras.
// A foto e o identificador: a bolinha da cor do calendario nao entra aqui.
// O avatar leva a BORDA que a pessoa escolheu no perfil (lote 11d), e nada por
// cima: o anel de metal em volta do avatar e o `ring` da lista sairam, porque
// escondiam a borda; medalha, chip, fundo e marca d'agua ficam.
//
// JANELA DE DEPLOY: o backend anterior nao tem a rota (404). Nesse caso a aba
// volta a mostrar o cartao "em breve" de sempre, que so sai do codigo num lote
// futuro, quando o 404 for impossivel.
//
// `modo="admin"` (lote 11d): o MESMO ranking, so leitura, na aba Creators do
// admin, como o calendario faz. Busca pela rota do admin (ranking neutro, sem
// `eu`), guarda o mes em estado local em vez da URL (a URL ali e do admin), e
// nao desenha nada pessoal: nem "Voce esta em...", nem chip "Voce", nem o
// cartao "Como pontuar". A casca do cartao e de quem monta.

type Estado =
  | { tipo: "carregando" }
  | { tipo: "ok"; ranking: RankingDoMes }
  | { tipo: "em_breve" }
  | { tipo: "erro" };

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const POR_PAGINA = 20;

const CHIP_VOCE =
  "rounded-full border-2 border-ink-on-accent bg-[var(--bnt-accent-solid)] px-2 py-0.5 text-[11px] font-black uppercase text-ink-on-accent";

// Balde de PONTO do detalhamento (Conteudo/Vendas/Cadastros): tom da marca
// (violeta), pra ler como "isto soma". Clique nao aparece no ranking publico.
const CHIP_PONTO =
  "inline-flex items-center gap-1 rounded-full border-2 border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-black text-violet-900";

// Discreto de proposito (lote 11j): num mes fechado, quem saiu do programa
// depois de pontuar fica na lista com esta marca, sem cor de destaque.
const CHIP_SAIU =
  "rounded-full border-2 border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600";

const BOTAO_DO_MES =
  "bnt-pressable min-h-10 min-w-10 rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900 sm:min-h-0 sm:min-w-0 disabled:cursor-not-allowed disabled:opacity-40";

/** O `?mes=` da URL, ou o mes atual quando ele nao serve. */
function mesDaUrl(search: string, mesAtual: string): string {
  const pedido = new URLSearchParams(search).get("mes");
  if (
    pedido &&
    /^\d{4}-\d{2}$/.test(pedido) &&
    mesTemRanking(pedido, mesAtual)
  ) {
    return pedido;
  }
  return mesAtual;
}

/** "setembro de 2026" a partir de `AAAA-MM`. */
function nomeDoMes(mes: string): string {
  const indice = Number(mes.slice(5, 7)) - 1;
  return `${MESES[indice] ?? mes} de ${mes.slice(0, 4)}`;
}

/** So o nome do mes, para o titulo ("Ranking de setembro"). */
function soOMes(mes: string): string {
  return MESES[Number(mes.slice(5, 7)) - 1] ?? mes;
}

/** Dias inteiros ate o fechamento, arredondados para cima: 1 hora antes ainda e "hoje". */
function diasAte(iso: string, agora: Date): number {
  const alvo = new Date(iso).getTime();
  if (Number.isNaN(alvo)) return 0;
  return Math.max(0, Math.ceil((alvo - agora.getTime()) / 86_400_000));
}

// TODO(Ana)
function fraseDoFechamento(dias: number): string {
  if (dias <= 0) return "Fecha hoje";
  if (dias === 1) return "Fecha amanhã";
  return `Fecha em ${dias} dias`;
}

// TODO(Ana)
function ordinal(n: number): string {
  return `${n}º`;
}

function rankingDaResposta(json: unknown): RankingDoMes | null {
  const data = (json as { data?: unknown } | null)?.data;
  if (typeof data !== "object" || data === null) return null;
  const r = data as Partial<RankingDoMes>;
  if (typeof r.mes !== "string" || !Array.isArray(r.posicoes)) return null;
  return {
    mes: r.mes,
    fechado: r.fechado === true,
    fecha_em: typeof r.fecha_em === "string" ? r.fecha_em : null,
    posicoes: r.posicoes,
    minha_posicao: r.minha_posicao ?? null,
  };
}

// TODO(Ana)
function nomeDeExibicao(p: PosicaoDoRanking): string {
  return p.handle ? `@${p.handle}` : (p.name ?? "Creator");
}

/**
 * Singular e plural de uma contagem, num lugar so: "1 venda" ou "2 vendas".
 * Fica aqui, e nao em ternarios espalhados pelos baldes, pra a regra ser uma.
 */
// TODO(Ana): revisar os rotulos (publicação, venda, cadastro).
function contagemEmPalavras(
  qtd: number,
  singular: string,
  plural: string,
): string {
  return `${qtd} ${qtd === 1 ? singular : plural}`;
}

/**
 * Detalhamento de ONDE vem a pontuacao: um chip por balde (conteudo, vendas,
 * cadastros) com a QUANTIDADE e os PONTOS ("2 vendas · 50 pts"), pra o rotulo
 * nao parecer contagem quando e ponto. A quantidade vem de `p.contagens`; os
 * pontos de `detalharPontuacao` (mesmo total autoritativo da regra), com o de
 * conteudo saindo como o resto, entao a soma dos chips fecha sempre o total.
 * Clique NAO aparece no ranking publico. `align` controla o alinhamento.
 */
function DetalheDaPontuacao({
  p,
  align,
}: {
  p: PosicaoDoRanking;
  align: "center" | "end";
}) {
  const d = detalharPontuacao({
    pontos: p.pontos,
    vendas: p.contagens.vendas,
    cadastros: p.contagens.cadastros ?? 0,
    cliques: p.contagens.cliques,
  });
  const baldes = [
    {
      chave: "conteudo",
      texto: contagemEmPalavras(
        p.contagens.publicacoes,
        "publicação",
        "publicações",
      ),
      pts: d.conteudo,
    },
    {
      chave: "vendas",
      texto: contagemEmPalavras(p.contagens.vendas, "venda", "vendas"),
      pts: d.vendas,
    },
    {
      chave: "cadastros",
      texto: contagemEmPalavras(
        p.contagens.cadastros ?? 0,
        "cadastro",
        "cadastros",
      ),
      pts: d.cadastros,
    },
  ].filter((b) => b.pts > 0);
  return (
    <span
      data-testid={`creator-ranking-detalhe-${p.user_id}`}
      className={`flex flex-wrap items-center gap-1.5 ${
        align === "center" ? "md:justify-center" : "sm:justify-end"
      }`}
    >
      {p.pontos === 0 ? (
        <span className="text-xs font-semibold text-slate-500">
          {/* TODO(Ana) */}
          sem pontos ainda
        </span>
      ) : (
        baldes.map((b) => (
          <span key={b.chave} className={CHIP_PONTO}>
            {/* TODO(Ana): quantidade e pontos juntos ("2 vendas · 50 pts"). */}
            {`${b.texto} · ${b.pts} pts`}
          </span>
        ))
      )}
      {/* Clique NAO aparece no ranking publico (decisao da Ana): fica so nas
          telas privadas (Numeros do creator, admin). Segue contado no banco. */}
    </span>
  );
}

/**
 * O @ com o glifo da rede, ou o nome quando nao ha @.
 *
 * `quebraAte` (lote 11m, podio e lista): abaixo do breakpoint o @ quebra
 * ENTRE os segmentos (depois de `.` e `_`, com `<wbr>`), porque a faixa tem
 * pouco espaco para ele e o @ e a informacao principal, que nao pode sair
 * cortada no meio. No `md:` volta o span com `truncate` de antes.
 */
function Handle({
  p,
  className,
  quebraAte = null,
}: {
  p: PosicaoDoRanking;
  className: string;
  /** Ate qual breakpoint o @ quebra entre os segmentos: o podio muda de
   * layout no `md:`, a lista no `sm:`. `null` e o truncate de sempre. */
  quebraAte?: "sm" | "md" | null;
}) {
  const texto = nomeDeExibicao(p);
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      {p.rede_do_handle ? (
        <IconeDaRede rede={p.rede_do_handle} className="h-3.5 w-3.5 shrink-0" />
      ) : null}
      {quebraAte ? (
        <>
          {/* Duas versoes, e nao uma com `md:truncate`: o `<wbr>` continua
              sendo ponto de quebra mesmo com `nowrap`, e o desktop quebrava
              o @ que antes truncava. `display: none` tira a outra da arvore
              de acessibilidade, entao o @ nao e lido duas vezes. */}
          <span
            data-testid={`creator-ranking-handle-${p.user_id}`}
            className={
              quebraAte === "sm" ? "min-w-0 sm:hidden" : "min-w-0 md:hidden"
            }
          >
            {texto.split(/(?<=[._])/).map((parte, i) => (
              <Fragment key={i}>
                {i > 0 ? <wbr /> : null}
                {parte}
              </Fragment>
            ))}
          </span>
          <span
            className={
              quebraAte === "sm"
                ? "hidden truncate sm:inline"
                : "hidden truncate md:inline"
            }
          >
            {texto}
          </span>
        </>
      ) : (
        <span className="truncate">{texto}</span>
      )}
    </span>
  );
}

/** Tinta escura e fixa sobre qualquer metal (a mesma dos avatares claros). */
const TINTA_SOBRE_METAL = "text-[var(--avatar-ink-amarelo)]";

/**
 * A identidade de cada lugar do podio: o metal, em classes literais com o
 * token fixo. `topo` e `chip` acompanham o tamanho da medalha (a do 1º e
 * `h-12`, as outras `h-10`), para o chip ficar a mesma distancia visual da
 * medalha nos tres cartoes.
 */
const METAL: Record<
  1 | 2 | 3,
  {
    rotulo: string;
    fundo: string;
    metal: string;
    medalha: string;
    marca: string;
    topo: string;
    Marca: LucideIcon;
  }
> = {
  // TODO(Ana)
  1: {
    rotulo: "Ouro",
    fundo: "bg-amber-100",
    metal: "bg-[var(--metal-ouro)]",
    medalha: "h-8 w-8 text-base md:h-12 md:w-12 md:text-xl",
    marca: "text-[var(--metal-ouro)]",
    topo: "md:pt-10",
    Marca: Trophy,
  },
  2: {
    rotulo: "Prata",
    fundo: "bg-slate-200",
    metal: "bg-[var(--metal-prata)]",
    medalha: "h-7 w-7 text-sm md:h-10 md:w-10 md:text-lg",
    marca: "text-[var(--metal-prata)]",
    topo: "md:pt-8",
    Marca: Medal,
  },
  3: {
    rotulo: "Bronze",
    fundo: "bg-orange-100",
    metal: "bg-[var(--metal-bronze)]",
    medalha: "h-7 w-7 text-sm md:h-10 md:w-10 md:text-lg",
    marca: "text-[var(--metal-bronze)]",
    topo: "md:pt-8",
    Marca: Medal,
  },
};

/**
 * Um lugar do podio. `p` nulo e o lugar vazio, que continua desenhado, com o
 * mesmo metal: um podio com dois cartoes parece quebrado, um com "ainda
 * ninguém" parece um convite.
 */
function LugarDoPodio({
  lugar,
  p,
}: {
  lugar: 1 | 2 | 3;
  p: PosicaoDoRanking | null;
}) {
  const primeiro = lugar === 1;
  const metal = METAL[lugar];
  const ordem =
    lugar === 1 ? "md:order-2" : lugar === 2 ? "md:order-1" : "md:order-3";
  const altura = primeiro ? "md:-translate-y-4 md:pb-8" : "";
  return (
    <li
      data-testid={`creator-ranking-podio-${lugar}`}
      // FAIXA NO CELULAR (lote 11m): medalha, avatar, @ e nome, pontos a
      // direita e os chips embaixo; os tres cabem numa tela. O `md:` volta
      // ao cartao em coluna, com o 1o mais alto.
      className={`${ordem} ${altura} relative flex flex-row flex-wrap items-center gap-x-2 gap-y-1.5 overflow-visible rounded-3xl border-2 border-slate-900 ${metal.fundo} px-3 pb-3 pt-4 text-left shadow-[5px_5px_0_var(--bnt-shadow)] md:flex-col md:flex-nowrap md:gap-0 md:px-5 md:pb-5 ${metal.topo} md:text-center ${
        p?.eu ? "ring-4 ring-[var(--bnt-accent-solid)] ring-offset-2" : ""
      }`}
    >
      {/* A medalha: primeiro filho, montada na borda de cima, centralizada. */}
      <span
        aria-hidden="true"
        data-testid={`creator-ranking-medalha-${lugar}`}
        className={`relative flex shrink-0 items-center justify-center rounded-full border-2 border-slate-900 font-display font-black shadow-[2px_2px_0_var(--bnt-shadow)] md:absolute md:-top-4 md:left-1/2 md:-translate-x-1/2 ${metal.metal} ${TINTA_SOBRE_METAL} ${metal.medalha}`}
      >
        {lugar}
      </span>
      {/* O chip do metal: fundo do metal, tinta escura fixa, borda preta.
          Nada nele muda com o tema, entao e legivel nos dois. */}
      <span
        data-testid={`creator-ranking-metal-${lugar}`}
        // No celular o chip vira aba sobre a borda de cima da faixa.
        className={`absolute -top-3 left-4 rounded-full border-2 border-slate-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider md:static ${metal.metal} ${TINTA_SOBRE_METAL}`}
      >
        {metal.rotulo}
      </span>
      {/* A marca d'agua na cor do metal, e nao na do texto: a do texto
          clareava no escuro e sumia sobre o fundo escuro do cartao. */}
      <metal.Marca
        aria-hidden="true"
        data-testid={`creator-ranking-marca-${lugar}`}
        className={`pointer-events-none absolute bottom-2 right-2 h-10 w-10 opacity-25 md:bottom-3 md:right-3 md:h-16 md:w-16 ${metal.marca}`}
      />

      <div className="relative shrink-0 md:mt-4">
        {p ? (
          <>
            {/* 56 px no celular; o do cartao a partir do `md:`. Dois
                desenhos, e nao uma classe por cima, porque o tamanho do
                avatar e do anel sai do `size` do UserAvatar. */}
            <span
              data-testid={`creator-ranking-avatar-celular-${lugar}`}
              className="block md:hidden"
            >
              <AvatarDoCreator
                name={p.name ?? p.handle ?? "Creator"}
                avatar={p.avatar}
                avatarUrl={p.avatar_url}
                size="md"
              />
            </span>
            <span className="hidden md:block">
              <AvatarDoCreator
                name={p.name ?? p.handle ?? "Creator"}
                avatar={p.avatar}
                avatarUrl={p.avatar_url}
                size={primeiro ? "xl" : "lg"}
              />
            </span>
          </>
        ) : (
          <div
            aria-hidden="true"
            className={`h-14 w-14 ${primeiro ? "md:h-32 md:w-32" : "md:h-28 md:w-28"} rounded-full border-4 border-dashed border-slate-400 bg-white/60`}
          />
        )}
      </div>

      {p ? (
        <>
          {/* O meio da faixa no celular; no `md:` o wrapper some do layout. */}
          <div
            data-testid={`creator-ranking-meio-${lugar}`}
            className="flex min-w-0 flex-1 flex-col md:contents"
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 md:mt-4 md:flex-nowrap md:gap-2">
              <Handle
                p={p}
                quebraAte="md"
                className="font-display text-sm font-black text-slate-950 md:text-lg"
              />
              {p.eu ? (
                <span
                  data-testid={`creator-ranking-voce-podio-${lugar}`}
                  className={CHIP_VOCE}
                >
                  Você
                </span>
              ) : null}
              {p.saiu_do_programa ? (
                <span
                  data-testid={`creator-ranking-saiu-podio-${lugar}`}
                  className={CHIP_SAIU}
                >
                  {/* TODO(Ana) */}
                  saiu do programa
                </span>
              ) : null}
            </p>
            {p.name && p.handle ? (
              <p className="truncate text-xs font-bold text-slate-600 md:overflow-visible md:whitespace-normal">
                {p.name}
              </p>
            ) : null}
          </div>
          <p
            // Empilhado no celular (numero sobre "pts"), para sobrar largura
            // para o @; o `md:` volta a linha de antes.
            className="ml-auto flex shrink-0 flex-col items-end md:ml-0 md:mt-3 md:flex-row md:items-baseline md:gap-1"
          >
            <span
              data-testid={`creator-ranking-pontos-podio-${lugar}`}
              className={`font-display text-2xl font-black text-slate-950 ${primeiro ? "md:text-5xl" : "md:text-4xl"}`}
            >
              {p.pontos}
            </span>
            <span className="text-xs font-black uppercase text-slate-600">
              pts
            </span>
          </p>
          <div className="w-full md:mt-1.5 md:w-auto">
            <DetalheDaPontuacao p={p} align="center" />
          </div>
        </>
      ) : (
        <p className="flex-1 text-sm font-bold text-slate-600 md:mt-4 md:flex-initial">
          {/* TODO(Ana) */}
          ainda ninguém
        </p>
      )}
    </li>
  );
}

function LinhaDaLista({ p }: { p: PosicaoDoRanking }) {
  const semPontos = p.pontos === 0;
  return (
    <li
      data-testid={`creator-ranking-linha-${p.user_id}`}
      // No celular (lote 11m) os chips das contagens descem para uma linha
      // inteira (`order-last basis-full`): no meio da linha eles tinham uns
      // 110 px e quebravam por dentro. O `sm:` volta a linha de antes.
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 px-3 py-2.5 sm:flex-nowrap ${
        p.eu
          ? "border-[var(--bnt-accent-solid)] bg-amber-50 shadow-[3px_3px_0_var(--bnt-accent-solid)]"
          : "border-slate-200 bg-white"
      } ${semPontos ? "opacity-70" : ""}`}
    >
      <span className="w-9 shrink-0 font-display text-xl font-black text-slate-900">
        {p.posicao}
      </span>
      <AvatarDoCreator
        name={p.name ?? p.handle ?? "Creator"}
        avatar={p.avatar}
        avatarUrl={p.avatar_url}
        size="sm"
      />
      {/* `contents` no celular: o @ e as contagens viram itens da linha, e
          as contagens descem inteiras; no `sm:` o meio volta a ser o flex de
          antes, com as contagens dentro dele. */}
      <span
        data-testid={`creator-ranking-meio-linha-${p.user_id}`}
        className="contents sm:flex sm:min-w-0 sm:flex-1 sm:flex-row sm:items-center sm:gap-3"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
          <Handle
            p={p}
            quebraAte="sm"
            className="text-sm font-black text-slate-950"
          />
          {p.name && p.handle ? (
            <span className="hidden truncate text-xs font-bold text-slate-500 sm:inline">
              {p.name}
            </span>
          ) : null}
          {p.eu ? (
            <span
              data-testid={`creator-ranking-voce-${p.user_id}`}
              className={CHIP_VOCE}
            >
              Você
            </span>
          ) : null}
          {p.saiu_do_programa ? (
            <span
              data-testid={`creator-ranking-saiu-${p.user_id}`}
              className={CHIP_SAIU}
            >
              {/* TODO(Ana) */}
              saiu do programa
            </span>
          ) : null}
        </span>
        <span
          data-testid={`creator-ranking-contagens-${p.user_id}`}
          className="order-last basis-full sm:order-none sm:ml-auto sm:basis-auto"
        >
          <DetalheDaPontuacao p={p} align="end" />
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="font-display text-xl font-black text-slate-950">
          {p.pontos}
        </span>
        <span className="ml-1 text-[10px] font-black uppercase text-slate-500">
          pts
        </span>
      </span>
    </li>
  );
}

/** A tabela publica da regra, lida da constante compartilhada. */
function ComoPontuar() {
  const linhas = tabelaDePontos();
  return (
    <section
      data-testid="creator-ranking-regra"
      aria-labelledby="creator-ranking-regra-titulo"
      className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-4 sm:p-5"
    >
      <h3
        id="creator-ranking-regra-titulo"
        className="font-display text-lg font-black text-slate-950"
      >
        {/* TODO(Ana) */}
        Como pontuar
      </h3>
      <ul className="mt-3 divide-y-2 divide-dashed divide-slate-300">
        {linhas.map((linha) => (
          <li
            key={linha.chave}
            data-testid={`creator-ranking-regra-${linha.chave}`}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="font-semibold text-slate-800">{linha.acao}</span>
            <span className="shrink-0 font-display text-base font-black text-slate-950">
              {linha.pontos} {linha.pontos === 1 ? "pt" : "pts"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs font-semibold text-slate-600">
        {/* TODO(Ana): revisar a palavra final. */}
        Só publicação confirmada vale.
      </p>
    </section>
  );
}

/** O cartao "em breve" de antes deste lote, para a janela de deploy. */
function RankingEmBreve() {
  return (
    <section
      data-testid="creator-ranking-em-breve"
      aria-labelledby="creator-ranking-titulo"
      className="card-surface rounded-3xl bg-white p-6 md:p-8"
    >
      <CabecalhoDeSecao
        id="creator-ranking-titulo"
        icone={<Trophy aria-hidden="true" className="h-4 w-4" />}
        // TODO(Ana)
        selo="em breve"
        // TODO(Ana)
        titulo="Ranking do mês"
        // TODO(Ana)
        frase="Os pontos vêm das publicações que você registrar, dos cadastros pelo seu link e das vendas do mês. Os três primeiros levam prêmio."
      />
    </section>
  );
}

export function CreatorRanking({
  modo = "creator",
  agora = () => new Date(),
}: {
  modo?: "creator" | "admin";
  agora?: () => Date;
}) {
  const admin = modo === "admin";
  const search = useSearch();
  const [, navigate] = useLocation();
  const mesAtual = mesDoDia(diaBrasilia(agora().toISOString()) ?? "");
  // No admin o mes vive em estado local: a URL da aba Creators e do admin.
  const [mesLocal, setMesLocal] = useState(mesAtual);
  const mes = admin ? mesLocal : mesDaUrl(search, mesAtual);

  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  const [visiveis, setVisiveis] = useState(POR_PAGINA);

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    setVisiveis(POR_PAGINA);
    (admin
      ? adminFetch(`/creators/ranking?mes=${mes}`)
      : contentFetch(`/creator/ranking?mes=${mes}`)
    )
      .then((json: unknown) => {
        if (cancelado) return;
        const ranking = rankingDaResposta(json);
        setEstado(ranking ? { tipo: "ok", ranking } : { tipo: "erro" });
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        // O "em breve" e da janela de deploy do CREATOR; no admin a rota
        // existe desde o lote 11c, e um 404 e erro como outro qualquer.
        const semRota =
          !admin && err instanceof AdminApiError && err.status === 404;
        setEstado(semRota ? { tipo: "em_breve" } : { tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [admin, mes, tentativa]);

  const irPara = (novo: string) => {
    if (admin) setMesLocal(novo);
    else navigate(`/creator?aba=ranking&mes=${novo}`, { replace: true });
  };
  const temAnterior = mesVizinho(mes, -1) >= PRIMEIRO_MES_DO_RANKING;
  const temSeguinte = mesVizinho(mes, 1) <= mesAtual;

  if (estado.tipo === "em_breve") return <RankingEmBreve />;

  return (
    <section
      data-testid="creator-ranking"
      data-modo={modo}
      aria-labelledby="creator-ranking-titulo"
      // No admin a casca do cartao e de quem monta (a secao da aba Creators).
      className={
        admin ? "" : "card-surface rounded-3xl bg-white p-4 sm:p-6 md:p-8"
      }
    >
      <CabecalhoDeSecao
        id="creator-ranking-titulo"
        icone={<Trophy aria-hidden="true" className="h-4 w-4" />}
        // TODO(Ana)
        selo="ranking"
        // TODO(Ana)
        titulo={`Ranking de ${soOMes(mes)}`}
        // TODO(Ana)
        frase="Publicações confirmadas, cadastros e vendas pelo cupom viram pontos. Os três primeiros do mês levam prêmio."
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="creator-ranking-anterior"
            onClick={() => irPara(mesVizinho(mes, -1))}
            disabled={!temAnterior}
            className={BOTAO_DO_MES}
            // TODO(Ana)
            aria-label="Mês anterior"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <p
            data-testid="creator-ranking-mes"
            className="text-sm font-black uppercase tracking-[0.15em] text-slate-900"
          >
            {nomeDoMes(mes)}
          </p>
          <button
            type="button"
            data-testid="creator-ranking-proximo"
            onClick={() => irPara(mesVizinho(mes, 1))}
            disabled={!temSeguinte}
            className={BOTAO_DO_MES}
            // TODO(Ana)
            aria-label="Próximo mês"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        {estado.tipo === "ok" ? (
          estado.ranking.fechado || !estado.ranking.fecha_em ? (
            <span
              data-testid="creator-ranking-fechado"
              className="rounded-full border-2 border-slate-900 bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700"
            >
              {/* TODO(Ana) */}
              mês fechado
            </span>
          ) : (
            <span
              data-testid="creator-ranking-fecha-em"
              className="text-sm font-black text-[var(--bnt-collab-ink)]"
            >
              {fraseDoFechamento(diasAte(estado.ranking.fecha_em, agora()))}
            </span>
          )
        ) : null}
      </div>

      {estado.tipo === "carregando" ? (
        <div className="mt-6">
          <EsqueletoDoRanking />
        </div>
      ) : null}

      {estado.tipo === "erro" ? (
        <div data-testid="creator-ranking-erro" className="mt-6 space-y-3">
          {/* TODO(Ana) */}
          <ErrorBlock message="Não foi possível carregar o ranking agora." />
          <div className="text-center">
            <button
              type="button"
              onClick={() => setTentativa((n) => n + 1)}
              className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] min-h-10 sm:min-h-0"
            >
              {/* TODO(Ana) */}
              Tentar de novo
            </button>
          </div>
        </div>
      ) : null}

      {estado.tipo === "ok" ? (
        <Corpo
          ranking={estado.ranking}
          visiveis={visiveis}
          admin={admin}
          onVerMais={() => setVisiveis((n) => n + POR_PAGINA)}
        />
      ) : null}
    </section>
  );
}

function Corpo({
  ranking,
  visiveis,
  admin,
  onVerMais,
}: {
  ranking: RankingDoMes;
  visiveis: number;
  admin: boolean;
  onVerMais: () => void;
}) {
  // Nada pessoal no admin: a rota do admin ja manda o ranking neutro, e
  // apagar o `eu` de cada linha aqui e a segunda barreira (nenhum chip "Voce").
  const posicoes = admin
    ? ranking.posicoes.map((p) => ({ ...p, eu: false }))
    : ranking.posicoes;
  const total = posicoes.length;
  // O podio e so de quem PONTUOU: zero ponto nao sobe no podio, nem quando
  // a lista inteira esta zerada.
  const pontuados = posicoes.filter((p) => p.pontos > 0);
  const podio: Array<PosicaoDoRanking | null> = [
    pontuados[0] ?? null,
    pontuados[1] ?? null,
    pontuados[2] ?? null,
  ];
  const noPodio = new Set<string>();
  podio.forEach((p) => {
    if (p) noPodio.add(p.user_id);
  });
  const resto = posicoes.filter((p) => !noPodio.has(p.user_id));
  const mostradas = resto.slice(0, visiveis);
  const minha = admin ? null : ranking.minha_posicao;

  return (
    <div className="mt-6 space-y-8">
      {minha ? (
        <p
          data-testid="creator-ranking-minha-posicao"
          className="rounded-2xl border-2 border-slate-900 bg-[var(--bnt-accent-solid)] px-4 py-3 text-sm font-black text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]"
        >
          {/* TODO(Ana) */}
          {`Você está em ${ordinal(minha.posicao)} de ${total}, com ${minha.pontos} ${
            minha.pontos === 1 ? "ponto" : "pontos"
          }`}
        </p>
      ) : null}

      <ol
        data-testid="creator-ranking-podio"
        // TODO(Ana)
        aria-label="Pódio do mês"
        // `gap-6` e `pt-3` no celular: o chip do metal fica sobre a borda de
        // cima de cada faixa e precisa do respiro.
        className="grid gap-6 pt-3 md:grid-cols-3 md:items-end md:gap-4 md:pt-4"
      >
        <LugarDoPodio lugar={1} p={podio[0]} />
        <LugarDoPodio lugar={2} p={podio[1]} />
        <LugarDoPodio lugar={3} p={podio[2]} />
      </ol>

      {resto.length > 0 ? (
        <ol
          data-testid="creator-ranking-lista"
          // TODO(Ana)
          aria-label="Lista completa"
          className="space-y-2"
        >
          {mostradas.map((p) => (
            <LinhaDaLista key={p.user_id} p={p} />
          ))}
        </ol>
      ) : null}

      {resto.length > visiveis ? (
        <div className="text-center">
          <button
            type="button"
            data-testid="creator-ranking-ver-mais"
            onClick={onVerMais}
            className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] min-h-10 sm:min-h-0"
          >
            {/* TODO(Ana) */}
            {`Ver mais (${resto.length - visiveis})`}
          </button>
        </div>
      ) : null}

      {admin ? null : <ComoPontuar />}
    </div>
  );
}
