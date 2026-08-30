import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

import { ActiveUsersChart } from "./ActiveUsersChart";
import { UserDetailModal } from "./UserDetailModal";
import { UserListHeader, UserListRow } from "./UserListRow";
import type { UserListFilter, UserRow, UsersListPayload } from "./types";

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 350;

export function UsersDashboard() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserListFilter>("all");
  const [page, setPage] = useState(1);

  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // Debounce da busca: so dispara a query depois da pausa na digitacao. Mudar a
  // busca volta para a pagina 1 (a pagina atual pode nao existir no resultado).
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (search) params.set("search", search);
    if (filter !== "all") params.set("filter", filter);
    adminFetch(`/users?${params.toString()}`)
      .then((json) => {
        if (cancelled) return;
        const payload = (json.data as UsersListPayload) ?? null;
        setRows(Array.isArray(payload?.items) ? payload.items : []);
        setTotal(typeof payload?.total === "number" ? payload.total : 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setListError(
          err instanceof Error ? err.message : "Erro ao buscar usuários.",
        );
        setRows([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, filter, page]);

  function changeFilter(next: UserListFilter) {
    setFilter(next);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* ACIMA da busca: a serie responde "como anda a presenca" e e leitura de
          contexto, enquanto busca e filtro sao ferramentas de procurar UMA
          pessoa. Enterrar o grafico embaixo da lista o deixaria fora da dobra em
          qualquer tela, e ele existe justamente para ser visto sem procurar. */}
      <ActiveUsersChart />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nome ou e-mail"
          className="min-w-[220px] flex-1 rounded-2xl border-2 border-slate-900 bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-[3px_3px_0_#0f172a] placeholder:text-slate-400 focus:bg-yellow-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        />
        {/* Pills, nao BntSelect: sao 5 opcoes mutuamente exclusivas e curtas.
            A pill mostra TODAS as opcoes e o estado atual sem abrir nada, e
            troca em um toque; um select esconde as opcoes e cobra dois. */}
        {/* GRADE de 3 colunas no mobile, linha unica no desktop.
            5 opcoes em 3 colunas deixariam um vao na segunda linha (foi o
            defeito relatado: parecia tabela quebrada). A quarta pill ocupa 2
            colunas, entao a segunda linha FECHA e as divisorias verticais
            alinham com as da primeira.

            Scroll horizontal foi descartado: "Ativo" e a ultima opcao e
            ficaria fora da tela, ou seja, esconderia opcao. Esconder opcao era
            exatamente o contra que fez a Fatia 2 preferir pills a select, entao
            resolver o wrap escondendo opcao desfaria a decisao anterior em vez
            de completar. Reduzir rotulo tambem saiu: os textos "Assinantes" e
            "Sem assinatura" foram escolhidos na Fatia 2 para a tela nao se
            contradizer com o selo da linha, e encurtar traria a contradicao de
            volta. Sobra tipografia menor no mobile, que nao custa informacao. */}
        <div className="grid w-full grid-cols-3 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[3px_3px_0_#0f172a] sm:flex sm:w-auto sm:flex-wrap">
          {(
            [
              { value: "all", label: "Todos" },
              // "Assinantes"/"Sem assinatura" em vez de "Pro"/"Nao-Pro": o
              // filtro olha SO assinatura ativa (influencer fica de fora de
              // proposito, ver server/routes/admin.ts), enquanto o selo da
              // linha mostra o acesso REAL, que inclui influencer. Com os
              // rotulos antigos, os 24 influencers sem assinatura apareciam sob
              // "Nao-Pro" exibindo um selo de Pro: a tela se contradizia. Os
              // valores enviados a API seguem "pro" e "not_pro".
              { value: "pro", label: "Assinantes" },
              { value: "not_pro", label: "Sem assinatura" },
              { value: "influencers", label: "Influencers" },
              { value: "ativo", label: "Ativo" },
            ] as Array<{ value: UserListFilter; label: string }>
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeFilter(option.value)}
              className={`-ml-0.5 -mt-0.5 border-l-2 border-t-2 border-slate-900 px-2 py-2.5 text-[11px] font-black uppercase leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400 sm:px-4 sm:text-sm ${
                option.value === "influencers" ? "col-span-2 sm:col-span-1" : ""
              } ${
                filter === option.value
                  ? "bg-yellow-300 text-slate-950"
                  : "bg-white text-slate-500 hover:bg-yellow-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <article
        data-testid="users-list"
        className="card-brutal overflow-hidden rounded-3xl bg-white"
      >
        {listLoading ? (
          <div className="p-6">
            <LoadingBlock />
          </div>
        ) : listError ? (
          <div className="p-6">
            <ErrorBlock message={listError} />
          </div>
        ) : rows.length ? (
          <>
            <UserListHeader />
            {rows.map((row, index) => (
              <UserListRow
                key={row.user_id || row.id || row.email || `row-${index}`}
                row={row}
                onOpen={setActiveUserId}
              />
            ))}
          </>
        ) : (
          <div className="p-6">
            <p className="font-display text-xl font-black text-slate-950">
              Nenhum usuário encontrado
            </p>
            {/* Vazio NAO e erro: sao diagnosticos diferentes e a copy precisa
                separar "sua busca nao achou" de "a consulta falhou". */}
            <p
              data-testid="users-empty-hint"
              className="mt-2 text-sm font-semibold text-slate-500"
            >
              {search || filter !== "all"
                ? "Nada bateu com a busca ou o filtro. Tente outro termo ou volte para Todos."
                : "Ainda não há usuários cadastrados."}
            </p>
          </div>
        )}
      </article>

      {!listLoading && !listError ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-wide text-slate-600">
            {total} resultado{total === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#0f172a] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-40 disabled:shadow-none"
            >
              Anterior
            </button>
            <span className="text-sm font-black text-slate-950">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#0f172a] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-40 disabled:shadow-none"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}

      {activeUserId ? (
        <UserDetailModal
          userId={activeUserId}
          onClose={() => setActiveUserId(null)}
        />
      ) : null}
    </div>
  );
}
