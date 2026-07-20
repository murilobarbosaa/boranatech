import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

// TODO(Ana): revisar TODA a copy visivel deste componente (titulo dos grupos,
// rotulos dos campos, estados vazios/erro e o aviso de auditoria do CPF).

type UserRow = {
  id?: string;
  user_id?: string;
  name?: string | null;
  email?: string | null;
  onboarding_completed?: boolean | null;
};

// Espelha o payload paginado de GET /users.
type UsersListPayload = {
  items: UserRow[];
  total: number;
  page: number;
  pageSize: number;
};

type UserListFilter = "all" | "pro" | "not_pro" | "influencers" | "ativo";

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 350;

// Espelha o payload de GET /users/:id (CPF ja mascarado; sem campos de moderacao
// de avatar nem o blob de preferences).
type UserDetail = {
  user_id: string | null;
  name: string | null;
  full_name: string | null;
  email: string | null;
  gender: string | null;
  bio: string | null;
  area_interesse: string | null;
  nivel_atual: string | null;
  objetivo: string | null;
  onboarding_completed: boolean | null;
  onboarding_step: number | null;
  marketing_opt_in: boolean | null;
  marketing_opt_in_at: string | null;
  welcome_email_sent: boolean | null;
  cpf_masked: string | null;
  has_cpf: boolean;
  // A foto e UMA (avatar_url); moderation_status diz o estado dela (clean |
  // pending_review | removed). Nao existe avatar_pending_url no schema.
  avatar: {
    url: string | null;
    mode: string | null;
    moderation_status: string | null;
  } | null;
  subscription: {
    plan_code: string | null;
    status: string | null;
    payment_method: string | null;
    renewal_type: string | null;
    created_at: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean | null;
  } | null;
  cancellation_intent: {
    reason_code: string | null;
    reason_text: string | null;
    effective_at: string | null;
  } | null;
  // Concessao de influencer ATIVA (null quando nao e influencer). Acesso Pro
  // vitalicio sem assinatura, ortogonal a subscription: os dois podem coexistir.
  influencer: {
    granted_at: string | null;
    note: string | null;
    granted_by_name: string | null;
    granted_by_email: string | null;
  } | null;
  paid_total_cents: number;
  // Derivado no servidor a partir de last_sign_in_at, com a mesma janela de 30d
  // do filtro ATIVO: active = login < 30d, inactive = login > 30d, never = nunca
  // logou. A janela vive so no servidor; aqui so mapeamos o rotulo.
  activity_status: "active" | "inactive" | "never";
  created_at: string | null;
  updated_at: string | null;
};

type PosthogUserActivityState =
  | { state: "not_configured"; missing: string[] }
  | { state: "error"; reason: string; httpStatus?: number }
  | {
      state: "ok";
      hasData: boolean;
      activity: {
        features: Array<{ event: string; count: number }>;
        navigation: Array<{ page: string; timestamp: string }>;
      };
    };

const NAO_INFORMADO = "Não informado";

