import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, Check, HelpCircle, Lock } from "lucide-react";

import ProjetoAnel from "@/components/projects/ProjetoAnel";
import {
  ProjectValidationError,
  getProjectValidation,
  submitProjectValidation,
  type RequisitoAvaliacaoItem,
  type RequisitoDeclarado,
} from "@/services/projectValidationService";
import type { NotaValidacao } from "@shared/projects/validationScore";

const COOLDOWN_MS = 5 * 60 * 1000;

const BOTAO_PRINCIPAL =
  "inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-[var(--brand-yellow)] px-5 py-2.5 font-display text-sm font-bold text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)] disabled:opacity-60";
const INPUT =
  "rounded-[10px] border-2 border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-ink";

const CORES_VEREDITO: Record<string, string> = {
  atende: "text-emerald-700 dark:text-emerald-300",
  parcial: "text-amber-700 dark:text-amber-300",
  nao_atende: "text-rose-700 dark:text-rose-300",
};

function IconeVeredito({ veredito }: { veredito: string }) {
  if (veredito === "atende")
    return (
      <Check
        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
        strokeWidth={3.5}
        aria-hidden
      />
    );
  if (veredito === "parcial")
    return (
      <HelpCircle
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
        aria-hidden
      />
    );
  return (
    <AlertCircle
      className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
      aria-hidden
    />
  );
}

