import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBlock } from "@/components/admin/StateBlocks";

import { fmtDate } from "./userFormat";
import type { AuditEntry, AuditPayload } from "./types";

// Rotulos de acao, com resolver de fallback. Convencao do projeto: acesso a
// mapa indexado por valor do servidor NUNCA e direto, porque um valor que o
// bundle ainda nao conhece derruba a pagina inteira (foi assim que
// STATUS_META[item.status].label quebrou o admin em producao). Acao nova no
// banco aparece crua aqui, e a secao continua de pe.
const ACAO_META: Record<string, { label: string; className: string }> = {
  reveal: {
    label: "CPF revelado",
    className: "border-amber-500 bg-amber-50 text-amber-800",
  },
  grant: {
    label: "Acesso de influencer concedido",
    className: "border-violet-500 bg-violet-50 text-violet-800",
  },
  revoke: {
    label: "Acesso de influencer revogado",
    className: "border-violet-500 bg-violet-50 text-violet-800",
  },
  update_profile: {
    label: "Cadastro editado",
    className: "border-slate-400 bg-slate-100 text-slate-700",
  },
  update_email: {
    label: "E-mail alterado",
    className: "border-amber-500 bg-amber-50 text-amber-800",
  },
  cancel_subscription: {
    label: "Assinatura cancelada",
    className: "border-rose-500 bg-rose-50 text-rose-800",
  },
  refund: {
    label: "Reembolso",
    className: "border-rose-500 bg-rose-50 text-rose-800",
  },
};

const ACAO_DESCONHECIDA = "border-slate-400 bg-slate-100 text-slate-600";

export function acaoDeAuditoriaOf(action: string): {
  label: string;
  className: string;
} {
  return ACAO_META[action] ?? { label: action, className: ACAO_DESCONHECIDA };
}

// Os tres estados do cruzamento entre INTENCAO (o log, escrito antes da acao) e
// RESULTADO (a linha em admin_refunds / subscription_cancellations). O registro
// existe para nao mentir; exibir intencao como fato mentiria exatamente ali.
const OUTCOME_META: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmado",
    className: "border-emerald-600 bg-emerald-50 text-emerald-800",
  },
  unconfirmed: {
    label: "Sem confirmação",
    className: "border-rose-500 bg-rose-50 text-rose-800",
  },
  not_verifiable: {
    label: "Não verificável",
    className: "border-slate-300 bg-slate-100 text-slate-500",
  },
};

function outcomeOf(outcome: string): { label: string; className: string } {
  return (
    OUTCOME_META[outcome] ?? {
      label: outcome,
      className: ACAO_DESCONHECIDA,
    }
  );
}

function valorLegivel(v: string | number | boolean | null): string {
  if (v === null) return "vazio";
  if (typeof v === "boolean") return v ? "sim" : "não";
  return String(v);
}

function Campos({ entrada }: { entrada: AuditEntry }) {
  const before = entrada.before ?? {};
  const after = entrada.after ?? {};
  const exibidos = new Set([...Object.keys(before), ...Object.keys(after)]);

  // Campos que mudaram mas cujo VALOR nao veio: o servidor filtrou pela
  // allowlist. Mostrar o nome mantem o evento visivel sem exibir o conteudo, e
  // e por isso que filtrar valor nao vira esconder acontecimento.
  const ocultos = (entrada.campos_alterados ?? []).filter(
    (campo) => !exibidos.has(campo),
  );

  if (exibidos.size === 0 && ocultos.length === 0) return null;

  return (
    <ul className="mt-1.5 space-y-0.5">
      {Array.from(exibidos).map((campo) => (
        <li key={campo} className="text-xs text-slate-600">
          <span className="font-black">{campo}</span>
          {campo in before ? (
            <>
              {" "}
              <span className="text-slate-400 line-through">
                {valorLegivel(before[campo])}
              </span>
            </>
          ) : null}
          {campo in after ? (
            <>
              {" "}
              <span className="font-bold text-slate-800">
                {valorLegivel(after[campo])}
              </span>
            </>
          ) : null}
        </li>
      ))}
      {ocultos.map((campo) => (
        <li key={campo} className="text-xs text-slate-500">
          <span className="font-black">{campo}</span>{" "}
          <span className="italic">alterado, valor não exibido</span>
        </li>
      ))}
    </ul>
  );
}

function Linha({ entrada }: { entrada: AuditEntry }) {
  const acao = acaoDeAuditoriaOf(entrada.action);
  const resultado = outcomeOf(entrada.outcome);

  return (
    <div className="border-b-2 border-slate-100 px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex w-fit items-center rounded-full border-2 px-2.5 py-0.5 text-xs font-black uppercase ${acao.className}`}
        >
          {acao.label}
        </span>
        <span
          className={`inline-flex w-fit items-center rounded-full border-2 px-2.5 py-0.5 text-[11px] font-black uppercase ${resultado.className}`}
        >
          {resultado.label}
        </span>
        <span className="text-xs font-bold text-slate-500">
          {fmtDate(entrada.created_at)}
        </span>
      </div>

      <p className="mt-1 text-xs font-bold text-slate-500">
        por {entrada.actor_name}
        {entrada.resource_slug ? (
          <span className="ml-2 font-mono text-[11px] font-normal text-slate-400">
            {entrada.resource_slug}
          </span>
        ) : null}
      </p>

      <Campos entrada={entrada} />

      {entrada.outcome_detail ? (
        <p className="mt-1 text-xs font-medium text-slate-500">
          {entrada.outcome_detail}
        </p>
      ) : null}
    </div>
  );
}

function HistoricoSkeleton() {
  return (
    <div className="space-y-2 p-4" data-testid="user-audit-skeleton">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-5 w-36 bg-slate-200" />
          <Skeleton className="h-4 w-24 bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function UserAuditHistory({
  loading,
  error,
  payload,
}: {
  loading: boolean;
  error: string | null;
  payload: AuditPayload | null;
}) {
  if (loading) return <HistoricoSkeleton />;
  // Erro de CARREGAMENTO fica inline, junto da regiao que ficou vazia (criterio
  // da Fatia 3). Aqui nao ha acao nenhuma, entao nao ha toast.
  if (error) return <ErrorBlock message={error} />;
  if (!payload) return <HistoricoSkeleton />;

  // Resposta de shape inesperado nao derruba o modal: na janela de deploy o
  // frontend novo fala com o backend antigo, que nao conhece esta rota.
  const entries = Array.isArray(payload.entries) ? payload.entries : [];

  if (entries.length === 0) {
    return (
      <p className="px-4 py-3 text-sm font-medium text-slate-400">
        Nenhuma ação administrativa registrada.
      </p>
    );
  }

  return (
    <div>
      {/* A tela precisa distinguir "nada a confirmar" de "nao deu para checar",
          senao o rotulo neutro de cada linha fica ambiguo. */}
      {payload.cross_reference_ok === false ? (
        <p className="border-b-2 border-amber-500 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-amber-800">
          Não foi possível checar o resultado das ações. O que aparece abaixo é
          o que foi registrado, não o que foi confirmado.
        </p>
      ) : null}

      {entries.map((entrada) => (
        <Linha key={entrada.id} entrada={entrada} />
      ))}

      {payload.truncated ? (
        <p className="border-t-2 border-amber-500 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-amber-800">
          Mostrando as primeiras {payload.limit} ações. Há mais no histórico.
        </p>
      ) : null}
    </div>
  );
}
