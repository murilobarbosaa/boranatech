import type { CSSProperties, ReactNode } from "react";
import {
  BadgeCheck,
  CalendarDays,
  DollarSign,
  Hourglass,
  Link2Off,
  MousePointerClick,
  Percent,
  ShoppingBag,
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

import UserAvatar from "@/components/UserAvatar";
import { BlocoBoundary } from "@/components/admin/BlocoBoundary";
import { rotuloDoKind } from "@/lib/creatorKindLabel";
import { formatarCentavos } from "@/lib/formatarCentavos";
import { DeltaBadge } from "@/components/admin/overview/DeltaBadge";
import {
  intervaloDeRotulos,
  rotuloDeDia,
} from "@/components/admin/overview/chartMath";
import { relativeTime } from "@/components/admin/tasks/relativeTime";
import { CreatorMetricTile } from "@/components/creator/CreatorMetricTile";
import { CupomDoCodigo } from "@/components/creator/CupomDoCodigo";
import type { TagPalette } from "@/lib/tagPalette";
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

// Um par pastel de tagPalette.ts por tile (fundo -200, tinta -900), seis
// familias diferentes. Strings literais: o Tailwind so emite classe escrita.
const TOM_CLIQUES: TagPalette = { bg: "bg-sky-200", text: "text-sky-900" };
const TOM_VENDAS: TagPalette = { bg: "bg-violet-200", text: "text-violet-900" };
const TOM_CONVERSAO: TagPalette = { bg: "bg-teal-200", text: "text-teal-900" };
const TOM_RECEITA: TagPalette = { bg: "bg-amber-200", text: "text-amber-900" };
const TOM_A_RECEBER: TagPalette = { bg: "bg-pink-200", text: "text-pink-900" };
const TOM_PAGA: TagPalette = { bg: "bg-lime-200", text: "text-lime-900" };

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

function TituloDeSecao({
  id,
  children,
  selo,
}: {
  id: string;
  children: ReactNode;
  selo?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h3 id={id} className="font-display text-xl font-black text-slate-950">
        {children}
      </h3>
      {selo}
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
            className={`rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black shadow-[2px_2px_0_var(--bnt-shadow)] ${
              ativa ? "bg-slate-900 text-white" : "bg-white text-slate-900"
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
            className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-2"
          >
            <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
              {linha.rotulo}
            </dt>
            <dd className="font-display text-xl font-black tabular-nums text-slate-950">
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
}: {
  painel: CreatorDashboard;
  janela: CreatorDashboardJanela;
  onJanelaChange: (janela: CreatorDashboardJanela) => void;
  visao: Visao;
}) {
  const agoraMs = Date.now();
  const { perfil, creator, totais, codigos } = painel;
  // TODO(Ana)
  const nome = perfil.name ?? perfil.handle ?? "Creator";

  return (
    <div data-testid="creator-painel" className="space-y-6 md:space-y-8">
      <div className="relative isolate">
      <div
        aria-hidden="true"
        data-testid="creator-faixa"
        className="absolute -inset-x-4 top-1/2 -z-10 h-24 -translate-y-1/2 border-y-2 border-slate-950 bg-[var(--brand-yellow)] bg-[repeating-linear-gradient(45deg,var(--brand-yellow-soft-deep)_0_10px,transparent_10px_20px)] sm:-inset-x-6 md:h-28"
      />
      <section className="card-brutal relative rounded-3xl bg-white p-6 md:p-8">
        <span
          aria-hidden="true"
          data-testid="creator-etiqueta"
          className="absolute -right-3 -top-4 rotate-6 rounded-full border-2 border-slate-950 bg-amber-300 px-3 py-1 font-display text-xs font-black uppercase tracking-widest text-ink-on-accent shadow-[2px_2px_0_var(--bnt-shadow)]"
        >
          {/* TODO(Ana) */}
          Creator
        </span>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar
            name={nome}
            avatarUrl={perfil.avatar_url}
            mode={perfil.avatar_url ? "photo" : "icon"}
            size="xl"
          />
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-amber-800">
              {/* TODO(Ana) */}
              Creator da Bora na Tech
            </p>
            <h2 className="mt-2 font-display text-3xl font-black text-slate-950 md:text-4xl">
              {nome}
            </h2>
            {perfil.handle ? (
              <p className="mt-1 text-sm font-bold text-slate-600">
                @{perfil.handle}
              </p>
            ) : null}
            {visao === "creator" ? (
              <p className="mt-2 max-w-xl text-sm font-semibold text-slate-600">
                {/* TODO(Ana) */}
                Seu link, seus números e o que você já gerou para a Bora na
                Tech.
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                data-testid="creator-kind"
                className="rounded-full border-2 border-sky-800 bg-sky-50 px-2.5 py-0.5 text-xs font-black text-sky-900"
              >
                {rotuloDoKind(creator.kind)}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {/* TODO(Ana) */}
                {`Creator desde ${dataCurta(creator.granted_at)}`}
              </span>
              {visao === "admin" && creator.revoked_at ? (
                <span
                  data-testid="creator-revogado"
                  className="rounded-full border-2 border-rose-700 bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-800"
                >
                  {/* TODO(Ana) */}
                  {`Revogado em ${dataCurta(creator.revoked_at)}`}
                </span>
              ) : null}
            </div>
            {visao === "admin" && perfil.email ? (
              <p
                data-testid="creator-email"
                className="mt-2 break-all text-sm font-bold text-slate-700"
              >
                {perfil.email}
              </p>
            ) : null}
          </div>
        </div>
      </section>
      </div>

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
            <section aria-labelledby="creator-totais-titulo" className="space-y-4">
              <TituloDeSecao
                id="creator-totais-titulo"
                selo={
                  <span
                    className={`${SELO} border-slate-900 bg-yellow-300 uppercase tracking-wide text-ink-on-accent`}
                  >
                    {/* TODO(Ana) */}
                    Desde o início
                  </span>
                }
              >
                {/* TODO(Ana) */}
                Seus números
              </TituloDeSecao>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <CreatorMetricTile
                  testId="creator-tile-cliques"
                  tom={TOM_CLIQUES}
                  icone={<MousePointerClick className={ICONE} />}
                  // TODO(Ana)
                  rotulo="Cliques"
                  valor={inteiro(totais.clicks)}
                />
                <CreatorMetricTile
                  testId="creator-tile-vendas"
                  tom={TOM_VENDAS}
                  icone={<ShoppingBag className={ICONE} />}
                  // TODO(Ana)
                  rotulo="Vendas"
                  valor={inteiro(totais.sales)}
                />
                <CreatorMetricTile
                  testId="creator-tile-conversao"
                  tom={TOM_CONVERSAO}
                  icone={<Percent className={ICONE} />}
                  // TODO(Ana)
                  rotulo="Conversão"
                  valor={
                    totais.conversao_pct === null
                      ? // TODO(Ana)
                        "sem cliques ainda"
                      : percentual(totais.conversao_pct)
                  }
                  detalhe={
                    totais.conversao_pct === null
                      ? undefined
                      : // TODO(Ana)
                        `${decimal(totais.conversao_pct)} vendas por 100 cliques`
                  }
                />
                <CreatorMetricTile
                  testId="creator-tile-receita"
                  tom={TOM_RECEITA}
                  icone={<DollarSign className={ICONE} />}
                  // TODO(Ana)
                  rotulo="Receita gerada"
                  valor={formatarCentavos(totais.revenue_cents)}
                />
                <CreatorMetricTile
                  testId="creator-tile-a-receber"
                  tom={TOM_A_RECEBER}
                  icone={<Hourglass className={ICONE} />}
                  // TODO(Ana)
                  rotulo="Comissão a receber"
                  valor={formatarCentavos(totais.commission_due_cents)}
                />
                <CreatorMetricTile
                  testId="creator-tile-paga"
                  tom={TOM_PAGA}
                  icone={<BadgeCheck className={ICONE} />}
                  // TODO(Ana)
                  rotulo="Comissão paga"
                  valor={formatarCentavos(totais.commission_paid_cents)}
                />
              </div>
            </section>
          </BlocoBoundary>

          <BlocoBoundary
            // TODO(Ana)
            nome="Seus links"
          >
            <section aria-labelledby="creator-links-titulo" className="space-y-4">
              <TituloDeSecao id="creator-links-titulo">
                {/* TODO(Ana) */}
                Seus links
              </TituloDeSecao>
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
              className="card-brutal space-y-4 rounded-3xl bg-white p-5 sm:p-6"
            >
              <TituloDeSecao id="creator-serie-titulo">
                {/* TODO(Ana) */}
                Cliques e vendas por dia
              </TituloDeSecao>
              <Serie
                painel={painel}
                janela={janela}
                onJanelaChange={onJanelaChange}
                agoraMs={agoraMs}
              />
            </section>
          </BlocoBoundary>
        </>
      )}
    </div>
  );
}
