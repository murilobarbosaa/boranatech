import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

// Painel das notas fiscais.
//
// O QUE ESTE PAINEL EXISTE PARA MOSTRAR. O pipeline fiscal inteiro roda em
// background e falha para o lado de deixar a nota para tras, de proposito
// (travar cobranca seria pior). Dois estados exigem uma pessoa:
//
//   blocked_missing_data  cadastro incompleto do tomador;
//   precisa_revisao       reembolso parcial ou cancelamento recusado.
//
// Nenhum dos dois aparece para o usuario final. Se tambem nao aparecer aqui,
// ninguem descobre, e o sintoma seria "o contador reclamou no fim do mes".
// Por isso os dois tem destaque visual proprio, e nao viram mais uma coluna
// numa tabela de contagens.

type Summary = {
  porStatus: Record<string, number>;
  precisaRevisao: number;
  total: number;
  ultimaReconciliacao: {
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    skippedNoUser: number;
    created: number;
  } | null;
};

type Invoice = {
  id: string;
  email: string | null;
  status: string;
  precisaRevisao: boolean;
  amountCents: number;
  planCode: string | null;
  numero: string | null;
  attempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  issuedAt: string | null;
  createdAt: string;
  tomadorNome: string | null;
  tomadorDocumento: string | null;
};

const STATUS_FILTROS = [
  { valor: "", label: "Todas" },
  { valor: "blocked_missing_data", label: "Bloqueadas" },
  { valor: "failed", label: "Falhas" },
  { valor: "pending", label: "Pendentes" },
  { valor: "processing", label: "Processando" },
  { valor: "issued", label: "Emitidas" },
  { valor: "canceled", label: "Canceladas" },
];

// Rotulo por status, com resolver de fallback: um status novo no servidor que
// o bundle ainda nao conhece mostra o valor cru, e nao derruba a pagina
// (regra dos lookups por valor do servidor, CLAUDE.md).
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  issued: "Emitida",
  failed: "Falhou",
  canceled: "Cancelada",
  blocked_missing_data: "Bloqueada",
};

