import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { callAiTool } from "@/lib/aiClient";
import type { PageHeroAccent } from "@/components/shared/PageHero";

function getAiErrorMessage(err: unknown) {
  if (!(err instanceof Error)) return "Não foi possível gerar a resposta agora.";
  if (err.message === "LOGIN_REQUIRED") return "Faça login para usar esta ferramenta.";
  if (err.message === "PRO_REQUIRED") return "Esta ferramenta requer o Plano Pro.";
  if (err.message.startsWith("RATE_LIMITED")) return err.message.replace("RATE_LIMITED: ", "");
  return err.message || "Não foi possível gerar a resposta agora.";
}

const ACCENT: Record<PageHeroAccent, {
  buttonBg: string;
  buttonHover: string;
  buttonText: string;
  buttonEyebrow: string;
  inputFocus: string;
  resultBg: string;
  skeletonBg: string;
}> = {
  violet:  { buttonBg: "bg-violet-700",  buttonHover: "hover:bg-violet-800",  buttonText: "text-white",     buttonEyebrow: "text-amber-100", inputFocus: "focus:ring-violet-200",  resultBg: "bg-violet-50",  skeletonBg: "bg-violet-100"  },
  emerald: { buttonBg: "bg-emerald-700", buttonHover: "hover:bg-emerald-800", buttonText: "text-white",     buttonEyebrow: "text-amber-100", inputFocus: "focus:ring-emerald-200", resultBg: "bg-emerald-50", skeletonBg: "bg-emerald-100" },
  blue:    { buttonBg: "bg-blue-700",    buttonHover: "hover:bg-blue-800",    buttonText: "text-white",     buttonEyebrow: "text-amber-100", inputFocus: "focus:ring-blue-200",    resultBg: "bg-blue-50",    skeletonBg: "bg-blue-100"    },
  amber:   { buttonBg: "bg-amber-500",   buttonHover: "hover:bg-amber-400",   buttonText: "text-slate-950", buttonEyebrow: "text-amber-900", inputFocus: "focus:ring-amber-300",   resultBg: "bg-amber-50",   skeletonBg: "bg-amber-100"   },
  sky:     { buttonBg: "bg-sky-700",     buttonHover: "hover:bg-sky-800",     buttonText: "text-white",     buttonEyebrow: "text-amber-100", inputFocus: "focus:ring-sky-200",     resultBg: "bg-sky-50",     skeletonBg: "bg-sky-100"     },
  cyan:    { buttonBg: "bg-cyan-700",    buttonHover: "hover:bg-cyan-800",    buttonText: "text-white",     buttonEyebrow: "text-amber-100", inputFocus: "focus:ring-cyan-200",    resultBg: "bg-cyan-50",    skeletonBg: "bg-cyan-100"    },
  fuchsia: { buttonBg: "bg-fuchsia-700", buttonHover: "hover:bg-fuchsia-800", buttonText: "text-white",     buttonEyebrow: "text-amber-100", inputFocus: "focus:ring-fuchsia-200", resultBg: "bg-fuchsia-50", skeletonBg: "bg-fuchsia-100" },
  orange:  { buttonBg: "bg-orange-700",  buttonHover: "hover:bg-orange-800",  buttonText: "text-white",     buttonEyebrow: "text-amber-100", inputFocus: "focus:ring-orange-200",  resultBg: "bg-orange-50",  skeletonBg: "bg-orange-100"  },
  rose:    { buttonBg: "bg-rose-700",    buttonHover: "hover:bg-rose-800",    buttonText: "text-white",     buttonEyebrow: "text-amber-100", inputFocus: "focus:ring-rose-200",    resultBg: "bg-rose-50",    skeletonBg: "bg-rose-100"    },
  teal:    { buttonBg: "bg-teal-700",    buttonHover: "hover:bg-teal-800",    buttonText: "text-white",     buttonEyebrow: "text-amber-100", inputFocus: "focus:ring-teal-200",    resultBg: "bg-teal-50",    skeletonBg: "bg-teal-100"    },
};

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
  accent?: PageHeroAccent;
}

export default function AiToolPanel({ endpoint, title, description, fields, buttonLabel = "Gerar análise", accent = "violet" }: AiToolPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const a = ACCENT[accent];

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
        <div className="rounded-xl border-2 border-slate-900 bg-amber-300 p-3 text-slate-950 shadow-[3px_3px_0_#0f172a]">
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
                className={`min-h-28 w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm outline-none focus:ring-4 ${a.inputFocus}`}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              />
            ) : field.type === "select" ? (
              <select
                className={`w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm font-bold outline-none focus:ring-4 ${a.inputFocus}`}
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
                className={`w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm outline-none focus:ring-4 ${a.inputFocus}`}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              />
            )}
          </label>
        ))}

        <button
          type="submit"
          className={`group inline-flex items-center gap-3 rounded-2xl border-2 border-slate-950 ${a.buttonBg} px-6 py-3 text-left ${a.buttonText} shadow-[5px_5px_0_#0f172a] transition-all hover:-translate-y-0.5 ${a.buttonHover} hover:shadow-[7px_7px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-70`}
          disabled={loading}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 text-slate-950 shadow-[3px_3px_0_#0f172a]">
            {loading ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-5 w-5" />}
          </span>
          <span>
            <span className={`block text-[10px] font-black uppercase tracking-wide ${a.buttonEyebrow}`}>executar com IA</span>
            <span className="block font-display font-black">{loading ? "Analisando..." : buttonLabel}</span>
          </span>
        </button>
      </form>

      {(result || error || loading) && (
        <div className={`mt-6 rounded-2xl border-2 border-slate-900 ${a.resultBg} p-5`}>
          {loading && <div className={`h-24 animate-pulse rounded-xl ${a.skeletonBg}`} />}
          {error && <p className="text-sm font-bold text-red-700">{error}</p>}
          {result && <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-slate-800">{result}</pre>}
        </div>
      )}
    </div>
  );
}
