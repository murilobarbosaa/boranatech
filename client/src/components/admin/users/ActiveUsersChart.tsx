import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { adminFetch } from "@/lib/adminApi";
import { ChartFrame } from "@/components/admin/overview/ChartFrame";
import {
  OverviewPeriod,
  type OverviewWindow,
} from "@/components/admin/overview/OverviewPeriod";
import {
  intervaloDeRotulos,
  rotuloDeDia,
  tendenciaDeFluxo,
} from "@/components/admin/overview/chartMath";

// ATIVOS POR DIA, na aba Usuarios.
//
// A PERGUNTA: a presenca esta crescendo ou secando ao longo do mes?
//
// BARRA e nao linha, pelo mesmo motivo do grafico de cadastros: contagem por dia
// e grandeza FECHADA, e linha sugeriria que existe valor entre dois dias.
//
// A UNIDADE E `distinct_id`, herdada do card "pessoas ativas hoje" e do resto do
// modulo de PostHog: e a unica chave presente em evento anonimo. Quem navega
// deslogado e depois entra conta duas vezes no dia. E PRESENCA com margem, e a
// copy tem que dizer "ativos", nao "usuarios", para nao prometer identidade que
// o numero nao tem.
//
// ZERO E MEDICAO, e quem afirma isso e o SERVIDOR: a serie chega sempre com 30
// pontos, ja preenchida. Este componente nunca decide o que um dia ausente
// significa, porque nunca recebe um.

type Ponto = { date: string; ativos: number };

// As MESMAS janelas da Visao. O "Tudo" nao e uma janela maior: o servidor troca
// o balde para SEMANA, e quem diz isso e o payload (`granularidade`), nunca a
// contagem de pontos. Se alguem acrescentar um valor aqui sem acrescentar no
// server, a rota responde 400 e a tela mostra o erro, que e ruim mas HONESTO; o
// contrario (server aceitando o que a tela nao oferece) nao tem sintoma.
const JANELAS: readonly OverviewWindow[] = ["7", "30", "all"];
const JANELA_PADRAO: OverviewWindow = "30";

// Espelha PosthogAtivosDiariosState. Os tres estados sao nomeados no tipo de
// proposito: com um `pontos?: Ponto[]` solto, "nao configurado" e "mes vazio"
// teriam a mesma forma, e a tela escolheria a leitura errada sem nada acusar.
type Serie =
  | { state: "not_configured"; missing?: string[] }
  | { state: "error"; reason?: string; httpStatus?: number }
  | {
      state: "ok";
      window?: string;
      granularidade?: "dia" | "semana";
      dias?: number;
      inicio?: string;
      pontos?: Ponto[];
    };

