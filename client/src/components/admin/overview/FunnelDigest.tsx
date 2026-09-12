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
 *    todo dia. O servidor manda `motivoSemDelta`; a tela diz isso em vez de
 *    fabricar uma comparação.
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
  anterior: null;
  motivoSemDelta?: string;
  limiteTemporalDosInicios?: string;
  consultaIniciadaEm?: string;
  consultaConcluidaEm?: string;
  semanticaUso?: string;
  cadastrosComMenosDe7Dias?: number;
};

function pct(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}

/**
 * O que a taxa daquela etapa SIGNIFICA, em duas palavras.
 *
 * Existe porque a terceira etapa não é conversão: o denominador dela já pagou.
 * Chamá-la de conversão mandaria otimizar aquisição quando o problema é o
 * cliente não estar usando o que comprou.
 *
 * RESOLVER COM FALLBACK NEUTRO, não acesso direto: a chave vem do SERVIDOR, e um
 * passo novo que o bundle ainda não conhece não pode derrubar a Visão inteira
 * (regra do projeto, e foi assim que `STATUS_META[item.status].label` quebrou o
 * admin em produção). Aqui a ausência é uma legenda a menos, nada mais.
 */
const LEGENDA_DO_PASSO: Record<string, string> = {
  pagamento: "recebimento local observado",
  uso_ia: "status na consulta",
};

export function legendaDoPasso(chave: string): string | null {
  return LEGENDA_DO_PASSO[chave] ?? null;
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
      {/* COPY DETERMINISTICA, escrita aqui. Nada de texto gerado por heurística
          ou por modelo: o painel explica como se lê, e a regra do destaque é
          fixa no servidor (a transição de menor taxa). */}
      <p
        data-testid="funil-como-ler"
        className="mt-1 text-sm font-semibold text-slate-600"
      >
        A taxa de cada etapa é sobre a etapa acima: quantas pessoas da coorte
        têm pagamento elegível registrado depois do cadastro e quantas dessas
        iniciaram uma execução de IA depois do pagamento, encontrada com status
        success durante a consulta.
      </p>
      {windowLabel ? (
        <p className="mt-1 text-xs font-bold text-slate-500">
          Coorte de quem se cadastrou em {windowLabel}
          {tz ? ` (${tz})` : ""}
        </p>
      ) : null}
      <p className="mt-1 text-xs font-semibold text-slate-500">
        Inícios considerados até{" "}
        {data?.limiteTemporalDosInicios
          ? new Date(data.limiteTemporalDosInicios).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })
          : "o corte informado"}
        . Cadastros recentes tiveram menos tempo para pagar e usar IA. Ausência
        de log significa uso de IA não observado, não inatividade em todo o
        produto.
      </p>
      {data?.consultaIniciadaEm && data?.consultaConcluidaEm ? (
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Status consultados entre{" "}
          {new Date(data.consultaIniciadaEm).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })}{" "}
          e{" "}
          {new Date(data.consultaConcluidaEm).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })}
          . O momento em que uma execução virou success não é registrado;
          resultados iniciados no período podem ser atualizados depois.
        </p>
      ) : null}
      {typeof data?.cadastrosComMenosDe7Dias === "number" ? (
        <p className="mt-1 text-xs font-bold text-slate-500">
          {data.cadastrosComMenosDe7Dias.toLocaleString("pt-BR")} cadastros da
          coorte tinham menos de 7 dias de observação no corte.
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
                      {legendaDoPasso(p.chave) ? (
                        <span
                          data-testid="funil-passo-legenda"
                          className="ml-2 text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                          {legendaDoPasso(p.chave)}
                        </span>
                      ) : null}
                    </p>
                    <p className="font-display text-xl font-black text-slate-950">
                      {p.taxaSobreAnterior === null ? (
                        <span className="text-slate-400">-</span>
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
                    /* "MENOR TAXA", não "maior perda": a regra do servidor é a
                       transição de menor taxa absoluta, e na terceira etapa
                       "perda" seria errado (ninguém se perde depois de pagar,
                       deixa de usar o que comprou). O rótulo nomeia a regra. */
                    <p className="mt-2 flex items-center gap-1 text-xs font-black uppercase text-amber-800">
                      <AlertTriangle className="h-3 w-3" />
                      menor taxa do funil
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
              Sem comparação com o período anterior: as coortes não têm janelas
              de observação equivalentes e cobertura comparável.
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}
