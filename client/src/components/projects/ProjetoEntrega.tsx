import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, Check, HelpCircle } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import ProjetoValidacao from "@/components/projects/ProjetoValidacao";
import {
  ProjectSubmissionError,
  type ProjectSubmission,
} from "@/services/projectSubmissionService";
import type { StatusEntrega } from "@/hooks/useProjectSubmission";
import {
  CAMPOS_POR_TIPO,
  type SubmissionInput,
} from "@shared/projects/submission";
import type {
  ProjetoTipoEntrega,
  ProjetoVerificacaoAuto,
} from "@shared/projects/v2/types";
import type { NotaValidacao } from "@shared/projects/validationScore";

const INTERVALO_VERIFY_MS = 60_000;

const ROTULO_CAMPO: Record<"deployUrl" | "repoUrl" | "artifactUrl", string> = {
  deployUrl: "Link do site no ar",
  repoUrl: "Link do repositório",
  artifactUrl: "Link do arquivo",
};

// TODO(Ana): ajuda do campo de artefato, por tipo de entrega
const AJUDA_ARTEFATO: Record<ProjetoTipoEntrega, string> = {
  repo_deploy: "",
  repo: "",
  figma: "O arquivo do Figma, com o link público de visualização.",
  notebook: "O notebook publicado no Colab, Kaggle ou GitHub.",
  documento: "O documento no Notion, Google Docs ou PDF, com link de leitura.",
  dashboard: "O painel publicado, ou o PDF exportado dele.",
};

// TODO(Ana): rotulos da lista "o que a gente confere sozinho"
const ROTULO_CHECK: Record<string, string> = {
  deploy_responde: "O site responde",
  artefato_responde: "O artefato abre",
  repo_publico: "O repositório é público",
  readme_existe: "Tem README com conteúdo",
  readme_tem_link_deploy: "O README tem o link do site",
  min_commits_5: "Pelo menos 5 commits",
};

function rotuloCheck(check: ProjetoVerificacaoAuto): string {
  if (ROTULO_CHECK[check]) return ROTULO_CHECK[check];
  if (check.startsWith("arquivo:"))
    return `Tem ${check.slice("arquivo:".length)}`;
  if (check.startsWith("pasta:"))
    return `Tem a pasta ${check.slice("pasta:".length)}`;
  return check;
}

