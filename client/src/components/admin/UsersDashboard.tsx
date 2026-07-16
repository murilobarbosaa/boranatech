import { useEffect, useState, type ReactNode } from "react";

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

// Espelha o payload de GET /users/:id (CPF ja mascarado; sem campos de moderacao
// de avatar nem o blob de preferences).
type UserDetail = {
  user_id: string | null;
  name: string | null;
  full_name: string | null;
  email: string | null;
  gender: string | null;
  headline: string | null;
  bio: string | null;
  city: string | null;
  uf: string | null;
  area_interesse: string | null;
  nivel_atual: string | null;
  objetivo: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  onboarding_completed: boolean | null;
  onboarding_step: number | null;
  marketing_opt_in: boolean | null;
  marketing_opt_in_at: string | null;
  welcome_email_sent: boolean | null;
  cpf_masked: string | null;
  has_cpf: boolean;
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

function statusLabel(onboardingCompleted: boolean | null | undefined): string {
  return onboardingCompleted ? "Ativo" : "Cadastro incompleto";
}

function displayName(row: UserRow): string {
  if (row.name && row.name.trim()) return row.name.trim();
  const email = row.email || "";
  if (email.includes("@")) return email.split("@")[0];
  return "Usuário";
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-violet-700">
        {label}
      </p>
      <p className="mt-1 break-words font-display text-base font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function LinkValue({ url }: { url: string | null | undefined }) {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return <>{NAO_INFORMADO}</>;
  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noreferrer"
      className="text-violet-700 underline"
    >
      {trimmed}
    </a>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
        {title}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
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
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [subStatus, setSubStatus] = useState<string | null>(null);

  const [activity, setActivity] = useState<PosthogUserActivityState | null>(
    null,
  );
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [revealedCpf, setRevealedCpf] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    adminFetch("/users")
      .then((json) => {
        if (cancelled) return;
        setRows(Array.isArray(json.data) ? (json.data as UserRow[]) : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setListError(
          err instanceof Error ? err.message : "Erro ao buscar usuários.",
        );
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ao abrir o modal (activeUserId): busca detalhe, assinatura e atividade. Cada
  // fonte tem seu proprio estado; a falha de uma nao apaga as outras.
  useEffect(() => {
    if (!activeUserId) {
      setDetail(null);
      setDetailError(null);
      setSubStatus(null);
      setActivity(null);
      setActivityError(null);
      setRevealedCpf(null);
      setRevealError(null);
      return;
    }

    let cancelled = false;

    setDetailLoading(true);
    setDetailError(null);
    setRevealedCpf(null);
    setRevealError(null);
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
  }, [activeUserId]);

  // Assinatura real via /subscribers (mesmo lookup por email do painel).
  useEffect(() => {
    const email = detail?.email;
    if (!email) {
      setSubStatus(null);
      return;
    }
    let cancelled = false;
    adminFetch(`/subscribers?pageSize=25&search=${encodeURIComponent(email)}`)
      .then((json) => {
        if (cancelled) return;
        const list: Array<{
          userId: string | null;
          email: string | null;
          status: string | null;
        }> = Array.isArray(json.data?.rows) ? json.data.rows : [];
        const match =
          list.find((row) =>
            detail?.user_id
              ? row.userId === detail.user_id
              : row.email === email,
          ) ??
          list[0] ??
          null;
        setSubStatus(match?.status ?? null);
      })
      .catch(() => {
        if (!cancelled) setSubStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [detail?.email, detail?.user_id]);

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

  return (
    <div className="space-y-6">
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
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-lg font-black text-slate-950">
                  {displayName(row)}
                </p>
                <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black">
                  {statusLabel(row.onboarding_completed)}
                </span>
              </div>
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
              A lista é preenchida com os perfis retornados por
              /api/admin/users.
            </p>
          </div>
        )}
      </article>

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
                <Group title="Identificação">
                  <Field label="Nome" value={fmtText(detail.name)} />
                  <Field
                    label="Nome completo"
                    value={fmtText(detail.full_name)}
                  />
                  <Field label="E-mail" value={fmtText(detail.email)} />
                  <Field label="Gênero" value={fmtText(detail.gender)} />
                </Group>

                <Group title="Documento">
                  <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3 sm:col-span-2">
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
                </Group>

                <Group title="Localização">
                  <Field label="Cidade" value={fmtText(detail.city)} />
                  <Field label="UF" value={fmtText(detail.uf)} />
                </Group>

                <Group title="Perfil e carreira">
                  <Field label="Headline" value={fmtText(detail.headline)} />
                  <Field
                    label="Área de interesse"
                    value={fmtText(detail.area_interesse)}
                  />
                  <Field
                    label="Nível atual"
                    value={fmtText(detail.nivel_atual)}
                  />
                  <Field label="Objetivo" value={fmtText(detail.objetivo)} />
                  <Field label="Bio" value={fmtText(detail.bio)} />
                </Group>

                <Group title="Links">
                  <Field
                    label="GitHub"
                    value={<LinkValue url={detail.github_url} />}
                  />
                  <Field
                    label="LinkedIn"
                    value={<LinkValue url={detail.linkedin_url} />}
                  />
                  <Field
                    label="Site"
                    value={<LinkValue url={detail.website_url} />}
                  />
                </Group>

                <Group title="Assinatura e onboarding">
                  <Field
                    label="Assinatura"
                    value={subStatus || "Sem assinatura ativa"}
                  />
                  <Field
                    label="Onboarding"
                    value={detail.onboarding_completed ? "Concluído" : "Incompleto"}
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
                  <Field
                    label="Status"
                    value={statusLabel(detail.onboarding_completed)}
                  />
                </Group>

                <Group title="Marketing e sistema">
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
                  <Field label="Cadastro" value={fmtDate(detail.created_at)} />
                  <Field
                    label="Atualizado em"
                    value={fmtDateTime(detail.updated_at)}
                  />
                </Group>

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
