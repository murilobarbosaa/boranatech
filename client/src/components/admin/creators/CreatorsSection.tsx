import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

import UserAvatar from "@/components/UserAvatar";
import { BlocoBoundary } from "@/components/admin/BlocoBoundary";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { relativeTime } from "@/components/admin/tasks/relativeTime";
import { CreatorDashboardView } from "@/components/creator/CreatorDashboardView";
import { CreatorMetricTile } from "@/components/creator/CreatorMetricTile";
import { AdminApiError, adminFetch } from "@/lib/adminApi";
import { rotuloDoKind } from "@/lib/creatorKindLabel";
import { formatarCentavos } from "@/lib/formatarCentavos";
import { isUuid } from "@shared/adminAttention";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import {
  CREATOR_DASHBOARD_JANELA_PADRAO,
  isCreatorBoardKind,
  isCreatorBoardStatus,
  type CreatorBoardItem,
  type CreatorBoardKind,
  type CreatorBoardPage,
  type CreatorBoardResumo,
  type CreatorBoardStatus,
  type CreatorDashboard,
  type CreatorDashboardJanela,
} from "@shared/creatorDashboard";

import { CHAVES_DA_URL_DE_CREATORS as CHAVE } from "./creatorsUrlKeys";

// ABA CREATORS DO ADMIN: resumo, quadro paginado e o painel de um creator.
//
// A URL guarda os filtros (`status`, `kind`) e o creator aberto (`creator`),
// para F5 e link colado abrirem a mesma tela. A pagina fica em estado local e
// volta para 1 quando o filtro muda.
//
// O resumo e buscado uma vez por montagem da aba: abrir e fechar um painel nao
// o refaz, porque os numeros dele nao dependem do creator aberto.

const PAGE_SIZE = 25;

// TODO(Ana)
const OPCOES_DE_STATUS: Array<{ valor: CreatorBoardStatus; rotulo: string }> = [
  { valor: "active", rotulo: "Ativos" },
  { valor: "revoked", rotulo: "Revogados" },
  { valor: "all", rotulo: "Todos" },
];

// TODO(Ana)
const OPCOES_DE_KIND: Array<{ valor: CreatorBoardKind; rotulo: string }> = [
  { valor: "all", rotulo: "Todos" },
  { valor: "influencer", rotulo: "Influencers" },
  { valor: "afiliado", rotulo: "Afiliados" },
];

function dataCurta(iso: string | null): string {
  const dia = diaBrasilia(iso);
  return dia ? formatarDiaCivil(dia) : "";
}

function inteiro(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

function numero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** Resumo fora do formato vira erro: um card com `undefined` pareceria zero. */
function resumoDaResposta(json: unknown): CreatorBoardResumo | null {
  if (!objeto(json) || !objeto(json.data)) return null;
  const d = json.data;
  if (
    !objeto(d.creators_ativos) ||
    !objeto(d.codigos) ||
    !objeto(d.eventos_30d)
  ) {
    return null;
  }
  const ok =
    numero(d.creators_ativos.influencer) &&
    numero(d.creators_ativos.afiliado) &&
    numero(d.codigos.vinculados) &&
    numero(d.codigos.sem_dono) &&
    typeof d.eventos_30d.desde === "string" &&
    numero(d.eventos_30d.clicks) &&
    numero(d.eventos_30d.sales) &&
    numero(d.commission_due_cents);
  return ok ? (d as unknown as CreatorBoardResumo) : null;
}

function paginaDaResposta(json: unknown): CreatorBoardPage | null {
  if (!objeto(json) || !objeto(json.data)) return null;
  const d = json.data;
  if (!Array.isArray(d.rows) || !numero(d.total)) return null;
  return d as unknown as CreatorBoardPage;
}

function painelDaResposta(json: unknown): CreatorDashboard | null {
  if (!objeto(json) || !objeto(json.data)) return null;
  const d = json.data;
  if (!("creator" in d) || !("totais" in d) || !("codigos" in d)) return null;
  if (!("eventos" in d)) return null;
  return d as unknown as CreatorDashboard;
}

function BotaoTentarDeNovo({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center">
      <button
        type="button"
        onClick={onClick}
        className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
      >
        {/* TODO(Ana) */}
        Tentar de novo
      </button>
    </div>
  );
}

type EstadoDoResumo =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; resumo: CreatorBoardResumo };

