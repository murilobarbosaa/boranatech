import { useCallback, useEffect, useRef, useState } from "react";
import { Briefcase, RefreshCw, Search } from "lucide-react";
import BrutalActionButton from "@/components/shared/BrutalActionButton";
import SectionLabel from "@/components/shared/SectionLabel";
import VagasJobCard from "@/components/vagas/VagasJobCard";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import {
  fetchVagas,
  type VagaContract,
  type VagaItem,
  type VagaModality,
  type VagaRegion,
  type VagaSeniority,
} from "@/services/vagasService";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("cyan");

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 400;

// Enums espelhados de server/lib/vagas/normalize.ts (valores exatos).
const REGION_OPTIONS: { value: VagaRegion; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "br", label: "Brasil" },
  { value: "intl", label: "Internacional" },
];

const SENIORITY_OPTIONS: { value: VagaSeniority; label: string }[] = [
  { value: "estagio", label: "Estágio" },
  { value: "junior", label: "Júnior" },
  { value: "pleno", label: "Pleno" },
  { value: "senior", label: "Sênior" },
];

const MODALITY_OPTIONS: { value: VagaModality; label: string }[] = [
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Híbrido" },
  { value: "onsite", label: "Presencial" },
];

const CONTRACT_OPTIONS: { value: VagaContract; label: string }[] = [
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
];

type FeedStatus = "loading" | "error" | "ready";

function FeedSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl border-2 border-slate-200 bg-white p-5"
        >
          <div className="h-4 w-16 rounded-full bg-slate-200" />
          <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

const selectClass =
  "h-10 rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-bold text-slate-800";

// Feed Pro de vagas: busca com debounce, filtros, paginacao por append.
// Montado SOMENTE para assinante (o pai condiciona a isPro): nenhuma chamada
// a /api/vagas acontece sem Pro.
export default function VagasFeed({
  onOpen,
}: {
  onOpen: (id: string) => void;
}) {
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<VagaRegion>("all");
  const [seniority, setSeniority] = useState<VagaSeniority | "">("");
  const [modality, setModality] = useState<VagaModality | "">("");
  const [contract, setContract] = useState<VagaContract | "">("");

  const [status, setStatus] = useState<FeedStatus>("loading");
  const [items, setItems] = useState<VagaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Uma unica "geracao" de request valida por vez: trocar filtro/busca no
  // meio de um fetch descarta a resposta velha (nao ha race de append).
  const generation = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setQ(qInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [qInput]);

  const buildParams = useCallback(
    (targetPage: number) => ({
      q: q || undefined,
      region,
      seniority: seniority || undefined,
      modality: modality || undefined,
      contract: contract || undefined,
      page: targetPage,
      limit: PAGE_SIZE,
    }),
    [q, region, seniority, modality, contract],
  );

  const loadFirstPage = useCallback(async () => {
    const gen = ++generation.current;
    setStatus("loading");
    setPage(1);
    try {
      const data = await fetchVagas(buildParams(1));
      if (gen !== generation.current) return;
      setItems(data.items);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setStatus("ready");
    } catch {
      if (gen !== generation.current) return;
      setStatus("error");
    }
  }, [buildParams]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    const gen = generation.current;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetchVagas(buildParams(nextPage));
      if (gen !== generation.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...data.items.filter((item) => !seen.has(item.id))];
      });
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch {
      if (gen !== generation.current) return;
      // Falha do "carregar mais" nao derruba a lista ja exibida.
      setHasMore(true);
    } finally {
      if (gen === generation.current) setLoadingMore(false);
    }
  }, [buildParams, page]);

  const hasActiveFilters =
    q !== "" || region !== "all" || seniority !== "" || modality !== "" || contract !== "";

  return (
    <div className="mb-14">
      {/* TODO(Ana): validar titulo e copy da secao do feed. */}
      <SectionLabel icon={Briefcase} ac={ac}>
        Feed de vagas
      </SectionLabel>
      <h2 className="mt-2 font-display text-2xl font-black text-slate-950">
        Todas as vagas
      </h2>

      <div className="mt-6 space-y-4">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={qInput}
            onChange={(event) => setQInput(event.target.value)}
            maxLength={80}
            // TODO(Ana): validar o placeholder da busca.
            placeholder="Buscar por cargo, tecnologia ou empresa"
            className={cn(
              "h-11 w-full rounded-xl border-2 border-slate-900 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2",
              ac.cardFocusRing,
            )}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5" role="group" aria-label="Região">
            {REGION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRegion(option.value)}
                className={cn(
                  "rounded-full border-2 px-3 py-1.5 text-xs font-black transition-colors",
                  region === option.value ? ac.filterActive : ac.filterInactive,
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <select
            value={seniority}
            onChange={(e) => setSeniority(e.target.value as VagaSeniority | "")}
            className={selectClass}
            aria-label="Nível"
          >
            <option value="">Nível: todos</option>
            {SENIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={modality}
            onChange={(e) => setModality(e.target.value as VagaModality | "")}
            className={selectClass}
            aria-label="Modalidade"
          >
            <option value="">Modalidade: todas</option>
            {MODALITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={contract}
            onChange={(e) => setContract(e.target.value as VagaContract | "")}
            className={selectClass}
            aria-label="Contrato"
          >
            <option value="">Contrato: todos</option>
            {CONTRACT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {status === "loading" ? (
          <FeedSkeleton />
        ) : status === "error" ? (
          <div className="card-brutal rounded-2xl border-2 border-slate-950 bg-white p-6">
            {/* TODO(Ana): validar a copy do estado de erro do feed. */}
            <p className="font-display text-lg font-black text-slate-950">
              Não conseguimos carregar as vagas agora
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Pode ser uma instabilidade momentânea. Tente de novo em alguns
              segundos.
            </p>
            <BrutalActionButton
              className="mt-4"
              icon={<RefreshCw className="h-4 w-4" aria-hidden />}
              onClick={() => void loadFirstPage()}
            >
              Tentar de novo
            </BrutalActionButton>
          </div>
        ) : items.length === 0 ? (
          <div className="card-brutal rounded-2xl border-2 border-slate-950 bg-white p-6">
            {hasActiveFilters ? (
              <>
                {/* TODO(Ana): validar a copy do vazio com filtros ativos. */}
                <p className="font-display text-lg font-black text-slate-950">
                  Nenhuma vaga com esses filtros
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Ajuste os filtros ou a busca pra ampliar os resultados.
                </p>
              </>
            ) : (
              <>
                {/* TODO(Ana): validar a copy do vazio sem filtros. */}
                <p className="font-display text-lg font-black text-slate-950">
                  Nenhuma vaga no feed agora
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  O feed é atualizado ao longo do dia. Volte mais tarde.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm font-bold text-slate-500">
              {total} {total === 1 ? "vaga encontrada" : "vagas encontradas"}
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((job) => (
                <VagasJobCard key={job.id} job={job} onOpen={onOpen} />
              ))}
            </div>
            {hasMore ? (
              <div className="mt-8 flex justify-center">
                <BrutalActionButton
                  loading={loadingMore}
                  onClick={() => void loadMore()}
                >
                  Carregar mais vagas
                </BrutalActionButton>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
