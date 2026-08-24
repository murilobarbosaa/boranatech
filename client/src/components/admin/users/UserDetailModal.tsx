import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock } from "@/components/admin/StateBlocks";
import { showActionToast, showErrorToast } from "@/lib/notify";
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
import {
  LAYER_DIALOG,
  LAYER_IN_DIALOG,
} from "@/components/admin/tasks/taskLayers";

import { ActivityBlock } from "./ActivityBlock";
import { BlocoBoundary } from "@/components/admin/BlocoBoundary";
import { UserAuditHistory } from "./UserAuditHistory";
import { BoletoBlock } from "./BoletoBlock";
import { SubscriptionHistory } from "./SubscriptionHistory";
import { AvatarBlock } from "./AvatarBlock";
import { PublicProfileSection, temPerfilPublico } from "./PublicProfileSection";
import { Field } from "./UserFields";
import { UserDetailSkeleton } from "./UserDetailSkeleton";
import { UserTransactions } from "./UserTransactions";
import { EditableField, GenderField } from "./UserEditFields";
import { EmailChangeDialog } from "./EmailChangeDialog";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
import { RevokeAccessDialog } from "./RevokeAccessDialog";
import { UserSiteLife, type VidaNoSite } from "./UserSiteLife";
import { ExternalRefundDialog } from "./ExternalRefundDialog";
import { RefundDialog } from "./RefundDialog";
import { useProfileEdit } from "./useProfileEdit";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  PosthogUserActivityState,
  TransactionItem,
  AuditPayload,
  TransactionsPayload,
  UserDetail,
} from "./types";
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
  proBadgeOf,
  semValor,
  planLabelOf,
  subscriptionStatusLabelOf,
  cancellationReasonLabelOf,
} from "./userFormat";

// Modal de detalhe do usuario, no molde do TaskModal: cabecalho fixo, corpo
// rolavel, rodape de acoes. Tela cheia no mobile, caixa no desktop.
//
// A borda e a sombra vem de utilitarios Tailwind, nao de .card-brutal: a classe
// custom vive em @layer components e perde para os utilitarios do proprio
// DialogContent (border, shadow-lg), que vem depois na cascata. Mesma solucao
// do TaskModal.
const CONTENT_CLASSES = [
  // w-full, NAO w-screen. `w-screen` e 100vw, e 100vw INCLUI a barra de
  // rolagem: numa janela estreita com barra classica o dialogo fica mais largo
  // que a area util e cria rolagem horizontal. `w-full` num elemento `fixed`
  // resolve contra o bloco de conteudo inicial, que ja exclui a barra. Em
  // celular os dois dao no mesmo (barra sobreposta, largura zero), entao isto
  // nao muda o mobile: fecha a unica fonte de overflow horizontal que o modulo
  // tinha.
  "flex h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden",
  // shadow-none no breakpoint base de proposito: o `shadow-lg` do primitivo
  // tem modificador vazio, e o tailwind-merge nao deixa `sm:shadow-[...]`
  // remove-lo. Sem isto, a versao de tela cheia carrega uma sombra que nao foi
  // pedida.
  "rounded-none border-0 bg-white p-0 shadow-none",
  "sm:h-[88vh] sm:w-[min(56rem,94vw)] sm:max-w-none sm:rounded-3xl",
  "sm:border-2 sm:border-slate-950 sm:shadow-[6px_6px_0_#0f172a]",
  LAYER_DIALOG,
].join(" ");

const SECTION_TITLE =
  "text-sm font-black uppercase tracking-[0.2em] text-slate-600";

const CARD_SECTION =
  "space-y-3 rounded-2xl border-2 border-slate-200 bg-white p-4";

const ACTION_BUTTON =
  "w-full rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black uppercase transition hover:bg-yellow-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60 sm:w-auto sm:py-1.5";

/**
 * Acao DESTRUTIVA. Difere em cor, nao so em posicao, e ocupa a linha inteira no
 * mobile.
 *
 * O rodape tinha cinco botoes com peso visual identico: "Cancelar Pro" parecia
 * igual a "Fechar". Numa grade de 2 colunas no celular, dois alvos de toque
 * lado a lado com o mesmo aspecto convidam ao erro, e este e o unico do rodape
 * cujo erro cobra caro. `col-span-2` tira ele do pareamento e o poe sozinho na
 * propria linha.
 */
const DESTRUCTIVE_BUTTON =
  "col-span-2 w-full rounded-full border-2 border-rose-600 bg-rose-50 px-4 py-2 text-xs font-black uppercase text-rose-700 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60 sm:col-span-1 sm:w-auto sm:py-1.5";