export function ActiveUsersChart() {
  const [janela, setJanela] = useState<OverviewWindow>(JANELA_PADRAO);
  const [data, setData] = useState<Serie | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    // ZERA OS DOIS ao trocar de janela. Sem isto, a serie anterior fica na tela
    // sob o rotulo novo enquanto a busca corre: o grafico diria "7 dias"
    // mostrando trinta, que e pior que um instante de esqueleto. Mesmo motivo
    // para o erro: um 400 de uma janela nao pode sobreviver a troca para outra.
    setData(null);
    setErro(null);
    adminFetch(`/users-active-daily?window=${janela}`)
      .then((json) => {
        if (!cancelado) setData(json.data as Serie);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        setErro(
          err instanceof Error ? err.message : "Erro ao carregar os ativos.",
        );
      });
    return () => {
      cancelado = true;
    };
  }, [janela]);

  // PostHog fora do ar NAO desenha grafico vazio. Trinta barras zeradas sao um
  // desenho plausivel de "site deserto" e indistinguivel do certo, entao a fonte
  // indisponivel vira a mensagem de erro do ChartFrame, sem eixo nenhum.
  const erroDeFonte =
    data && data.state === "not_configured"
      ? `PostHog nao configurado no servidor${
          data.missing?.length ? `: ${data.missing.join(", ")}` : "."
        }`
      : data && data.state === "error"
        ? `Falha ao consultar o PostHog${
            typeof data.httpStatus === "number"
              ? ` (HTTP ${data.httpStatus})`
              : ""
          }.`
        : null;

  // `pontos` ausente na janela de deploy (backend antigo, front novo) degrada
  // para lista vazia em vez de derrubar o render inteiro com TypeError.
  const pontos =
    data && data.state === "ok" && Array.isArray(data.pontos)
      ? data.pontos
      : [];

  // A GRANULARIDADE VEM DA FONTE. Derivar do tamanho da lista ("mais de 60
  // pontos, deve ser semana") seria um parser adivinhando o que o servidor ja
  // declarou, e erraria no dia em que alguem pedisse 7 semanas.
  const semanal =
    data !== null && data.state === "ok" && data.granularidade === "semana";
  const inicioDaSerie =
    data !== null && data.state === "ok" ? (data.inicio ?? null) : null;

  const barras = pontos.map((p) => ({
    rotulo: rotuloDeDia(p.date),
    ativos: p.ativos,
  }));

  return (
    <ChartFrame
      /* TODO(Ana) */
      titulo="Ativos por dia"
      /* TODO(Ana) */
      pergunta="A presença no site está crescendo ou secando?"
      testId="grafico-ativos-diarios"
      erro={erro ?? erroDeFonte}
      vazio={data !== null && erroDeFonte === null && pontos.length === 0}
      carregando={data === null && erro === null}
      rodape={rodapeDeAtivos(pontos.length, semanal)}
      controles={
        <div className="mt-3">
          <OverviewPeriod
            window={janela}
            onChange={setJanela}
            windows={JANELAS}
            testId="ativos-periodo"
            seriesStart={inicioDaSerie}
            // O `inicio` do payload ja E o dia civil, calculado em Brasilia
            // dentro da HogQL. Sem esta declaracao ele passaria pelo
            // renderizador de INSTANTES e a tela diria um dia a menos.
            seriesStartKind="diaCivil"
          />
        </div>
      }
      tendencia={tendenciaDeFluxo(
        // `partial: false` em todos: ao contrario do grafico de cadastros, a
        // serie de ativos nao marca o dia em andamento. Ela ja e uma contagem
        // de PRESENCA, que naturalmente sobe ao longo do dia sem que isso
        // signifique nada, e excluir hoje da tendencia esconderia justamente o
        // dia que a pessoa abriu a aba para ver.
        pontos.map((p) => ({ count: p.ativos, partial: false })),
        /* TODO(Ana) */
        {
          nenhum: "Ninguém ativo no período",
          comecou: "O site voltou a ter gente no período",
        },
        // A aritmetica da tendencia (media da metade recente contra a anterior)
        // vale para qualquer balde de tamanho constante, entao ela NAO e
        // omitida no modo semanal: o que muda e a palavra. Deixar "por dia"
        // sobre uma serie semanal seria um resumo diario sobre dado que nao e
        // diario, que e pior que nao ter resumo.
        semanal ? "semana" : "dia",
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barras}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="rotulo"
            interval={intervaloDeRotulos(barras.length, 6)}
            tick={{ fontSize: 11, fontWeight: 700, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            // Contagem por dia sempre comeca em zero: a altura da barra e a
            // unica coisa que ela comunica.
            domain={[0, "auto"]}
            allowDecimals={false}
            tick={{ fontSize: 11, fontWeight: 700, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            /* TODO(Ana) */
            formatter={(valor: unknown) => [`${valor}`, "Ativos"]}
            labelFormatter={(rotulo: string) =>
              semanal ? `Semana de ${rotulo}` : `Dia ${rotulo}`
            }
            contentStyle={{
              borderRadius: 12,
              border: "2px solid var(--bnt-ink)",
              background: "var(--card)",
              color: "var(--foreground)",
              fontSize: 12,
              fontWeight: 700,
            }}
          />
          <Bar
            dataKey="ativos"
            name="Ativos"
            fill="var(--chart-3)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function rodapeDeAtivos(total: number, semanal: boolean): string[] {
  if (total === 0) return [];
  if (!semanal) {
    return [
      /* TODO(Ana) */
      `Últimos ${total} dias (America/Sao_Paulo). Conta presença por navegador, não por pessoa: quem entra deslogado e depois faz login conta duas vezes no dia.`,
    ];
  }
  return [
    /* TODO(Ana) */
    `${total} semanas (America/Sao_Paulo), começando no domingo. Conta presença por navegador, não por pessoa: quem entra deslogado e depois faz login conta duas vezes.`,
    // A RESSALVA QUE NAO PODE FALTAR. Sem ela alguem soma as barras semanais,
    // compara com a serie diaria e acha que uma das duas esta errada.
    /* TODO(Ana) */
    "Cada barra conta as pessoas distintas DA SEMANA: quem apareceu em três dias conta uma vez, então a soma das semanas é menor que a soma dos dias.",
    /* TODO(Ana) */
    "A primeira e a última barra são semanas incompletas: a série começa no primeiro evento registrado e termina hoje.",
  ];
}