function fmtText(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || NAO_INFORMADO;
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return NAO_INFORMADO;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NAO_INFORMADO;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return NAO_INFORMADO;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NAO_INFORMADO;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function fmtBool(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return NAO_INFORMADO;
  return value ? "Sim" : "Não";
}

function fmtBrl(cents: number | null | undefined): string {
  if (typeof cents !== "number") return NAO_INFORMADO;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

// TODO(Ana): revisar os rotulos de metodo de pagamento e tipo de renovacao.
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Cartão",
  pix: "Pix",
  boleto: "Boleto",
};

const RENEWAL_TYPE_LABELS: Record<string, string> = {
  auto: "Automática",
  manual: "Manual",
};

function labelFrom(
  map: Record<string, string>,
  value: string | null | undefined,
): string {
  if (!value) return NAO_INFORMADO;
  return map[value] ?? value;
}

// Rotulos do activity_status (derivado no servidor de last_sign_in_at). So
// aparece no detalhe: a lista nao paga o scan de Auth necessario para saber isso.
const ACTIVITY_STATUS_LABELS: Record<UserDetail["activity_status"], string> = {
  active: "Ativo",
  inactive: "Inativo",
  never: "Nunca acessou",
};

function displayName(row: UserRow): string {
  if (row.name && row.name.trim()) return row.name.trim();
  const email = row.email || "";
  if (email.includes("@")) return email.split("@")[0];
  return "Usuário";
}

// Linha compacta de lista de definicao: rotulo pequeno em cima, valor embaixo,
// sem caixa. A hierarquia vem do peso da tipografia, nao de borda/fundo. Campo
// vazio (NAO_INFORMADO vindo dos formatadores) continua visivel, mas esmaecido:
// o admin ve que esta vazio sem o texto disputar peso com dado real.
function Field({ label, value }: { label: string; value: ReactNode }) {
  const isEmpty = value === NAO_INFORMADO;
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={
          isEmpty
            ? "break-words text-sm font-medium text-slate-400"
            : "break-words text-sm font-bold text-slate-950"
        }
      >
        {value}
      </p>
    </div>
  );
}

