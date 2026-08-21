import { useEffect, useState } from "react";
import { AlertTriangle, Database, TrendingDown } from "lucide-react";

import { adminFetch } from "@/lib/adminApi";

// FUNIL ATE O ASSINANTE PAGO.
//
// BARRAS HORIZONTAIS, e a razão é o rótulo, não o gosto. Cada etapa carrega
// quatro coisas escritas ("Cadastros", "2.802", "4,8% do passo anterior",
// "-2.668 pessoas"), e texto é horizontal. Em barra vertical esse rótulo vira
// legenda girada ou tooltip, e em 380px de largura quatro colunas verticais dão
// menos de 90px cada, o que não cabe nem o número. Na horizontal a largura da
// barra é o dado e a altura acompanha o texto: a mesma composição serve 380px e
// desktop sem virar duas implementações.
//
// A FONTE MUDA NA ÚLTIMA ETAPA e isso é dito na etapa, não numa nota de rodapé:
// as três primeiras vêm do PostHog, a última é a interseção com o banco.

type Passo = {
  id: string;
  label: string;
  people: number;
  fonte: "posthog" | "posthog+banco";
  conversionFromPrev: number | null;
  lostFromPrev: number | null;
  smallSample: boolean;
};

type Vazamento = {
  stepId: string;
  fromLabel: string;
  toLabel: string;
  lost: number;
  conversionPercent: number;
};

type PosthogEstado =
  | { state: "ok" }
  | { state: "not_configured"; missing: string[] }
  | { state: "error"; reason: string; httpStatus?: number };

type FunilPago = {
  janela: { from: string; to: string; days: number };
  posthog: PosthogEstado;
  steps: Passo[];
  biggestLeak: Vazamento | null;
  pagantesNaJanela: number;
  assinantesSemRastro: number | null;
  retornos: { pessoas: number; converteramDepois: number } | null;
  boletosPendentes: { count: number; cents: number };
  truncated: boolean;
};

