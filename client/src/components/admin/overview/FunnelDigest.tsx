import { AlertTriangle } from "lucide-react";

/**
 * Funil digerido: TAXAS entre etapas adjacentes, com os absolutos ao lado.
 *
 * O bloco antigo mostrava contagens e deixava a divisão para quem lê. Taxa é a
 * pergunta ("onde vaza?"); contagem é o contexto.
 *
 * DUAS COISAS QUE ESTE COMPONENTE NÃO FAZ, e as duas de propósito:
 *
 * 1. NÃO exibe delta de taxa contra o período anterior. As coortes têm
 *    maturidades diferentes (quem entrou ontem teve um dia para ativar, quem
 *    entrou há 45 dias teve 45), então o delta seria negativo por construção
 *    todo dia. O servidor manda `motivoSemDelta` e as contagens anteriores como
 *    informação; a tela diz isso em vez de calcular.
 * 2. NÃO gera texto de "insight". O destaque é uma regra fixa escrita no
 *    servidor (a transição de menor taxa absoluta), e aqui só se pinta o passo
 *    que ele apontou.
 */

export type PassoDoFunil = {
  chave: string;
  rotulo: string;
  valor: number;
  taxaSobreAnterior: number | null;
};

export type FunilDigerido = {
  passos: PassoDoFunil[];
  destaque: string | null;
  anterior: { cadastro: number; ativacao: number; pro: number } | null;
  motivoSemDelta?: string;
};

function pct(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}

export function FunnelDigest({
  data,
  loading,
  error,
  windowLabel,
  tz,
}: {
  data?: FunilDigerido | null;
  loading?: boolean;
  error?: string | null;
  windowLabel?: string | null;
  tz?: string | null;
}) {
  // RESILIÊNCIA A PAYLOAD DEGRADADO: `data.passos.map` sobre `{}` seria um
  // TypeError no render, e no render da Visão isso troca a ABA INTEIRA pela tela
  // de falha, não só este bloco. Mesma classe do defeito que o AttentionPanel
  // teve na rodada 5.
  const passos = Array.isArray(data?.passos) ? data.passos : [];

  return (
    <article
      data-testid="funil-digerido"
      className="card-brutal rounded-3xl bg-white p-5 sm:p-6"
    >
      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
        funil principal
      </p>
      <h3 className="font-display text-lg font-black text-slate-950 sm:text-xl">
        Onde as pessoas param?
      </h3>
      {windowLabel ? (
        <p className="mt-1 text-xs font-bold text-slate-500">
          Coorte de quem se cadastrou em {windowLabel}
          {tz ? ` (${tz})` : ""}
        </p>
      ) : null}

      {loading ? (
        <p
          data-testid="funil-loading"
          className="mt-5 text-sm font-bold text-slate-500"
        >
          Carregando…
        </p>
      ) : error ? (
        <p
          data-testid="funil-erro"
          className="mt-5 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-black text-rose-800"
        >
          {error}
        </p>
      ) : passos.length === 0 ? (
        <p
          data-testid="funil-vazio"
          className="mt-5 text-sm font-bold text-slate-500"
        >
          Sem dados no período.
        </p>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            {passos.map((p) => {
              const destacado = data?.destaque === p.chave;
              return (
                <div
                  key={p.chave}
                  data-testid="funil-passo"
                  data-chave={p.chave}
                  data-destaque={destacado ? "sim" : "nao"}
                  className={`rounded-2xl border-2 p-3 ${
                    destacado
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-black text-slate-950">
                      {p.rotulo}
                    </p>
                    <p className="font-display text-xl font-black text-slate-950">
                      {p.taxaSobreAnterior === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        pct(p.taxaSobreAnterior)
                      )}
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {p.valor.toLocaleString("pt-BR")} pessoas
                    {p.taxaSobreAnterior === null
                      ? " (topo do funil)"
                      : " que chegaram até aqui"}
                  </p>
                  {destacado ? (
                    <p className="mt-2 flex items-center gap-1 text-xs font-black uppercase text-amber-800">
                      <AlertTriangle className="h-3 w-3" />
                      maior perda
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {data?.motivoSemDelta ? (
            <p
              data-testid="funil-sem-delta"
              className="mt-4 text-xs font-semibold text-slate-500"
            >
              Sem comparação com o período anterior: as coortes têm tempos de
              vida diferentes, e a diferença seria negativa por construção.
              {data.anterior
                ? ` No período anterior: ${data.anterior.cadastro.toLocaleString("pt-BR")} cadastros, ${data.anterior.ativacao.toLocaleString("pt-BR")} ativados, ${data.anterior.pro.toLocaleString("pt-BR")} Pro.`
                : ""}
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}
