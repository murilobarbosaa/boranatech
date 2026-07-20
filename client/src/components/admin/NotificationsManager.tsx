import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import {
  NOTIFICATION_TYPE_META as TYPE_META,
  notificationTypeMetaOf,
} from "@/lib/notificationTypeMeta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  archiveNotification,
  createNotification,
  fetchAudiencePreview,
  fetchNotificationStats,
  listNotifications,
  patchNotification,
  publishNotification,
  scheduleNotification,
  unscheduleNotification,
  type AdminNotification,
  type AdminNotificationAudience,
  type AdminNotificationCategory,
  type AdminNotificationInput,
  type AdminNotificationMutationResult,
  type AdminNotificationStatus,
  type AdminNotificationType,
  type AudiencePreview,
  type NotificationStats,
} from "@/services/adminNotificationsService";

// Gestao das notificacoes in-app (broadcast). Regra central espelhada do
// server: draft edita tudo; published tem conteudo IMUTAVEL (so expires_at e
// status mudam); archived some do feed dos usuarios e permanece aqui. Sem
// delete fisico em nenhum status.

const PAGE_SIZE = 10;

// TYPE_META vem de @/lib/notificationTypeMeta (fonte única compartilhada com o
// detalhe do usuário); importado com alias pra não mexer nas referências.

const STATUS_META: Record<
  AdminNotificationStatus,
  { label: string; badge: string }
> = {
  draft: { label: "Rascunho", badge: "border-slate-500 bg-slate-100 text-slate-600" },
  scheduled: {
    label: "Agendada",
    badge: "border-sky-700 bg-sky-100 text-sky-800",
  },
  published: {
    label: "Publicada",
    badge: "border-emerald-700 bg-emerald-100 text-emerald-800",
  },
  archived: {
    label: "Arquivada",
    badge: "border-slate-400 bg-slate-200 text-slate-500",
  },
};

const AUDIENCE_META: Record<
  AdminNotificationAudience,
  { label: string; description: string }
> = {
  all: { label: "Todos", description: "Toda a base de usuários." },
  never_pro: {
    label: "Nunca Pro",
    description: "Quem nunca teve um plano pago.",
  },
  active_pro: {
    label: "Pro ativo",
    description: "Assinatura paga ativa (mesma definição do is_user_pro).",
  },
  ex_pro: {
    label: "Ex-Pro",
    description:
      "Já pagou e hoje não tem plano ativo (past_due fica de fora).",
  },
  custom: {
    label: "Emails específicos",
    description:
      "Lista fixa de destinatários, resolvida por email na criação. Quem não tem cadastro fica de fora.",
  },
};

// Mesma validação de email do server (adminNotifications/adminEmailCampaigns).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CUSTOM_RECIPIENTS = 500;

// Um por linha, vírgula ou ponto e vírgula; dedupe case-insensitive.
function parseRecipientEmails(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

const TYPE_OPTIONS = Object.entries(TYPE_META) as Array<
  [AdminNotificationType, { label: string; badge: string }]
>;
const AUDIENCE_OPTIONS = Object.entries(AUDIENCE_META) as Array<
  [AdminNotificationAudience, { label: string; description: string }]
>;

// Resolvem meta por chave COM FALLBACK. Um valor de enum vindo do server que o
// front ainda não conhece (deploy do frontend defasado do backend/db:push que
// já produz um status/audience novo, ou uma adição futura de enum) renderiza um
// badge neutro com o valor cru, em vez de estourar a página inteira do admin num
// `X[chave].label` de chave inexistente (TypeError dentro do items.map).
const UNKNOWN_BADGE = "border-slate-400 bg-slate-100 text-slate-500";
// Reusa o resolver centralizado (fonte única de fallback do type, compartilhada
// com o lado do usuário). status/audience abaixo são metas exclusivos do admin
// (shapes distintos) e mantêm resolver próprio.
export const typeMetaOf = notificationTypeMetaOf;
export function statusMetaOf(status: string): { label: string; badge: string } {
  return (
    STATUS_META[status as AdminNotificationStatus] ?? {
      label: status,
      badge: UNKNOWN_BADGE,
    }
  );
}
export function audienceMetaOf(
  audience: string,
): { label: string; description: string } {
  return (
    AUDIENCE_META[audience as AdminNotificationAudience] ?? {
      label: audience,
      description: "",
    }
  );
}

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return dateTimeFmt.format(new Date(iso));
}

function isExpired(iso: string | null): boolean {
  return iso !== null && new Date(iso).getTime() < Date.now();
}

