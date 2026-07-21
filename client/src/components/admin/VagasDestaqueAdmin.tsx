import { useCallback, useEffect, useState } from "react";
import { Clock3, PencilLine, PlusCircle, RefreshCcw, Star } from "lucide-react";
import { toast } from "sonner";
import {
  createVagaAdmin,
  fetchVagasAdmin,
  updateVagaAdmin,
  type AdminVagaItem,
  type VagaAdminCreatePayload,
  type VagaContract,
  type VagaModality,
  type VagaSeniority,
} from "@/services/vagasService";
import { cn } from "@/lib/utils";
import { BntSelect } from "@/components/shared/BntSelect";

// Secao "Vagas em destaque" do painel admin (front VAGAS, fase 4): CRUD das
// vagas manuais (source='manual') via endpoints dedicados com validacao Zod
// no server. O editor generico de external_jobs (aba Conteudo) segue vivo
// como ferramenta bruta; este form e o caminho correto para destaque.

// Espelho de ADZUNA_COUNTRIES do config do server + a ordem com br primeiro.
const COUNTRY_OPTIONS = [
  "br",
  "us",
  "ca",
  "gb",
  "de",
  "fr",
  "es",
  "it",
  "nl",
  "pl",
  "at",
];

const CURRENCY_OPTIONS = ["BRL", "USD", "EUR", "GBP", "CAD", "PLN"];

const SENIORITY_OPTIONS: { value: VagaSeniority; label: string }[] = [
  { value: "estagio", label: "Estágio" },
  { value: "junior", label: "Júnior" },
  { value: "pleno", label: "Pleno" },
  { value: "senior", label: "Sênior" },
];

const CONTRACT_OPTIONS: { value: VagaContract; label: string }[] = [
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
];

const MODALITY_OPTIONS: { value: VagaModality; label: string }[] = [
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Híbrido" },
  { value: "onsite", label: "Presencial" },
];

type FormState = {
  title: string;
  company: string;
  location: string;
  country: string;
  url: string;
  seniority: "" | VagaSeniority;
  contract: "" | VagaContract;
  modality: "" | VagaModality;
  description: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  featured: boolean;
  featuredUntil: string;
  published: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  company: "",
  location: "",
  country: "br",
  url: "",
  seniority: "",
  contract: "",
  modality: "",
  description: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "",
  featured: true,
  featuredUntil: "",
  published: true,
};

const inputClass =
  "mt-2 w-full rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-200";
const labelClass = "text-sm font-black text-slate-950";
// Sentinela de borda p/ o BntSelect (Radix proibe SelectItem value=""). Aqui "" e
// uma escolha legitima ("Nao informar"/"Sem salario informado"): mapeamos "" <->
// sentinela SO na camada de UI (value/onValueChange). O state segue "" e o
// payloadFromForm (campo || undefined) continua gravando undefined, nao a sentinela.
const NAO_INFORMAR = "__none__";

type ListStatus = "loading" | "error" | "ready";

function isEnumValue<T extends string>(
  value: string,
  options: { value: T; label: string }[],
): value is T {
  return options.some((option) => option.value === value);
}

function formFromItem(item: AdminVagaItem): FormState {
  return {
    title: item.title,
    company: item.company ?? "",
    location: item.location ?? "",
    country: item.country ?? "br",
    url: item.url,
    seniority:
      item.seniority && isEnumValue(item.seniority, SENIORITY_OPTIONS)
        ? item.seniority
        : "",
    contract:
      item.contract && isEnumValue(item.contract, CONTRACT_OPTIONS)
        ? item.contract
        : "",
    modality:
      item.modality && isEnumValue(item.modality, MODALITY_OPTIONS)
        ? item.modality
        : "",
    description: item.description ?? "",
    salaryMin: item.salaryMin !== null ? String(item.salaryMin) : "",
    salaryMax: item.salaryMax !== null ? String(item.salaryMax) : "",
    salaryCurrency: item.salaryCurrency ?? "",
    featured: item.featured,
    featuredUntil: item.featuredUntil ? item.featuredUntil.slice(0, 10) : "",
    published: item.published,
  };
}

function payloadFromForm(form: FormState): VagaAdminCreatePayload {
  return {
    title: form.title.trim(),
    company: form.company.trim(),
    location: form.location.trim(),
    country: form.country,
    url: form.url.trim(),
    seniority: form.seniority || undefined,
    contract: form.contract || undefined,
    modality: form.modality || undefined,
    description: form.description.trim() || undefined,
    salary_min: form.salaryMin ? Number(form.salaryMin) : undefined,
    salary_max: form.salaryMax ? Number(form.salaryMax) : undefined,
    salary_currency: form.salaryCurrency || undefined,
    featured: form.featured,
    featured_until: form.featuredUntil || undefined,
    published: form.published,
  };
}

function mutationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("INVALID_REQUEST:")) {
    return message.slice("INVALID_REQUEST:".length).trim();
  }
  // TODO(Ana): validar as mensagens de erro do form de vagas destaque.
  if (message === "CONFLICT") {
    return "Já existe uma vaga com essa URL.";
  }
  if (message === "ADMIN_REQUIRED") {
    return "Acesso administrativo necessário.";
  }
  return "Erro ao salvar. Tente novamente.";
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return "-";
  return new Date(ts).toLocaleDateString("pt-BR");
}

function isExpired(item: AdminVagaItem): boolean {
  return (
    item.featured &&
    item.featuredUntil !== null &&
    Date.parse(item.featuredUntil) < Date.now()
  );
}

export default function VagasDestaqueAdmin() {
  const [status, setStatus] = useState<ListStatus>("loading");
  const [items, setItems] = useState<AdminVagaItem[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<AdminVagaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await fetchVagasAdmin();
      setItems(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(item: AdminVagaItem) {
    setEditing(item);
    setForm(formFromItem(item));
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Validacoes client espelhando o Zod do server (o server segue sendo a
    // barreira real).
    if (!/^https:\/\/.+/.test(form.url.trim())) {
      // TODO(Ana): validar a mensagem de url invalida.
      toast.error("A URL da vaga precisa começar com https://");
      return;
    }
    if ((form.salaryMin || form.salaryMax) && !form.salaryCurrency) {
      // TODO(Ana): validar a mensagem de moeda obrigatoria.
      toast.error("Informe a moeda quando houver valor de salário.");
      return;
    }

    setSaving(true);
    try {
      const payload = payloadFromForm(form);
      if (editing) {
        await updateVagaAdmin(editing.id, payload);
        // TODO(Ana): validar as mensagens de sucesso.
        toast.success("Vaga atualizada com sucesso.");
      } else {
        await createVagaAdmin(payload);
        toast.success("Vaga criada com sucesso.");
      }
      cancelEdit();
      await loadItems();
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: AdminVagaItem) {
    setBusyId(item.id);
    try {
      await updateVagaAdmin(item.id, { published: !item.published });
      // TODO(Ana): validar as mensagens de publicar/despublicar.
      toast.success(
        item.published ? "Vaga despublicada." : "Vaga publicada.",
      );
      await loadItems();
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-black text-slate-950">
          {/* TODO(Ana): validar titulo e copy da secao. */}
          Vagas em destaque
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Vagas manuais (source manual) exibidas na seção Destaques da página
          de vagas.
        </p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          <Clock3 className="h-4 w-4" aria-hidden />
          {/* TODO(Ana): validar a copy da nota de cache. */}
          Alterações podem levar até 2 minutos para aparecer na página de
          vagas.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-[5px_5px_0_#0f172a]"
      >
        <h3 className="font-display text-lg font-black text-slate-950">
          {editing ? "Editar vaga destaque" : "Nova vaga destaque"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Título
            <input
              required
              minLength={3}
              maxLength={160}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Empresa
            <input
              required
              maxLength={120}
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Localização
            <input
              required
              maxLength={120}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            País
            <BntSelect
              accent="gold"
              label="País"
              className="mt-2"
              value={form.country}
              onValueChange={(v) => set("country", v)}
              options={COUNTRY_OPTIONS.map((cc) => ({
                value: cc,
                label: cc.toUpperCase(),
              }))}
            />
          </label>
          <label className={cn(labelClass, "md:col-span-2")}>
            URL da vaga (https)
            <input
              required
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Nível
            <BntSelect
              accent="gold"
              label="Nível"
              className="mt-2"
              value={form.seniority === "" ? NAO_INFORMAR : form.seniority}
              onValueChange={(v) =>
                set(
                  "seniority",
                  (v === NAO_INFORMAR ? "" : v) as FormState["seniority"],
                )
              }
              options={[
                { value: NAO_INFORMAR, label: "Não informar" },
                ...SENIORITY_OPTIONS,
              ]}
            />
          </label>
          <label className={labelClass}>
            Contrato
            <BntSelect
              accent="gold"
              label="Contrato"
              className="mt-2"
              value={form.contract === "" ? NAO_INFORMAR : form.contract}
              onValueChange={(v) =>
                set(
                  "contract",
                  (v === NAO_INFORMAR ? "" : v) as FormState["contract"],
                )
              }
              options={[
                { value: NAO_INFORMAR, label: "Não informar" },
                ...CONTRACT_OPTIONS,
              ]}
            />
          </label>
          <label className={labelClass}>
            Modalidade
            <BntSelect
              accent="gold"
              label="Modalidade"
              className="mt-2"
              value={form.modality === "" ? NAO_INFORMAR : form.modality}
              onValueChange={(v) =>
                set(
                  "modality",
                  (v === NAO_INFORMAR ? "" : v) as FormState["modality"],
                )
              }
              options={[
                { value: NAO_INFORMAR, label: "Não informar" },
                ...MODALITY_OPTIONS,
              ]}
            />
          </label>
          <label className={cn(labelClass, "md:col-span-2")}>
            Descrição
            <textarea
              maxLength={4000}
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Salário mínimo
            <input
              type="number"
              min={0}
              value={form.salaryMin}
              onChange={(e) => set("salaryMin", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Salário máximo
            <input
              type="number"
              min={0}
              value={form.salaryMax}
              onChange={(e) => set("salaryMax", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Moeda do salário
            <BntSelect
              accent="gold"
              label="Moeda do salário"
              className="mt-2"
              value={
                form.salaryCurrency === "" ? NAO_INFORMAR : form.salaryCurrency
              }
              onValueChange={(v) =>
                set("salaryCurrency", v === NAO_INFORMAR ? "" : v)
              }
              options={[
                { value: NAO_INFORMAR, label: "Sem salário informado" },
                ...CURRENCY_OPTIONS.map((currency) => ({
                  value: currency,
                  label: currency,
                })),
              ]}
            />
          </label>
          <label className={labelClass}>
            Destacar até (opcional)
            <input
              type="date"
              value={form.featuredUntil}
              onChange={(e) => set("featuredUntil", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm font-black text-slate-950">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Em destaque
          </label>
          <label className="flex items-center gap-2 text-sm font-black text-slate-950">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Publicada
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-900 bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            {saving
              ? "Salvando..."
              : editing
                ? "Salvar alterações"
                : "Criar vaga destaque"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-2xl border-2 border-slate-900 bg-white px-5 py-2.5 text-sm font-black text-slate-900 shadow-[3px_3px_0_#0f172a]"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>

      <div className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-[5px_5px_0_#0f172a]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-black text-slate-950">
            Vagas manuais cadastradas
          </h3>
          <button
            type="button"
            onClick={() => void loadItems()}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-900"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
            Atualizar
          </button>
        </div>

        {status === "loading" ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4">
            {/* TODO(Ana): validar a copy do erro da tabela. */}
            <p className="text-sm font-bold text-rose-800">
              Não conseguimos carregar as vagas manuais.
            </p>
            <button
              type="button"
              onClick={() => void loadItems()}
              className="mt-2 rounded-xl border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-900"
            >
              Tentar de novo
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm font-medium text-slate-600">
            {/* TODO(Ana): validar a copy do vazio da tabela. */}
            Nenhuma vaga manual cadastrada ainda. Crie a primeira no form
            acima.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Título</th>
                  <th className="py-2 pr-3">Empresa</th>
                  <th className="py-2 pr-3">País</th>
                  <th className="py-2 pr-3">Destaque</th>
                  <th className="py-2 pr-3">Destaque até</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 align-top"
                  >
                    <td className="max-w-[240px] py-3 pr-3 font-bold text-slate-900">
                      {item.title}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">
                      {item.company ?? "-"}
                    </td>
                    <td className="py-3 pr-3 uppercase text-slate-700">
                      {item.country ?? "-"}
                    </td>
                    <td className="py-3 pr-3">
                      {item.featured ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black",
                            isExpired(item)
                              ? "bg-amber-100 text-amber-800"
                              : "bg-cyan-100 text-cyan-800",
                          )}
                        >
                          <Star className="h-3 w-3" aria-hidden />
                          {isExpired(item) ? "Expirado" : "Sim"}
                        </span>
                      ) : (
                        <span className="text-slate-400">Não</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">
                      {formatDate(item.featuredUntil)}
                    </td>
                    <td className="py-3 pr-3">
                      {item.published ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                          Publicada
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-black text-rose-800">
                          Despublicada
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">
                      {formatDate(item.publishedAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center gap-1 rounded-xl border-2 border-slate-900 bg-white px-2.5 py-1 text-xs font-black text-slate-900"
                        >
                          <PencilLine className="h-3 w-3" aria-hidden />
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void togglePublished(item)}
                          className="rounded-xl border-2 border-slate-900 bg-white px-2.5 py-1 text-xs font-black text-slate-900 disabled:opacity-60"
                        >
                          {busyId === item.id
                            ? "..."
                            : item.published
                              ? "Despublicar"
                              : "Publicar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
