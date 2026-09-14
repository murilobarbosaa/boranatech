import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
import {
  diaBrasilia,
  formatarDiaCivil,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "@shared/brasiliaDay";
import type {
  CreatorDashboard,
  CreatorDashboardCodigo,
  CreatorDashboardJanela,
  CreatorEventosSomas,
} from "@shared/creatorDashboard";

// O PAINEL DE CREATOR, sem buscar dado nenhum. Quem busca e quem monta: a
// pagina /creator (GET /api/creator/me) hoje, e o admin
// (GET /api/admin/creators/:userId) no lote 04, com `visao="admin"`. O mesmo
// componente serve os dois porque o payload e o mesmo; a visao admin so
// acrescenta e-mail, notas e revogacao, que o servidor nem envia na visao
// creator.
//
// DUAS FONTES, NUNCA NA MESMA FRASE: os tiles de "Desde o inicio" vem de
// `totais` (contadores); a serie, o periodo e o delta vem de `eventos`, que
// existem desde `events_since`, e a tela diz essa data ao lado da serie.

type Visao = "creator" | "admin";

const DIAS_DA_JANELA: Record<Exclude<CreatorDashboardJanela, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

// TODO(Ana)
const JANELAS: Array<{ valor: CreatorDashboardJanela; rotulo: string }> = [
  { valor: "7d", rotulo: "7 dias" },
  { valor: "30d", rotulo: "30 dias" },
  { valor: "90d", rotulo: "90 dias" },
  { valor: "all", rotulo: "Tudo" },
];

/** Instante ISO em dd/mm/aaaa, pelo dia civil de Brasilia. */
function dataCurta(iso: string | null | undefined): string {
  const dia = diaBrasilia(iso);
  return dia ? formatarDiaCivil(dia) : "";
}

function inteiro(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

function percentual(valor: number): string {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

/**
 * O delta contra o periodo anterior so e honesto quando os eventos ja existiam
 * no comeco daquele periodo. Antes disso a soma anterior e zero por falta de
 * medicao, e um "+400%" contra ela seria mentira com cara de numero.
 *
 * Inicio do periodo anterior = inicio da janela menos o tamanho dela, em dias
 * civis de Brasilia, a mesma aritmetica do servidor (shared/brasiliaDay).
 */
export function deltaPermitido(
  eventsSince: string | null,
  periodoAnterior: CreatorEventosSomas | null,
  janela: CreatorDashboardJanela,
  agoraMs: number,
): boolean {
  if (janela === "all" || periodoAnterior === null || !eventsSince) {
    return false;
  }
  const hoje = diaBrasilia(new Date(agoraMs).toISOString());
  if (!hoje) return false;
  const dias = DIAS_DA_JANELA[janela];
  const primeiroDia = somarDiaCivil(hoje, -(dias - 1));
  const inicioAnterior = inicioDoDiaBrasilia(somarDiaCivil(primeiroDia, -dias));
  return Date.parse(eventsSince) < Date.parse(inicioAnterior);
}

function BotaoCopiar({ texto }: { texto: string }) {
  const [estado, setEstado] = useState<"parado" | "copiado" | "falhou">(
    "parado",
  );

  useEffect(() => {
    if (estado !== "copiado") return;
    const timer = setTimeout(() => setEstado("parado"), 2000);
    return () => clearTimeout(timer);
  }, [estado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setEstado("copiado");
    } catch {
      setEstado("falhou");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void copiar()}
        className="bnt-pressable inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
      >
        {estado === "copiado" ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {/* TODO(Ana) */}
        {estado === "copiado" ? "Copiado" : "Copiar"}
      </button>
      {estado === "falhou" ? (
        <span className="text-xs font-bold text-rose-700">
          {/* TODO(Ana) */}
          Não deu para copiar. Selecione o link e copie à mão.
        </span>
      ) : null}
    </div>
  );
}

function CartaoDoCodigo({
  codigo,
  visao,
}: {
  codigo: CreatorDashboardCodigo;
  visao: Visao;
}) {
  return (
    <article
      data-testid={`creator-codigo-${codigo.code}`}
      className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display text-xl font-black text-slate-950">
          {codigo.code}
        </p>
        {codigo.status !== "active" ? (
          <span className="rounded-full border-2 border-amber-600 bg-amber-50 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-amber-900">
            {/* TODO(Ana) */}
            Pausado
          </span>
        ) : null}
      </div>

      <p className="mt-2 break-all text-sm font-bold text-slate-700">
        {codigo.link}
      </p>
      <div className="mt-2">
        <BotaoCopiar texto={codigo.link} />
      </div>

      <p className="mt-3 text-sm font-bold text-slate-700">
        {/* TODO(Ana) */}
        {codigo.discount_percent > 0
          ? `${percentual(codigo.discount_percent)} de desconto para quem usar`
          : "Sem desconto para quem usar"}
        {" · "}
        {/* TODO(Ana) */}
        {`Comissão de ${percentual(codigo.commission_percent)}`}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          // TODO(Ana)
          { rotulo: "Cliques", valor: inteiro(codigo.clicks) },
          // TODO(Ana)
          { rotulo: "Vendas", valor: inteiro(codigo.sales) },
          // TODO(Ana)
          { rotulo: "Receita", valor: formatarCentavos(codigo.revenue_cents) },
          {
            // TODO(Ana)
            rotulo: "A receber",
            valor: formatarCentavos(codigo.commission_due_cents),
          },
        ].map((item) => (
          <div key={item.rotulo}>
            <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
              {item.rotulo}
            </dt>
            <dd className="font-black text-slate-950">{item.valor}</dd>
          </div>
        ))}
      </dl>

      {visao === "admin" && codigo.notes ? (
        <p
          data-testid={`creator-codigo-notas-${codigo.code}`}
          className="mt-3 rounded-xl border-2 border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600"
        >
          {codigo.notes}
        </p>
      ) : null}
    </article>
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

  if (eventos.events_since === null) {
    return (
      <p
        data-testid="creator-sem-eventos"
        className="rounded-2xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-sm font-bold text-slate-600"
      >
        {/* TODO(Ana) */}
        Ainda não registramos cliques no seu link.
      </p>
    );
  }

  const comDelta = deltaPermitido(
    eventos.events_since,
    eventos.periodo_anterior,
    janela,
    agoraMs,
  );
  const anterior = comDelta ? eventos.periodo_anterior : null;
  const muitosDias = eventos.serie.length > 31;

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
    <div data-testid="creator-serie">
      <SeletorDeJanela janela={janela} onChange={onJanelaChange} />
      <p
        data-testid="creator-eventos-desde"
        className="mt-3 text-xs font-bold text-slate-500"
      >
        {/* TODO(Ana) */}
        {`Eventos desde ${dataCurta(eventos.events_since)}`}
      </p>

      <div className="mt-3 overflow-x-auto">
        <div
          data-testid="creator-grafico"
          className={`h-64 ${muitosDias ? "min-w-[40rem] sm:min-w-0" : ""}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={eventos.serie}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dia"
                tickFormatter={rotuloDeDia}
                interval={intervaloDeRotulos(eventos.serie.length, 6)}
                tick={{ fontSize: 11, fontWeight: 700 }}
              />
              <YAxis
                yAxisId="cliques"
                allowDecimals={false}
                tick={{ fontSize: 11, fontWeight: 700 }}
              />
              <YAxis
                yAxisId="vendas"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 11, fontWeight: 700 }}
              />
              <Tooltip labelFormatter={rotuloDeDia} />
              <Line
                yAxisId="cliques"
                type="monotone"
                dataKey="clicks"
                // TODO(Ana)
                name="Cliques"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="vendas"
                type="monotone"
                dataKey="sales"
                // TODO(Ana)
                name="Vendas"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <dl
        data-testid="creator-periodo"
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {linhasDoPeriodo.map((linha) => (
          <div key={linha.chave}>
            <dt className="text-[11px] font-black uppercase tracking-wide text-slate-500">
              {linha.rotulo}
            </dt>
            <dd className="font-black text-slate-950">{linha.valor}</dd>
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

      <p className="mt-4 text-xs font-bold text-slate-500">
        {/* TODO(Ana) */}
        {`Último clique: ${
          eventos.ultimo_click_at
            ? relativeTime(eventos.ultimo_click_at, agoraMs)
            : "nenhum ainda"
        } · Última venda: ${
          eventos.ultima_venda_at
            ? relativeTime(eventos.ultima_venda_at, agoraMs)
            : "nenhuma ainda"
        }`}
      </p>
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
    <div data-testid="creator-painel" className="space-y-6">
      <section className="card-brutal flex flex-col gap-4 rounded-3xl bg-white p-5 sm:flex-row sm:items-center sm:p-6">
        <UserAvatar
          name={nome}
          avatarUrl={perfil.avatar_url}
          mode={perfil.avatar_url ? "photo" : "icon"}
          size="md"
        />
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-black text-slate-950">
            {nome}
          </h2>
          {perfil.handle ? (
            <p className="text-sm font-bold text-slate-600">@{perfil.handle}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
      </section>

      {codigos.length === 0 ? (
        <section
          data-testid="creator-sem-codigo"
          className="rounded-3xl border-2 border-dashed border-slate-400 bg-white p-6 text-center"
        >
          <p className="font-display text-lg font-black text-slate-950">
            {/* TODO(Ana) */}
            Seu código de creator ainda não foi vinculado.
          </p>
          <p className="mt-1 text-sm font-bold text-slate-600">
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
            <section aria-labelledby="creator-totais-titulo">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3
                  id="creator-totais-titulo"
                  className="font-display text-lg font-black text-slate-950"
                >
                  {/* TODO(Ana) */}
                  Seus números
                </h3>
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                  {/* TODO(Ana) */}
                  Desde o início
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                <CreatorMetricTile
                  testId="creator-tile-cliques"
                  // TODO(Ana)
                  rotulo="Cliques"
                  valor={inteiro(totais.clicks)}
                />
                <CreatorMetricTile
                  testId="creator-tile-vendas"
                  // TODO(Ana)
                  rotulo="Vendas"
                  valor={inteiro(totais.sales)}
                />
                <CreatorMetricTile
                  testId="creator-tile-conversao"
                  // TODO(Ana)
                  rotulo="Conversão"
                  valor={
                    totais.conversao_pct === null
                      ? // TODO(Ana)
                        "sem cliques ainda"
                      : percentual(totais.conversao_pct)
                  }
                />
                <CreatorMetricTile
                  testId="creator-tile-receita"
                  // TODO(Ana)
                  rotulo="Receita gerada"
                  valor={formatarCentavos(totais.revenue_cents)}
                />
                <CreatorMetricTile
                  testId="creator-tile-a-receber"
                  // TODO(Ana)
                  rotulo="Comissão a receber"
                  valor={formatarCentavos(totais.commission_due_cents)}
                />
                <CreatorMetricTile
                  testId="creator-tile-paga"
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
            <section aria-labelledby="creator-links-titulo">
              <h3
                id="creator-links-titulo"
                className="font-display text-lg font-black text-slate-950"
              >
                {/* TODO(Ana) */}
                Seus links
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {codigos.map((codigo) => (
                  <CartaoDoCodigo
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
              <h3
                id="creator-serie-titulo"
                className="font-display text-lg font-black text-slate-950"
              >
                {/* TODO(Ana) */}
                Cliques e vendas por dia
              </h3>
              <div className="mt-3">
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
