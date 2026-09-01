import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

import { cancellationReasonLabelOf } from "@/components/admin/users/userFormat";

/**
 * Painel "Atenção necessária", v2 (rodada 7).
 *
 * O QUE QUEBROU NA v1, visto na revisão visual e invisível para os guards
 * estruturais: com ~26 itens, o painel virava uma coluna sem fim de cards
 * idênticos (uns 20 "Saída agendada" empilhados), e como ele não tinha teto de
 * altura, esticava a linha inteira do grid, o vizinho ao lado virava um pill
 * gigante. Nenhum teste de posição ou de payload pega isso: eles verificam que o
 * bloco está lá e não quebra, não que ele é legível.
 *
 * v2, e as três decisões:
 *
 * 1. AGRUPAMENTO POR TIPO, feito NO CLIENT a partir de `itens[]`. No client de
 *    propósito: esta rodada entrega preview contra a API de PRODUÇÃO, então
 *    nada pode depender de shape novo no servidor. Vinte "Saída agendada" viram
 *    um card "Saídas agendadas · 20 · R$ 566,80", que é a informação que se usa
 *    para decidir; a lista individual continua a um clique.
 * 2. TETO DE ALTURA no painel e na lista interna. Um painel que cresce sem
 *    limite não é um painel, é a página.
 * 3. Grupos de severidade baixa nascem RECOLHIDOS. O que é crítico abre sozinho.
 *
 * v3, e o que mudou:
 *
 * 4. DESTINO INTERNO como ação primária. Todo item mandava para a Stripe,
 *    inclusive os que se resolvem aqui dentro (uma saída agendada se olha na aba
 *    de usuários). Agora o servidor manda `destinoInterno`, e ele vira o botão
 *    principal; a Stripe desce para secundária.
 * 5. O TETO DE ALTURA SAIU, e isso NÃO reabre o defeito da v1. O que a v1
 *    deformava era o VIZINHO de grid, e esse vizinho não existe mais: o bloco
 *    "Aquisição de usuários" e o botão que sobrou dele saíram na rodada 7 (D17),
 *    e hoje o painel está sozinho num `grid gap-6` de coluna única. Sem vizinho
 *    para esticar, o teto só fazia uma coisa: esconder item de alerta atrás de
 *    uma barra de rolagem, que é o oposto do propósito do painel.
 * 6. MOTIVO da saída agendada, quando declarado, traduzido pelo resolver que já
 *    existe (`cancellationReasonLabelOf`), nunca por um mapa novo aqui.
 */

export type ItemAtencao = {
  tipo: string;
  chave: string;
  severidade: "critico" | "atencao";
  titulo: string;
  detalhe: string;
  /** Valor NOMINAL do contrato (R$ 222,00 no anual). */
  valorCents?: number;
  /**
   * O mesmo valor em equivalente MENSAL, pela mesma função que produz o MRR.
   * Opcional: o backend antigo da janela de deploy não manda, e o plano sem
   * ciclo normalizável também não.
   */
  mrrMensalCents?: number;
  /** Contagem e janela do item agregado (cobranças falhadas). */
  agregado?: { quantidade: number; janelaDias: number };
  url: string;
  /**
   * Caminho DENTRO do admin. Opcional: na janela de deploy o backend antigo não
   * manda, e a ausência tem de virar "sem botão interno", nunca erro.
   */
  destinoInterno?: string;
  /** Código do motivo declarado no cancelamento. Traduzido aqui, com fallback. */
  motivoCodigo?: string;
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
  payouts: "repasses bancários",
  despesas: "despesas",
  influencers: "influencers",
};

/** Resolver com fallback neutro: tipo novo do servidor não pode derrubar a aba. */
function rotuloDeFonte(id: string): string {
  return ROTULO_DE_FONTE[id] ?? id;
}

