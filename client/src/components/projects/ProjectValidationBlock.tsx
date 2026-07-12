import { useEffect, useState } from "react";
import { AlertTriangle, Check, Github, Loader2, X } from "lucide-react";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import type { ProjetoCatalogo } from "@shared/projects/catalog";
import {
  getProjectValidation,
  ProjectValidationError,
  submitProjectValidation,
  type RequisitoAvaliacaoItem,
} from "@/services/projectValidationService";

// Bloco de validacao de projeto Pro via leitor de GitHub (fase 5c.2). So
// renderiza no corpo expandido do card Pro, que por sua vez so renderiza pra
// assinante (regra da 5a.2); a hidratacao acontece no mount deste bloco, ou
// seja, ao expandir o card (lazy por construcao).
type ValidationPhase =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "submitting" }
  | {
      kind: "result";
      status: "aprovado" | "reprovado";
      resultado: RequisitoAvaliacaoItem[];
      pendentes: string[];
    };

// TODO(Ana): revisar todas as mensagens de erro do bloco de validacao.
const ERROR_MESSAGES: Record<string, string> = {
  rate_limited:
    "Você atingiu o limite diário de análises com IA. Tente de novo amanhã.",
  timeout:
    "A análise demorou mais que o esperado e foi interrompida. Tente de novo em instantes.",
  invalid_url:
    "Esse endereço não parece um repositório público do GitHub. Confira a URL.",
  already_validated: "Este projeto já foi validado e aprovado.",
  generic: "Não foi possível concluir a validação agora. Tente de novo.",
};

function VereditoIcon({ veredito }: { veredito: string }) {
  if (veredito === "atende") {
    return (
      <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3.5} />
    );
  }
  if (veredito === "parcial") {
    return (
      <AlertTriangle
        className="h-4 w-4 shrink-0 text-amber-600"
        strokeWidth={2.6}
      />
    );
  }
  return <X className="h-4 w-4 shrink-0 text-red-500" strokeWidth={3.5} />;
}

export default function ProjectValidationBlock({
  projeto,
  onApproved,
}: {
  projeto: ProjetoCatalogo;
  onApproved: (projectId: string) => void;
}) {
  const [phase, setPhase] = useState<ValidationPhase>({ kind: "loading" });
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProjectValidation(projeto.id)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setPhase({ kind: "none" });
          return;
        }
        const record = data.aprovada ?? data.ultima;
        setPhase({
          kind: "result",
          status: record.status,
          resultado: record.resultado ?? [],
          pendentes: (record.resultado ?? [])
            .filter((r) => r.veredito !== "atende")
            .map((r) => r.id),
        });
      })
      .catch(() => {
        if (!cancelled) setPhase({ kind: "none" });
      });
    return () => {
      cancelled = true;
    };
  }, [projeto.id]);

  async function submit() {
    if (!url.trim() || phase.kind === "submitting") return;
    setError(null);
    setPhase({ kind: "submitting" });
    try {
      const result = await submitProjectValidation(projeto.id, url.trim());
      setPhase({
        kind: "result",
        status: result.status,
        resultado: result.resultado,
        pendentes: result.pendentes,
      });
      if (result.status === "aprovado") onApproved(projeto.id);
    } catch (err) {
      const code = err instanceof ProjectValidationError ? err.code : "generic";
      setError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.generic);
      setPhase({ kind: "none" });
    }
  }

  const descByReqId = new Map(
    (projeto.requisitos ?? []).map((r) => [r.id, r.descricao]),
  );

  return (
    <div className="mt-5 rounded-[14px] border-[2.5px] border-slate-900 bg-violet-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Github className="h-4 w-4 text-slate-900" aria-hidden />
        <p className="text-sm font-black text-slate-900">
          {/* TODO(Ana): titulo do bloco de validacao */}
          Validação do projeto
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-300 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">
          <ProStarIcon className="h-3 w-3" /> Pro
        </span>
      </div>

      {phase.kind === "loading" && (
        <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {/* TODO(Ana): copy do carregamento do bloco */}
          Carregando validações...
        </p>
      )}

      {phase.kind === "result" && (
        <div>
          {phase.status === "aprovado" ? (
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-emerald-400 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a]">
              <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
              {/* TODO(Ana): label do selo de projeto validado */}
              Projeto validado
            </p>
          ) : (
            <p className="mb-3 text-sm font-bold text-slate-800">
              {/* TODO(Ana): copy do estado reprovado */}
              Ainda não passou: {phase.pendentes.length} requisito
              {phase.pendentes.length !== 1 ? "s" : ""} pendente
              {phase.pendentes.length !== 1 ? "s" : ""}. Ajuste o repositório e
              tente de novo.
            </p>
          )}
          <ul className="space-y-2">
            {phase.resultado.map((item) => (
              <li
                key={item.id}
                className={`rounded-lg border-2 p-2.5 text-sm ${
                  item.veredito === "atende"
                    ? "border-emerald-200 bg-emerald-50"
                    : item.veredito === "parcial"
                      ? "border-amber-200 bg-amber-50"
                      : "border-red-200 bg-red-50"
                }`}
              >
                <span className="flex items-start gap-2 font-bold text-slate-900">
                  <VereditoIcon veredito={item.veredito} />
                  {descByReqId.get(item.id) ?? item.id}
                </span>
                <span className="mt-1 block pl-6 text-xs font-medium text-slate-600">
                  {item.evidencia}
                </span>
              </li>
            ))}
          </ul>
          {phase.status === "reprovado" && (
            <div className="mt-4">
              <SubmitForm
                url={url}
                setUrl={setUrl}
                onSubmit={submit}
                submitting={false}
                retry
              />
            </div>
          )}
        </div>
      )}

      {(phase.kind === "none" || phase.kind === "submitting") && (
        <div>
          <p className="mb-3 text-sm font-medium text-slate-600">
            {/* TODO(Ana): microcopy do que sera verificado */}
            Envie o repositório público do GitHub com o projeto pronto. A IA
            confere requisito a requisito (README, arquivos, dependências e
            workflows) e devolve o resultado.
          </p>
          <SubmitForm
            url={url}
            setUrl={setUrl}
            onSubmit={submit}
            submitting={phase.kind === "submitting"}
          />
          {phase.kind === "submitting" && (
            <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {/* TODO(Ana): copy do progresso da validacao */}
              Analisando seu repositório... isso leva até um minuto e meio.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function SubmitForm({
  url,
  setUrl,
  onSubmit,
  submitting,
  retry,
}: {
  url: string;
  setUrl: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  retry?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://github.com/voce/seu-projeto"
        disabled={submitting}
        className="flex-1 rounded-[10px] border-2 border-slate-900 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || !url.trim()}
        className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {/* TODO(Ana): labels do botao de submissao */}
        {retry ? "Tentar de novo" : "Enviar para validação"}
      </button>
    </div>
  );
}
