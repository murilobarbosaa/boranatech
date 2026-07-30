import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
// Acoplamento conhecido users/ -> tasks/: LAYER_DIALOG e a escala de z-index do
// ADMIN INTEIRO, so que hoje ela mora dentro do modulo de Tarefas. Importar de
// la e melhor que redeclarar o numero aqui (duas fontes divergem no primeiro
// ajuste). Promover taskLayers.ts para um modulo compartilhado e o certo, mas
// mexe em tasks/ e em outras abas, entao fica para quando houver um terceiro
// consumidor.
import { LAYER_DIALOG } from "@/components/admin/tasks/taskLayers";

import { ActivityBlock } from "./ActivityBlock";
import { AvatarBlock } from "./AvatarBlock";
import { Field } from "./UserFields";
import type { PosthogUserActivityState, UserDetail } from "./types";
import {
  NAO_INFORMADO,
  PAYMENT_METHOD_LABELS,
  RENEWAL_TYPE_LABELS,
  activityStatusLabelOf,
  fmtBool,
  fmtBrl,
  fmtDate,
  fmtDateTime,
  fmtText,
  labelFrom,
} from "./userFormat";

// Modal de detalhe do usuario. Extraido do UsersDashboard sem mudanca de
// aparencia: o cartao interno (`card-brutal my-8 ...`) e o mesmo elemento de
// antes, com as mesmas classes.
//
// O container que antes era uma <div> a mao virou Radix Dialog, o que traz Esc,
// foco preso e semantica ARIA. O DialogContent nao desenha nada: ele so
// reproduz o antigo container de rolagem (`fixed inset-0 flex items-start
// justify-center overflow-y-auto p-4`), e por isso precisa neutralizar os
// defaults visuais do primitivo (borda, sombra, fundo, arredondamento,
// largura maxima e a centralizacao por translate).
const CONTENT_CLASSES = [
  // reproducao literal do container antigo
  "fixed inset-0 flex items-start justify-center overflow-y-auto p-4",
  // neutralizacao dos defaults do DialogContent
  "top-auto left-auto w-auto max-w-none translate-x-0 translate-y-0",
  "gap-0 rounded-none border-0 bg-transparent shadow-none",
  // o sm: precisa ser neutralizado no PROPRIO breakpoint: o tailwind-merge nao
  // deixa uma classe sem modificador remover uma com `sm:`.
  "sm:max-w-none",
  LAYER_DIALOG,
].join(" ");