function Resumo() {
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<EstadoDoResumo>({ tipo: "carregando" });

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    adminFetch("/creators/resumo")
      .then((json: unknown) => {
        if (cancelado) return;
        const resumo = resumoDaResposta(json);
        setEstado(resumo ? { tipo: "ok", resumo } : { tipo: "erro" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  if (estado.tipo === "carregando") {
    // TODO(Ana)
    return <LoadingBlock label="Carregando o resumo..." />;
  }
  if (estado.tipo === "erro") {
    return (
      <div data-testid="creators-resumo-erro" className="space-y-3">
        {/* TODO(Ana) */}
        <ErrorBlock message="Não foi possível carregar o resumo de creators." />
        <BotaoTentarDeNovo onClick={() => setTentativa((n) => n + 1)} />
      </div>
    );
  }

  const { resumo } = estado;
  // TODO(Ana)
  const pelosEventos = `pelos eventos, últimos 30 dias (desde ${dataCurta(resumo.eventos_30d.desde)})`;
  // TODO(Ana)
  const pelosContadores = "pelos contadores";

  return (
    <section
      data-testid="creators-resumo"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      <CreatorMetricTile
        testId="creators-resumo-influencers"
        // TODO(Ana)
        rotulo="Influencers ativos"
        valor={inteiro(resumo.creators_ativos.influencer)}
      />
      <CreatorMetricTile
        testId="creators-resumo-afiliados"
        // TODO(Ana)
        rotulo="Afiliados ativos"
        valor={inteiro(resumo.creators_ativos.afiliado)}
      />
      <CreatorMetricTile
        testId="creators-resumo-vinculados"
        // TODO(Ana)
        rotulo="Códigos vinculados"
        valor={inteiro(resumo.codigos.vinculados)}
      />
      <CreatorMetricTile
        testId="creators-resumo-sem-dono"
        // TODO(Ana)
        rotulo="Códigos sem dono"
        valor={inteiro(resumo.codigos.sem_dono)}
      />
      <CreatorMetricTile
        testId="creators-resumo-cliques"
        // TODO(Ana)
        rotulo="Cliques"
        valor={inteiro(resumo.eventos_30d.clicks)}
        detalhe={pelosEventos}
      />
      <CreatorMetricTile
        testId="creators-resumo-vendas"
        // TODO(Ana)
        rotulo="Vendas"
        valor={inteiro(resumo.eventos_30d.sales)}
        detalhe={pelosEventos}
      />
      <CreatorMetricTile
        testId="creators-resumo-comissao"
        // TODO(Ana)
        rotulo="Comissão a pagar"
        valor={formatarCentavos(resumo.commission_due_cents)}
        detalhe={pelosContadores}
      />
    </section>
  );
}

function Pilulas<T extends string>({
  rotulo,
  opcoes,
  valor,
  onChange,
}: {
  rotulo: string;
  opcoes: Array<{ valor: T; rotulo: string }>;
  valor: T;
  onChange: (valor: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className="flex flex-wrap overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[3px_3px_0_var(--bnt-shadow)]"
    >
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          role="radio"
          aria-checked={opcao.valor === valor}
          onClick={() => onChange(opcao.valor)}
          className={`-ml-0.5 border-l-2 border-slate-900 px-3 py-2 text-xs font-black uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400 sm:px-4 ${
            opcao.valor === valor
              ? "bg-yellow-300 text-ink-on-accent"
              : "bg-white text-slate-500 hover:bg-yellow-50 dark:hover:bg-secondary"
          }`}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}

function nomeDaLinha(item: CreatorBoardItem): string {
  // TODO(Ana)
  return item.name ?? item.email ?? item.handle ?? "Sem nome";
}

function LinhaDoQuadro({
  item,
  agoraMs,
  onAbrir,
}: {
  item: CreatorBoardItem;
  agoraMs: number;
  onAbrir: (userId: string) => void;
}) {
  const nome = nomeDaLinha(item);
  return (
    <tr
      data-testid={`creators-linha-${item.user_id}`}
      tabIndex={0}
      // TODO(Ana)
      aria-label={`Abrir painel de ${nome}`}
      onClick={() => onAbrir(item.user_id)}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          onAbrir(item.user_id);
        }
      }}
      className="cursor-pointer border-t-2 border-slate-200 align-top hover:bg-yellow-50 focus:outline-none focus-visible:bg-yellow-50 dark:hover:bg-secondary"
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <UserAvatar
            name={nome}
            avatarUrl={item.avatar_url}
            mode={item.avatar_url ? "photo" : "icon"}
            size="sm"
          />
          <div className="min-w-0">
            <p className="font-black text-slate-950">{nome}</p>
            {item.handle ? (
              <p className="text-xs font-bold text-slate-500">@{item.handle}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full border-2 border-sky-800 bg-sky-50 px-2 py-0.5 text-[11px] font-black text-sky-900">
            {rotuloDoKind(item.kind)}
          </span>
          {item.revoked_at ? (
            <span
              data-testid="creators-linha-revogado"
              className="rounded-full border-2 border-rose-700 bg-rose-50 px-2 py-0.5 text-[11px] font-black text-rose-800"
            >
              {/* TODO(Ana) */}
              Revogado
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3">
        {item.codigos.length === 0 ? (
          <span
            data-testid="creators-sem-codigo"
            className="rounded-full border-2 border-amber-600 bg-amber-50 px-2 py-0.5 text-[11px] font-black uppercase text-amber-900"
          >
            {/* TODO(Ana) */}
            sem código
          </span>
        ) : (
          <span className="font-bold text-slate-800">
            {item.codigos.map((c) => c.code).join(", ")}
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-right font-bold tabular-nums">
        {inteiro(item.totais.clicks)}
      </td>
      <td className="px-3 py-3 text-right font-bold tabular-nums">
        {inteiro(item.totais.sales)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums">
        {formatarCentavos(item.totais.revenue_cents)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums">
        {formatarCentavos(item.totais.commission_due_cents)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-700">
        {item.ultimo_evento_at
          ? relativeTime(item.ultimo_evento_at, agoraMs)
          : // TODO(Ana)
            "nenhum ainda"}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-700">
        {dataCurta(item.granted_at)}
      </td>
    </tr>
  );
}

type EstadoDoQuadro =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; pagina: CreatorBoardPage };

function Quadro({
  status,
  kind,
  page,
  onPage,
  onAbrir,
}: {
  status: CreatorBoardStatus;
  kind: CreatorBoardKind;
  page: number;
  onPage: (page: number) => void;
  onAbrir: (userId: string) => void;
}) {
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<EstadoDoQuadro>({ tipo: "carregando" });

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    const params = new URLSearchParams({
      status,
      kind,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    adminFetch(`/creators?${params.toString()}`)
      .then((json: unknown) => {
        if (cancelado) return;
        const pagina = paginaDaResposta(json);
        setEstado(pagina ? { tipo: "ok", pagina } : { tipo: "erro" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [status, kind, page, tentativa]);

  if (estado.tipo === "carregando") {
    // TODO(Ana)
    return <LoadingBlock label="Carregando creators..." />;
  }
  if (estado.tipo === "erro") {
    return (
      <div data-testid="creators-quadro-erro" className="space-y-3">
        {/* TODO(Ana) */}
        <ErrorBlock message="Não foi possível carregar a lista de creators." />
        <BotaoTentarDeNovo onClick={() => setTentativa((n) => n + 1)} />
      </div>
    );
  }

  const { pagina } = estado;
  if (pagina.rows.length === 0 && pagina.total === 0) {
    return (
      <p
        data-testid="creators-vazio"
        className="rounded-2xl border-2 border-dashed border-slate-400 bg-white p-6 text-center font-display text-lg font-black text-slate-950"
      >
        {/* TODO(Ana) */}
        Nenhum creator neste filtro.
      </p>
    );
  }

  const totalDePaginas = Math.max(1, Math.ceil(pagina.total / PAGE_SIZE));
  const agoraMs = Date.now();

  return (
    <div className="space-y-3">
      <div className="card-brutal overflow-x-auto rounded-3xl bg-white">
        <table data-testid="creators-quadro" className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              {/* TODO(Ana) */}
              <th className="min-w-[12rem] px-3 py-3">Creator</th>
              <th className="px-3 py-3">Tipo</th>
              <th className="min-w-[10rem] px-3 py-3">Códigos</th>
              <th className="px-3 py-3 text-right">Cliques</th>
              <th className="px-3 py-3 text-right">Vendas</th>
              <th className="px-3 py-3 text-right">Receita</th>
              <th className="px-3 py-3 text-right">Comissão a receber</th>
              <th className="px-3 py-3">Último evento</th>
              <th className="px-3 py-3">Creator desde</th>
            </tr>
          </thead>
          <tbody>
            {pagina.rows.map((item) => (
              <LinhaDoQuadro
                key={item.user_id}
                item={item}
                agoraMs={agoraMs}
                onAbrir={onAbrir}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-black uppercase tracking-wide text-slate-600">
          {/* TODO(Ana) */}
          {`${pagina.total} ${pagina.total === 1 ? "creator" : "creators"}`}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_var(--bnt-shadow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-40 disabled:shadow-none"
          >
            {/* TODO(Ana) */}
            Anterior
          </button>
          <span className="text-sm font-black text-slate-950">
            {/* TODO(Ana) */}
            {`Página ${page} de ${totalDePaginas}`}
          </span>
          <button
            type="button"
            onClick={() => onPage(Math.min(totalDePaginas, page + 1))}
            disabled={page >= totalDePaginas}
            className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_var(--bnt-shadow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-40 disabled:shadow-none"
          >
            {/* TODO(Ana) */}
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}

type EstadoDoPainel =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "nao_encontrado" }
  | { tipo: "ok"; painel: CreatorDashboard };

function PainelDoCreator({ userId }: { userId: string }) {
  const [janela, setJanela] = useState<CreatorDashboardJanela>(
    CREATOR_DASHBOARD_JANELA_PADRAO,
  );
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<EstadoDoPainel>({ tipo: "carregando" });

  useEffect(() => {
    let cancelado = false;
    // Zera ao trocar de janela: o painel anterior sob o rotulo novo diria
    // "7 dias" mostrando trinta.
    setEstado({ tipo: "carregando" });
    adminFetch(`/creators/${userId}?janela=${janela}`)
      .then((json: unknown) => {
        if (cancelado) return;
        const painel = painelDaResposta(json);
        setEstado(painel ? { tipo: "ok", painel } : { tipo: "erro" });
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        const naoEncontrado =
          err instanceof AdminApiError &&
          err.status === 404 &&
          err.code === "creator_not_found";
        setEstado(naoEncontrado ? { tipo: "nao_encontrado" } : { tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [userId, janela, tentativa]);

  if (estado.tipo === "carregando") {
    // TODO(Ana)
    return <LoadingBlock label="Carregando o painel do creator..." />;
  }
  if (estado.tipo === "erro") {
    return (
      <div data-testid="creators-painel-erro" className="space-y-3">
        {/* TODO(Ana) */}
        <ErrorBlock message="Não foi possível carregar o painel deste creator." />
        <BotaoTentarDeNovo onClick={() => setTentativa((n) => n + 1)} />
      </div>
    );
  }
  if (estado.tipo === "nao_encontrado") {
    return (
      <p
        data-testid="creators-painel-404"
        className="rounded-2xl border-2 border-dashed border-slate-400 bg-white p-6 text-center font-display text-lg font-black text-slate-950"
      >
        {/* TODO(Ana) */}
        Este usuário nunca teve acesso de creator.
      </p>
    );
  }
  return (
    <CreatorDashboardView
      painel={estado.painel}
      janela={janela}
      onJanelaChange={setJanela}
      visao="admin"
    />
  );
}

export function CreatorsSection() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);

  const statusDaUrl = params.get(CHAVE.status);
  const kindDaUrl = params.get(CHAVE.kind);
  const status: CreatorBoardStatus = isCreatorBoardStatus(statusDaUrl)
    ? statusDaUrl
    : "active";
  const kind: CreatorBoardKind = isCreatorBoardKind(kindDaUrl)
    ? kindDaUrl
    : "all";
  const creatorDaUrl = params.get(CHAVE.creator);
  const creatorAberto =
    creatorDaUrl !== null && isUuid(creatorDaUrl) ? creatorDaUrl : null;
  const creatorInvalido = creatorDaUrl !== null && creatorAberto === null;

  // A pagina pertence ao filtro em que foi escolhida. Guardar os dois juntos
  // volta para a pagina 1 quando o filtro muda por qualquer caminho (pilula,
  // voltar do navegador, link colado) sem uma busca extra na pagina velha.
  const chaveDoFiltro = `${status}|${kind}`;
  const [pagina, setPagina] = useState({ chave: chaveDoFiltro, page: 1 });
  const page = pagina.chave === chaveDoFiltro ? pagina.page : 1;

  function trocarParametro(chave: string, valor: string | null) {
    const atual = new URLSearchParams(search);
    if (valor === null) atual.delete(chave);
    else atual.set(chave, valor);
    setLocation(`/admin?${atual.toString()}`);
  }

  return (
    <div className="space-y-6">
      <BlocoBoundary
        // TODO(Ana)
        nome="Resumo de creators"
      >
        <Resumo />
      </BlocoBoundary>

      {creatorInvalido ? (
        <p
          data-testid="creators-link-invalido"
          className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-3 text-sm font-bold text-amber-900"
        >
          {/* TODO(Ana) */}O identificador de creator do link é inválido. O
          quadro continua disponível.
        </p>
      ) : null}

      {creatorAberto ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => trocarParametro(CHAVE.creator, null)}
              className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
            >
              {/* TODO(Ana) */}
              Voltar ao quadro
            </button>
            <Link
              href={`/admin?section=usuarios&user=${creatorAberto}`}
              className="text-sm font-black text-slate-900 underline underline-offset-2"
            >
              {/* TODO(Ana) */}
              Abrir na tela de usuários
            </Link>
          </div>
          <BlocoBoundary
            // TODO(Ana)
            nome="Painel do creator"
          >
            <PainelDoCreator key={creatorAberto} userId={creatorAberto} />
          </BlocoBoundary>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Pilulas
              // TODO(Ana)
              rotulo="Status da concessão"
              opcoes={OPCOES_DE_STATUS}
              valor={status}
              onChange={(valor) => trocarParametro(CHAVE.status, valor)}
            />
            <Pilulas
              // TODO(Ana)
              rotulo="Tipo de creator"
              opcoes={OPCOES_DE_KIND}
              valor={kind}
              onChange={(valor) => trocarParametro(CHAVE.kind, valor)}
            />
          </div>
          <BlocoBoundary
            // TODO(Ana)
            nome="Quadro de creators"
          >
            <Quadro
              status={status}
              kind={kind}
              page={page}
              onPage={(proxima) =>
                setPagina({ chave: chaveDoFiltro, page: proxima })
              }
              onAbrir={(userId) => trocarParametro(CHAVE.creator, userId)}
            />
          </BlocoBoundary>
        </div>
      )}
    </div>
  );
}
