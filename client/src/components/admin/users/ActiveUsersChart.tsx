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

// As janelas que ESTA serie oferece. Subconjunto das OVERVIEW_WINDOWS, mesmos
// valores, sem o "Tudo": serie diaria sem corte nao tem teto de baldes, e o
// servidor recusa a janela com 400 em vez de aceitar calado. Se alguem
// acrescentar um valor aqui sem acrescentar no server, a rota responde 400 e a
// tela mostra o estado de erro, que e ruim mas HONESTO. O contrario (server
// aceitando o que a tela nao oferece) nao tem sintoma.
const JANELAS: readonly OverviewWindow[] = ["7", "30"];
const JANELA_PADRAO: OverviewWindow = "30";

// Espelha PosthogAtivosDiariosState. Os tres estados sao nomeados no tipo de
// proposito: com um `pontos?: Ponto[]` solto, "nao configurado" e "mes vazio"
// teriam a mesma forma, e a tela escolheria a leitura errada sem nada acusar.
type Serie =
  | { state: "not_configured"; missing?: string[] }
  | { state: "error"; reason?: string; httpStatus?: number }
  | { state: "ok"; window?: string; dias?: number; pontos?: Ponto[] };

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
      rodape={rodapeDeAtivos(pontos.length)}
      controles={
        <div className="mt-3">
          <OverviewPeriod
            window={janela}
            onChange={setJanela}
            windows={JANELAS}
            testId="ativos-periodo"
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
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barras}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />
          <XAxis
            dataKey="rotulo"
            interval={intervaloDeRotulos(barras.length, 6)}
            tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            // Contagem por dia sempre comeca em zero: a altura da barra e a
            // unica coisa que ela comunica.
            domain={[0, "auto"]}
            allowDecimals={false}
            tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            /* TODO(Ana) */
            formatter={(valor: unknown) => [`${valor}`, "Ativos"]}
            labelFormatter={(rotulo: string) => `Dia ${rotulo}`}
            contentStyle={{
              borderRadius: 12,
              border: "2px solid #0f172a",
              fontSize: 12,
              fontWeight: 700,
            }}
          />
          <Bar
            dataKey="ativos"
            name="Ativos"
            fill="#0d9488"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function rodapeDeAtivos(total: number): string[] {
  if (total === 0) return [];
  return [
    /* TODO(Ana) */
    `Últimos ${total} dias (America/Sao_Paulo). Conta presença por navegador, não por pessoa: quem entra deslogado e depois faz login conta duas vezes no dia.`,
  ];
}
