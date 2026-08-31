import { useState } from "react";
import {
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

import { formatIsoDay } from "./relativeTime";
import type { SentryDataBloco } from "./types";

// Secao do Sentry DENTRO do modal existente (invariante 8: nada de interface
// paralela). Somente leitura, e separada de descricao e notas: aqueles dois sao
// do humano e o sync nunca os toca (invariante 2). Aqui e o contrario, e tudo
// vem do robo.

const rotulo =
  "text-[10px] font-black uppercase tracking-[0.14em] text-slate-500";

function Campo({ nome, valor }: { nome: string; valor: string | null }) {
  return (
    <div>
      <p className={rotulo}>{nome}</p>
      {/* Valor ausente vira travessao, nunca vazio: celula em branco parece
          defeito de renderizacao, o travessao afirma "nao ha". */}
      <p className="text-sm font-bold text-slate-900">{valor || "-"}</p>
    </div>
  );
}

export function SentryBlock({ bloco }: { bloco: SentryDataBloco }) {
  const [stackAberto, setStackAberto] = useState(false);
  const { coleta, issue, detalhe } = bloco;

  return (
    <section className="rounded-xl border-2 border-slate-900 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={rotulo}>Sentry</p>
          <p className="text-sm font-black text-slate-900">{issue.shortId}</p>
        </div>
        {issue.permalink ? (
          <a
            href={issue.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-2 py-1 text-[11px] font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
          >
            Abrir no Sentry <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      {/*
        A DISTINCAO QUE NAO PODE MORRER NA RENDERIZACAO.

        `coleta.completo === false` significa "nao consegui ler", nao "nao
        existe". Os dois produzem release vazio logo abaixo, e sem este aviso
        seriam indistinguiveis para sempre: a pessoa concluiria que a issue nao
        tem release e nunca saberia que faltou buscar. O jsonb guarda a
        diferenca desde a Fase 3 justamente para ela chegar ate aqui.
      */}
      {!coleta.completo ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-100 p-2 text-[11px] font-bold text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Detalhe incompleto: não foi possível ler tudo no Sentry
            {coleta.motivo ? ` (${coleta.motivo})` : ""}. A próxima manutenção
            completa automaticamente. O que falta não significa que não existe.
          </span>
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Campo nome="Eventos" valor={String(issue.eventos)} />
        <Campo nome="Usuários afetados" valor={String(issue.usuarios)} />
        <Campo
          nome="Primeiro evento"
          valor={formatIsoDay(issue.primeiroEvento)}
        />
        <Campo nome="Último evento" valor={formatIsoDay(issue.ultimoEvento)} />
        <Campo nome="Nível" valor={issue.level} />
        <Campo nome="Projeto" valor={issue.projeto} />
        <Campo nome="Environment" valor={detalhe?.environment ?? null} />
        <Campo nome="Release" valor={detalhe?.release ?? null} />
      </div>

      <div className="mt-3">
        <p className={rotulo}>Culprit</p>
        <p className="break-all font-mono text-xs text-slate-800">
          {issue.culprit || "-"}
        </p>
      </div>

      {detalhe?.stack ? (
        <div className="mt-3">
          {/*
            COLAPSADO POR PADRAO. Um stack pode ter dezenas de linhas e empurraria
            descricao, notas, checklist e comentarios para fora da tela. O modal
            e o lugar de trabalhar na tarefa; o stack e consulta.
          */}
          <button
            type="button"
            onClick={() => setStackAberto((v) => !v)}
            aria-expanded={stackAberto}
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600"
          >
            {stackAberto ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Stack
          </button>
          {stackAberto ? (
            <pre className="mt-1.5 max-h-64 overflow-auto rounded-lg bg-slate-900 p-2 font-mono text-[11px] leading-relaxed text-slate-100">
              {detalhe.stack}
            </pre>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
