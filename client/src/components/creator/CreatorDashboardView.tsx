import type { CSSProperties, ReactNode } from "react";
import {
  BadgeCheck,
  BarChart3,
  CalendarDays,
  DollarSign,
  Hourglass,
  Link2Off,
  MousePointerClick,
  Percent,
  ShoppingBag,
  Ticket,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BlocoBoundary } from "@/components/admin/BlocoBoundary";
import { formatarCentavos } from "@/lib/formatarCentavos";
import { DeltaBadge } from "@/components/admin/overview/DeltaBadge";
import {
  intervaloDeRotulos,
  rotuloDeDia,
} from "@/components/admin/overview/chartMath";
import { relativeTime } from "@/components/admin/tasks/relativeTime";
import { CreatorIdentidade } from "@/components/creator/CreatorIdentidade";
import { CreatorMetricCard } from "@/components/creator/CreatorMetricCard";
import { CupomDoCodigo } from "@/components/creator/CupomDoCodigo";
import {
  diaBrasilia,
  formatarDiaCivil,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "@shared/brasiliaDay";
import type {
  CreatorDashboard,
  CreatorDashboardJanela,
  CreatorDashboardSerieDia,
  CreatorEventosSomas,
} from "@shared/creatorDashboard";

// O PAINEL DE CREATOR, sem buscar dado nenhum. Quem busca e quem monta: a
// pagina /creator (GET /api/creator/me) e o admin
// (GET /api/admin/creators/:userId), com `visao="admin"`. O mesmo componente
// serve os dois porque o payload e o mesmo; a visao admin so acrescenta
// e-mail, notas e revogacao, que o servidor nem envia na visao creator.
//
// DUAS FONTES, NUNCA NA MESMA FRASE: os tiles de "Desde o inicio" vem de
// `totais` (contadores); a serie, o periodo e o delta vem de `eventos`, e cada
// tipo vale desde o proprio marco (`clicks_since`, `sales_since`), que a tela
// mostra em dois selos ao lado da serie. Antes de `clicks_since` o grafico
// desenha cliques como AUSENTES (null no dado), e nao zero: nao havia medicao.
//
// SERIE CURTA: com 1 ou 2 dias o grafico vira barras. Uma linha com um ponto so
// fica um ponto solto no meio do vazio, e a leitura some; barras dizem o valor
// de cada dia sem precisar de vizinho.
//
// IDENTIDADE: com `identidade="embutida"` (o padrao, que e o do admin) a view
// desenha o CreatorIdentidade como primeiro bloco. Com `"externa"` ela nao
// desenha: a pagina /creator o poe na faixa de topo, ao lado do titulo, com o
// mesmo componente.

type Visao = "creator" | "admin";

const DIAS_DA_JANELA: Record<Exclude<CreatorDashboardJanela, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

// A partir de quantos dias a serie volta a ser linha.
const DIAS_MINIMOS_PARA_LINHA = 3;

// TODO(Ana)
const JANELAS: Array<{ valor: CreatorDashboardJanela; rotulo: string }> = [
  { valor: "7d", rotulo: "7 dias" },
  { valor: "30d", rotulo: "30 dias" },
  { valor: "90d", rotulo: "90 dias" },
  { valor: "all", rotulo: "Tudo" },
];

const ICONE = "h-3.5 w-3.5";
const ICONE_DO_SELO = "h-4 w-4";
const ICONE_DO_CARD = "h-6 w-6";

// Opacidade da base das barras: o gradiente vertical sai da cor da serie no
// topo e desbota ate aqui.
const BASE_DA_BARRA = 0.35;

const SELO =
  "inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs font-black";

const SELO_NEUTRO = `${SELO} border-slate-300 bg-slate-50 text-slate-600`;

const MARGEM_DO_GRAFICO = { top: 8, right: 8, bottom: 0, left: -8 };

const EIXO = {
  fontSize: 11,
  fontWeight: 700,
  fill: "var(--muted-foreground)",
};

const TOOLTIP: CSSProperties = {
  borderRadius: 12,
  border: "2px solid var(--bnt-ink)",
  background: "var(--card)",
  color: "var(--foreground)",
  fontSize: 12,
  fontWeight: 700,
};

const LEGENDA: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  paddingBottom: 8,
};

/** Instante ISO em dd/mm/aaaa, pelo dia civil de Brasilia. */
function dataCurta(iso: string | null | undefined): string {
  const dia = diaBrasilia(iso);
  return dia ? formatarDiaCivil(dia) : "";
}

