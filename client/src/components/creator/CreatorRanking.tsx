import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Medal,
  MousePointerClick,
  Send,
  ShoppingBag,
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
  mesDoDia,
  mesTemRanking,
  mesVizinho,
  PRIMEIRO_MES_DO_RANKING,
  tabelaDePontos,
  TETO_DE_CLIQUES_POR_DIA,
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

const CHIP =
  "inline-flex items-center gap-1 rounded-full border-2 border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-black text-slate-700";

const CHIP_VOCE =
  "rounded-full border-2 border-ink-on-accent bg-[var(--bnt-accent-solid)] px-2 py-0.5 text-[11px] font-black uppercase text-ink-on-accent";

const BOTAO_DO_MES =
  "bnt-pressable rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900 disabled:cursor-not-allowed disabled:opacity-40";

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

// TODO(Ana)
function fraseDasContagens(p: PosicaoDoRanking): string {
  const partes: string[] = [];
  const { publicacoes, vendas, cliques } = p.contagens;
  if (publicacoes > 0) {
    partes.push(
      `${publicacoes} ${publicacoes === 1 ? "publicação" : "publicações"}`,
    );
  }
  if (vendas > 0) partes.push(`${vendas} ${vendas === 1 ? "venda" : "vendas"}`);
  if (cliques > 0)
    partes.push(`${cliques} ${cliques === 1 ? "clique" : "cliques"}`);
  return partes.join(", ");
}

