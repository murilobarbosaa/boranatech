import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

/**
 * Painel "Atenção necessária". Substitui "Eventos recentes".
 *
 * O bloco antigo listava as 10 últimas linhas de `content_audit_logs`, ou seja,
 * histórico de edição de conteúdo: o espaço mais visível da Visão era o único
 * sobre o qual não havia nada a fazer.
 *
 * TRÊS ESTADOS, e nenhum deles é o outro:
 *
 *   itens          o que pede ação, crítico primeiro.
 *   vazio          "Tudo em ordem" — e ele só aparece quando TODAS as fontes
 *                  responderam. Painel vazio por sucesso e painel vazio por
 *                  sonda quebrada são estados opostos, e chamar o segundo de
 *                  "tudo em ordem" é mentira.
 *   erro/loading   declarados, nunca disfarçados de vazio.
 *
 * ARQUIVO NOVO de propósito: `client/src/pages/Admin.tsx` está na zona de
 * colisão da frente paralela, então a integração precisa ser uma edição só.
 */

export type ItemAtencao = {
  tipo: string;
  chave: string;
  severidade: "critico" | "atencao";
  titulo: string;
  detalhe: string;
  valorCents?: number;
  url: string;
};

export type PainelDeAtencao = {
  itens: ItemAtencao[];
  fontesIndisponiveis: string[];
  janelaDias: number;
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const ROTULO_DE_FONTE: Record<string, string> = {
  assinaturas: "assinaturas",
  cobrancas_falhadas: "cobranças falhadas",
  pagamentos_orfaos: "pagamentos órfãos",
  custo_ia: "custo de IA",
};

/**
 * Resolver com fallback neutro, como manda a convenção do projeto para todo
 * lookup indexado por valor que vem do servidor: uma fonte nova que o bundle
 * ainda não conhece não pode derrubar a página.
 */
function rotuloDeFonte(id: string): string {
  return ROTULO_DE_FONTE[id] ?? id;
}

export function AttentionPanel({
  data,
  loading,
  error,
}: {
  data: PainelDeAtencao | null;
  loading?: boolean;
  error?: string | null;
}) {
  // CAMPOS AUSENTES NAO DERRUBAM A ABA. Este componente roda dentro da Visao, e
  // um `data.itens.length` sobre um payload degradado ({} do backend antigo na
  // janela de deploy, ou envelope de erro) seria um TypeError no render — o que
  // troca a PAGINA INTEIRA pela tela de falha do ErrorBoundary, nao so este
  // bloco. Foi exatamente isso que `Admin.visao.test.tsx` acusou na primeira
  // versao. Array ausente vira array vazio; a distincao que importa (vazio por
  // sucesso vs vazio por fonte fora do ar) continua vindo de `fontes`.
  const itens = Array.isArray(data?.itens) ? data.itens : [];
  const fontes = Array.isArray(data?.fontesIndisponiveis)
    ? data.fontesIndisponiveis
    : [];

  return (
    <article className="card-brutal rounded-3xl bg-white p-6">
      <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
        <AlertTriangle className="h-6 w-6" />
        Atenção necessária
      </h2>

      {loading ? (
        <p
          data-testid="atencao-loading"
          className="mt-5 text-sm font-bold text-slate-500"
        >
          Carregando…
        </p>
      ) : error ? (
        <p
          data-testid="atencao-erro"
          className="mt-5 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-black text-rose-800"
        >
          {error}
        </p>
      ) : !data ? null : (
        <div className="mt-5 space-y-4">
          {fontes.length > 0 ? (
            <p
              data-testid="atencao-fontes-indisponiveis"
              className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-3 text-xs font-bold text-amber-900"
            >
              Sem resposta de: {fontes.map(rotuloDeFonte).join(", ")}. O que
              aparece abaixo pode estar incompleto.
            </p>
          ) : null}

          {itens.length === 0 ? (
            fontes.length === 0 ? (
              <p
                data-testid="atencao-vazio"
                className="flex items-center gap-2 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-sm font-black text-emerald-800"
              >
                <CheckCircle2 className="h-5 w-5" />
                Tudo em ordem.
              </p>
            ) : null
          ) : (
            itens.map((item) => (
              <div
                key={item.chave}
                data-testid="atencao-item"
                data-severidade={item.severidade}
                className={`rounded-2xl border-2 p-4 ${
                  item.severidade === "critico"
                    ? "border-rose-500 bg-rose-50"
                    : "border-amber-400 bg-amber-50"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-lg font-black text-slate-950">
                    {item.titulo}
                  </p>
                  {typeof item.valorCents === "number" ? (
                    <p className="text-sm font-black text-slate-700">
                      {formatCents(item.valorCents)}
                    </p>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {item.detalhe}
                </p>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase text-violet-700 hover:underline"
                  >
                    Abrir <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </article>
  );
}