function inteiro(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

function decimal(valor: number): string {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function percentual(valor: number): string {
  return `${decimal(valor)}%`;
}

/**
 * O delta contra o periodo anterior so e honesto quando a MEDICAO ja existia
 * no comeco daquele periodo. Antes disso a soma anterior e zero por falta de
 * medicao, e um "+400%" contra ela seria mentira com cara de numero.
 *
 * `medidoDesde` e o marco de CLIQUES, e nao o de vendas: o periodo soma
 * cliques, checkouts e vendas juntos, e cliques e checkouts so existem desde o
 * lote 01. Venda reconstruida antes disso nao torna o delta de cliques honesto.
 *
 * Inicio do periodo anterior = inicio da janela menos o tamanho dela, em dias
 * civis de Brasilia, a mesma aritmetica do servidor (shared/brasiliaDay).
 */
export function deltaPermitido(
  medidoDesde: string | null,
  periodoAnterior: CreatorEventosSomas | null,
  janela: CreatorDashboardJanela,
  agoraMs: number,
): boolean {
  if (janela === "all" || periodoAnterior === null || !medidoDesde) {
    return false;
  }
  const hoje = diaBrasilia(new Date(agoraMs).toISOString());
  if (!hoje) return false;
  const dias = DIAS_DA_JANELA[janela];
  const primeiroDia = somarDiaCivil(hoje, -(dias - 1));
  const inicioAnterior = inicioDoDiaBrasilia(somarDiaCivil(primeiroDia, -dias));
  return Date.parse(medidoDesde) < Date.parse(inicioAnterior);
}

/** Cabecalho de secao na forma do AdminSection do admin: selo, titulo e frase. */
function CabecalhoDeSecao({
  id,
  icone,
  selo,
  titulo,
  frase,
}: {
  id: string;
  icone: ReactNode;
  selo: string;
  titulo: string;
  frase: string;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-violet-800 shadow-[2px_2px_0_var(--bnt-shadow)]">
        {icone}
        {selo}
      </p>
      <h2
        id={id}
        className="font-display mt-3 text-3xl font-black text-slate-950"
      >
        {titulo}
      </h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
        {frase}
      </p>
    </div>
  );
}

function SeletorDeJanela({
  janela,
  onChange,
}: {
  janela: CreatorDashboardJanela;
  onChange: (janela: CreatorDashboardJanela) => void;
}) {
  return (
    <div
      role="group"
      // TODO(Ana)
      aria-label="Período da série"
      className="flex flex-wrap gap-2"
    >
      {JANELAS.map((opcao) => {
        const ativa = opcao.valor === janela;
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativa}
            onClick={() => onChange(opcao.valor)}
            className={`rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-black uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:py-1.5 ${
              ativa
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}

/** Um dia do grafico: o da serie, com cliques null onde nao havia medicao. */
export type PontoDoGrafico = Omit<CreatorDashboardSerieDia, "clicks"> & {
  clicks: number | null;
};

/**
 * Dias ANTERIORES ao marco de cliques viram `clicks: null`. O marco e o inicio
 * global da medicao (INICIO_MEDICAO_CLIQUES). O servidor manda 0 nesses dias (a
 * serie comeca no primeiro evento de qualquer tipo, e com o backfill de vendas
 * isso pode ser meses antes da medicao de cliques), e um 0 desenhado diria
 * "ninguem clicou" onde a verdade e "nao se media". Null o recharts desenha como
 * ausencia: sem barra, e um vao na linha. Sem marco (payload sem o campo e sem
 * o alias), todos os dias ficam null. Vendas nao mudam.
 */
export function serieParaGrafico(
  serie: CreatorDashboardSerieDia[],
  clicksSince: string | null,
): PontoDoGrafico[] {
  const diaDoMarco = diaBrasilia(clicksSince);
  return serie.map((dia) => ({
    ...dia,
    clicks: diaDoMarco !== null && dia.dia >= diaDoMarco ? dia.clicks : null,
  }));
}

/** Gradiente vertical da barra: a cor da serie no topo, desbotada na base. */
function GradienteDaBarra({ id, cor }: { id: string; cor: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style={{ stopColor: cor }} />
      <stop
        offset="100%"
        style={{ stopColor: cor, stopOpacity: BASE_DA_BARRA }}
      />
    </linearGradient>
  );
}

/**
 * O gradiente entra pelo `shape`, e nao pelo `fill` da Bar: a legenda e o
 * tooltip leem a cor da serie do `fill`, e um `url(#...)` ali apagaria a cor
 * deles.
 */
function barraComGradiente(id: string) {
  return function BarraComGradiente(props: unknown) {
    const { x, y, width, height, radius } = props as {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      radius?: number | [number, number, number, number];
    };
    return (
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        radius={radius}
        fill={`url(#${id})`}
      />
    );
  };
}

const BARRA_CLIQUES = barraComGradiente("creator-barra-cliques");
const BARRA_VENDAS = barraComGradiente("creator-barra-vendas");

function Grafico({ dados }: { dados: PontoDoGrafico[] }) {
  const curta = dados.length < DIAS_MINIMOS_PARA_LINHA;
  const temVendas = dados.some((dia) => dia.sales > 0);
  const muitosDias = dados.length > 31;

  return (
    <div className="overflow-x-auto">
      <div
        data-testid="creator-grafico"
        data-forma={curta ? "barras" : "linha"}
        data-eixo-vendas={!curta && temVendas ? "sim" : "nao"}
        data-cliques-ausentes={dados.filter((dia) => dia.clicks === null).length}
        className={`h-72 ${muitosDias ? "min-w-[40rem] sm:min-w-0" : ""}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          {curta ? (
            <BarChart data={dados} margin={MARGEM_DO_GRAFICO}>
              <defs>
                <GradienteDaBarra id="creator-barra-cliques" cor="var(--chart-1)" />
                <GradienteDaBarra id="creator-barra-vendas" cor="var(--chart-3)" />
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="dia"
                tickFormatter={rotuloDeDia}
                tick={EIXO}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={EIXO}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip labelFormatter={rotuloDeDia} contentStyle={TOOLTIP} />
              <Legend
                verticalAlign="top"
                iconType="circle"
                wrapperStyle={LEGENDA}
              />
              <Bar
                dataKey="clicks"
                // TODO(Ana)
                name="Cliques"
                fill="var(--chart-1)"
                shape={BARRA_CLIQUES}
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
                isAnimationActive={false}
              />
              <Bar
                dataKey="sales"
                // TODO(Ana)
                name="Vendas"
                fill="var(--chart-3)"
                shape={BARRA_VENDAS}
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <ComposedChart data={dados} margin={MARGEM_DO_GRAFICO}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="dia"
                tickFormatter={rotuloDeDia}
                interval={intervaloDeRotulos(dados.length, 6)}
                tick={EIXO}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                yAxisId="cliques"
                allowDecimals={false}
                tick={EIXO}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              {temVendas ? (
                <YAxis
                  yAxisId="vendas"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ ...EIXO, fill: "var(--chart-3)" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
              ) : null}
              <Tooltip labelFormatter={rotuloDeDia} contentStyle={TOOLTIP} />
              <Legend
                verticalAlign="top"
                iconType="circle"
                wrapperStyle={LEGENDA}
              />
              <Area
                yAxisId="cliques"
                type="monotone"
                dataKey="clicks"
                // TODO(Ana)
                name="Cliques"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="var(--chart-1)"
                fillOpacity={0.15}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
              <Line
                yAxisId={temVendas ? "vendas" : "cliques"}
                type="monotone"
                dataKey="sales"
                // TODO(Ana)
                name="Vendas"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Serie({
  painel,
  janela,
  onJanelaChange,
  agoraMs,
}: {
  painel: CreatorDashboard;
  janela: CreatorDashboardJanela;
  onJanelaChange: (janela: CreatorDashboardJanela) => void;
  agoraMs: number;
}) {
  const { eventos } = painel;

  if (eventos.serie.length === 0) {
    return (
      <div
        data-testid="creator-sem-eventos"
        className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-10 text-center text-sm font-bold text-slate-600"
      >
        <MousePointerClick aria-hidden="true" className="h-7 w-7 text-slate-400" />
        {/* TODO(Ana) */}
        Ainda não registramos cliques no seu link.
      </div>
    );
  }

  // JANELA DE DEPLOY: o backend anterior ao lote 06b so manda `events_since`
  // (primeiro evento de qualquer tipo). O front novo cai para ele como marco de
  // cliques e simplesmente nao mostra o selo de vendas.
  const clicksSince = eventos.clicks_since ?? eventos.events_since ?? null;
  const salesSince = eventos.sales_since ?? null;

  const comDelta = deltaPermitido(
    clicksSince,
    eventos.periodo_anterior,
    janela,
    agoraMs,
  );
  const anterior = comDelta ? eventos.periodo_anterior : null;

  const linhasDoPeriodo: Array<{
    chave: keyof CreatorEventosSomas;
    rotulo: string;
    valor: string;
  }> = [
    // TODO(Ana)
    {
      chave: "clicks",
      rotulo: "Cliques",
      valor: inteiro(eventos.periodo.clicks),
    },
    {
      chave: "checkouts",
      // TODO(Ana)
      rotulo: "Checkouts",
      valor: inteiro(eventos.periodo.checkouts),
    },
    // TODO(Ana)
    { chave: "sales", rotulo: "Vendas", valor: inteiro(eventos.periodo.sales) },
    {
      chave: "revenue_cents",
      // TODO(Ana)
      rotulo: "Receita",
      valor: formatarCentavos(eventos.periodo.revenue_cents),
    },
  ];

  return (
    <div data-testid="creator-serie" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorDeJanela janela={janela} onChange={onJanelaChange} />
        <div className="flex flex-wrap items-center gap-2">
          {clicksSince ? (
            <span data-testid="creator-cliques-desde" className={SELO_NEUTRO}>
              <CalendarDays aria-hidden="true" className={ICONE} />
              {/* TODO(Ana) */}
              {`Cliques desde ${dataCurta(clicksSince)}`}
            </span>
          ) : null}
          {salesSince ? (
            <span data-testid="creator-vendas-desde" className={SELO_NEUTRO}>
              <CalendarDays aria-hidden="true" className={ICONE} />
              {/* TODO(Ana) */}
              {`Vendas desde ${dataCurta(salesSince)}`}
            </span>
          ) : null}
        </div>
      </div>

      <Grafico dados={serieParaGrafico(eventos.serie, clicksSince)} />

      <dl
        data-testid="creator-periodo"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {linhasDoPeriodo.map((linha) => (
          <div
            key={linha.chave}
            className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4"
          >
            <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
              {linha.rotulo}
            </dt>
            <dd className="font-display mt-1 text-xl font-black tabular-nums text-slate-950">
              {linha.valor}
            </dd>
            {anterior ? (
              <DeltaBadge
                atual={eventos.periodo[linha.chave]}
                anterior={anterior[linha.chave]}
                testId={`creator-delta-${linha.chave}`}
              />
            ) : null}
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        <span data-testid="creator-ultimo-clique" className={SELO_NEUTRO}>
          <MousePointerClick aria-hidden="true" className={ICONE} />
          {/* TODO(Ana) */}
          {`Último clique: ${
            eventos.ultimo_click_at
              ? relativeTime(eventos.ultimo_click_at, agoraMs)
              : "nenhum ainda"
          }`}
        </span>
        <span data-testid="creator-ultima-venda" className={SELO_NEUTRO}>
          <ShoppingBag aria-hidden="true" className={ICONE} />
          {/* TODO(Ana) */}
          {`Última venda: ${
            eventos.ultima_venda_at
              ? relativeTime(eventos.ultima_venda_at, agoraMs)
              : "nenhuma ainda"
          }`}
        </span>
      </div>
    </div>
  );
}

export function CreatorDashboardView({
  painel,
  janela,
  onJanelaChange,
  visao,
  identidade = "embutida",
}: {
  painel: CreatorDashboard;
  janela: CreatorDashboardJanela;
  onJanelaChange: (janela: CreatorDashboardJanela) => void;
  visao: Visao;
  identidade?: "embutida" | "externa";
}) {
  const agoraMs = Date.now();
  const { perfil, creator, totais, codigos } = painel;

  return (
    <div data-testid="creator-painel" className="space-y-6 md:space-y-8">
      {identidade === "embutida" ? (
        <CreatorIdentidade perfil={perfil} creator={creator} visao={visao} />
      ) : null}

      {codigos.length === 0 ? (
        <section
          data-testid="creator-sem-codigo"
          className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-slate-400 bg-white px-6 py-10 text-center"
        >
          <Link2Off aria-hidden="true" className="h-8 w-8 text-slate-400" />
          <p className="font-display text-lg font-black text-slate-950">
            {/* TODO(Ana) */}
            Seu código de creator ainda não foi vinculado.
          </p>
          <p className="max-w-md text-sm font-bold text-slate-600">
            {/* TODO(Ana) */}O time da Bora na Tech vai vincular o código à sua
            conta e avisar você. Assim que isso acontecer, seus números aparecem
            aqui.
          </p>
        </section>
      ) : (
        <>
          <BlocoBoundary
            // TODO(Ana)
            nome="Seus números"
          >
            <section
              aria-labelledby="creator-totais-titulo"
              className="space-y-5"
            >
              <CabecalhoDeSecao
                id="creator-totais-titulo"
                icone={<BarChart3 className={ICONE_DO_SELO} />}
                // TODO(Ana)
                selo="desde o início"
                // TODO(Ana)
                titulo="Seus números"
                // TODO(Ana)
                frase="Os totais acumulados de todos os seus códigos."
              />
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <CreatorMetricCard
                  testId="creator-tile-cliques"
                  icone={<MousePointerClick className={ICONE_DO_CARD} />}
                  cor="bg-violet-800 text-white"
                  // TODO(Ana)
                  rotulo="Cliques"
                  valor={inteiro(totais.clicks)}
                  // TODO(Ana)
                  detalhe="no seu link"
                />
                <CreatorMetricCard
                  testId="creator-tile-vendas"
                  icone={<ShoppingBag className={ICONE_DO_CARD} />}
                  cor="bg-violet-800 text-white"
                  // TODO(Ana)
                  rotulo="Vendas"
                  valor={inteiro(totais.sales)}
                  // TODO(Ana)
                  detalhe="com o seu cupom"
                />
                <CreatorMetricCard
                  testId="creator-tile-conversao"
                  icone={<Percent className={ICONE_DO_CARD} />}
                  cor="bg-sky-600 text-white"
                  // TODO(Ana)
                  rotulo="Conversão"
                  valor={
                    totais.conversao_pct === null
                      ? "-"
                      : percentual(totais.conversao_pct)
                  }
                  detalhe={
                    totais.conversao_pct === null
                      ? // TODO(Ana)
                        "sem cliques ainda"
                      : // TODO(Ana)
                        `${decimal(totais.conversao_pct)} vendas por 100 cliques`
                  }
                />
                <CreatorMetricCard
                  testId="creator-tile-receita"
                  icone={<DollarSign className={ICONE_DO_CARD} />}
                  cor="bg-[var(--bnt-accent-solid)] text-ink-on-accent"
                  // TODO(Ana)
                  rotulo="Receita gerada"
                  valor={formatarCentavos(totais.revenue_cents)}
                  // TODO(Ana)
                  detalhe="valor pago pelas pessoas, com desconto"
                />
                <CreatorMetricCard
                  testId="creator-tile-a-receber"
                  icone={<Hourglass className={ICONE_DO_CARD} />}
                  cor="bg-[var(--bnt-accent-solid)] text-ink-on-accent"
                  // TODO(Ana)
                  rotulo="Comissão a receber"
                  valor={formatarCentavos(totais.commission_due_cents)}
                  // TODO(Ana)
                  detalhe="ainda não repassada"
                />
                <CreatorMetricCard
                  testId="creator-tile-paga"
                  icone={<BadgeCheck className={ICONE_DO_CARD} />}
                  cor="bg-emerald-600 text-white"
                  // TODO(Ana)
                  rotulo="Comissão paga"
                  valor={formatarCentavos(totais.commission_paid_cents)}
                  // TODO(Ana)
                  detalhe="já repassada a você"
                />
              </div>
            </section>
          </BlocoBoundary>

          <BlocoBoundary
            // TODO(Ana)
            nome="Seu cupom"
          >
            <section
              aria-labelledby="creator-links-titulo"
              className="space-y-5"
            >
              <CabecalhoDeSecao
                id="creator-links-titulo"
                icone={<Ticket className={ICONE_DO_SELO} />}
                // TODO(Ana)
                selo="cupom e link"
                // TODO(Ana)
                titulo="Seu cupom"
                // TODO(Ana)
                frase="O código e o link para divulgar, com os números de cada um."
              />
              <div className="grid gap-5">
                {codigos.map((codigo) => (
                  <CupomDoCodigo
                    key={codigo.id}
                    codigo={codigo}
                    visao={visao}
                  />
                ))}
              </div>
            </section>
          </BlocoBoundary>

          <BlocoBoundary
            // TODO(Ana)
            nome="Cliques e vendas por dia"
          >
            <section
              aria-labelledby="creator-serie-titulo"
              className="card-brutal rounded-3xl bg-white p-5 sm:p-6"
            >
              <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                {/* TODO(Ana) */}
                série diária
              </p>
              <h3
                id="creator-serie-titulo"
                className="font-display text-lg font-black text-slate-950 sm:text-xl"
              >
                {/* TODO(Ana) */}
                Cliques e vendas por dia
              </h3>
              <div className="mt-4">
                <Serie
                  painel={painel}
                  janela={janela}
                  onJanelaChange={onJanelaChange}
                  agoraMs={agoraMs}
                />
              </div>
            </section>
          </BlocoBoundary>
        </>
      )}
    </div>
  );
}