const TITULO_DE_GRUPO: Record<string, string> = {
  assinatura_past_due: "Pagamentos em atraso",
  saida_agendada: "Saídas agendadas",
  cobrancas_falhadas: "Cobranças falhadas",
  pagamento_orfao: "Pagamentos sem assinatura",
  custo_ia_spike: "Custo de IA acima do normal",
  payout_falho: "Repasses que falharam",
  mes_sem_despesa: "Mês sem despesa registrada",
  influencer_com_assinatura: "Influencers que viraram assinantes",
};

function tituloDeGrupo(tipo: string, exemplo: ItemAtencao): string {
  return TITULO_DE_GRUPO[tipo] ?? exemplo.titulo ?? tipo;
}

/**
 * DEEP LINK PARA A STRIPE, validado no client.
 *
 * O servidor já manda `url` pronta, montada a partir do
 * `provider_subscription_id`. Aqui ela é VALIDADA antes de virar botão: só
 * `https://dashboard.stripe.com/...` passa. Um href vazio, relativo ou de outro
 * host vira ausência de botão, e não um "Abrir" que não abre nada, que é pior,
 * porque promete uma ação.
 *
 * A `chave` do item NÃO serve como fonte do link: ela carrega o id da linha
 * local (`past_due:<uuid>`), não o id da Stripe. Quem tem o id certo é a `url`.
 */
export function linkDaStripe(url: unknown): string | null {
  if (typeof url !== "string" || url.length === 0) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (u.hostname !== "dashboard.stripe.com") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * DESTINO INTERNO validado, no mesmo espírito do `linkDaStripe`.
 *
 * Só caminho relativo começando em `/admin`. Um valor absoluto vindo do
 * servidor (`https://...`) viraria link de saída disfarçado de navegação
 * interna, e um caminho fora de `/admin` levaria o admin para fora da tela sem
 * dizer. Qualquer outra coisa vira ausência de botão, nunca botão quebrado.
 */
export function destinoInternoValido(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length === 0) return null;
  if (!valor.startsWith("/admin")) return null;
  if (valor.startsWith("//")) return null;
  return valor;
}

/**
 * Ações de UM item: interna primeiro, Stripe depois.
 *
 * A ordem é a mensagem. Quando as duas existem, a primária é a que resolve sem
 * sair do admin; a Stripe fica visível mas secundária, com peso menor.
 */