function statusLabelOf(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDataHora(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR");
}

function Contador({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: number;
  destaque?: "alerta" | "atencao";
}) {
  const cor =
    destaque === "alerta" && valor > 0
      ? "border-rose-500 bg-rose-50 text-rose-900"
      : destaque === "atencao" && valor > 0
        ? "border-amber-500 bg-amber-50 text-amber-900"
        : "border-slate-900 bg-white text-slate-950";
  return (
    <div
      className={`rounded-2xl border-2 p-4 shadow-[3px_3px_0_#0f172a] ${cor}`}
    >
      <p className="text-xs font-black uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-black">{valor}</p>
    </div>
  );
}

export function FiscalInvoicesDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      // adminFetch ja prefixa /api/admin e devolve o JSON cru (sem generico),
      // entao a assercao de tipo fica aqui, na fronteira.
      const [resumo, lista] = await Promise.all([
        adminFetch("/fiscal-invoices/summary") as Promise<{ data: Summary }>,
        adminFetch(
          `/fiscal-invoices${filtro ? `?status=${filtro}` : ""}`,
        ) as Promise<{ data: Invoice[] }>,
      ]);
      setSummary(resumo.data);
      setInvoices(lista.data);
    } catch {
      setErro("Não foi possível carregar as notas fiscais.");
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function handleRetry(id: string) {
    setRetrying(id);
    try {
      await adminFetch(`/fiscal-invoices/${id}/retry`, { method: "POST" });
      await carregar();
    } catch {
      setErro("Não foi possível reprocessar essa nota.");
    } finally {
      setRetrying(null);
    }
  }

  if (loading && !summary) return <LoadingBlock />;
  if (erro && !summary) return <ErrorBlock message={erro} />;

  const bloqueadas = summary?.porStatus.blocked_missing_data ?? 0;
  const falhas = summary?.porStatus.failed ?? 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Contador label="Bloqueadas" valor={bloqueadas} destaque="alerta" />
        <Contador
          label="Precisam de revisão"
          valor={summary?.precisaRevisao ?? 0}
          destaque="alerta"
        />
        <Contador label="Falhas" valor={falhas} destaque="atencao" />
        <Contador label="Emitidas" valor={summary?.porStatus.issued ?? 0} />
      </div>

      {summary?.ultimaReconciliacao ? (
        <p className="mt-3 text-xs font-semibold text-slate-600">
          Última reconciliação:{" "}
          {formatDataHora(summary.ultimaReconciliacao.startedAt)} (
          {summary.ultimaReconciliacao.status}
          {summary.ultimaReconciliacao.created > 0
            ? `, ${summary.ultimaReconciliacao.created} criada(s)`
            : ""}
          {summary.ultimaReconciliacao.skippedNoUser > 0
            ? `, ${summary.ultimaReconciliacao.skippedNoUser} cobrança(s) sem usuário`
            : ""}
          ).
        </p>
      ) : (
        // Ausencia de execucao e um ACHADO, nao um espaco vazio: significa que
        // a rede de seguranca nunca rodou.
        <p className="mt-3 text-xs font-bold text-amber-700">
          O cron de reconciliação ainda não rodou nenhuma vez.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {STATUS_FILTROS.map((opcao) => (
          <button
            key={opcao.valor || "todas"}
            type="button"
            onClick={() => setFiltro(opcao.valor)}
            className={`rounded-full border-2 border-slate-900 px-3 py-1.5 text-xs font-black uppercase transition-all ${
              filtro === opcao.valor
                ? "bg-[#FFB800] text-slate-950"
                : "bg-white text-slate-600"
            }`}
          >
            {opcao.label}
          </button>
        ))}
      </div>

      {erro ? (
        <p className="mt-3 text-xs font-bold text-rose-700">{erro}</p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left">
              <th className="p-2 text-xs font-black uppercase">Usuário</th>
              <th className="p-2 text-xs font-black uppercase">Documento</th>
              <th className="p-2 text-xs font-black uppercase">Valor</th>
              <th className="p-2 text-xs font-black uppercase">Status</th>
              <th className="p-2 text-xs font-black uppercase">Tent.</th>
              <th className="p-2 text-xs font-black uppercase">Erro</th>
              <th className="p-2 text-xs font-black uppercase">Ação</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-slate-500">
                  Nenhuma nota neste filtro.
                </td>
              </tr>
            ) : (
              invoices.map((nota) => {
                const retentavel =
                  nota.status === "failed" ||
                  nota.status === "blocked_missing_data";
                return (
                  <tr
                    key={nota.id}
                    className={`border-b border-slate-200 ${
                      nota.precisaRevisao ? "bg-rose-50" : ""
                    }`}
                  >
                    <td className="p-2 font-semibold">
                      {nota.email ?? nota.tomadorNome ?? "—"}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {nota.tomadorDocumento ?? "—"}
                    </td>
                    <td className="p-2 font-bold">
                      {formatBrl(nota.amountCents)}
                    </td>
                    <td className="p-2">
                      <span className="font-black">
                        {statusLabelOf(nota.status)}
                      </span>
                      {nota.precisaRevisao ? (
                        <span className="ml-2 rounded-full border-2 border-rose-500 bg-white px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">
                          Revisar
                        </span>
                      ) : null}
                    </td>
                    <td className="p-2">{nota.attempts}</td>
                    <td
                      className="max-w-[280px] truncate p-2 text-xs text-slate-600"
                      title={nota.errorMessage ?? ""}
                    >
                      {nota.errorMessage ?? ""}
                    </td>
                    <td className="p-2">
                      {retentavel ? (
                        <button
                          type="button"
                          onClick={() => void handleRetry(nota.id)}
                          disabled={retrying === nota.id}
                          className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
                        >
                          {retrying === nota.id ? "..." : "Reprocessar"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