function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Mesmos degraus do CountdownBadge do painel do usuário, em versão estática
// (preview do admin não precisa de tique por segundo).
function formatCountdownPreview(iso: string): string {
  const msLeft = new Date(iso).getTime() - Date.now();
  if (msLeft <= 0) return "Expirado";
  const totalSec = Math.floor(msLeft / 1000);
  if (totalSec > 48 * 3600) {
    const days = Math.floor(totalSec / (24 * 3600));
    return `Termina em ${days} ${days === 1 ? "dia" : "dias"}`;
  }
  if (totalSec >= 3600) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `Termina em ${h}h ${m}min`;
  }
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `Termina em ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type FormState = {
  title: string;
  body: string;
  type: AdminNotificationType;
  category: AdminNotificationCategory;
  audience: AdminNotificationAudience;
  coupon_code: string;
  discount_percent: string;
  cta_url: string;
  cta_label: string;
  expires_at_local: string;
  // Texto cru do textarea de custom; os emails saem de parseRecipientEmails.
  recipients_text: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  body: "",
  type: "announcement",
  category: "product",
  audience: "all",
  coupon_code: "",
  discount_percent: "",
  cta_url: "",
  cta_label: "",
  expires_at_local: "",
  recipients_text: "",
};

function formFromNotification(n: AdminNotification): FormState {
  return {
    title: n.title,
    body: n.body,
    type: n.type,
    category: n.category,
    audience: n.audience,
    coupon_code: n.coupon_code ?? "",
    discount_percent:
      n.discount_percent !== null ? String(n.discount_percent) : "",
    cta_url: n.cta_url ?? "",
    cta_label: n.cta_label ?? "",
    expires_at_local: n.expires_at ? isoToLocalInput(n.expires_at) : "",
    // Emails da lista atual não são recuperáveis (guardamos user_id); vazio
    // mantém a lista, preencher substitui inteira.
    recipients_text: "",
  };
}

// Espelho client-side do zod do server, pra mensagem imediata; o erro do
// server continua sendo exibido se algo passar. requireRecipients: true no
// create e ao mudar um draft para custom; false editando um draft já custom
// (textarea vazio mantém a lista atual).
function validateForm(
  form: FormState,
  options: { requireRecipients: boolean },
): string | null {
  if (!form.title.trim()) return "Informe o título.";
  if (form.title.trim().length > 200)
    return "O título deve ter no máximo 200 caracteres.";
  if (!form.body.trim()) return "Informe o corpo da notificação.";
  if (form.body.trim().length > 2000)
    return "O corpo deve ter no máximo 2000 caracteres.";
  if (form.type === "coupon" && !form.coupon_code.trim())
    return "Cupom exige um código (coupon_code).";
  if (form.discount_percent) {
    const pct = Number(form.discount_percent);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100)
      return "Desconto deve ser um inteiro entre 1 e 100.";
  }
  if (form.cta_url) {
    try {
      new URL(form.cta_url);
    } catch {
      return "cta_url deve ser uma URL válida (com https://).";
    }
  }
  if (form.expires_at_local) {
    const ts = new Date(form.expires_at_local).getTime();
    if (Number.isNaN(ts)) return "Data de expiração inválida.";
    if (ts <= Date.now()) return "expires_at deve ser uma data futura.";
  }
  if (form.audience === "custom") {
    const emails = parseRecipientEmails(form.recipients_text);
    if (options.requireRecipients && emails.length === 0)
      return "Informe pelo menos um email de destinatário.";
    if (emails.length > MAX_CUSTOM_RECIPIENTS)
      return `No máximo ${MAX_CUSTOM_RECIPIENTS} emails por notificação.`;
    const invalid = emails.filter((email) => !EMAIL_PATTERN.test(email));
    if (invalid.length > 0)
      return `Email inválido na lista: ${invalid[0]}${invalid.length > 1 ? ` (e mais ${invalid.length - 1})` : ""}.`;
  }
  return null;
}

function payloadFromForm(form: FormState): AdminNotificationInput {
  const recipientEmails =
    form.audience === "custom"
      ? parseRecipientEmails(form.recipients_text)
      : [];
  return {
    ...(recipientEmails.length > 0
      ? { recipient_emails: recipientEmails }
      : {}),
    title: form.title.trim(),
    body: form.body.trim(),
    type: form.type,
    category: form.category,
    audience: form.audience,
    coupon_code: form.coupon_code.trim() || null,
    discount_percent: form.discount_percent
      ? Number(form.discount_percent)
      : null,
    cta_url: form.cta_url.trim() || null,
    cta_label: form.cta_label.trim() || null,
    expires_at: form.expires_at_local
      ? new Date(form.expires_at_local).toISOString()
      : null,
  };
}

// Debounce do preview de alcance: audience/category mudam, espera 400ms e
// consulta (o server cacheia 10 min por combinação).
function useAudiencePreview(
  audience: AdminNotificationAudience,
  category: AdminNotificationCategory,
  enabled: boolean,
) {
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchAudiencePreview(audience, category)
        .then((res) => {
          if (!cancelled) setPreview(res.data);
        })
        .catch(() => {
          if (!cancelled) setPreview(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [audience, category, enabled]);

  return { preview, loading };
}

function MetaBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

function AudienceReach({
  audience,
  category,
  enabled,
  elevated = false,
}: {
  audience: AdminNotificationAudience;
  category: AdminNotificationCategory;
  enabled: boolean;
  // elevated: aplica a sombra brutalist do card de preview. Ligado só na coluna
  // do formulário (consistência com o preview); desligado no diálogo, onde os
  // cards não têm sombra.
  elevated?: boolean;
}) {
  const { preview, loading } = useAudiencePreview(audience, category, enabled);
  return (
    <div
      className={`rounded-2xl border-2 border-slate-900 bg-violet-50 p-3${
        elevated ? " shadow-[3px_3px_0_#0f172a]" : ""
      }`}
    >
      <p className="text-xs font-black uppercase text-violet-700">
        Alcance estimado
      </p>
      {loading ? (
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Calculando...
        </p>
      ) : preview ? (
        <>
          <p className="font-display mt-1 text-xl font-black text-slate-950">
            ~{preview.matched.toLocaleString("pt-BR")} usuários
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            de {preview.total_users.toLocaleString("pt-BR")} na base.
            Estimativa: quem virar elegível depois também passa a ver.
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Não foi possível estimar agora.
        </p>
      )}
    </div>
  );
}

// Preview visual: versão estática e simplificada do card do painel do
// usuário (duplicação leve e proposital pra não acoplar o admin ao
// componente do usuário).
function NotificationPreviewCard({ form }: { form: FormState }) {
  const countdown = form.expires_at_local
    ? formatCountdownPreview(new Date(form.expires_at_local).toISOString())
    : null;
  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white shadow-[3px_3px_0_#0f172a]">
      <p className="rounded-t-[14px] border-b-2 border-slate-900 bg-[#faf8f4] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        Como o usuário verá
      </p>
      <div className="rounded-b-[14px] bg-sky-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-black text-slate-950">
                {form.title.trim() || "Título da notificação"}
              </h4>
              {countdown ? (
                <span className="inline-flex rounded-full border border-slate-900 bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-900">
                  {countdown}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {form.body.trim() || "Corpo da notificação."}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              agora
            </p>
            {form.type === "coupon" && form.coupon_code.trim() ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-slate-900 bg-amber-50 p-2">
                <span className="inline-flex rounded-md bg-slate-950 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-white">
                  {form.coupon_code.trim().toUpperCase()}
                </span>
                {form.discount_percent ? (
                  <span className="text-xs font-black text-slate-900">
                    {form.discount_percent}% de desconto
                  </span>
                ) : null}
              </div>
            ) : null}
            {form.cta_url.trim() ? (
              <span className="mt-2 inline-flex items-center rounded-full border-2 border-slate-900 bg-[#FFB800] px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                {form.cta_label.trim() || "Ver mais"}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const labelClass =
  "mb-1 block text-xs font-black uppercase tracking-wide text-slate-600";
const primaryButtonClass =
  "rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:opacity-50 disabled:shadow-none";
const secondaryButtonClass =
  "rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:opacity-50 disabled:shadow-none";
const rowActionClass =
  "rounded-full border-2 border-slate-900 bg-white px-2.5 py-1 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:opacity-50";

type FormMode =
  | { mode: "create" }
  | { mode: "edit"; notification: AdminNotification };

export function NotificationsManager() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    AdminNotificationStatus | ""
  >("");
  const [typeFilter, setTypeFilter] = useState<AdminNotificationType | "">("");
  const [page, setPage] = useState(0);

  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Resolução da última gravação custom (matched × unmatched do server).
  const [recipientFeedback, setRecipientFeedback] = useState<{
    matched: string[];
    unmatched: string[];
  } | null>(null);

  const [publishTarget, setPublishTarget] = useState<AdminNotification | null>(
    null,
  );
  const [publishing, setPublishing] = useState(false);
  // "quando enviar" do diálogo de publicação (espelha o modal de disparo das
  // campanhas de email): now = publica já; schedule = grava scheduled_for.
  const [whenMode, setWhenMode] = useState<"now" | "schedule">("now");
  const [scheduleText, setScheduleText] = useState("");
  const [unscheduling, setUnscheduling] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminNotification | null>(
    null,
  );
  const [archiving, setArchiving] = useState(false);

  const [statsTarget, setStatsTarget] = useState<AdminNotification | null>(
    null,
  );
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [statsPreview, setStatsPreview] = useState<AudiencePreview | null>(
    null,
  );
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Imutabilidade: SO published/archived travam o conteudo. scheduled ainda nao
  // foi disparada, entao edita normalmente (igual draft).
  const editingPublished =
    formMode?.mode === "edit" &&
    (formMode.notification.status === "published" ||
      formMode.notification.status === "archived");

  const load = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await listNotifications({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setItems(res.data);
      setTotal(res.total);
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : "Erro ao listar notificações.",
      );
    } finally {
      setListLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setRecipientFeedback(null);
    setFormMode({ mode: "create" });
  }

  function openEdit(notification: AdminNotification) {
    setForm(formFromNotification(notification));
    setFormError(null);
    setRecipientFeedback(null);
    setFormMode({ mode: "edit", notification });
  }

  function closeForm() {
    setFormMode(null);
    setFormError(null);
    setRecipientFeedback(null);
  }

  async function handleSave() {
    // Published: o conteúdo é imutável, o PATCH envia somente expires_at.
    if (editingPublished && formMode?.mode === "edit") {
      if (form.expires_at_local) {
        const ts = new Date(form.expires_at_local).getTime();
        if (Number.isNaN(ts)) return setFormError("Data de expiração inválida.");
        if (ts <= Date.now())
          return setFormError("expires_at deve ser uma data futura.");
      }
      setSaving(true);
      setFormError(null);
      try {
        await patchNotification(formMode.notification.id, {
          expires_at: form.expires_at_local
            ? new Date(form.expires_at_local).toISOString()
            : null,
        });
        toast.success("Validade atualizada.");
        closeForm();
        void load();
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : "Erro ao salvar.",
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    // Emails obrigatórios: sempre no create custom; no edit, só quando o
    // draft está VIRANDO custom (draft já custom com textarea vazio mantém a
    // lista atual).
    const requireRecipients =
      form.audience === "custom" &&
      (formMode?.mode !== "edit" ||
        formMode.notification.audience !== "custom");
    const validationError = validateForm(form, { requireRecipients });
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSaving(true);
    setFormError(null);
    setRecipientFeedback(null);
    try {
      const payload = payloadFromForm(form);
      let result: AdminNotificationMutationResult;
      if (formMode?.mode === "edit") {
        result = await patchNotification(formMode.notification.id, payload);
        toast.success("Rascunho atualizado.");
      } else {
        result = await createNotification(payload);
        toast.success("Rascunho criado.");
      }
      void load();
      // Emails sem cadastro: o draft foi salvo, mas o form permanece aberto
      // (em edição do draft salvo) com o aviso, pra corrigir antes de publicar.
      if (result.unmatched && result.unmatched.length > 0) {
        setRecipientFeedback({
          matched: result.matched ?? [],
          unmatched: result.unmatched,
        });
        setFormMode({ mode: "edit", notification: result.data });
        setForm(formFromNotification(result.data));
      } else {
        closeForm();
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  // Abre o diálogo de publicação/agendamento. mode=schedule prefill a data com
  // o scheduled_for atual (reagendar); publicar agora abre em now.
  function openPublish(item: AdminNotification, mode: "now" | "schedule") {
    setPublishTarget(item);
    setWhenMode(mode);
    setScheduleText(
      mode === "schedule" && item.scheduled_for
        ? isoToLocalInput(item.scheduled_for)
        : "",
    );
  }

  async function handlePublish() {
    if (!publishTarget) return;
    // Agendar: converte o datetime-local (fuso do navegador) para ISO e chama
    // /schedule. As regras de janela (futuro, máx 30d) são validadas no server.
    if (whenMode === "schedule") {
      if (!scheduleText) {
        toast.error("Escolha a data e a hora do agendamento.");
        return;
      }
      const date = new Date(scheduleText);
      if (Number.isNaN(date.getTime())) {
        toast.error("Data de agendamento inválida.");
        return;
      }
      setPublishing(true);
      try {
        await scheduleNotification(publishTarget.id, date.toISOString());
        toast.success("Notificação agendada.");
        setPublishTarget(null);
        void load();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao agendar.",
        );
      } finally {
        setPublishing(false);
      }
      return;
    }

    setPublishing(true);
    try {
      await publishNotification(publishTarget.id);
      toast.success("Notificação publicada.");
      setPublishTarget(null);
      void load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao publicar.",
      );
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnschedule(item: AdminNotification) {
    setUnscheduling(item.id);
    try {
      await unscheduleNotification(item.id);
      toast.success("Agendamento cancelado. Voltou para rascunho.");
      void load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao cancelar agendamento.",
      );
    } finally {
      setUnscheduling(null);
    }
  }

  async function handleArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await archiveNotification(archiveTarget.id);
      toast.success("Notificação arquivada.");
      setArchiveTarget(null);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao arquivar.");
    } finally {
      setArchiving(false);
    }
  }

  function openStats(notification: AdminNotification) {
    setStatsTarget(notification);
    setStats(null);
    setStatsPreview(null);
    setStatsError(null);
    setStatsLoading(true);
    // custom não tem preview de segmento: o denominador exato é o
    // recipient_count da própria notificação.
    void Promise.all([
      fetchNotificationStats(notification.id),
      notification.audience === "custom"
        ? Promise.resolve(null)
        : fetchAudiencePreview(notification.audience, notification.category),
    ])
      .then(([statsRes, previewRes]) => {
        setStats(statsRes.data);
        setStatsPreview(previewRes ? previewRes.data : null);
      })
      .catch((error) => {
        setStatsError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar estatísticas.",
        );
      })
      .finally(() => setStatsLoading(false));
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statsIsCustom = statsTarget?.audience === "custom";
  const statsDenominator = statsIsCustom
    ? (statsTarget?.recipient_count ?? 0)
    : (statsPreview?.matched ?? 0);
  const readRate =
    stats && statsDenominator > 0
      ? Math.min(100, Math.round((stats.total_reads / statsDenominator) * 100))
      : null;
  const parsedRecipients =
    form.audience === "custom"
      ? parseRecipientEmails(form.recipients_text)
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="notif-filter-status" className={labelClass}>
              Status
            </label>
            <select
              id="notif-filter-status"
              value={statusFilter}
              onChange={(e) => {
                setPage(0);
                setStatusFilter(e.target.value as AdminNotificationStatus | "");
              }}
              className={inputClass}
            >
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="scheduled">Agendada</option>
              <option value="published">Publicada</option>
              <option value="archived">Arquivada</option>
            </select>
          </div>
          <div>
            <label htmlFor="notif-filter-type" className={labelClass}>
              Tipo
            </label>
            <select
              id="notif-filter-type"
              value={typeFilter}
              onChange={(e) => {
                setPage(0);
                setTypeFilter(e.target.value as AdminNotificationType | "");
              }}
              className={inputClass}
            >
              <option value="">Todos</option>
              {TYPE_OPTIONS.map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={openCreate} className={primaryButtonClass}>
          Nova notificação
        </button>
      </div>

      {formMode ? (
        <article className="card-brutal rounded-3xl bg-white p-6">
          <h3 className="font-display text-2xl font-black text-slate-950">
            {formMode.mode === "create"
              ? "Nova notificação"
              : editingPublished
                ? "Editar validade"
                : "Editar rascunho"}
          </h3>
          {editingPublished ? (
            <p className="mt-2 rounded-xl border-2 border-amber-600 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
              Conteúdo publicado é imutável. Apenas a validade (expires_at)
              pode ser alterada.
            </p>
          ) : null}

          <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div>
                <label htmlFor="notif-title" className={labelClass}>
                  Título ({form.title.length}/200)
                </label>
                <input
                  id="notif-title"
                  type="text"
                  maxLength={200}
                  value={form.title}
                  disabled={editingPublished}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="notif-body" className={labelClass}>
                  Corpo ({form.body.length}/2000)
                </label>
                <textarea
                  id="notif-body"
                  rows={4}
                  maxLength={2000}
                  value={form.body}
                  disabled={editingPublished}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="notif-type" className={labelClass}>
                    Tipo
                  </label>
                  <select
                    id="notif-type"
                    value={form.type}
                    disabled={editingPublished}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as AdminNotificationType,
                      })
                    }
                    className={inputClass}
                  >
                    {TYPE_OPTIONS.map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="notif-category" className={labelClass}>
                    Categoria
                  </label>
                  <select
                    id="notif-category"
                    value={form.category}
                    disabled={editingPublished}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target
                          .value as AdminNotificationCategory,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="product">Produto</option>
                    <option value="promotional">Promocional</option>
                  </select>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Promocional só chega a quem tem opt-in de marketing.
                  </p>
                </div>
              </div>
              <div>
                <label htmlFor="notif-audience" className={labelClass}>
                  Audience
                </label>
                <select
                  id="notif-audience"
                  value={form.audience}
                  disabled={editingPublished}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      audience: e.target
                        .value as AdminNotificationAudience,
                    })
                  }
                  className={inputClass}
                >
                  {AUDIENCE_OPTIONS.map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {audienceMetaOf(form.audience).description}
                </p>
              </div>
              {form.audience === "custom" ? (
                <div>
                  <label htmlFor="notif-recipients" className={labelClass}>
                    Emails dos destinatários ({parsedRecipients.length}/
                    {MAX_CUSTOM_RECIPIENTS})
                  </label>
                  <textarea
                    id="notif-recipients"
                    rows={5}
                    value={form.recipients_text}
                    disabled={editingPublished}
                    placeholder={
                      formMode.mode === "edit" &&
                      formMode.notification.audience === "custom"
                        ? `Deixe vazio para manter a lista atual (${formMode.notification.recipient_count ?? 0} destinatários). Preencher substitui a lista inteira.`
                        : "um@email.com, outro@email.com (um por linha ou separados por vírgula)"
                    }
                    onChange={(e) =>
                      setForm({ ...form, recipients_text: e.target.value })
                    }
                    className={`${inputClass} font-mono`}
                  />
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Um por linha ou separados por vírgula; duplicados são
                    ignorados. Emails sem cadastro na plataforma não recebem.
                  </p>
                </div>
              ) : null}
              {recipientFeedback ? (
                <div className="rounded-xl border-2 border-amber-600 bg-amber-50 px-3 py-2 text-sm">
                  <p className="font-bold text-amber-800">
                    {recipientFeedback.matched.length} com cadastro
                    (receberão). {recipientFeedback.unmatched.length} sem
                    cadastro e NÃO receberão:
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-amber-900">
                    {recipientFeedback.unmatched.join(", ")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-amber-800">
                    O rascunho foi salvo. Corrija a lista acima (substitui a
                    atual) ou publique só para os encontrados.
                  </p>
                </div>
              ) : null}
              {form.type === "coupon" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="notif-coupon" className={labelClass}>
                      Código do cupom (obrigatório)
                    </label>
                    <input
                      id="notif-coupon"
                      type="text"
                      maxLength={64}
                      value={form.coupon_code}
                      disabled={editingPublished}
                      onChange={(e) =>
                        setForm({ ...form, coupon_code: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="notif-discount" className={labelClass}>
                      Desconto % (opcional)
                    </label>
                    <input
                      id="notif-discount"
                      type="number"
                      min={1}
                      max={100}
                      value={form.discount_percent}
                      disabled={editingPublished}
                      onChange={(e) =>
                        setForm({ ...form, discount_percent: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="notif-cta-url" className={labelClass}>
                    CTA URL (opcional)
                  </label>
                  <input
                    id="notif-cta-url"
                    type="url"
                    placeholder="https://..."
                    value={form.cta_url}
                    disabled={editingPublished}
                    onChange={(e) =>
                      setForm({ ...form, cta_url: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="notif-cta-label" className={labelClass}>
                    CTA label (opcional)
                  </label>
                  <input
                    id="notif-cta-label"
                    type="text"
                    maxLength={60}
                    value={form.cta_label}
                    disabled={editingPublished}
                    onChange={(e) =>
                      setForm({ ...form, cta_label: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="notif-expires" className={labelClass}>
                  Expira em (opcional, sempre editável)
                </label>
                <input
                  id="notif-expires"
                  type="datetime-local"
                  value={form.expires_at_local}
                  onChange={(e) =>
                    setForm({ ...form, expires_at_local: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              {formError ? (
                <p className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                  {formError}
                </p>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className={primaryButtonClass}
                >
                  {saving
                    ? "Salvando..."
                    : formMode.mode === "create"
                      ? "Criar rascunho"
                      : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className={secondaryButtonClass}
                >
                  Cancelar
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {!editingPublished && form.audience !== "custom" ? (
                <AudienceReach
                  audience={form.audience}
                  category={form.category}
                  enabled
                  elevated
                />
              ) : null}
              {!editingPublished && form.audience === "custom" ? (
                <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3 shadow-[3px_3px_0_#0f172a]">
                  <p className="text-xs font-black uppercase text-violet-700">
                    Destinatários
                  </p>
                  <p className="font-display mt-1 text-xl font-black text-slate-950">
                    {parsedRecipients.length.toLocaleString("pt-BR")} emails na
                    lista
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Quantos têm cadastro você vê ao salvar (matched ×
                    unmatched).
                  </p>
                </div>
              ) : null}
              <NotificationPreviewCard form={form} />
            </div>
          </div>
        </article>
      ) : null}

      <article className="card-brutal overflow-hidden rounded-3xl bg-white">
        {listLoading ? (
          <div className="p-6">
            <LoadingBlock label="Carregando notificações..." />
          </div>
        ) : listError ? (
          <div className="p-6">
            <ErrorBlock message={listError} />
          </div>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-sm font-black text-slate-500">
            Nenhuma notificação com esses filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-[#faf8f4] text-xs font-black uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Publicada em</th>
                  <th className="px-4 py-3">Expira</th>
                  <th className="px-4 py-3 text-right">Leituras</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-200 last:border-b-0"
                  >
                    <td className="max-w-[260px] truncate px-4 py-3 font-bold text-slate-950">
                      {item.title}
                    </td>
                    <td className="px-4 py-3">
                      <MetaBadge
                        label={typeMetaOf(item.type).label}
                        className={typeMetaOf(item.type).badge}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600">
                      {audienceMetaOf(item.audience).label}
                      {item.audience === "custom" ? (
                        <span className="block text-[11px] font-semibold text-slate-400">
                          {item.recipient_count.toLocaleString("pt-BR")}{" "}
                          destinatários
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600">
                      {item.category === "promotional"
                        ? "Promocional"
                        : "Produto"}
                    </td>
                    <td className="px-4 py-3">
                      <MetaBadge
                        label={statusMetaOf(item.status).label}
                        className={statusMetaOf(item.status).badge}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600">
                      {item.status === "scheduled" && item.scheduled_for ? (
                        <span className="inline-flex flex-col text-sky-800">
                          <span className="text-[11px] font-black uppercase tracking-wide">
                            Agendada para
                          </span>
                          {formatDateTime(item.scheduled_for)}
                        </span>
                      ) : (
                        formatDateTime(item.published_at) || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600">
                      {item.expires_at ? (
                        <span className="inline-flex flex-col">
                          {formatDateTime(item.expires_at)}
                          {isExpired(item.expires_at) ? (
                            <MetaBadge
                              label="Expirada"
                              className="mt-1 w-fit border-rose-700 bg-rose-100 text-rose-700"
                            />
                          ) : null}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-950">
                      {item.read_count.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {item.status === "draft" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className={rowActionClass}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => openPublish(item, "now")}
                              className={`${rowActionClass} bg-emerald-100 text-emerald-800`}
                            >
                              Publicar
                            </button>
                          </>
                        ) : null}
                        {item.status === "scheduled" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className={rowActionClass}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => openPublish(item, "schedule")}
                              className={`${rowActionClass} bg-sky-100 text-sky-800`}
                            >
                              Reagendar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleUnschedule(item)}
                              disabled={unscheduling === item.id}
                              className={rowActionClass}
                            >
                              {unscheduling === item.id
                                ? "Cancelando..."
                                : "Cancelar agendamento"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openPublish(item, "now")}
                              className={`${rowActionClass} bg-emerald-100 text-emerald-800`}
                            >
                              Publicar agora
                            </button>
                          </>
                        ) : null}
                        {item.status === "published" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openStats(item)}
                              className={rowActionClass}
                            >
                              Ver stats
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className={rowActionClass}
                            >
                              Editar validade
                            </button>
                            <button
                              type="button"
                              onClick={() => setArchiveTarget(item)}
                              className={`${rowActionClass} bg-rose-50 text-rose-800`}
                            >
                              Arquivar
                            </button>
                          </>
                        ) : null}
                        {item.status === "archived" ? (
                          <button
                            type="button"
                            onClick={() => openStats(item)}
                            className={rowActionClass}
                          >
                            Ver stats
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!listLoading && !listError && total > PAGE_SIZE ? (
          <div className="flex items-center justify-between border-t-2 border-slate-900 bg-[#faf8f4] px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Página {page + 1} de {totalPages} ({total} no total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className={rowActionClass}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page + 1 >= totalPages}
                className={rowActionClass}
              >
                Próxima
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <Dialog
        open={publishTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPublishTarget(null);
        }}
      >
        <DialogContent className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a] sm:max-w-md">
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            {whenMode === "schedule"
              ? "Agendar notificação?"
              : "Publicar notificação?"}
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-600">
            {whenMode === "schedule"
              ? "Ela vai sair automaticamente no horário escolhido. Até lá, continua editável."
              : "Após publicar, o conteúdo não poderá ser editado."}
          </DialogDescription>
          {publishTarget ? (
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">
                  {publishTarget.title}
                </p>
                <p className="mt-1 line-clamp-3 text-sm text-slate-600">
                  {publishTarget.body}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <MetaBadge
                    label={typeMetaOf(publishTarget.type).label}
                    className={typeMetaOf(publishTarget.type).badge}
                  />
                  <MetaBadge
                    label={audienceMetaOf(publishTarget.audience).label}
                    className="border-slate-900 bg-white text-slate-900"
                  />
                  <MetaBadge
                    label={
                      publishTarget.category === "promotional"
                        ? "Promocional"
                        : "Produto"
                    }
                    className="border-slate-900 bg-white text-slate-900"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {publishTarget.expires_at
                    ? `Expira em ${formatDateTime(publishTarget.expires_at)}.`
                    : "Sem data de expiração."}
                </p>
              </div>
              {publishTarget.audience === "custom" ? (
                <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3">
                  <p className="text-xs font-black uppercase text-violet-700">
                    Destinatários
                  </p>
                  <p className="font-display mt-1 text-xl font-black text-slate-950">
                    Será enviada para{" "}
                    {publishTarget.recipient_count.toLocaleString("pt-BR")}{" "}
                    usuários
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Lista fixa resolvida na criação; não muda depois.
                  </p>
                </div>
              ) : (
                <AudienceReach
                  audience={publishTarget.audience}
                  category={publishTarget.category}
                  enabled
                />
              )}

              <div className="rounded-2xl border-2 border-slate-900 bg-white p-3">
                <p className="text-xs font-black uppercase text-slate-500">
                  Quando enviar
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { id: "now", label: "Agora" },
                      { id: "schedule", label: "Agendar" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setWhenMode(option.id)}
                      className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase transition-colors ${
                        whenMode === option.id
                          ? "bg-slate-950 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {whenMode === "schedule" ? (
                  <div className="mt-3">
                    <label
                      htmlFor="notif-schedule"
                      className="text-xs font-black uppercase text-slate-500"
                    >
                      Data e hora (horário de Brasília)
                    </label>
                    <input
                      id="notif-schedule"
                      type="datetime-local"
                      value={scheduleText}
                      onChange={(e) => setScheduleText(e.target.value)}
                      className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
                    />
                    {scheduleText &&
                    !Number.isNaN(new Date(scheduleText).getTime()) ? (
                      <p className="mt-2 text-xs font-bold text-sky-800">
                        Sai em{" "}
                        {formatDateTime(new Date(scheduleText).toISOString())}.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setPublishTarget(null)}
              className={secondaryButtonClass}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing}
              className={primaryButtonClass}
            >
              {whenMode === "schedule"
                ? publishing
                  ? "Agendando..."
                  : "Agendar"
                : publishing
                  ? "Publicando..."
                  : "Publicar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <DialogContent className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a] sm:max-w-md">
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            Arquivar notificação?
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-600">
            Ela some do feed dos usuários e permanece aqui no histórico do
            admin.
          </DialogDescription>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setArchiveTarget(null)}
              className={secondaryButtonClass}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleArchive()}
              disabled={archiving}
              className={`${secondaryButtonClass} bg-rose-100 text-rose-800`}
            >
              {archiving ? "Arquivando..." : "Arquivar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={statsTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatsTarget(null);
        }}
      >
        <DialogContent className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a] sm:max-w-lg">
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            Leituras
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-600">
            {statsTarget?.title}
          </DialogDescription>
          {statsLoading ? (
            <LoadingBlock label="Carregando estatísticas..." />
          ) : statsError ? (
            <ErrorBlock message={statsError} />
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3">
                  <p className="text-xs font-black uppercase text-violet-700">
                    Total de leituras
                  </p>
                  <p className="font-display mt-1 text-2xl font-black text-slate-950">
                    {stats.total_reads.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-slate-900 bg-emerald-50 p-3">
                  <p className="text-xs font-black uppercase text-emerald-700">
                    {statsIsCustom
                      ? "Taxa de leitura (exata)"
                      : "Taxa de leitura (estimativa)"}
                  </p>
                  <p className="font-display mt-1 text-2xl font-black text-slate-950">
                    {readRate !== null ? `${readRate}%` : "-"}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    {statsIsCustom
                      ? `Sobre os ${statsDenominator.toLocaleString("pt-BR")} destinatários fixos da lista.`
                      : "Sobre o alcance atual da audience, que muda com o tempo."}
                  </p>
                </div>
              </div>
              {stats.reads_by_day.length > 0 ? (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.reads_by_day}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(day: string) => day.slice(5)}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Leituras"
                        fill="#FFB800"
                        stroke="#0f172a"
                        strokeWidth={1}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center text-sm font-bold text-slate-500">
                  Nenhuma leitura registrada ainda.
                </p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
