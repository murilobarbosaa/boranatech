import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { callAiTool } from "@/lib/aiClient";

function getAiErrorMessage(err: unknown) {
  if (!(err instanceof Error)) return "Não foi possível gerar a resposta agora.";
  if (err.message === "LOGIN_REQUIRED") return "Faça login para usar esta ferramenta.";
  if (err.message === "PRO_REQUIRED") return "Esta ferramenta requer o Plano Pro.";
  if (err.message.startsWith("RATE_LIMITED")) return err.message.replace("RATE_LIMITED: ", "");
  return err.message || "Não foi possível gerar a resposta agora.";
}

interface AiToolPanelProps {
  endpoint: string;
  title: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type?: "text" | "textarea" | "select";
    placeholder?: string;
    options?: string[];
  }>;
  buttonLabel?: string;
}

export default function AiToolPanel({ endpoint, title, description, fields, buttonLabel = "Gerar análise" }: AiToolPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await callAiTool(endpoint, values);
      setResult(response.result);
    } catch (err) {
      setError(getAiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-brutal rounded-2xl bg-white p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl border-2 border-slate-900 bg-violet-700 p-3 text-white shadow-[3px_3px_0_#0f172a]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1 block text-sm font-black text-slate-800">{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                className="min-h-28 w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-violet-200"
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              />
            ) : field.type === "select" ? (
              <select
                className="w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-violet-200"
                value={values[field.name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              >
                <option value="">Selecione</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-violet-200"
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              />
            )}
          </label>
        ))}

        <button
          type="submit"
          className="group inline-flex items-center gap-3 rounded-2xl border-2 border-slate-950 bg-violet-700 px-6 py-3 text-left text-white shadow-[5px_5px_0_#0f172a] transition-all hover:-translate-y-0.5 hover:bg-violet-800 hover:shadow-[7px_7px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 text-slate-950 shadow-[3px_3px_0_#0f172a]">
            {loading ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-5 w-5" />}
          </span>
          <span>
            <span className="block text-[10px] font-black uppercase tracking-wide text-amber-100">executar com IA</span>
            <span className="block font-display font-black">{loading ? "Analisando..." : buttonLabel}</span>
          </span>
        </button>
      </form>

      {(result || error || loading) && (
        <div className="mt-6 rounded-2xl border-2 border-slate-900 bg-violet-50 p-5">
          {loading && <div className="h-24 animate-pulse rounded-xl bg-violet-100" />}
          {error && <p className="text-sm font-bold text-red-700">{error}</p>}
          {result && <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-slate-800">{result}</pre>}
        </div>
      )}
    </div>
  );
}
