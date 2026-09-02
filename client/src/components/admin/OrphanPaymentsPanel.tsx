import { useCallback, useEffect, useId, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";

import { adminFetch } from "@/lib/adminApi";

/**
 * Pagamentos que a Stripe registrou e que nao viraram assinatura no banco.
 *
 * POR QUE UMA TELA, se o painel de Atencao ja mostra orfaos. Porque ele mostra
 * MENOS: `server/lib/atencaoNecessaria.ts:634-635` descarta quem nao tem
 * `expected_provider_subscription_id` e quem nao passa em `orfaoAindaPedeAcao`.
 * Os descartados existiam na tabela, ninguem os via, e nao havia como carimba-los
 * como tratados. Esta tela lista TODOS os abertos, e e o unico lugar do produto
 * onde `resolved_at` e `resolution_note` podem ser preenchidos sem SQL na mao.
 */

/** Uma linha aberta, como GET /admin/billing/orphan-payments devolve. */
export interface OrphanPaymentRow {
  id: string;
  stripe_session_id: string | null;
  /**
   * Chave do achado que vem de `finance_transactions` em vez de sessao de
   * checkout (migration 20260831140000). O CHECK da tabela garante EXATAMENTE
   * uma das duas preenchidas.
   *
   * OPCIONAL: o campo passou a ser selecionado pela rota em 2026-09-02, e na
   * janela de deploy a resposta antiga nao o traz.
   */
  stripe_charge_id?: string | null;
  customer_email: string | null;
  plan_id: string | null;
  amount_total_cents: number | null;
  currency: string | null;
  detected_at: string;
  last_seen_at: string | null;
  expected_provider_subscription_id: string | null;
}

/** Minimo da nota, espelhando `ORFAO_NOTA_MIN_CHARS` do servidor. */
export const NOTA_MIN_CHARS = 20;

/**
 * Regra do gate do botao, exportada para o teste afirmar a REGRA.
 *
 * O servidor revalida isto (`note_required`), e e ele quem decide. Aqui a
 * checagem existe para a pessoa nao descobrir o minimo por tentativa e erro.
 */
export function notaSuficiente(texto: string): boolean {
  return texto.trim().length >= NOTA_MIN_CHARS;
}

export function formatarCentavos(cents: number | null): string {
  if (cents === null) return "valor não registrado";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Ha quanto tempo espera, em texto curto.
 *
 * Arredonda para baixo em dias e cai para horas abaixo de um dia. Nao usa
 * biblioteca de datas: a pergunta e "isto e de ontem ou do mes passado?", e para
 * isso a precisao de hora basta.
 */
export function esperaDesde(detectedAt: string, agora: Date): string {
  const inicio = new Date(detectedAt).getTime();
  if (Number.isNaN(inicio)) return "data desconhecida";
  const ms = agora.getTime() - inicio;
  if (ms < 0) return "agora";
  const horas = Math.floor(ms / 3_600_000);
  if (horas < 1) return "menos de 1 hora";
  if (horas < 24) return horas === 1 ? "1 hora" : `${horas} horas`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

/**
 * Link para a Stripe, VALIDADO antes de virar botao.
 *
 * Mesmo criterio de `linkDaStripe` em
 * `client/src/components/admin/overview/AttentionPanel.tsx:130`: so
 * `https://dashboard.stripe.com/` passa. Sessao sem id vira ausencia de botao, e
 * nao um "Abrir" que nao abre, que promete uma acao e nao cumpre.
 */
export function linkDaSessao(sessionId: string | null): string | null {
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  return `https://dashboard.stripe.com/payments?query=${encodeURIComponent(sessionId)}`;
}

/**
 * A chave do achado, seja ela qual for, e o link quando ela abre algo.
 *
 * O ACHADO POR COBRANCA NAO MOSTRAVA NADA. Desde a migration 20260831140000 a
 * fila aceita linha vinda de `finance_transactions`, cuja chave e
 * `stripe_charge_id` e cujo `stripe_session_id` e NULO. Para ela o painel
 * imprimia valor, e-mail e espera, e nenhuma identificacao: nao dava para achar
 * a cobranca no painel da Stripe nem para citar o id numa conversa.
 *
 * O MESMO CRITERIO DE VALIDACAO do link de sessao, por prefixo conhecido e nao
 * por "tem alguma coisa": id que nao case vira ausencia de botao, nunca um
 * "Abrir" que nao abre. `ch_` e cobranca de cartao, `py_` e boleto, e os dois
 * abrem na mesma busca do dashboard.
 *
 * ESTE PAINEL E STRIPE-ONLY POR CONSTRUCAO, e vale dizer por que: uma cobranca
 * do Asaas nao tem nenhuma das duas chaves, e o CHECK
 * `billing_orphan_payments_uma_chave` exige exatamente uma, entao ela nao entra
 * na fila. O detector CONTA essa cobranca (`naoEnfileiraveis` em
 * server/lib/chargeSemDono.ts) e a faixa de saude a mostra; so a fila com botao
 * de resolver nao a alcanca. Fechar isso exige `provider` e
 * `provider_transaction_id` na tabela, que e migration propria.
 */
export function chaveDoAchado(linha: {
  stripe_session_id: string | null;
  stripe_charge_id?: string | null;
}): { id: string; href: string | null } | null {
  const sessao = linha.stripe_session_id;
  if (sessao) return { id: sessao, href: linkDaSessao(sessao) };

  const cobranca = linha.stripe_charge_id ?? null;
  if (!cobranca) return null;
  const href = /^(ch|py)_[A-Za-z0-9_]+$/.test(cobranca)
    ? `https://dashboard.stripe.com/payments?query=${encodeURIComponent(cobranca)}`
    : null;
  return { id: cobranca, href };
}

interface ModalProps {
  linha: OrphanPaymentRow | null;
  enviando: boolean;
  erro: string | null;
  onFechar: () => void;
  onConfirmar: (nota: string) => void;
}

/**
 * Modal de resolucao, com nota obrigatoria.
 *
 * Mesmo desenho de gate do `DeleteAccountConfirmModal`: o botao fica bloqueado
 * ate a entrada valer, com `aria-disabled` e um texto de apoio que DIZ o que
 * falta (botao cinza nao informa nada a quem usa leitor de tela), e o campo zera
 * a cada abertura, porque o componente nao desmonta ao fechar.
 */
function ResolverModal({
  linha,
  enviando,
  erro,
  onFechar,
  onConfirmar,
}: ModalProps) {
  const [nota, setNota] = useState("");
  const notaId = useId();
  const apoioId = useId();

  useEffect(() => {
    if (linha) setNota("");
  }, [linha]);

  if (!linha) return null;

  const restam = Math.max(0, NOTA_MIN_CHARS - nota.trim().length);
  const liberado = notaSuficiente(nota);
  const bloqueado = !liberado || enviando;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!enviando) onFechar();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border-2 border-[var(--bnt-ink)] bg-white p-6 shadow-[4px_4px_0_var(--bnt-shadow)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orfao-modal-title"
      >
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-amber-700 bg-amber-100">
          <AlertTriangle className="h-5 w-5 text-amber-700" strokeWidth={2.5} />
        </div>
        <h2
          id="orfao-modal-title"
          className="font-display text-2xl font-black text-slate-950"
        >
          Marcar como resolvido
        </h2>
        {/* TODO(Ana): revisar a copy. */}
        <p className="mt-2 text-sm font-semibold text-slate-600">
          {formatarCentavos(linha.amount_total_cents)} de{" "}
          {linha.customer_email ?? "e-mail não registrado"}. Esta ação é
          permanente, e a nota abaixo é o único registro do motivo: quem ler
          esta linha daqui a seis meses vai ter só ela.
        </p>

        <div className="mt-5">
          {/* TODO(Ana): revisar a copy. */}
          <label
            htmlFor={notaId}
            className="block text-sm font-bold text-slate-800"
          >
            O que foi feito com este pagamento
          </label>
          <textarea
            id={notaId}
            value={nota}
            onChange={(event) => setNota(event.target.value)}
            disabled={enviando}
            rows={4}
            aria-describedby={apoioId}
            data-testid="orfao-nota"
            className="mt-2 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-amber-500 disabled:opacity-60"
          />
          <p id={apoioId} className="mt-2 text-xs font-semibold text-slate-500">
            {/* TODO(Ana): revisar a copy. */}
            {liberado
              ? "Pronto. O botão abaixo está liberado."
              : `Faltam ${restam} caracteres para liberar o botão (mínimo de ${NOTA_MIN_CHARS}).`}
          </p>
        </div>

        {erro ? (
          <p
            data-testid="orfao-modal-erro"
            className="mt-4 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-900"
          >
            {erro}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            className="flex-1 rounded-full border-2 border-[var(--bnt-ink)] bg-white px-5 py-3 font-display font-black text-slate-700 shadow-[3px_3px_0_var(--bnt-shadow)] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="orfao-confirmar"
            onClick={() => onConfirmar(nota)}
            disabled={bloqueado}
            aria-disabled={bloqueado}
            aria-describedby={apoioId}
            className="flex-1 rounded-full border-2 border-amber-900 bg-amber-100 px-5 py-3 font-display font-black text-amber-900 shadow-[3px_3px_0_#78350f] disabled:opacity-60"
          >
            {enviando ? "Registrando..." : "Confirmar resolução"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrphanPaymentsPanel() {
  const [linhas, setLinhas] = useState<OrphanPaymentRow[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<OrphanPaymentRow | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const json = await adminFetch("/billing/orphan-payments");
      setLinhas((json.data ?? []) as OrphanPaymentRow[]);
    } catch (err) {
      // ESTADO DE ERRO PROPRIO, e `linhas` volta a null. Lista vazia depois de
      // uma falha diria "nao ha pagamento orfao" sobre uma leitura que nao
      // aconteceu, que e a pior mentira que esta tela poderia contar.
      setLinhas(null);
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function confirmar(nota: string) {
    if (!alvo) return;
    setEnviando(true);
    setErroModal(null);
    try {
      await adminFetch(`/billing/orphan-payments/${alvo.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ confirmed: true, note: nota }),
      });
      setAlvo(null);
      await carregar();
    } catch (err) {
      setErroModal(
        err instanceof Error ? err.message : "Não foi possível registrar.",
      );
    } finally {
      setEnviando(false);
    }
  }

  const agora = new Date();

  return (
    <div className="mt-10">
      {/* TODO(Ana): revisar a copy. */}
      <h2 className="font-display text-3xl font-black text-slate-950">
        Pagamentos sem assinatura
      </h2>
      <p className="mb-5 mt-1 max-w-3xl text-sm font-semibold text-slate-600">
        A Stripe registrou o pagamento e não existe linha correspondente em
        assinaturas. Resolva depois de tratar o caso (reembolso, liberação
        manual, ou falso positivo) e escreva o que foi feito.
      </p>

      {carregando ? (
        <p className="text-sm font-semibold text-slate-500">Carregando...</p>
      ) : erro ? (
        <div
          data-testid="orfaos-erro"
          className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-900"
        >
          {/* TODO(Ana): revisar a copy. */}
          Não foi possível carregar a lista: {erro}
          <button
            type="button"
            onClick={() => void carregar()}
            className="ml-3 underline decoration-2 underline-offset-4"
          >
            Tentar de novo
          </button>
        </div>
      ) : (linhas ?? []).length === 0 ? (
        /* TODO(Ana): revisar a copy. */
        <p
          data-testid="orfaos-vazio"
          className="rounded-2xl border-2 border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600"
        >
          Nenhum pagamento órfão em aberto.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {(linhas ?? []).map((linha) => {
            const chave = chaveDoAchado(linha);
            const href = chave?.href ?? null;
            return (
              <li
                key={linha.id}
                data-testid="orfao-linha"
                className="flex flex-col gap-3 rounded-2xl border-2 border-slate-900 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg font-black text-slate-950">
                    {formatarCentavos(linha.amount_total_cents)}
                    {linha.plan_id ? (
                      <span className="ml-2 text-sm font-bold text-slate-500">
                        {linha.plan_id}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-600">
                    {linha.customer_email ?? "e-mail não registrado"}
                  </p>
                  {chave ? (
                    <p className="truncate font-mono text-xs text-slate-500">
                      {chave.id}
                    </p>
                  ) : null}
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    esperando há {esperaDesde(linha.detected_at, agora)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-bold text-slate-800"
                    >
                      Abrir <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    data-testid="orfao-resolver"
                    onClick={() => {
                      setErroModal(null);
                      setAlvo(linha);
                    }}
                    className="rounded-full border-2 border-amber-900 bg-amber-100 px-4 py-2 text-sm font-black text-amber-900"
                  >
                    Resolver
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ResolverModal
        linha={alvo}
        enviando={enviando}
        erro={erroModal}
        onFechar={() => setAlvo(null)}
        onConfirmar={(nota) => void confirmar(nota)}
      />
    </div>
  );
}