export function UserDetailModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [activity, setActivity] = useState<PosthogUserActivityState | null>(
    null,
  );
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  // Dropdown "Mais informacoes": fechado por padrao a cada abertura do modal.
  // activityRequested garante que o fetch do PostHog dispara UMA vez, na
  // primeira abertura do dropdown, nunca junto com o detalhe.
  const [moreOpen, setMoreOpen] = useState(false);
  const [activityRequested, setActivityRequested] = useState(false);

  const [revealedCpf, setRevealedCpf] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Influencer: formulario de concessao (nota), confirmacao de revogacao e
  // refetch do detalhe apos mutacao (detailVersion entra nas deps do effect).
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantNote, setGrantNote] = useState("");
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const [influencerBusy, setInfluencerBusy] = useState(false);
  const [influencerError, setInfluencerError] = useState<string | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);

  // FUNIL UNICO de fechamento: o botao "Fechar", o Esc e qualquer caminho
  // futuro passam por aqui. Hoje so repassa o onClose; existe porque a Fatia 5
  // poe formulario editavel neste modal, e a checagem de "tem alteracao nao
  // salva" precisa estar DENTRO do funil, nao repetida em cada caminho de
  // saida. Guarda no chamador e o desenho que ja falhou nesta base
  // (setScoreDelta, 2 call sites, um ficou sem).
  async function requestClose() {
    onClose();
  }

  // Ao montar (e a cada detailVersion): busca o detalhe. A atividade PostHog
  // NAO vem junto: fica para a primeira abertura do dropdown "Mais informacoes"
  // (efeito abaixo), evitando chamada a toa em modal que nunca expande.
  //
  // A limpeza de estado que o componente antigo fazia no ramo `if
  // (!activeUserId)` sumiu de proposito: aqui o modal DESMONTA ao fechar, entao
  // todo o estado local nasce zerado na proxima abertura, sem ninguem precisar
  // lembrar de resetar campo novo.
  useEffect(() => {
    let cancelled = false;

    setDetailLoading(true);
    setDetailError(null);
    setRevealedCpf(null);
    setRevealError(null);
    setGrantOpen(false);
    setGrantNote("");
    setRevokeConfirm(false);
    setInfluencerError(null);
    adminFetch(`/users/${userId}`)
      .then((json) => {
        if (cancelled) return;
        setDetail((json.data as UserDetail) ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setDetailError(
          err instanceof Error ? err.message : "Erro ao buscar usuário.",
        );
        setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, detailVersion]);

  // Fetch preguicoso da atividade PostHog: dispara uma unica vez por usuario,
  // quando o dropdown abre pela primeira vez.
  useEffect(() => {
    if (!moreOpen || activityRequested) return;

    let cancelled = false;
    setActivityRequested(true);
    setActivityLoading(true);
    setActivityError(null);
    adminFetch(`/users/${userId}/activity`)
      .then((json) => {
        if (cancelled) return;
        setActivity((json.data as PosthogUserActivityState) ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setActivityError(
          err instanceof Error ? err.message : "Erro ao consultar o PostHog.",
        );
        setActivity(null);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, moreOpen, activityRequested]);

  async function handleGrantInfluencer() {
    if (influencerBusy) return;
    setInfluencerBusy(true);
    setInfluencerError(null);
    try {
      await adminFetch(`/users/${userId}/influencer`, {
        method: "POST",
        body: JSON.stringify({ note: grantNote.trim() }),
      });
      setGrantOpen(false);
      setGrantNote("");
      setDetailVersion((version) => version + 1);
    } catch (err) {
      setInfluencerError(
        err instanceof Error
          ? err.message
          : "Erro ao conceder acesso de influencer.",
      );
    } finally {
      setInfluencerBusy(false);
    }
  }

  async function handleRevokeInfluencer() {
    if (influencerBusy) return;
    setInfluencerBusy(true);
    setInfluencerError(null);
    try {
      await adminFetch(`/users/${userId}/influencer/revoke`, {
        method: "POST",
      });
      setRevokeConfirm(false);
      setDetailVersion((version) => version + 1);
    } catch (err) {
      setInfluencerError(
        err instanceof Error
          ? err.message
          : "Erro ao revogar acesso de influencer.",
      );
    } finally {
      setInfluencerBusy(false);
    }
  }

  async function handleReveal() {
    setRevealing(true);
    setRevealError(null);
    try {
      const json = await adminFetch(`/users/${userId}/reveal-cpf`, {
        method: "POST",
      });
      setRevealedCpf(json.data?.cpf ?? null);
    } catch (err) {
      setRevealError(
        err instanceof Error ? err.message : "Erro ao revelar CPF.",
      );
    } finally {
      setRevealing(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // Esc chega aqui. Clique fora NAO: ver onInteractOutside abaixo.
        if (!open) void requestClose();
      }}
    >
      <DialogContent
        overlayClassName={LAYER_DIALOG}
        className={CONTENT_CLASSES}
        showCloseButton={false}
        // Clique fora NAO fecha. Divergencia deliberada do TaskModal, que
        // permite: la todo campo tem autosave, entao fechar sem querer nao
        // perde nada. Aqui a Fatia 5 poe formulario com salvamento EXPLICITO
        // (corrigir e-mail digitado errado), e o backdrop e o alvo mais facil
        // de acertar sem querer num cartao centralizado de max-w-3xl. Esc
        // continua fechando porque e gesto deliberado, nao acidente.
        //
        // Redundante com o layout atual (o DialogContent cobre inset-0, entao
        // nao ha "fora" clicavel), e de proposito: se o layout mudar, a postura
        // nao muda junto em silencio.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="card-brutal my-8 w-full max-w-3xl rounded-3xl bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle asChild>
                <h3 className="font-display text-2xl font-black text-slate-950">
                  {detail ? fmtText(detail.name) : "Carregando..."}
                </h3>
              </DialogTitle>
              <DialogDescription asChild>
                <p className="text-sm font-semibold text-slate-500">
                  {detail?.email || ""}
                </p>
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => void requestClose()}
              className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black"
            >
              Fechar
            </button>
          </div>

          {detailLoading ? (
            <div className="mt-5">
              <LoadingBlock />
            </div>
          ) : detailError ? (
            <div className="mt-5">
              <ErrorBlock message={detailError} />
            </div>
          ) : detail ? (
            <div className="mt-6 space-y-6">
              {/* Visivel de cara: Identificacao (com a foto), Assinatura e
                  Documento empilhados na vertical. Dentro de cada bloco os
                  campos compactos usam a largura em 2 colunas (>= sm). */}
              <div className="space-y-6">
                <section className="space-y-2.5">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                    Identificação
                  </h4>
                  <AvatarBlock avatar={detail.avatar} />
                  <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    <Field label="Nome" value={fmtText(detail.name)} />
                    <Field
                      label="Nome completo"
                      value={fmtText(detail.full_name)}
                    />
                    <Field label="E-mail" value={fmtText(detail.email)} />
                    <Field label="Gênero" value={fmtText(detail.gender)} />
                  </div>
                </section>

                {/* TODO(Ana): revisar toda a copy do bloco de assinatura (rotulos,
                    aviso de cancelamento e o estado de quem nunca assinou). */}
                <section className="space-y-2.5">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                    Assinatura
                  </h4>
                  {detail.subscription ? (
                    <>
                      <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                        <Field
                          label="Plano"
                          value={fmtText(detail.subscription.plan_code)}
                        />
                        <Field
                          label="Status"
                          value={fmtText(detail.subscription.status)}
                        />
                        <Field
                          label="Método de pagamento"
                          value={labelFrom(
                            PAYMENT_METHOD_LABELS,
                            detail.subscription.payment_method,
                          )}
                        />
                        <Field
                          label="Renovação"
                          value={labelFrom(
                            RENEWAL_TYPE_LABELS,
                            detail.subscription.renewal_type,
                          )}
                        />
                        <Field
                          label="Assinou em"
                          value={fmtDate(detail.subscription.created_at)}
                        />
                        <Field
                          label={
                            detail.subscription.cancel_at_period_end
                              ? "Expira em"
                              : "Renova em"
                          }
                          value={fmtDate(
                            detail.subscription.current_period_end,
                          )}
                        />
                        <Field
                          label="Valor pago (total)"
                          value={fmtBrl(detail.paid_total_cents)}
                        />
                      </div>
                      {detail.cancellation_intent ? (
                        <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-3">
                          <p className="text-[11px] font-black uppercase tracking-wide text-amber-800">
                            Cancelamento agendado
                          </p>
                          <p className="mt-1 text-sm font-semibold text-amber-900">
                            Motivo:{" "}
                            {fmtText(
                              detail.cancellation_intent.reason_text ||
                                detail.cancellation_intent.reason_code,
                            )}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-amber-900">
                            Efetivo em:{" "}
                            {fmtDate(detail.cancellation_intent.effective_at)}
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-slate-400">
                      Este usuário nunca assinou um plano.
                    </p>
                  )}

                  {/* TODO(Ana): revisar toda a copy do bloco de influencer
                      (rotulos, avisos, botoes e confirmacao de revogacao). */}
                  {detail.influencer ? (
                    <div className="space-y-2 rounded-2xl border-2 border-violet-700 bg-violet-50 p-3">
                      <span className="inline-block rounded-full border-2 border-violet-700 bg-violet-200 px-3 py-1 text-xs font-black uppercase text-violet-900">
                        Influencer
                      </span>
                      <p className="text-sm font-semibold text-violet-900">
                        Acesso Pro de parceiro, sem assinatura e sem prazo. O
                        acesso Pro desta conta vem desta concessão
                        {detail.subscription
                          ? " (além da assinatura acima)"
                          : ""}
                        .
                      </p>
                      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                        Desde {fmtDate(detail.influencer.granted_at)}
                      </p>
                      <p className="text-xs font-semibold text-violet-800">
                        Concedido por:{" "}
                        {detail.influencer.granted_by_name ||
                          detail.influencer.granted_by_email ||
                          NAO_INFORMADO}
                      </p>
                      <p className="text-xs font-semibold text-violet-800">
                        Nota: {fmtText(detail.influencer.note)}
                      </p>
                      {revokeConfirm ? (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleRevokeInfluencer}
                            disabled={influencerBusy}
                            className="rounded-full border-2 border-slate-900 bg-rose-300 px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
                          >
                            {influencerBusy
                              ? "Revogando..."
                              : "Confirmar revogação"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevokeConfirm(false)}
                            disabled={influencerBusy}
                            className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
                          >
                            Manter acesso
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRevokeConfirm(true)}
                          className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase"
                        >
                          Revogar acesso
                        </button>
                      )}
                    </div>
                  ) : grantOpen ? (
                    <div className="space-y-2 rounded-2xl border-2 border-violet-700 bg-violet-50 p-3">
                      <p className="text-[11px] font-black uppercase tracking-wide text-violet-700">
                        Conceder acesso de influencer
                      </p>
                      <textarea
                        value={grantNote}
                        onChange={(event) => setGrantNote(event.target.value)}
                        placeholder="Por que este usuário está recebendo acesso? (ex: parceria de divulgação)"
                        rows={2}
                        className="w-full rounded-xl border-2 border-slate-900 bg-white p-2 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGrantInfluencer}
                          disabled={influencerBusy}
                          className="rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
                        >
                          {influencerBusy ? "Concedendo..." : "Conceder"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGrantOpen(false);
                            setGrantNote("");
                          }}
                          disabled={influencerBusy}
                          className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setGrantOpen(true)}
                      className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase"
                    >
                      Tornar influencer
                    </button>
                  )}
                  {influencerError ? (
                    <p className="text-xs font-black text-rose-700">
                      {influencerError}
                    </p>
                  ) : null}
                </section>

                <section className="space-y-2.5">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                    Documento
                  </h4>
                  <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3">
                    <p className="text-[11px] font-black uppercase tracking-wide text-violet-700">
                      CPF
                    </p>
                    <p className="mt-1 break-words font-display text-base font-black text-slate-950">
                      {revealedCpf ??
                        (detail.has_cpf
                          ? (detail.cpf_masked ?? NAO_INFORMADO)
                          : NAO_INFORMADO)}
                    </p>
                    {detail.has_cpf && !revealedCpf ? (
                      <button
                        type="button"
                        onClick={handleReveal}
                        disabled={revealing}
                        className="mt-3 rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
                      >
                        {revealing ? "Revelando..." : "Revelar CPF"}
                      </button>
                    ) : null}
                    {revealError ? (
                      <p className="mt-2 text-xs font-black text-rose-700">
                        {revealError}
                      </p>
                    ) : null}
                    {/* TODO(Ana): copy do aviso de que revelar o CPF fica registrado em auditoria. */}
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Revelar o CPF fica registrado em auditoria (quem revelou,
                      de quem e quando).
                    </p>
                  </div>
                </section>
              </div>

              {/* TODO(Ana): rotulo do dropdown "Mais informacoes". */}
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen}
                className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-900 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-950 shadow-[3px_3px_0_#0f172a] transition hover:bg-yellow-50"
              >
                Mais informações
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                />
              </button>

              {moreOpen ? (
                <div className="space-y-6">
                  <div className="grid items-start gap-6 sm:grid-cols-2">
                    <section className="space-y-2.5">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                        Perfil e carreira
                      </h4>
                      <Field
                        label="Área de interesse"
                        value={fmtText(detail.area_interesse)}
                      />
                      <Field
                        label="Nível atual"
                        value={fmtText(detail.nivel_atual)}
                      />
                      <Field
                        label="Objetivo"
                        value={fmtText(detail.objetivo)}
                      />
                      <Field label="Bio" value={fmtText(detail.bio)} />
                    </section>

                    <section className="space-y-2.5">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                        Onboarding
                      </h4>
                      <Field
                        label="Onboarding"
                        value={
                          detail.onboarding_completed
                            ? "Concluído"
                            : "Incompleto"
                        }
                      />
                      <Field
                        label="Passo do onboarding"
                        value={
                          detail.onboarding_step === null ||
                          detail.onboarding_step === undefined
                            ? NAO_INFORMADO
                            : String(detail.onboarding_step)
                        }
                      />
                    </section>

                    <section className="space-y-2.5">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                        Marketing
                      </h4>
                      <Field
                        label="Opt-in de marketing"
                        value={fmtBool(detail.marketing_opt_in)}
                      />
                      <Field
                        label="Data do opt-in"
                        value={fmtDateTime(detail.marketing_opt_in_at)}
                      />
                      <Field
                        label="E-mail de boas-vindas"
                        value={fmtBool(detail.welcome_email_sent)}
                      />
                    </section>

                    <section className="space-y-2.5">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                        Sistema
                      </h4>
                      <Field
                        label="Atividade"
                        value={activityStatusLabelOf(detail.activity_status)}
                      />
                      <Field
                        label="Cadastro"
                        value={fmtDate(detail.created_at)}
                      />
                      <Field
                        label="Atualizado em"
                        value={fmtDateTime(detail.updated_at)}
                      />
                    </section>
                  </div>

                  <section className="space-y-3">
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                      Atividade
                    </h4>
                    <ActivityBlock
                      loading={activityLoading}
                      error={activityError}
                      state={activity}
                    />
                  </section>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-5">
              <ErrorBlock message="Usuário não encontrado." />
            </div>
          )}
        </div>{" "}
      </DialogContent>
    </Dialog>
  );
}
