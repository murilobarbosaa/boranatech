import { useCallback, useEffect, useRef, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

// TODO(Ana): revisar TODA a copy visivel deste bloco (titulos, passos do import,
// avisos, rotulos de status, botoes e mensagens de estado).

type ImportSource = "paste" | "csv" | "xlsx" | "pdf";
type MemberStatus = "valid" | "invalid" | "duplicate" | "suppressed";

type MemberReport = {
  email: string;
  name: string | null;
  status: MemberStatus;
  invalidReason: string | null;
  userId: string | null;
  rawLine: string;
};

type ImportReport = {
  source: ImportSource;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  suppressedCount: number;
  existingUserCount: number;
  members: MemberReport[];
};

type ContactList = {
  id: string;
  name: string;
  source: ImportSource;
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  duplicate_count: number;
  suppressed_count: number;
  original_filename: string | null;
  lgpd_basis: string;
  created_at: string;
};

type ListsData = { rows: ContactList[]; total: number };

const STATUS_META: Record<MemberStatus, { label: string; className: string }> = {
  valid: { label: "Válido", className: "border-emerald-600 bg-emerald-50 text-emerald-700" },
  invalid: { label: "Inválido", className: "border-rose-400 bg-rose-50 text-rose-700" },
  duplicate: { label: "Duplicado", className: "border-amber-500 bg-amber-50 text-amber-700" },
  suppressed: { label: "Suprimido", className: "border-slate-400 bg-slate-100 text-slate-600" },
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function extToSource(filename: string): ImportSource | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "xlsx";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${meta.className}`}>
      {meta.label}
    </span>
  );
}

// Numeros grandes do relatorio.
function ReportTile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`rounded-2xl border-2 border-slate-900 p-4 ${tone ?? "bg-white"}`}>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="font-display text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

type Step = "source" | "preview" | "declare";

function ImportWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<Step>("source");
  const [mode, setMode] = useState<"paste" | "file">("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [filter, setFilter] = useState<"all" | MemberStatus>("all");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lgpdBasis, setLgpdBasis] = useState("");
  const [lgpdNote, setLgpdNote] = useState("");
  const [footerReason, setFooterReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function runPreview() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      let body: Record<string, unknown>;
      if (mode === "paste") {
        if (!text.trim()) {
          setError("Cole ao menos um e-mail.");
          setLoading(false);
          return;
        }
        body = { source: "paste", text };
      } else {
        if (!file) {
          setError("Escolha um arquivo.");
          setLoading(false);
          return;
        }
        if (file.size > MAX_FILE_BYTES) {
          setError("Arquivo acima de 5 MB. Envie um arquivo menor.");
          setLoading(false);
          return;
        }
        const source = extToSource(file.name);
        if (!source) {
          setError("Formato não suportado. Use CSV, XLSX ou PDF.");
          setLoading(false);
          return;
        }
        const fileBase64 = await fileToBase64(file);
        body = { source, fileBase64, filename: file.name };
      }
      const json = await adminFetch("/contact-lists/preview", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setReport(json.data as ImportReport);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar o arquivo.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSave() {
    if (!report) return;
    if (!name.trim()) {
      setSaveError("Dê um nome à lista.");
      return;
    }
    if (!lgpdBasis.trim()) {
      setSaveError("Declare a base legal (LGPD) antes de salvar.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await adminFetch("/contact-lists", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          source: report.source,
          original_filename: file?.name ?? null,
          lgpd_basis: lgpdBasis.trim(),
          lgpd_note: lgpdNote.trim() || null,
          footer_reason: footerReason.trim() || null,
          members: report.members,
        }),
      });
      onCreated();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar a lista.");
    } finally {
      setSaving(false);
    }
  }

  const filteredMembers =
    report && filter !== "all"
      ? report.members.filter((m) => m.status === filter)
      : (report?.members ?? []);

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="card-brutal my-8 w-full max-w-3xl rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-black text-slate-950">
            Importar lista de contatos
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black"
          >
            Fechar
          </button>
        </div>

        {/* Aviso permanente: importar nao envia. */}
        <p className="mt-3 rounded-2xl border-2 border-slate-900 bg-yellow-100 p-3 text-sm font-black text-slate-800">
          {/* TODO(Ana): copy do aviso de que importar nao envia. */}
          Importar não envia e-mail. Isto só cria a lista. O envio é um segundo
          passo, explícito, na criação de uma campanha.
        </p>

        {step === "source" ? (
          <div className="mt-5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase ${mode === "paste" ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}
              >
                Colar texto
              </button>
              <button
                type="button"
                onClick={() => setMode("file")}
                className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase ${mode === "file" ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}
              >
                Enviar arquivo
              </button>
            </div>

            {mode === "paste" ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Um e-mail por linha, ou separados por vírgula. Aceita Nome <email@dominio.com>."
                className="mt-3 block w-full rounded-2xl border-2 border-slate-900 bg-white p-3 text-sm font-semibold"
              />
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) setFile(dropped);
                }}
                className={`mt-3 rounded-2xl border-2 border-dashed p-8 text-center ${dragOver ? "border-violet-700 bg-violet-50" : "border-slate-400 bg-slate-50"}`}
              >
                <p className="text-sm font-black text-slate-700">
                  {file ? file.name : "Arraste um arquivo aqui ou clique para escolher"}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  CSV, XLSX ou PDF. Máximo 5 MB.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black"
                >
                  Escolher arquivo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file && extToSource(file.name) === "pdf" ? (
                  <p className="mt-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-2 text-xs font-black text-amber-900">
                    {/* TODO(Ana): aviso de PDF impreciso. */}
                    Extração de PDF é imprecisa. Confira o preview linha a linha
                    antes de salvar.
                  </p>
                ) : null}
              </div>
            )}

            {error ? <div className="mt-3"><ErrorBlock message={error} /></div> : null}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void runPreview()}
                disabled={loading}
                className="rounded-full border-2 border-slate-900 bg-yellow-300 px-5 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a] disabled:opacity-50"
              >
                {loading ? "Processando..." : "Gerar preview"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "preview" && report ? (
          <div className="mt-5">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <ReportTile label="Total" value={report.totalRows} />
              <ReportTile label="Válidos" value={report.validCount} tone="bg-emerald-50" />
              <ReportTile label="Inválidos" value={report.invalidCount} tone="bg-rose-50" />
              <ReportTile label="Duplicados" value={report.duplicateCount} tone="bg-amber-50" />
              <ReportTile label="Suprimidos" value={report.suppressedCount} tone="bg-slate-100" />
              <ReportTile label="Já usuários" value={report.existingUserCount} tone="bg-violet-50" />
            </div>

            {report.source === "pdf" ? (
              <p className="mt-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-3 text-sm font-black text-amber-900">
                {/* TODO(Ana): aviso de PDF no preview. */}
                Esta lista veio de um PDF. A extração é imprecisa: confira linha a
                linha abaixo antes de confirmar.
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {(["all", "valid", "invalid", "duplicate", "suppressed"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black uppercase ${filter === f ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}
                >
                  {f === "all" ? "Todos" : STATUS_META[f].label}
                </button>
              ))}
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border-2 border-slate-900">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b-2 border-slate-900">
                    <th className="px-3 py-2 font-black uppercase text-slate-600">E-mail</th>
                    <th className="px-3 py-2 font-black uppercase text-slate-600">Status</th>
                    <th className="px-3 py-2 font-black uppercase text-slate-600">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m, i) => (
                    <tr key={`${m.email}-${i}`} className="border-b border-slate-200 last:border-0">
                      <td className="px-3 py-2 font-semibold text-slate-900">
                        {m.email || <span className="text-slate-400">(vazio)</span>}
                        {m.userId ? (
                          <span className="ml-2 rounded-full border border-violet-300 bg-violet-50 px-1.5 text-xs font-black text-violet-700">
                            já usuário
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2"><StatusBadge status={m.status} /></td>
                      <td className="px-3 py-2 text-slate-500">{m.invalidReason ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep("source")}
                className="rounded-full border-2 border-slate-900 bg-white px-5 py-2 text-sm font-black"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep("declare")}
                className="rounded-full border-2 border-slate-900 bg-yellow-300 px-5 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a]"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : null}

        {step === "declare" && report ? (
          <div className="mt-5 space-y-3">
            <p className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3 text-sm font-black text-slate-800">
              {/* TODO(Ana): copy da declaracao LGPD. */}
              Declare a base legal (LGPD) desta lista. Sem isso, a lista não é
              salva.
            </p>
            <label className="block text-xs font-black uppercase text-slate-600">
              Nome da lista
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
              />
            </label>
            <label className="block text-xs font-black uppercase text-slate-600">
              Descrição (opcional)
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
              />
            </label>
            <label className="block text-xs font-black uppercase text-slate-600">
              Base legal (LGPD)
              <input
                value={lgpdBasis}
                onChange={(e) => setLgpdBasis(e.target.value)}
                placeholder="Ex: consentimento, legítimo interesse..."
                className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
              />
            </label>
            <label className="block text-xs font-black uppercase text-slate-600">
              De onde veio a lista / como foi obtido o consentimento
              <textarea
                value={lgpdNote}
                onChange={(e) => setLgpdNote(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white p-2 text-sm font-semibold"
              />
              {/* TODO(Ana): copy do aviso de que o campo acima e nota interna. */}
              <span className="mt-1 block text-[11px] font-semibold normal-case text-slate-500">
                Nota interna. O destinatário não lê isto.
              </span>
            </label>

            <label className="block text-xs font-black uppercase text-slate-600">
              {/* TODO(Ana): rotulo do campo da frase de rodape do e-mail. */}
              Frase de rodapé do e-mail (o destinatário lê)
              <textarea
                value={footerReason}
                onChange={(e) => setFooterReason(e.target.value)}
                rows={2}
                placeholder="Ex: Você está recebendo este e-mail porque baixou nosso ebook."
                className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white p-2 text-sm font-semibold"
              />
              {/* TODO(Ana): copy do aviso de que esta frase aparece no e-mail. */}
              <span className="mt-1 block text-[11px] font-semibold normal-case text-slate-500">
                Vai no rodapé do e-mail que esta lista receber, explicando de
                forma honesta como o contato chegou até você. Se ficar em branco,
                usamos uma frase neutra.
              </span>
            </label>

            {saveError ? <ErrorBlock message={saveError} /> : null}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="rounded-full border-2 border-slate-900 bg-white px-5 py-2 text-sm font-black"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => void confirmSave()}
                disabled={saving}
                className="rounded-full border-2 border-slate-900 bg-emerald-300 px-5 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a] disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Confirmar e salvar lista"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ListDetail({
  listId,
  onClose,
  onDeleted,
}: {
  listId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [data, setData] = useState<{
    list: ContactList;
    members: MemberReport[];
    pagination: { page: number; pageSize: number; total: number };
  } | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | MemberStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: "50" });
        if (status !== "all") params.set("status", status);
        const json = await adminFetch(`/contact-lists/${listId}?${params.toString()}`);
        if (cancelled) return;
        setData(
          json.data as {
            list: ContactList;
            members: MemberReport[];
            pagination: { page: number; pageSize: number; total: number };
          },
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar a lista.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [listId, page, status]);

  async function handleExport() {
    // Baixa o CSV com o token de admin no header (fetch direto, nao um <a>).
    const { data: sessionData } = supabase
      ? await supabase.auth.getSession()
      : { data: { session: null } };
    const token = sessionData.session?.access_token ?? "";
    const res = await fetch(
      apiUrl(`/api/admin/contact-lists/${listId}/export`),
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contact-list-${listId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminFetch(`/contact-lists/${listId}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir a lista.");
      setDeleting(false);
    }
  }

  const members = data?.members ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="card-brutal my-8 w-full max-w-3xl rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-black text-slate-950">
            {data?.list.name ?? "Lista"}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleExport()}
              className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-1 text-xs font-black text-rose-800 disabled:opacity-50"
            >
              {deleting ? "Excluindo..." : "Excluir lista"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black"
            >
              Fechar
            </button>
          </div>
        </div>

        {data ? (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {data.list.valid_count} válidos · base LGPD: {data.list.lgpd_basis}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "valid", "invalid", "duplicate", "suppressed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setStatus(f);
                setPage(1);
              }}
              className={`rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black uppercase ${status === f ? "bg-slate-950 text-white" : "bg-white text-slate-700"}`}
            >
              {f === "all" ? "Todos" : STATUS_META[f].label}
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border-2 border-slate-900">
          {loading && !data ? (
            <div className="p-4"><LoadingBlock label="Carregando contatos..." /></div>
          ) : error ? (
            <div className="p-4"><ErrorBlock message={error} /></div>
          ) : members.length === 0 ? (
            <p className="p-6 text-sm font-semibold text-slate-600">
              Nenhum contato neste filtro.
            </p>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="px-3 py-2 font-black uppercase text-slate-600">E-mail</th>
                  <th className="px-3 py-2 font-black uppercase text-slate-600">Status</th>
                  <th className="px-3 py-2 font-black uppercase text-slate-600">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={`${m.email}-${i}`} className="border-b border-slate-200 last:border-0">
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {m.email}
                      {m.userId ? (
                        <span className="ml-2 rounded-full border border-violet-300 bg-violet-50 px-1.5 text-xs font-black text-violet-700">
                          já usuário
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2"><StatusBadge status={m.status} /></td>
                    <td className="px-3 py-2 text-slate-500">{m.invalidReason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > 50 ? (
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page * 50 >= total || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ContactListsManager() {
  const [data, setData] = useState<ListsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetch("/contact-lists?page=1&pageSize=50");
      setData(json.data as ListsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar as listas.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = data?.rows ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {/* TODO(Ana): titulo e subtitulo do bloco de listas de contatos. */}
          <h3 className="font-display text-2xl font-black text-slate-950">
            Listas de contatos
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Contatos importados de fora da plataforma. Importar não envia e-mail;
            o envio é um passo separado na campanha.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="rounded-full border-2 border-slate-900 bg-yellow-300 px-5 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a]"
        >
          Importar lista
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[4px_4px_0_#0f172a]">
        {loading && !data ? (
          <div className="p-4"><LoadingBlock label="Carregando listas..." /></div>
        ) : error ? (
          <div className="p-4"><ErrorBlock message={error} /></div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            Nenhuma lista importada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Nome</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Origem</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Válidos</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Total</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Criada</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((list) => (
                  <tr
                    key={list.id}
                    onClick={() => setDetailId(list.id)}
                    className="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-yellow-50"
                  >
                    <td className="px-4 py-3 font-black text-slate-900">{list.name}</td>
                    <td className="px-4 py-3 uppercase text-slate-600">{list.source}</td>
                    <td className="px-4 py-3 font-black text-emerald-700">{list.valid_count}</td>
                    <td className="px-4 py-3 text-slate-600">{list.total_rows}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(list.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {wizardOpen ? (
        <ImportWizard
          onClose={() => setWizardOpen(false)}
          onCreated={() => {
            setWizardOpen(false);
            void load();
          }}
        />
      ) : null}
      {detailId ? (
        <ListDetail
          listId={detailId}
          onClose={() => setDetailId(null)}
          onDeleted={() => {
            setDetailId(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