// TODO(Ana): revisar toda a copy do bloco de foto (rotulos de estado e avisos).
function AvatarBlock({ avatar }: { avatar: UserDetail["avatar"] }) {
  const [broken, setBroken] = useState(false);
  const url = avatar?.url ?? null;
  const status = avatar?.moderation_status ?? null;
  const showImage = Boolean(url) && !broken;

  const statusBadge =
    status === "pending_review"
      ? {
          label: "Aguardando aprovação",
          className: "border-amber-500 bg-amber-100 text-amber-900",
        }
      : status === "removed"
        ? {
            label: "Rejeitada pela moderação",
            className: "border-rose-500 bg-rose-100 text-rose-900",
          }
        : url
          ? {
              label: "Foto atual",
              className: "border-emerald-600 bg-emerald-100 text-emerald-900",
            }
          : null;

  return (
    <div className="flex items-start gap-4 rounded-2xl border-2 border-slate-900 bg-violet-50 p-4 sm:col-span-2">
      {showImage ? (
        <img
          src={url as string}
          alt="Foto do usuário"
          onError={() => setBroken(true)}
          className="h-24 w-24 shrink-0 rounded-2xl border-2 border-slate-900 object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-400 bg-white text-xs font-black uppercase text-slate-400">
          Sem foto
        </div>
      )}
      <div className="space-y-2">
        {statusBadge ? (
          <span
            className={`inline-block rounded-full border-2 px-3 py-1 text-xs font-black uppercase ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        ) : null}
        {status === "removed" ? (
          <p className="text-sm font-semibold text-slate-600">
            A foto enviada foi rejeitada e removida pela moderação.
          </p>
        ) : status === "pending_review" ? (
          <p className="text-sm font-semibold text-slate-600">
            Esta foto ainda não está pública: aguarda aprovação da moderação.
          </p>
        ) : !url ? (
          <p className="text-sm font-semibold text-slate-600">
            Este usuário não tem foto enviada.
          </p>
        ) : null}
        <p className="text-xs font-black uppercase tracking-wide text-violet-700">
          Modo do avatar: {avatar?.mode === "photo" ? "Foto" : "Ícone"}
        </p>
      </div>
    </div>
  );
}

function ActivityBlock({
  loading,
  error,
  state,
}: {
  loading: boolean;
  error: string | null;
  state: PosthogUserActivityState | null;
}) {
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!state) return <LoadingBlock />;

  if (state.state === "not_configured") {
    return (
      <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4">
        <p className="font-display text-base font-black text-amber-900">
          PostHog não configurado
        </p>
        <p className="mt-1 text-sm font-semibold text-amber-800">
          Faltando no servidor:{" "}
          {state.missing.length
            ? state.missing.join(", ")
            : "credenciais do PostHog"}
          .
        </p>
      </div>
    );
  }

  if (state.state === "error") {
    return (
      <ErrorBlock
        message={`Falha ao consultar o PostHog${
          typeof state.httpStatus === "number"
            ? ` (HTTP ${state.httpStatus})`
            : ""
        }: ${state.reason}`}
      />
    );
  }

  if (!state.hasData) {
    return (
      <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        Sem atividade registrada para este usuário.
      </div>
    );
  }

  const { features, navigation } = state.activity;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <p className="mb-2 font-display text-lg font-black text-slate-950">
          Funcionalidades usadas
        </p>
        {features.length ? (
          <ul className="space-y-2">
            {features.map((item) => (
              <li
                key={item.event}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-900 bg-white px-3 py-2"
              >
                <span className="break-all font-semibold text-slate-800">
                  {item.event}
                </span>
                <span className="rounded-full border-2 border-slate-900 bg-yellow-300 px-2 py-0.5 text-xs font-black">
                  {item.count}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-500">
            Nenhuma funcionalidade usada até agora.
          </div>
        )}
      </div>
      <div>
        <p className="mb-2 font-display text-lg font-black text-slate-950">
          Histórico de navegação
        </p>
        {navigation.length ? (
          <ul className="space-y-2">
            {navigation.map((item, index) => (
              <li
                key={`${item.timestamp}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-900 bg-white px-3 py-2"
              >
                <span className="break-all font-semibold text-slate-800">
                  {item.page}
                </span>
                <span className="whitespace-nowrap text-xs font-black text-slate-500">
                  {fmtDateTime(item.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-500">
            Nenhuma navegação registrada.
          </div>
        )}
      </div>
    </div>
  );
}

export function UsersDashboard() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserListFilter>("all");
  const [page, setPage] = useState(1);

  const [activeUserId, setActiveUserId] = useState<string | null>(null);

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

  // Debounce da busca: so dispara a query depois da pausa na digitacao. Mudar a
  // busca volta para a pagina 1 (a pagina atual pode nao existir no resultado).
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (search) params.set("search", search);
    if (filter !== "all") params.set("filter", filter);
    adminFetch(`/users?${params.toString()}`)
      .then((json) => {
        if (cancelled) return;
        const payload = (json.data as UsersListPayload) ?? null;
        setRows(Array.isArray(payload?.items) ? payload.items : []);
        setTotal(typeof payload?.total === "number" ? payload.total : 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setListError(
          err instanceof Error ? err.message : "Erro ao buscar usuários.",
        );
        setRows([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, filter, page]);

  function changeFilter(next: UserListFilter) {
    setFilter(next);
    setPage(1);
  }

  // Ao abrir o modal (activeUserId): busca o detalhe. A atividade PostHog NAO
  // vem junto: fica para a primeira abertura do dropdown "Mais informacoes"
  // (efeito abaixo), evitando chamada a toa em modal que nunca expande.
  useEffect(() => {
    if (!activeUserId) {
      setDetail(null);
      setDetailError(null);
      setActivity(null);
      setActivityError(null);
      setRevealedCpf(null);
      setRevealError(null);
      setMoreOpen(false);
      setActivityRequested(false);
      setGrantOpen(false);
      setGrantNote("");
      setRevokeConfirm(false);
      setInfluencerError(null);
      return;
    }

    let cancelled = false;

    setDetailLoading(true);
    setDetailError(null);
    setRevealedCpf(null);
    setRevealError(null);
    setGrantOpen(false);
    setGrantNote("");
    setRevokeConfirm(false);
    setInfluencerError(null);
    adminFetch(`/users/${activeUserId}`)
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
  }, [activeUserId, detailVersion]);

  // Fetch preguicoso da atividade PostHog: dispara uma unica vez por usuario,
  // quando o dropdown abre pela primeira vez.
  useEffect(() => {
    if (!activeUserId || !moreOpen || activityRequested) return;

    let cancelled = false;
    setActivityRequested(true);
    setActivityLoading(true);
    setActivityError(null);
    adminFetch(`/users/${activeUserId}/activity`)
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
  }, [activeUserId, moreOpen, activityRequested]);

  async function handleGrantInfluencer() {
    if (!activeUserId || influencerBusy) return;
    setInfluencerBusy(true);
    setInfluencerError(null);
    try {
      await adminFetch(`/users/${activeUserId}/influencer`, {
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
    if (!activeUserId || influencerBusy) return;
    setInfluencerBusy(true);
    setInfluencerError(null);
    try {
      await adminFetch(`/users/${activeUserId}/influencer/revoke`, {
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
    if (!activeUserId) return;
    setRevealing(true);
    setRevealError(null);
    try {
      const json = await adminFetch(`/users/${activeUserId}/reveal-cpf`, {
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* TODO(Ana): revisar copy da busca, filtros, paginacao e estado vazio. */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="min-w-[220px] flex-1 rounded-2xl border-2 border-slate-900 bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-[3px_3px_0_#0f172a] outline-none placeholder:text-slate-400 focus:bg-yellow-50"
        />
        <div className="flex flex-wrap overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[3px_3px_0_#0f172a]">
          {(
            [
              { value: "all", label: "Todos" },
              { value: "pro", label: "Pro" },
              { value: "not_pro", label: "Não-Pro" },
              { value: "influencers", label: "Influencers" },
              { value: "ativo", label: "Ativo" },
            ] as Array<{ value: UserListFilter; label: string }>
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeFilter(option.value)}
              className={`-ml-0.5 -mt-0.5 border-l-2 border-t-2 border-slate-900 px-4 py-2.5 text-sm font-black uppercase ${
                filter === option.value
                  ? "bg-yellow-300 text-slate-950"
                  : "bg-white text-slate-500 hover:bg-yellow-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <article className="card-brutal overflow-hidden rounded-3xl bg-white">
        {listLoading ? (
          <div className="p-6">
            <LoadingBlock />
          </div>
        ) : listError ? (
          <div className="p-6">
            <ErrorBlock message={listError} />
          </div>
        ) : rows.length ? (
          rows.map((row, index) => (
            <button
              key={row.user_id || row.id || row.email || `row-${index}`}
              type="button"
              onClick={() => setActiveUserId(row.user_id ?? null)}
              disabled={!row.user_id}
              className="grid w-full gap-1 border-b-2 border-slate-100 p-4 text-left transition hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="font-display text-lg font-black text-slate-950">
                {displayName(row)}
              </p>
              <p className="text-sm font-semibold text-slate-500">
                {row.email || "sem e-mail"}
              </p>
            </button>
          ))
        ) : (
          <div className="p-6">
            <p className="font-display text-xl font-black text-slate-950">
              Nenhum usuário encontrado
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {search || filter !== "all"
                ? "Nenhum resultado para a busca ou filtro atual. Ajuste os critérios e tente de novo."
                : "A lista é preenchida com os perfis retornados por /api/admin/users."}
            </p>
          </div>
        )}
      </article>

      {!listLoading && !listError ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-wide text-slate-600">
            {total} resultado{total === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#0f172a] disabled:opacity-40 disabled:shadow-none"
            >
              Anterior
            </button>
            <span className="text-sm font-black text-slate-950">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#0f172a] disabled:opacity-40 disabled:shadow-none"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}

      {activeUserId ? (
        <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="card-brutal my-8 w-full max-w-3xl rounded-3xl bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-black text-slate-950">
                  {detail ? fmtText(detail.name) : "Carregando..."}
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  {detail?.email || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveUserId(null)}
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
                        Revelar o CPF fica registrado em auditoria (quem
                        revelou, de quem e quando).
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
                          value={ACTIVITY_STATUS_LABELS[detail.activity_status]}
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