function dataCurta(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const CAMPO = "flex flex-col gap-1.5";
const LABEL = "text-sm font-bold text-foreground";
const INPUT =
  "rounded-[10px] border-2 border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-ink";
const BOTAO_PRINCIPAL =
  "inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-[var(--brand-yellow)] px-5 py-2.5 font-display text-sm font-bold text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)] disabled:opacity-60";

export default function ProjetoEntrega({
  tipoEntrega,
  checks,
  submission,
  status,
  onEntregar,
  onVerificar,
  projectId,
  isPro,
  onValidated,
}: {
  tipoEntrega: ProjetoTipoEntrega;
  checks: readonly ProjetoVerificacaoAuto[];
  submission: ProjectSubmission | null;
  status: StatusEntrega;
  onEntregar: (input: SubmissionInput) => Promise<void>;
  onVerificar: () => Promise<void>;
  /** Validacao por IA: so aparece em projeto de codigo. */
  projectId: string;
  isPro: boolean;
  onValidated?: (nota: NotaValidacao) => void;
}) {
  const { user } = useAuth();
  const campos = CAMPOS_POR_TIPO[tipoEntrega];
  // So projeto de codigo tem validacao por IA: o avaliador le um repositorio.
  const ehCodigo = tipoEntrega === "repo" || tipoEntrega === "repo_deploy";
  const [editando, setEditando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [retro, setRetro] = useState("");
  const [publico, setPublico] = useState(false);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!submission) return;
    setValores({
      deployUrl: submission.deployUrl ?? "",
      repoUrl: submission.repoUrl ?? "",
      artifactUrl: submission.artifactUrl ?? "",
    });
    setRetro(submission.retro?.maisDificil ?? "");
    setPublico(submission.isPublic);
  }, [submission]);

  // Contador do intervalo entre verificacoes: o servidor recusa antes de 60 s,
  // entao o botao mostra quanto falta em vez de deixar a pessoa bater na porta.
  useEffect(() => {
    if (!submission?.autoCheckAt) {
      setSegundos(0);
      return;
    }
    const calcular = () =>
      Math.max(
        0,
        Math.ceil(
          (INTERVALO_VERIFY_MS -
            (Date.now() - new Date(submission.autoCheckAt!).getTime())) /
            1000,
        ),
      );
    setSegundos(calcular());
    const timer = window.setInterval(() => setSegundos(calcular()), 1000);
    return () => window.clearInterval(timer);
  }, [submission?.autoCheckAt]);

  if (status === "indisponivel") {
    return (
      <p className="rounded-xl border-2 border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Entrega indisponível agora. Tente de novo em alguns minutos.
      </p>
    );
  }

  if (status === "erro") {
    return (
      <div className="rounded-xl border-2 border-border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          Não conseguimos carregar sua entrega.
        </p>
      </div>
    );
  }

  const mostrarFormulario = !submission || editando;

  async function enviar() {
    setErro(null);
    setEnviando(true);
    try {
      const input: SubmissionInput = {
        retro: retro.trim() ? { maisDificil: retro.trim() } : undefined,
        isPublic: publico,
      };
      for (const campo of campos) input[campo] = valores[campo]?.trim() ?? "";
      await onEntregar(input);
      setEditando(false);
    } catch (err) {
      setErro(
        err instanceof ProjectSubmissionError
          ? err.message
          : "Não conseguimos salvar a entrega.",
      );
    } finally {
      setEnviando(false);
    }
  }

  async function verificar() {
    setErro(null);
    setEnviando(true);
    try {
      await onVerificar();
    } catch (err) {
      setErro(
        err instanceof ProjectSubmissionError
          ? err.message
          : "Não conseguimos verificar agora.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="card-brutal rounded-xl bg-card p-5">
      {mostrarFormulario ? (
        <div className="flex flex-col gap-4">
          {campos.map((campo) => (
            <div key={campo} className={CAMPO}>
              <label className={LABEL} htmlFor={`entrega-${campo}`}>
                {ROTULO_CAMPO[campo]}
              </label>
              {campo === "artifactUrl" && AJUDA_ARTEFATO[tipoEntrega] && (
                <span className="text-xs text-muted-foreground">
                  {AJUDA_ARTEFATO[tipoEntrega]}
                </span>
              )}
              <input
                id={`entrega-${campo}`}
                type="url"
                inputMode="url"
                className={INPUT}
                value={valores[campo] ?? ""}
                onChange={(e) =>
                  setValores((prev) => ({ ...prev, [campo]: e.target.value }))
                }
              />
            </div>
          ))}

          <div className={CAMPO}>
            <label className={LABEL} htmlFor="entrega-retro">
              O que foi mais difícil?
            </label>
            <span className="text-xs text-muted-foreground">
              Uma ou duas frases. Vai para a sua retrospectiva e para o post, se
              você quiser.
            </span>
            <textarea
              id="entrega-retro"
              rows={3}
              maxLength={500}
              className={INPUT}
              value={retro}
              onChange={(e) => setRetro(e.target.value)}
            />
          </div>

          {checks.length > 0 && (
            <div>
              <p className="text-sm font-bold text-foreground">
                O que a gente confere sozinho
              </p>
              <ul className="mt-2 grid gap-1">
                {checks.map((check) => (
                  <li
                    key={check}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border-2 border-border"
                      aria-hidden
                    />
                    {rotuloCheck(check)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={publico}
              onChange={(e) => setPublico(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-border"
            />
            Mostrar minha solução na galeria pública
          </label>

          {erro && (
            <p className="flex items-start gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {erro}
            </p>
          )}

          {user ? (
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={enviando}
              className={BOTAO_PRINCIPAL}
            >
              Entregar projeto
            </button>
          ) : (
            <Link href="/login" className={BOTAO_PRINCIPAL}>
              Entre para entregar
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-sm font-bold text-foreground">
              {submission.status === "verificado"
                ? `Verificado em ${dataCurta(submission.autoCheckAt ?? submission.updatedAt)}`
                : `Entregue em ${dataCurta(submission.updatedAt)}`}
            </span>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="rounded text-sm font-bold text-orange-700 underline-offset-2 hover:underline dark:text-orange-400"
            >
              Alterar links
            </button>
          </div>

          <ul className="grid gap-1 text-sm">
            {campos.map((campo) => {
              const valor = submission[campo];
              if (!valor) return null;
              return (
                <li key={campo} className="truncate">
                  <span className="font-semibold text-foreground">
                    {ROTULO_CAMPO[campo]}:
                  </span>{" "}
                  <a
                    href={valor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-700 underline-offset-2 hover:underline dark:text-orange-400"
                  >
                    {valor}
                  </a>
                </li>
              );
            })}
          </ul>

          {submission.autoCheck && submission.autoCheck.length > 0 && (
            <ul className="grid gap-1.5">
              {submission.autoCheck.map((r) => (
                <li key={r.check} className="flex items-start gap-2 text-sm">
                  {r.status === "ok" ? (
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      strokeWidth={3.5}
                      aria-hidden
                    />
                  ) : r.status === "falhou" ? (
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                      aria-hidden
                    />
                  ) : (
                    <HelpCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <span
                    className={
                      r.status === "ok"
                        ? "text-foreground"
                        : r.status === "falhou"
                          ? "text-rose-700 dark:text-rose-300"
                          : "text-muted-foreground"
                    }
                  >
                    {rotuloCheck(r.check as ProjetoVerificacaoAuto)}
                    {r.status !== "ok" && ` · ${r.mensagem}`}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {erro && (
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              {erro}
            </p>
          )}

          <button
            type="button"
            onClick={() => void verificar()}
            disabled={enviando || segundos > 0}
            className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-2 text-sm font-bold text-foreground disabled:opacity-60"
          >
            {segundos > 0
              ? `Verificar de novo (${segundos}s)`
              : "Verificar de novo"}
          </button>
        </div>
      )}

      {ehCodigo && (
        <div className="mt-5 border-t border-border pt-5">
          <p className="mb-3 font-display text-sm font-bold text-foreground">
            Validação com IA
          </p>
          <ProjetoValidacao
            projectId={projectId}
            isPro={isPro}
            repoUrlDaEntrega={submission?.repoUrl ?? null}
            exigeEntrega
            onValidated={onValidated}
          />
        </div>
      )}
    </div>
  );
}