/** O @ com o glifo da rede, ou o nome quando nao ha @. */
function Handle({ p, className }: { p: PosicaoDoRanking; className: string }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      {p.rede_do_handle ? (
        <IconeDaRede rede={p.rede_do_handle} className="h-3.5 w-3.5 shrink-0" />
      ) : null}
      <span className="truncate">{nomeDeExibicao(p)}</span>
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
    medalha: "h-12 w-12 text-xl",
    marca: "text-[var(--metal-ouro)]",
    topo: "pt-10",
    Marca: Trophy,
  },
  2: {
    rotulo: "Prata",
    fundo: "bg-slate-200",
    metal: "bg-[var(--metal-prata)]",
    medalha: "h-10 w-10 text-lg",
    marca: "text-[var(--metal-prata)]",
    topo: "pt-8",
    Marca: Medal,
  },
  3: {
    rotulo: "Bronze",
    fundo: "bg-orange-100",
    metal: "bg-[var(--metal-bronze)]",
    medalha: "h-10 w-10 text-lg",
    marca: "text-[var(--metal-bronze)]",
    topo: "pt-8",
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
      className={`${ordem} ${altura} relative flex flex-col items-center overflow-visible rounded-3xl border-2 border-slate-900 ${metal.fundo} px-5 pb-5 ${metal.topo} text-center shadow-[5px_5px_0_var(--bnt-shadow)] ${
        p?.eu ? "ring-4 ring-[var(--bnt-accent-solid)] ring-offset-2" : ""
      }`}
    >
      {/* A medalha: primeiro filho, montada na borda de cima, centralizada. */}
      <span
        aria-hidden="true"
        data-testid={`creator-ranking-medalha-${lugar}`}
        className={`absolute -top-4 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border-2 border-slate-900 font-display font-black shadow-[2px_2px_0_var(--bnt-shadow)] ${metal.metal} ${TINTA_SOBRE_METAL} ${metal.medalha}`}
      >
        {lugar}
      </span>
      {/* O chip do metal: fundo do metal, tinta escura fixa, borda preta.
          Nada nele muda com o tema, entao e legivel nos dois. */}
      <span
        data-testid={`creator-ranking-metal-${lugar}`}
        className={`rounded-full border-2 border-slate-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${metal.metal} ${TINTA_SOBRE_METAL}`}
      >
        {metal.rotulo}
      </span>
      {/* A marca d'agua na cor do metal, e nao na do texto: a do texto
          clareava no escuro e sumia sobre o fundo escuro do cartao. */}
      <metal.Marca
        aria-hidden="true"
        data-testid={`creator-ranking-marca-${lugar}`}
        className={`pointer-events-none absolute bottom-3 right-3 h-16 w-16 opacity-25 ${metal.marca}`}
      />

      <div className="relative mt-4">
        {p ? (
          <AvatarDoCreator
            name={p.name ?? p.handle ?? "Creator"}
            avatar={p.avatar}
            avatarUrl={p.avatar_url}
            size={primeiro ? "xl" : "lg"}
          />
        ) : (
          <div
            aria-hidden="true"
            className={`${primeiro ? "h-32 w-32" : "h-28 w-28"} rounded-full border-4 border-dashed border-slate-400 bg-white/60`}
          />
        )}
      </div>

      {p ? (
        <>
          <p className="mt-4 flex items-center gap-2">
            <Handle
              p={p}
              className="font-display text-lg font-black text-slate-950"
            />
            {p.eu ? (
              <span
                data-testid={`creator-ranking-voce-podio-${lugar}`}
                className={CHIP_VOCE}
              >
                Você
              </span>
            ) : null}
          </p>
          {p.name && p.handle ? (
            <p className="text-xs font-bold text-slate-600">{p.name}</p>
          ) : null}
          <p className="mt-3 flex items-baseline gap-1">
            <span
              data-testid={`creator-ranking-pontos-podio-${lugar}`}
              className={`font-display font-black text-slate-950 ${primeiro ? "text-5xl" : "text-4xl"}`}
            >
              {p.pontos}
            </span>
            <span className="text-xs font-black uppercase text-slate-600">
              pts
            </span>
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            {/* TODO(Ana) */}
            {fraseDasContagens(p) || "sem pontos ainda"}
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm font-bold text-slate-600">
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
      className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 ${
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
      <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <Handle p={p} className="text-sm font-black text-slate-950" />
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
        </span>
        <span className="flex flex-wrap gap-1.5 sm:ml-auto">
          {semPontos ? (
            <span className="text-xs font-semibold text-slate-500">
              {/* TODO(Ana) */}
              sem pontos ainda
            </span>
          ) : (
            <>
              {p.contagens.publicacoes > 0 ? (
                <span className={CHIP}>
                  <Send aria-hidden="true" className="h-3 w-3" />
                  {p.contagens.publicacoes}
                </span>
              ) : null}
              {p.contagens.vendas > 0 ? (
                <span className={CHIP}>
                  <ShoppingBag aria-hidden="true" className="h-3 w-3" />
                  {p.contagens.vendas}
                </span>
              ) : null}
              {p.contagens.cliques > 0 ? (
                <span className={CHIP}>
                  <MousePointerClick aria-hidden="true" className="h-3 w-3" />
                  {p.contagens.cliques}
                </span>
              ) : null}
            </>
          )}
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
        {/* TODO(Ana) */}
        Só publicação confirmada vale. Cliques contam até{" "}
        {TETO_DE_CLIQUES_POR_DIA} por dia.
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
      className="card-brutal rounded-3xl bg-white p-6 md:p-8"
    >
      <CabecalhoDeSecao
        id="creator-ranking-titulo"
        icone={<Trophy aria-hidden="true" className="h-4 w-4" />}
        // TODO(Ana)
        selo="em breve"
        // TODO(Ana)
        titulo="Ranking do mês"
        // TODO(Ana)
        frase="Os pontos vêm das publicações que você registrar, dos cliques no seu link e das vendas do mês. Os três primeiros levam prêmio."
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
      className={admin ? "" : "card-brutal rounded-3xl bg-white p-6 md:p-8"}
    >
      <CabecalhoDeSecao
        id="creator-ranking-titulo"
        icone={<Trophy aria-hidden="true" className="h-4 w-4" />}
        // TODO(Ana)
        selo="ranking"
        // TODO(Ana)
        titulo={`Ranking de ${soOMes(mes)}`}
        // TODO(Ana)
        frase="Publicações confirmadas, vendas pelo cupom e cliques no seu link viram pontos. Os três primeiros do mês levam prêmio."
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
              className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
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
        className="grid gap-4 md:grid-cols-3 md:items-end md:pt-4"
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
            className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
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