export default function ProjetoValidacao({
  projectId,
  isPro,
  repoUrlDaEntrega,
  exigeEntrega,
  onValidated,
  onNota,
}: {
  projectId: string;
  isPro: boolean;
  /** Link do repositorio vindo da entrega (lote 04), quando existe. */
  repoUrlDaEntrega: string | null;
  /** v2 de codigo exige entrega antes; os Pro do catalogo, nao. */
  exigeEntrega: boolean;
  onValidated?: (nota: NotaValidacao) => void;
  /** Reporta a nota atual sem comemorar: usado na carga, para o cabecalho. */
  onNota?: (nota: NotaValidacao | null) => void;
}) {
  const [url, setUrl] = useState(repoUrlDaEntrega ?? "");
  const [nota, setNota] = useState<NotaValidacao | null>(null);
  const [melhor, setMelhor] = useState<NotaValidacao | null>(null);
  const [resultado, setResultado] = useState<RequisitoAvaliacaoItem[]>([]);
  const [requisitos, setRequisitos] = useState<RequisitoDeclarado[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [proximaEm, setProximaEm] = useState<number | null>(null);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    setUrl((atual) => atual || (repoUrlDaEntrega ?? ""));
  }, [repoUrlDaEntrega]);

  const carregar = useCallback(async () => {
    try {
      const dados = await getProjectValidation(projectId);
      if (!dados) return;
      const registro = dados.aprovada ?? dados.ultima;
      setNota(registro.nota);
      if (dados.aprovada?.nota) onNota?.(dados.aprovada.nota);
      setResultado(registro.resultado ?? []);
      setRequisitos(dados.requisitos ?? []);
      if (dados.ultima.createdAt)
        setProximaEm(new Date(dados.ultima.createdAt).getTime() + COOLDOWN_MS);
    } catch {
      // Sem validacao anterior ou falha de leitura: o bloco abre no estado
      // inicial, e o botao continua disponivel.
    }
  }, [projectId, onNota]);

  useEffect(() => {
    if (!isPro) return;
    void carregar();
  }, [isPro, carregar]);

  useEffect(() => {
    if (proximaEm === null) {
      setSegundos(0);
      return;
    }
    const calcular = () =>
      Math.max(0, Math.ceil((proximaEm - Date.now()) / 1000));
    setSegundos(calcular());
    const timer = window.setInterval(() => setSegundos(calcular()), 1000);
    return () => window.clearInterval(timer);
  }, [proximaEm]);

  if (!isPro) {
    return (
      <div className="rounded-xl border-2 border-accent/60 bg-accent/10 p-4">
        <p className="flex items-start gap-2 text-sm font-semibold text-foreground">
          <Lock
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
            aria-hidden
          />
          <span>
            Validação com IA é do Pro. A IA lê seu repositório, confere cada
            requisito e dá uma nota. Validado vale no seu perfil.
          </span>
        </p>
        <Link href="/planos" className={`${BOTAO_PRINCIPAL} mt-4`}>
          Assinar o Pro
        </Link>
      </div>
    );
  }

  if (exigeEntrega && !repoUrlDaEntrega && !nota) {
    return (
      <p className="text-sm text-muted-foreground">
        Entregue primeiro. A validação usa o link do repositório da entrega.
      </p>
    );
  }

  async function validar() {
    setErro(null);
    setEnviando(true);
    try {
      const r = await submitProjectValidation(projectId, url.trim());
      setNota(r.nota);
      setResultado(r.resultado ?? []);
      setRequisitos(r.requisitos ?? []);
      setMelhor(r.gravado === false ? (r.melhor ?? null) : null);
      setProximaEm(Date.now() + COOLDOWN_MS);
      if (r.status === "aprovado") {
        onNota?.(r.melhor ?? r.nota);
        onValidated?.(r.melhor ?? r.nota);
      }
    } catch (err) {
      if (err instanceof ProjectValidationError) {
        setErro(err.message);
        if (err.retryAfter) setProximaEm(Date.now() + err.retryAfter * 1000);
      } else {
        setErro("Não conseguimos validar agora.");
      }
    } finally {
      setEnviando(false);
    }
  }

  const porId = new Map(resultado.map((r) => [r.id, r]));
  // Pendencias no topo: e o que a pessoa precisa consertar.
  const ordenados = [...requisitos].sort((a, b) => {
    const okA = porId.get(a.id)?.veredito === "atende" ? 1 : 0;
    const okB = porId.get(b.id)?.veredito === "atende" ? 1 : 0;
    return okA - okB;
  });

  return (
    <div className="flex flex-col gap-4">
      {nota && (
        <div className="flex flex-wrap items-center gap-3">
          <ProjetoAnel
            feitas={nota.atendidos}
            total={nota.total}
            rotulo={`${nota.atendidos} de ${nota.total}`}
            legenda={`${nota.percentual}%`}
          />
          <span className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-[10px] border-2 px-3 py-1.5 font-display text-xs font-bold ${
                nota.validado
                  ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                  : "border-border text-muted-foreground"
              }`}
            >
              {nota.validado ? "Validado" : "Não validado ainda"}
            </span>
            {nota.perfeito && (
              <span className="inline-flex items-center rounded-full border-2 border-ink bg-[var(--brand-yellow)] px-2.5 py-0.5 font-display text-xs font-black text-ink-on-accent">
                100%
              </span>
            )}
          </span>
        </div>
      )}

      {melhor && (
        <p className="text-sm text-muted-foreground">
          Sua melhor nota continua sendo {melhor.atendidos} de {melhor.total}.
        </p>
      )}

      {ordenados.length > 0 && (
        <ul className="grid gap-2">
          {ordenados.map((req) => {
            const item = porId.get(req.id);
            const veredito = item?.veredito ?? "nao_atende";
            return (
              <li
                key={req.id}
                className="flex items-start gap-2 rounded-[10px] border border-border bg-card p-3 text-sm"
              >
                <IconeVeredito veredito={veredito} />
                <span>
                  <span className="block text-foreground">{req.descricao}</span>
                  {item?.evidencia && (
                    <span
                      className={`mt-0.5 block text-xs ${CORES_VEREDITO[veredito] ?? "text-muted-foreground"}`}
                    >
                      {item.evidencia}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-bold text-foreground"
          htmlFor="validacao-url"
        >
          Link do repositório
        </label>
        <input
          id="validacao-url"
          type="url"
          inputMode="url"
          className={INPUT}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      {erro && (
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={() => void validar()}
        disabled={enviando || segundos > 0}
        className={BOTAO_PRINCIPAL}
      >
        {segundos > 0
          ? `Validar de novo (${Math.ceil(segundos / 60)} min)`
          : nota
            ? "Validar de novo"
            : "Validar com IA"}
      </button>
      <p className="text-xs text-muted-foreground">
        Usa 1 da sua cota diária de IA. Corte para validar: 80%.
      </p>
    </div>
  );
}