function AcoesDoItem({ item }: { item: ItemAtencao }) {
  const interno = destinoInternoValido(item.destinoInterno);
  const externo = linkDaStripe(item.url);
  if (!interno && !externo) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      {interno ? (
        <a
          href={interno}
          data-testid="atencao-destino-interno"
          className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-slate-900 hover:bg-yellow-50 dark:hover:bg-secondary"
        >
          Resolver no admin <ArrowRight className="h-3 w-3" />
        </a>
      ) : null}
      {externo ? (
        <a
          href={externo}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-xs font-black uppercase text-violet-700 hover:underline ${
            interno ? "opacity-80" : ""
          }`}
        >
          Abrir na Stripe <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  );
}

/** Motivo declarado, quando houver. Rótulo pelo resolver que já existe. */
function MotivoDaSaida({ item }: { item: ItemAtencao }) {
  if (!item.motivoCodigo) return null;
  return (
    <p
      data-testid="atencao-item-motivo"
      className="mt-1 text-xs font-black uppercase tracking-wide text-slate-600"
    >
      Motivo declarado: {cancellationReasonLabelOf(item.motivoCodigo)}
    </p>
  );
}

type Grupo = {
  tipo: string;
  titulo: string;
  itens: ItemAtencao[];
  /** Soma dos valores NOMINAIS de contrato. */
  totalCents: number;
  /**
   * Soma dos equivalentes MENSAIS, ou `null` quando NENHUM item do grupo trouxe
   * o campo. Null e zero são estados diferentes aqui: null é "o servidor não
   * mandou" (janela de deploy) e zero seria "não há receita", que é falso.
   */
  totalMrrMensalCents: number | null;
  /** Quantos itens do grupo NÃO trouxeram o equivalente mensal. */
  semMensal: number;
  /** Contagem e janela, quando o grupo é um agregado (cobranças falhadas). */
  agregado?: { quantidade: number; janelaDias: number };
  severidade: "critico" | "atencao";
};

/** Agrupa por tipo preservando a ordem em que os tipos aparecem. */
export function agruparItens(itens: ItemAtencao[]): Grupo[] {
  const porTipo = new Map<string, Grupo>();
  for (const item of itens) {
    if (!item || typeof item.tipo !== "string") continue;
    const g = porTipo.get(item.tipo) ?? {
      tipo: item.tipo,
      titulo: tituloDeGrupo(item.tipo, item),
      itens: [],
      totalCents: 0,
      totalMrrMensalCents: null,
      semMensal: 0,
      severidade: "atencao" as const,
    };
    g.itens.push(item);
    g.totalCents += typeof item.valorCents === "number" ? item.valorCents : 0;
    // SOMA PARCIAL DECLARADA: um item sem `mrrMensalCents` não vira zero na
    // soma (isso baixaria o total em silêncio), ele é CONTADO à parte para o
    // rodapé do grupo poder dizer que o número é um piso.
    if (typeof item.mrrMensalCents === "number") {
      g.totalMrrMensalCents =
        (g.totalMrrMensalCents ?? 0) + item.mrrMensalCents;
    } else if (typeof item.valorCents === "number") {
      g.semMensal += 1;
    }
    if (item.agregado && typeof item.agregado.quantidade === "number") {
      g.agregado = item.agregado;
    }
    // A severidade do grupo é a PIOR do grupo: um crítico entre vinte avisos não
    // pode ficar escondido atrás da média.
    if (item.severidade === "critico") g.severidade = "critico";
    porTipo.set(item.tipo, g);
  }
  return Array.from(porTipo.values()).sort(
    (a, b) =>
      (a.severidade === "critico" ? 0 : 1) -
        (b.severidade === "critico" ? 0 : 1) || b.totalCents - a.totalCents,
  );
}

function GrupoView({ grupo }: { grupo: Grupo }) {
  // Grupo de severidade baixa nasce recolhido; crítico nasce aberto.
  const [aberto, setAberto] = useState(grupo.severidade === "critico");
  const critico = grupo.severidade === "critico";
  const unico = grupo.itens.length === 1;

  return (
    <div
      data-testid="atencao-grupo"
      data-tipo={grupo.tipo}
      data-severidade={grupo.severidade}
      data-aberto={aberto ? "sim" : "nao"}
      className={`rounded-2xl border-2 p-4 ${
        critico ? "border-rose-500 bg-rose-50" : "border-amber-400 bg-amber-50"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-lg font-black text-slate-950">
          {grupo.titulo}
          {!unico ? (
            <span className="ml-2 rounded-full border-2 border-slate-900 bg-white px-2 py-0.5 text-xs font-black">
              {grupo.itens.length}
            </span>
          ) : null}
        </p>
        {/* MENSAL COMO PRINCIPAL (D21). O card "Receita em risco" soma
            equivalentes mensais; este grupo somava valores NOMINAIS de ciclos
            diferentes, e as duas telas exibiam números diferentes sobre a mesma
            coisa. O nominal não sumiu, desceu para linha secundária: ele é o que
            o cliente paga, e continua sendo a resposta certa para outra
            pergunta. */}
        {grupo.totalMrrMensalCents !== null ? (
          <div className="text-right">
            <p
              data-testid="atencao-grupo-mensal"
              className="text-sm font-black text-slate-700"
            >
              {formatCents(grupo.totalMrrMensalCents)}/mês
              {grupo.semMensal > 0 ? " (parcial)" : ""}
            </p>
            {grupo.totalCents > 0 ? (
              <p
                data-testid="atencao-grupo-nominal"
                className="text-xs font-bold text-slate-500"
              >
                {formatCents(grupo.totalCents)} em contratos
              </p>
            ) : null}
          </div>
        ) : grupo.totalCents > 0 ? (
          // Sem NENHUM mensal (backend antigo, ou grupo que não tem plano): o
          // nominal volta a ser o principal. É o que existe, e é verdadeiro.
          <p
            data-testid="atencao-grupo-nominal"
            className="text-sm font-black text-slate-700"
          >
            {formatCents(grupo.totalCents)}
          </p>
        ) : null}
      </div>

      {/* CONTAGEM E JANELA do agregado. O agrupamento troca o título do servidor
          ("24 cobrancas falharam em 7 dias") pelo rótulo do grupo ("Cobranças
          falhadas"), e nessa troca os dois números sumiram da tela. */}
      {grupo.agregado ? (
        <p
          data-testid="atencao-grupo-agregado"
          className="mt-1 text-xs font-black uppercase tracking-wide text-slate-600"
        >
          {grupo.agregado.quantidade.toLocaleString("pt-BR")} cobranças ·
          últimos {grupo.agregado.janelaDias} dias
        </p>
      ) : null}

      {unico ? (
        // GRUPO DE UM: o resumo JA e o item. Renderizar a lista embaixo
        // repetiria o mesmo texto duas vezes na tela, foi o que o teste pegou.
        <>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {grupo.itens[0].detalhe}
          </p>
          <MotivoDaSaida item={grupo.itens[0]} />
          <AcoesDoItem item={grupo.itens[0]} />
        </>
      ) : (
        <button
          type="button"
          data-testid="atencao-grupo-toggle"
          onClick={() => setAberto((v) => !v)}
          className="mt-2 text-xs font-black uppercase text-violet-700 hover:underline"
        >
          {aberto ? "ocultar" : `ver ${grupo.itens.length} itens`}
        </button>
      )}

      {aberto && !unico ? (
        <ul data-testid="atencao-grupo-lista" className="mt-3 space-y-2 pr-1">
          {grupo.itens.map((item) => {
            return (
              <li
                key={item.chave}
                data-testid="atencao-item"
                className="rounded-xl border-2 border-slate-200 bg-white/70 p-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800">
                    {item.titulo}
                  </span>
                  {typeof item.valorCents === "number" ? (
                    <span className="text-xs font-black text-slate-600">
                      {formatCents(item.valorCents)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.detalhe}
                </p>
                <MotivoDaSaida item={item} />
                <AcoesDoItem item={item} />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
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
  // Campos ausentes não derrubam a aba: um throw no render da Visão troca a
  // PÁGINA inteira pela tela do ErrorBoundary, não só este bloco.
  const itens = Array.isArray(data?.itens) ? data.itens : [];
  const fontes = Array.isArray(data?.fontesIndisponiveis)
    ? data.fontesIndisponiveis
    : [];
  const grupos = agruparItens(itens);

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
        // TETO DE ALTURA. Sem ele o painel estica a linha do grid e deforma o
        // vizinho, foi exatamente o que aconteceu na v1.
        // O PAINEL CRESCE. Ver a decisão 5 na docstring: o teto de altura da v2
        // existia para não deformar um vizinho de grid que não existe mais, e
        // esconder item de alerta atrás de scroll é o oposto do propósito daqui.
        <div data-testid="atencao-corpo" className="mt-5 space-y-4">
          {fontes.length > 0 ? (
            <p
              data-testid="atencao-fontes-indisponiveis"
              className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-3 text-xs font-bold text-amber-900"
            >
              Sem resposta de: {fontes.map(rotuloDeFonte).join(", ")}. O que
              aparece abaixo pode estar incompleto.
            </p>
          ) : null}

          {grupos.length === 0 ? (
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
            grupos.map((g) => <GrupoView key={g.tipo} grupo={g} />)
          )}
        </div>
      )}
    </article>
  );
}