/**
 * Destrutiva IMEDIATA. Duas ações vermelhas sobre a mesma assinatura convivem no
 * rodapé, e cor igual entre elas não diz qual é qual: quem carrega a diferença é
 * o RÓTULO ("no fim do período" x "agora"). O preenchimento sólido só reforça a
 * ordem de gravidade depois que a leitura já distinguiu as duas.
 */
const DESTRUCTIVE_NOW_BUTTON =
  "col-span-2 w-full rounded-full border-2 border-rose-700 bg-rose-500 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60 sm:col-span-1 sm:w-auto sm:py-1.5";

/**
 * Acoes de influencer DENTRO do card de status, nao no rodape. Nao reaproveitam
 * DESTRUCTIVE_BUTTON nem ACTION_BUTTON na parte de grade porque aquelas carregam
 * `col-span-2 ... sm:col-span-1`, que so significa alguma coisa na grade do
 * rodape; aqui seria classe morta pendurada.
 */
const INFLUENCER_REVOKE_BUTTON =
  "w-full rounded-full border-2 border-rose-600 bg-rose-50 px-4 py-2 text-xs font-black uppercase text-rose-700 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60 sm:w-auto sm:py-1.5";

const INFLUENCER_REVOKE_CONFIRM_BUTTON =
  "w-full rounded-full border-2 border-slate-900 bg-rose-300 px-4 py-2 text-xs font-black uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60 sm:w-auto sm:py-1.5";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h4 className={SECTION_TITLE}>{title}</h4>
      {children}
    </section>
  );
}

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
  // O latch abaixo garante que o fetch do PostHog dispara UMA vez, na primeira
  // abertura do dropdown, nunca junto com o detalhe.
  //
  // useRef, NAO useState. Era estado, e estava nas dependencias do proprio
  // efeito que o setava: setar re-rodava o efeito, a limpeza da primeira
  // execucao marcava cancelled = true, e .then/.catch/.finally eram descartados
  // antes de aplicar qualquer coisa. A secao Atividade ficava em "Carregando
  // dados..." para sempre, no sucesso e no erro. Ref nao dispara render, entao
  // o efeito nao se reentrega no meio da propria requisicao.
  const [moreOpen, setMoreOpen] = useState(false);
  const activityRequested = useRef(false);

  // Historico administrativo: MESMO padrao preguicoso da atividade, e o latch e
  // ref pelo mesmo motivo (estado nas deps do proprio efeito que o seta faz a
  // limpeza da primeira execucao descartar a resposta, e a secao fica
  // carregando para sempre). Mora atras do mesmo dropdown em vez de ganhar um
  // colapsavel proprio: uma affordance nova para a mesma classe de informacao
  // secundaria seria mecanismo a mais sem pergunta a mais respondida.
  // Vida no site: MESMO padrao preguicoso da atividade e do historico, e o latch
  // e ref pelo mesmo motivo ja registrado acima. Quatro fontes que so interessam
  // a quem abre o dropdown nao podem entrar na carga do detalhe.
  const [vida, setVida] = useState<VidaNoSite | null>(null);
  const [vidaLoading, setVidaLoading] = useState(false);
  const [vidaError, setVidaError] = useState<string | null>(null);
  const vidaRequested = useRef(false);

  const [audit, setAudit] = useState<AuditPayload | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const auditRequested = useRef(false);

  const [transactions, setTransactions] = useState<TransactionsPayload | null>(
    null,
  );
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(
    null,
  );

  const [revealedCpf, setRevealedCpf] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  // Influencer: formulario de concessao (nota), confirmacao de revogacao e
  // refetch do detalhe apos mutacao (detailVersion entra nas deps do effect).
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantNote, setGrantNote] = useState("");
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const [influencerBusy, setInfluencerBusy] = useState(false);
  const [detailVersion, setDetailVersion] = useState(0);

  const edit = useProfileEdit(detail);
  // Confirmacao de descarte. Fica aqui, e nao no hook, porque quem decide
  // FECHAR e o modal.
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [revokeProOpen, setRevokeProOpen] = useState(false);
  const [refundAlvo, setRefundAlvo] = useState<TransactionItem | null>(null);
  const [externalRefundAlvo, setExternalRefundAlvo] =
    useState<TransactionItem | null>(null);

  // FUNIL UNICO de fechamento: o botao "Fechar", o Esc e qualquer caminho
  // futuro passam por aqui. Hoje so repassa o onClose; existe porque a Fatia 5
  // poe formulario editavel neste modal, e a checagem de "tem alteracao nao
  // salva" precisa estar DENTRO do funil, nao repetida em cada caminho de
  // saida. Guarda no chamador e o desenho que ja falhou nesta base
  // (setScoreDelta, 2 call sites, um ficou sem).
  async function requestClose() {
    // A GUARDA MORA AQUI, dentro do funil, nunca nos call sites. Esta e a fatia
    // para a qual o funil foi construido: com alteracao nao salva, qualquer
    // caminho de saida (Esc, botao Fechar, e o que a Fatia 6 ou 7 acrescentar)
    // passa pela mesma pergunta. Guarda repetida em cada chamador some no
    // primeiro que alguem esquecer, que e exatamente o que aconteceu com
    // setScoreDelta nesta base.
    if (edit.dirty) {
      setConfirmDiscard(true);
      return;
    }
    // Fechar o modal fecha tambem a troca de e-mail em andamento: sair com o
    // dialogo aberto deixaria estado pendente para a proxima abertura. O
    // rascunho da troca nao sobrevive de propósito (o dialogo zera ao abrir).
    setEmailOpen(false);
    setCancelOpen(false);
    setRevokeProOpen(false);
    setRefundAlvo(null);
    setExternalRefundAlvo(null);
    onClose();
  }

  async function handleSave() {
    if (edit.saving) return;
    if (!edit.validate()) return;

    edit.setSaving(true);
    try {
      await adminFetch(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...edit.changedFields,
          // Trava otimista: o servidor recusa com 409 se o cadastro mudou
          // depois que este modal abriu.
          expected_updated_at: detail?.updated_at ?? undefined,
        }),
      });
      edit.cancel();
      setDetailVersion((version) => version + 1);
      showActionToast({ message: "Cadastro atualizado." });
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "Erro ao salvar o cadastro.",
      );
    } finally {
      edit.setSaving(false);
    }
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
    setGrantOpen(false);
    setGrantNote("");
    setRevokeConfirm(false);
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

  // Extrato de compras: vem JUNTO do detalhe, nao preguicoso como o PostHog.
  // Os dois motivos sao diferentes. O PostHog e uma chamada a um terceiro, cara
  // e opcional, escondida atras de um dropdown que muita gente nunca abre. O
  // extrato e uma consulta ao proprio banco, filtrada por user_id, que hoje
  // devolve no maximo UMA linha, e responde a mesma pergunta que a secao
  // Assinatura logo acima: o estado financeiro desta pessoa. Escondido atras de
  // clique, o "Valor pago (total)" continuaria sem lastro visivel.
  useEffect(() => {
    let cancelled = false;

    setTransactionsLoading(true);
    setTransactionsError(null);
    adminFetch(`/users/${userId}/transactions`)
      .then((json) => {
        if (cancelled) return;
        setTransactions((json.data as TransactionsPayload) ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setTransactionsError(
          err instanceof Error ? err.message : "Erro ao buscar as compras.",
        );
        setTransactions(null);
      })
      .finally(() => {
        if (!cancelled) setTransactionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, detailVersion]);

  // Fetch preguicoso da atividade PostHog: dispara uma unica vez por usuario,
  // quando o dropdown abre pela primeira vez.
  useEffect(() => {
    if (!moreOpen || activityRequested.current) return;

    let cancelled = false;
    activityRequested.current = true;
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
  }, [userId, moreOpen]);

  useEffect(() => {
    if (!moreOpen || auditRequested.current) return;

    let cancelled = false;
    auditRequested.current = true;
    setAuditLoading(true);
    setAuditError(null);
    adminFetch(`/users/${userId}/audit`)
      .then((json) => {
        if (cancelled) return;
        setAudit((json.data as AuditPayload) ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setAuditError(
          err instanceof Error ? err.message : "Erro ao buscar o histórico.",
        );
        setAudit(null);
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, moreOpen]);

  useEffect(() => {
    if (!moreOpen || vidaRequested.current) return;

    let cancelled = false;
    vidaRequested.current = true;
    setVidaLoading(true);
    setVidaError(null);
    adminFetch(`/users/${userId}/site-life`)
      .then((json) => {
        if (cancelled) return;
        setVida((json.data as VidaNoSite) ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setVidaError(
          err instanceof Error
            ? err.message
            : "Erro ao buscar a atividade no site.",
        );
        setVida(null);
      })
      .finally(() => {
        if (!cancelled) setVidaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, moreOpen]);

  // Resultado de ACAO vai para toast; erro de CARREGAMENTO continua inline (ver
  // ErrorBlock abaixo). O criterio: erro de carregamento pertence a regiao que
  // ficou vazia e precisa ser lido ao lado dela, inclusive depois que o toast
  // sumiria; resultado de acao e um evento pontual, e prende-lo a um <p> dentro
  // de um corpo rolavel deixa a confirmacao fora da tela quando a pessoa ja
  // rolou para outro lugar.
  async function handleGrantInfluencer() {
    if (influencerBusy) return;
    setInfluencerBusy(true);
    try {
      await adminFetch(`/users/${userId}/influencer`, {
        method: "POST",
        body: JSON.stringify({ note: grantNote.trim() }),
      });
      setGrantOpen(false);
      setGrantNote("");
      setDetailVersion((version) => version + 1);
      showActionToast({
        message: "Influencer concedido. O Pro já está ativo.",
      });
    } catch (err) {
      showErrorToast(
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
    try {
      await adminFetch(`/users/${userId}/influencer/revoke`, {
        method: "POST",
      });
      setRevokeConfirm(false);
      setDetailVersion((version) => version + 1);
      showActionToast({
        message:
          "Influencer revogado. Se houver assinatura ativa, o Pro continua por ela.",
      });
    } catch (err) {
      showErrorToast(
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
    try {
      const json = await adminFetch(`/users/${userId}/reveal-cpf`, {
        method: "POST",
      });
      setRevealedCpf(json.data?.cpf ?? null);
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "Erro ao revelar CPF.",
      );
    } finally {
      setRevealing(false);
    }
  }

  const pro = proBadgeOf(detail?.pro_source);

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
        // de acertar sem querer. Esc continua fechando porque e gesto
        // deliberado, nao acidente.
        onInteractOutside={(event) => event.preventDefault()}
      >
        {/* CABECALHO FIXO: identidade e acesso ficam visiveis durante todo o
            scroll, porque sao a resposta a "de quem e esta tela" e o admin
            perde isso de vista assim que rola ate as secoes de baixo. */}
        <header className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-slate-200 bg-[#f6f0df] px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-700 text-sm font-black text-white sm:flex"
            >
              {(detail?.name || detail?.email || "?")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </span>
            <div className="min-w-0">
              <DialogTitle asChild>
                <h3 className="font-display truncate text-xl font-black text-slate-950 sm:text-2xl">
                  {detail ? fmtText(detail.name) : "Carregando..."}
                </h3>
              </DialogTitle>
              <DialogDescription asChild>
                <p className="truncate text-sm font-semibold text-slate-500">
                  {detail?.email || ""}
                </p>
              </DialogDescription>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {detail ? (
              <span
                className={`rounded-full border-2 px-3 py-1 text-xs font-black uppercase ${pro.className}`}
              >
                {pro.label}
              </span>
            ) : null}
            {/* Saida no cabecalho, SO no mobile, onde o modal e tela cheia e o
                "Fechar" do rodape gastava uma linha inteira das cinco acoes.
                Chama requestClose, o mesmo funil de Esc e do botao do rodape:
                nao existe segunda porta de saida, so um segundo gatilho para a
                mesma. */}
            <button
              type="button"
              data-testid="header-fechar"
              aria-label="Fechar"
              onClick={() => void requestClose()}
              className={`rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black uppercase transition hover:bg-yellow-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:hidden`}
            >
              Fechar
            </button>
          </div>
        </header>

        {/* CORPO ROLAVEL */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {detailLoading ? (
            <UserDetailSkeleton />
          ) : detailError ? (
            <ErrorBlock message={detailError} />
          ) : detail ? (
            <div className="space-y-6">
              {/* ASSINATURA vem PRIMEIRO, invertendo a ordem antiga. O modal e
                  aberto para responder "qual o estado de acesso e pagamento
                  desta pessoa", e a identidade ja esta no cabecalho fixo:
                  repeti-la no topo empurrava a resposta para baixo da dobra.
                  E aqui que as Fatias 5 a 7 vao agir. */}
              <Section title="Assinatura">
                <div className={CARD_SECTION}>
                  {detail.subscription ? (
                    <>
                      <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                        <Field
                          label="Plano"
                          value={planLabelOf(detail.subscription.plan_code)}
                          empty={semValor(detail.subscription.plan_code)}
                        />
                        <Field
                          label="Status"
                          value={subscriptionStatusLabelOf(
                            detail.subscription.status,
                          )}
                          empty={semValor(detail.subscription.status)}
                        />
                        <Field
                          label="Método de pagamento"
                          value={labelFrom(
                            PAYMENT_METHOD_LABELS,
                            detail.subscription.payment_method,
                          )}
                          empty={semValor(detail.subscription.payment_method)}
                        />
                        <Field
                          label="Renovação"
                          value={labelFrom(
                            RENEWAL_TYPE_LABELS,
                            detail.subscription.renewal_type,
                          )}
                          empty={semValor(detail.subscription.renewal_type)}
                        />
                        <Field
                          label="Assinou em"
                          value={fmtDate(detail.subscription.created_at)}
                          empty={semValor(detail.subscription.created_at)}
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
                          empty={semValor(
                            detail.subscription.current_period_end,
                          )}
                        />
                        <Field
                          label="Valor pago (total)"
                          value={fmtBrl(detail.paid_total_cents)}
                          empty={semValor(detail.paid_total_cents)}
                        />
                      </div>
                      {/* So aparece com assinatura `pending`; o servidor manda
                          null nos demais casos, entao nao ha condicao repetida
                          aqui. */}
                      <BoletoBlock boleto={detail.boleto} />

                      {detail.cancellation_intent ? (
                        <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-3">
                          <p className="text-[11px] font-black uppercase tracking-wide text-amber-800">
                            Cancelamento agendado
                          </p>
                          {/* Rótulo em linha PRÓPRIA, não colado no valor. A
                              aprovação de copy que tirou os dois-pontos vale
                              para rótulo curto seguido de valor curto; aqui o
                              valor é texto livre do admin, e "Motivo QUero
                              cancelar e pedir o reembolso" lia como uma frase
                              só. Só este campo muda. */}
                          <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-amber-700">
                            Motivo
                          </p>
                          <p className="text-sm font-semibold text-amber-900">
                            {detail.cancellation_intent.reason_text?.trim()
                              ? detail.cancellation_intent.reason_text
                              : cancellationReasonLabelOf(
                                  detail.cancellation_intent.reason_code,
                                )}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-amber-900">
                            Acaba em{" "}
                            {fmtDate(detail.cancellation_intent.effective_at)}
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-slate-400">
                      Nunca assinou um plano.
                    </p>
                  )}

                  {/* O ESTADO do influencer e o BOTAO que o revoga ficam
                      JUNTOS. A revogacao morava no rodape, a umas 400 linhas
                      daqui, sob o rotulo generico "Revogar acesso" e encostada
                      nas destrutivas da assinatura ("Encerrar Pro agora"), que
                      sao outra acao com outra consequencia: o rotulo nao dizia
                      o que caia e a vizinhanca sugeria a acao errada. Acao
                      destrutiva se le junto do estado que ela destroi, e o
                      rotulo nomeia o que se perde.

                      A CONCESSAO continua no rodape de proposito: ela nao e a
                      perigosa, e o rodape nao e defeito para ela. */}
                  {detail.influencer ? (
                    <div
                      data-testid="influencer-status"
                      className="space-y-2 rounded-2xl border-2 border-violet-700 bg-violet-50 p-3"
                    >
                      <span className="inline-block rounded-full border-2 border-violet-700 bg-violet-200 px-3 py-1 text-xs font-black uppercase text-violet-900">
                        Influencer
                      </span>
                      <p className="text-sm font-semibold text-violet-900">
                        Acesso Pro de parceria: sem assinatura e sem prazo.
                        Cancelar a assinatura não remove este acesso.
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
                      {!edit.editing ? (
                        <div className="flex flex-wrap justify-center gap-2 border-t-2 border-violet-200 pt-3">
                          {revokeConfirm ? (
                            <>
                              <button
                                type="button"
                                onClick={handleRevokeInfluencer}
                                disabled={influencerBusy}
                                className={INFLUENCER_REVOKE_CONFIRM_BUTTON}
                              >
                                {/* TODO(Ana) */}
                                {influencerBusy
                                  ? "Revogando..."
                                  : "Confirmar revogação de influencer"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRevokeConfirm(false)}
                                disabled={influencerBusy}
                                className={ACTION_BUTTON}
                              >
                                Manter acesso
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRevokeConfirm(true)}
                              className={INFLUENCER_REVOKE_BUTTON}
                            >
                              {/* TODO(Ana) */}
                              Revogar acesso de influencer
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Section>

              {/* Compras logo depois de Assinatura: as duas respondem a
                  mesma pergunta (estado financeiro desta pessoa), e e aqui que
                  o "Valor pago (total)" ganha lastro. */}
              <Section title="Compras">
                <div
                  data-testid="user-transactions"
                  className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white"
                >
                  {/* Os dois blocos com BUSCA PRÓPRIA do modal (`/transactions`
                      e `/audit`) sao os que ganham boundary aqui: um payload
                      estranho neles derrubaria o modal inteiro, junto com o
                      cadastro e a assinatura, que vieram de outra chamada e
                      estao intactos. Os demais blocos leem o mesmo `detail` ja
                      guardado e nao ganham nada com casca propria. */}
                  <BlocoBoundary nome="Extrato de compras">
                    <UserTransactions
                      loading={transactionsLoading}
                      error={transactionsError}
                      payload={transactions}
                      onRefund={setRefundAlvo}
                      onExternalRefund={setExternalRefundAlvo}
                    />
                  </BlocoBoundary>
                </div>
              </Section>

              <Section title="Identificação">
                <div className={CARD_SECTION}>
                  <AvatarBlock avatar={detail.avatar} />
                  <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    <EditableField
                      label="Nome"
                      name="name"
                      editing={edit.editing}
                      form={edit.form}
                      onChange={edit.change}
                      error={edit.errors.name}
                      disabled={edit.saving}
                      readValue={fmtText(detail.name)}
                      readEmpty={semValor(detail.name)}
                    />
                    <EditableField
                      label="Nome completo"
                      name="full_name"
                      editing={edit.editing}
                      form={edit.form}
                      onChange={edit.change}
                      error={edit.errors.full_name}
                      disabled={edit.saving}
                      readValue={fmtText(detail.full_name)}
                      readEmpty={semValor(detail.full_name)}
                    />
                    {/* E-mail NAO e editavel aqui: e a Fatia 5b, separada de
                        propósito porque trocar o e-mail mexe em auth.users, na
                        Stripe e nas listas de envio. */}
                    <Field
                      label="E-mail"
                      value={fmtText(detail.email)}
                      empty={semValor(detail.email)}
                    />
                    <GenderField
                      editing={edit.editing}
                      form={edit.form}
                      onChange={edit.change}
                      error={edit.errors.gender}
                      disabled={edit.saving}
                      readValue={fmtText(detail.gender)}
                      readEmpty={semValor(detail.gender)}
                    />
                  </div>
                </div>
              </Section>

              <Section title="Documento">
                <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-wide text-violet-700">
                    CPF
                  </p>
                  <p className="mt-1 break-words font-display text-base font-black text-slate-950">
                    {revealedCpf ??
                      (detail.has_cpf
                        ? (detail.cpf_masked ?? NAO_INFORMADO)
                        : NAO_INFORMADO)}
                  </p>
                  {/* "Revelar CPF" fica AQUI, e nao no rodape: age sobre a
                      visibilidade deste campo, nao sobre o usuario, e o efeito
                      aparece na linha de cima. */}
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
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Revelar fica registrado: quem revelou, de quem e quando.
                  </p>
                </div>
              </Section>

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
                  <div className="grid items-start gap-6 lg:grid-cols-2">
                    <Section title="Perfil e carreira">
                      <div className={CARD_SECTION}>
                        <EditableField
                          label="Área de interesse"
                          name="area_interesse"
                          editing={edit.editing}
                          form={edit.form}
                          onChange={edit.change}
                          error={edit.errors.area_interesse}
                          disabled={edit.saving}
                          readValue={fmtText(detail.area_interesse)}
                          readEmpty={semValor(detail.area_interesse)}
                        />
                        <EditableField
                          label="Nível atual"
                          name="nivel_atual"
                          editing={edit.editing}
                          form={edit.form}
                          onChange={edit.change}
                          error={edit.errors.nivel_atual}
                          disabled={edit.saving}
                          readValue={fmtText(detail.nivel_atual)}
                          readEmpty={semValor(detail.nivel_atual)}
                        />
                        <EditableField
                          label="Objetivo"
                          name="objetivo"
                          editing={edit.editing}
                          form={edit.form}
                          onChange={edit.change}
                          error={edit.errors.objetivo}
                          disabled={edit.saving}
                          readValue={fmtText(detail.objetivo)}
                          readEmpty={semValor(detail.objetivo)}
                        />
                        <EditableField
                          label="Bio"
                          name="bio"
                          editing={edit.editing}
                          form={edit.form}
                          onChange={edit.change}
                          error={edit.errors.bio}
                          disabled={edit.saving}
                          readValue={fmtText(detail.bio)}
                          readEmpty={semValor(detail.bio)}
                          multiline
                        />
                      </div>
                    </Section>

                    {/* Em LEITURA a secao e condicional (os campos estao
                        100% nulos em producao e seis linhas vazias para todo
                        mundo seriam ruido). Em EDICAO ela aparece SEMPRE:
                        escondida, nao haveria onde clicar para preencher pela
                        primeira vez. */}
                    {edit.editing || temPerfilPublico(detail) ? (
                      <Section title="Perfil público">
                        <PublicProfileSection detail={detail} edit={edit} />
                      </Section>
                    ) : null}

                    <Section title="Onboarding">
                      <div className={CARD_SECTION}>
                        <Field
                          label="Onboarding"
                          value={
                            detail.onboarding_completed
                              ? "Concluído"
                              : "Incompleto"
                          }
                          empty={semValor(detail.onboarding_completed)}
                        />
                        <Field
                          label="Passo do onboarding"
                          value={
                            semValor(detail.onboarding_step)
                              ? NAO_INFORMADO
                              : String(detail.onboarding_step)
                          }
                          empty={semValor(detail.onboarding_step)}
                        />
                      </div>
                    </Section>

                    <Section title="Marketing">
                      <div className={CARD_SECTION}>
                        <Field
                          label="Opt-in de marketing"
                          value={fmtBool(detail.marketing_opt_in)}
                          empty={semValor(detail.marketing_opt_in)}
                        />
                        <Field
                          label="Data do opt-in"
                          value={fmtDateTime(detail.marketing_opt_in_at)}
                          empty={semValor(detail.marketing_opt_in_at)}
                        />
                        <Field
                          label="E-mail de boas-vindas"
                          value={fmtBool(detail.welcome_email_sent)}
                          empty={semValor(detail.welcome_email_sent)}
                        />
                      </div>
                    </Section>

                    <Section title="Sistema">
                      <div className={CARD_SECTION}>
                        <Field
                          label="Atividade"
                          value={activityStatusLabelOf(detail.activity_status)}
                          empty={semValor(detail.activity_status)}
                        />
                        <Field
                          label="Cadastro"
                          value={fmtDate(detail.created_at)}
                          empty={semValor(detail.created_at)}
                        />
                        <Field
                          label="Atualizado em"
                          value={fmtDateTime(detail.updated_at)}
                          empty={semValor(detail.updated_at)}
                        />
                      </div>
                    </Section>
                  </div>

                  {/* So aparece quando existe historico: o servidor manda
                      lista vazia para quem tem uma assinatura so, e secao
                      vazia seria promessa de conteudo que nao existe. */}
                  {(detail.subscription_history ?? []).length > 0 ? (
                    <Section title="Assinaturas anteriores">
                      <SubscriptionHistory
                        items={detail.subscription_history}
                      />
                    </Section>
                  ) : null}

                  <Section title="Atividade">
                    <ActivityBlock
                      loading={activityLoading}
                      error={activityError}
                      state={activity}
                    />
                  </Section>

                  {/* TODO(Ana) */}
                  <Section title="Vida no site">
                    <BlocoBoundary nome="Vida no site">
                      <UserSiteLife
                        vida={vida}
                        loading={vidaLoading}
                        error={vidaError}
                      />
                    </BlocoBoundary>
                  </Section>

                  {/* Somente LEITURA. Um historico com botao seria um lugar de
                      onde se AGE sobre o passado, e o passado e o unico dado
                      desta tela que nao pode ser editado. */}
                  <Section title="Histórico administrativo">
                    <div
                      data-testid="user-audit"
                      className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white"
                    >
                      <BlocoBoundary nome="Histórico de ações">
                        <UserAuditHistory
                          loading={auditLoading}
                          error={auditError}
                          payload={audit}
                        />
                      </BlocoBoundary>
                    </div>
                  </Section>
                </div>
              ) : null}
            </div>
          ) : (
            <ErrorBlock message="Usuário não encontrado." />
          )}
        </div>

        {/* RODAPE DE ACOES sobre o USUARIO. Editar, Cancelar Pro e Reembolsar
            entram aqui nas Fatias 5, 6 e 7. Nenhum botao desabilitado de
            reserva: espaco vazio nao promete o que ainda nao existe. */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t-2 border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          {/* GRADE de 2 colunas no mobile: as acoes ficam com a MESMA largura e
              a mesma altura, em vez de quebrarem em tres linhas desalinhadas.
              Escala sem redesenho: 6 acoes fecham 3 linhas, 7 fecham 3 e a
              destrutiva (col-span-2) sempre ocupa a sua sozinha. No desktop
              volta a ser o flex de antes, sem mudanca. */}
          <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {detail && !detailLoading && edit.editing ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={edit.saving || !edit.dirty}
                  className="w-full rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-2 text-xs font-black uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60 sm:w-auto sm:py-1.5"
                >
                  {edit.saving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (edit.dirty) setConfirmDiscard(true);
                    else edit.cancel();
                  }}
                  disabled={edit.saving}
                  className={ACTION_BUTTON}
                >
                  Cancelar
                </button>
              </>
            ) : null}
            {detail && !detailLoading && !edit.editing ? (
              <>
                <button
                  type="button"
                  onClick={edit.start}
                  className={ACTION_BUTTON}
                >
                  Editar
                </button>
                {/* Rota e dialogo proprios: nao e um campo do formulario de
                    perfil, e a identidade de LOGIN que muda. */}
                <button
                  type="button"
                  onClick={() => setEmailOpen(true)}
                  className={ACTION_BUTTON}
                >
                  Trocar e-mail
                </button>
                {/* Boleto NAO aparece como botao desabilitado: um botao morto
                    convida a clicar e nao explica nada. Vira uma linha de
                    texto, que diz o porque no lugar de esconder. A rota recusa
                    de qualquer forma (boleto_not_supported). */}
                {detail.subscription &&
                !detail.subscription.cancel_at_period_end ? (
                  detail.subscription.renewal_type === "manual" ? (
                    <span
                      data-testid="boleto-sem-cancelamento"
                      className="col-span-2 text-xs font-bold text-slate-500 sm:col-span-1"
                    >
                      Boleto não renova sozinho: o acesso termina no fim do
                      período pago.
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCancelOpen(true)}
                      className={DESTRUCTIVE_BUTTON}
                    >
                      Cancelar no fim do período
                    </button>
                  )
                ) : null}
                {/* SEGUNDA destrutiva sobre a assinatura. O que separa as duas
                    não é a cor (as duas são vermelhas, e cor sozinha não diz
                    QUAL das duas): é QUANDO o acesso cai, e por isso os dois
                    rótulos dizem o prazo em vez de nomearem a ação. O peso
                    visual segue a gravidade: esta é sólida, a agendada é
                    contornada. Aparece com assinatura em qualquer estado que
                    ainda dê acesso, INCLUSIVE com cancelamento já agendado, que
                    é justamente o caso em que a pessoa mantém Pro até o fim do
                    período. */}
                {detail.subscription ? (
                  <button
                    type="button"
                    onClick={() => setRevokeProOpen(true)}
                    className={DESTRUCTIVE_NOW_BUTTON}
                  >
                    Encerrar Pro agora
                  </button>
                ) : null}
              </>
            ) : null}
            {/* So a CONCESSAO. Quando a pessoa JA e influencer, o rodape nao
                oferece nada de influencer: a revogacao mora na secao de status,
                junto do estado que ela apaga. */}
            {detail && !detailLoading && !edit.editing && !detail.influencer ? (
              <button
                type="button"
                onClick={() => setGrantOpen((open) => !open)}
                className={ACTION_BUTTON}
              >
                Tornar influencer
              </button>
            ) : null}
          </div>

          <button
            type="button"
            data-testid="footer-fechar"
            onClick={() => void requestClose()}
            className={`hidden rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase transition hover:bg-yellow-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:inline-flex`}
          >
            Fechar
          </button>

          {/* Formulario da nota, aberto pelo botao acima. Ocupa a linha inteira
              do rodape para o textarea nao espremer as acoes. */}
          {grantOpen && detail && !detail.influencer && !edit.editing ? (
            <div className="w-full space-y-2 rounded-2xl border-2 border-violet-700 bg-violet-50 p-3">
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
                  className={ACTION_BUTTON}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
        </footer>

        {/* Confirmacao de descarte. LAYER_IN_DIALOG (z-[2100]) porque abre
            DENTRO de um modal que ja esta em z-[2000]; a escala inteira esta
            documentada em tasks/taskLayers.ts. */}
        <RefundDialog
          userId={userId}
          charge={refundAlvo}
          influencer={Boolean(detail?.influencer)}
          open={refundAlvo !== null}
          onOpenChange={(aberto) => {
            if (!aberto) setRefundAlvo(null);
          }}
          onDone={() => setDetailVersion((version) => version + 1)}
        />

        <ExternalRefundDialog
          userId={userId}
          charge={externalRefundAlvo}
          influencer={Boolean(detail?.influencer)}
          open={externalRefundAlvo !== null}
          onOpenChange={(aberto) => {
            if (!aberto) setExternalRefundAlvo(null);
          }}
          onDone={() => setDetailVersion((version) => version + 1)}
        />

        {detail ? (
          <CancelSubscriptionDialog
            userId={userId}
            detail={detail}
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            onChanged={() => setDetailVersion((version) => version + 1)}
          />
        ) : null}

        {detail ? (
          <RevokeAccessDialog
            userId={userId}
            detail={detail}
            transactions={transactions}
            open={revokeProOpen}
            onOpenChange={setRevokeProOpen}
            onChanged={() => setDetailVersion((version) => version + 1)}
          />
        ) : null}

        {detail ? (
          <EmailChangeDialog
            userId={userId}
            emailAtual={detail.email}
            open={emailOpen}
            onOpenChange={setEmailOpen}
            onChanged={() => setDetailVersion((version) => version + 1)}
          />
        ) : null}

        <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
          <AlertDialogContent
            overlayClassName={LAYER_IN_DIALOG}
            className={`${LAYER_IN_DIALOG} rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]`}
          >
            <AlertDialogTitle className="font-display text-2xl font-black text-slate-950">
              Descartar alterações?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-semibold text-slate-600">
              As alterações deste cadastro ainda não foram salvas. Se sair
              agora, elas se perdem.
            </AlertDialogDescription>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className={ACTION_BUTTON}>
                Continuar editando
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmDiscard(false);
                  edit.cancel();
                  onClose();
                }}
                className="rounded-full border-2 border-slate-900 bg-rose-300 px-4 py-1.5 text-xs font-black uppercase"
              >
                Descartar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