const numero = new Intl.NumberFormat("pt-BR");
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function PaidFunnel() {
  const [data, setData] = useState<FunilPago | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    adminFetch("/paid-funnel")
      .then((json) => {
        if (!cancelado) setData(json.data as FunilPago);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        setErro(
          err instanceof Error ? err.message : "Erro ao carregar o funil.",
        );
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (erro) {
    return (
      <p
        data-testid="funil-pago-erro"
        className="rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900"
      >
        {erro}
      </p>
    );
  }
  if (!data) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;
  }

  // NORMALIZAÇÃO NUMA LINHA SÓ, e não guarda espalhada por 12 pontos de leitura.
  // O payload desta rota tem oito campos e o render toca todos; guardar cada um
  // no ponto de uso é a versão que alguém esquece de repetir no décimo terceiro.
  // Aqui o shape é resolvido uma vez, e o JSX abaixo lê valores que existem.
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const posthog: PosthogEstado = data.posthog ?? {
    state: "error",
    reason: "Resposta sem o estado do PostHog.",
  };
  const janelaDias = data.janela?.days ?? 30;
  const boletos = data.boletosPendentes ?? { count: 0, cents: 0 };
  const base = steps[0]?.people ?? 0;

  return (
    <div data-testid="funil-pago" className="space-y-4">
      {posthog.state === "ok" ? null : (
        // POSTHOG FORA NÃO APAGA O BLOCO: o estado é nomeado e o fato do banco
        // sobrevive logo abaixo. Um funil zerado diria "ninguém converteu", que
        // é uma afirmação sobre o negócio feita a partir de uma falha de sonda.
        <div
          data-testid="funil-pago-posthog-indisponivel"
          className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4"
        >
          <p className="font-display text-base font-black text-amber-900">
            {posthog.state === "not_configured"
              ? "PostHog não configurado"
              : `Falha ao consultar o PostHog${
                  typeof posthog.httpStatus === "number"
                    ? ` (HTTP ${posthog.httpStatus})`
                    : ""
                }`}
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-800">
            {posthog.state === "not_configured"
              ? `Faltando no servidor: ${
                  posthog.missing?.length
                    ? posthog.missing.join(", ")
                    : "credenciais do PostHog"
                }.`
              : posthog.reason}
          </p>
          <p
            data-testid="funil-fato-do-banco"
            className="mt-2 text-xs font-bold text-slate-700"
          >
            As etapas de comportamento ficam indisponíveis. O que veio do banco
            continua valendo: {numero.format(data.pagantesNaJanela)}{" "}
            assinatura(s) paga(s) nos últimos {janelaDias} dias.
          </p>
        </div>
      )}

      {steps.length > 0 ? (
        <ol className="space-y-3">
          {steps.map((passo) => (
            <li
              key={passo.id}
              data-testid={`funil-passo-${passo.id}`}
              data-fonte={passo.fonte}
              className="rounded-2xl border-2 border-slate-900 bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-black uppercase text-violet-700">
                  {passo.label}
                </p>
                <p className="font-display text-2xl font-black text-slate-950">
                  {numero.format(passo.people)}
                </p>
              </div>

              {passo.fonte === "posthog+banco" ? (
                // A TRANSIÇÃO DE FONTE, escrita onde ela acontece.
                <p
                  data-testid="funil-fonte-banco"
                  className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500"
                >
                  <Database className="h-3.5 w-3.5 shrink-0" />
                  Esta etapa vem do banco: quem iniciou checkout e pagou.
                </p>
              ) : null}

              <div className="mt-2 h-3 rounded-full border-2 border-slate-900 bg-slate-50">
                <div
                  className={`h-full rounded-full ${
                    data.biggestLeak?.stepId === passo.id
                      ? "bg-rose-600"
                      : "bg-violet-700"
                  }`}
                  style={{
                    // Largura relativa ao TOPO do funil, não ao passo anterior:
                    // é a proporção que faz o afunilamento aparecer como forma.
                    width: `${base > 0 ? Math.max((passo.people / base) * 100, passo.people > 0 ? 2 : 0) : 0}%`,
                  }}
                />
              </div>

              {passo.conversionFromPrev !== null ? (
                <p className="mt-2 text-xs font-bold text-slate-600">
                  <span
                    className={
                      passo.smallSample ? "text-slate-400" : "text-slate-900"
                    }
                  >
                    {passo.conversionFromPrev.toFixed(1)}% do passo anterior
                  </span>
                  {passo.smallSample ? (
                    <span
                      data-testid={`funil-amostra-${passo.id}`}
                      className="ml-1.5 rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[10px] font-black uppercase text-slate-500"
                    >
                      amostra pequena
                    </span>
                  ) : null}
                  {passo.lostFromPrev ? (
                    <span className="ml-2 text-slate-500">
                      -{numero.format(passo.lostFromPrev)} pessoas
                    </span>
                  ) : null}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {data.biggestLeak ? (
        <p
          data-testid="funil-maior-vazamento"
          className="flex items-start gap-2 rounded-2xl border-2 border-rose-600 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-900"
        >
          <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Maior vazamento: {data.biggestLeak.fromLabel} para{" "}
            {data.biggestLeak.toLabel}. Passam{" "}
            {data.biggestLeak.conversionPercent.toFixed(1)}%, e{" "}
            {numero.format(data.biggestLeak.lost)} pessoas ficam pelo caminho.
          </span>
        </p>
      ) : null}

      <ul className="space-y-1 border-t-2 border-slate-100 pt-3 text-xs font-semibold text-slate-500">
        <li data-testid="funil-janela-fixa">
          Janela fixa de {janelaDias} dias nas duas fontes. Não segue o seletor
          de período.
        </li>
        {data.assinantesSemRastro ? (
          <li data-testid="funil-sem-rastro">
            {numero.format(data.assinantesSemRastro)} de{" "}
            {numero.format(data.pagantesNaJanela)} assinantes pagos não têm
            checkout registrado no PostHog e ficam fora do funil (bloqueador de
            script é o suspeito). O total pago na janela é{" "}
            {numero.format(data.pagantesNaJanela)}.
          </li>
        ) : null}
        {data.retornos && data.retornos.pessoas > 0 ? (
          <li data-testid="funil-retornos">
            {numero.format(data.retornos.pessoas)} pessoas voltaram da Stripe
            sem concluir ao menos uma vez;{" "}
            {numero.format(data.retornos.converteramDepois)} delas assinaram
            depois. Não é uma etapa: está dentro de quem iniciou checkout.
          </li>
        ) : null}
        {boletos.count > 0 ? (
          <li data-testid="funil-boleto-pendente">
            {numero.format(boletos.count)} boleto(s) emitido(s) e não pago(s) (
            {brl.format(boletos.cents / 100)}) estão fora do funil: não são
            conversão nem vazamento enquanto o prazo corre.
          </li>
        ) : null}
        {data.truncated ? (
          <li
            data-testid="funil-truncado"
            className="flex items-start gap-1.5 font-bold text-amber-700"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />A leitura
            do PostHog bateu no teto de ids: a junção está incompleta e a última
            etapa está subestimada.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
