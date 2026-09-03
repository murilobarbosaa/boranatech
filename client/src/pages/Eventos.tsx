/*
  BORA NA TECH? (Eventos Page)
  Style: Neo-Brutalism Suavizado
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarPlus,
  ExternalLink,
  LayoutGrid,
  MapPin,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { BntSelect } from "@/components/shared/BntSelect";
import {
  ESTADO_UF_OPTS,
  LABEL_FILTROS,
  rotuloEstadoEvento,
} from "@/lib/eventFilters";
import type { EstadoUfSigla } from "@/lib/eventFilters";
import { getEventos, type Evento } from "@/services/eventosService";

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Quantos cards entram por vez no "Mostrar mais". */
const LOTE = 30;

function rotuloEstado(evento: Evento): string {
  if (evento.estadoLabel) return evento.estadoLabel;
  return evento.uf ? rotuloEstadoEvento(evento.uf) : "";
}

/**
 * Data final EXCLUSIVA, mais um dia.
 *
 * O Google trata a data final de evento de dia inteiro como exclusiva: sem o +1
 * o ultimo dia some da agenda de quem se inscreve. A versao anterior desta
 * pagina passava `calendarEnd` cru e tinha esse defeito; a rotina que alimenta o
 * banco ja grava `calendar_url` corretamente, entao este fallback so roda quando
 * a coluna esta vazia.
 */
function maisUmDia(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function googleCalendarUrl(evento: Evento): string | null {
  if (evento.calendarUrl) return evento.calendarUrl;
  if (!evento.inicio) return null;
  const fim = evento.fim || evento.inicio;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evento.nome,
    dates: `${evento.inicio.replace(/-/g, "")}/${maisUmDia(fim)}`,
    details: `${evento.descricao}\n\nOrganizador: ${evento.organizador}\nValor: ${evento.valor}\nLink: ${evento.link}`,
    location: `${evento.cidade}, ${rotuloEstado(evento)} (${evento.formato})`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Rotulo de data a exibir: o do banco quando existe, senao a data formatada. */
function textoData(evento: Evento): string {
  if (evento.dataLabel) return evento.dataLabel;
  if (!evento.inicio) return "";
  const [a, m, d] = evento.inicio.split("-");
  return `${Number(d)} de ${MESES_PT[Number(m) - 1].toLowerCase()} de ${a}`;
}

/**
 * Data de hoje como "AAAA-MM-DD", no fuso DO NAVEGADOR.
 *
 * A rota /api/content/eventos ja fez o recorte grosso em America/Sao_Paulo:
 * evento que terminou antes de hoje nem chega aqui. Este calculo so decide, no
 * conjunto que sobrou, quais entram na secao "acontecendo agora", e para isso o
 * relogio de quem le e o certo: o publico e brasileiro, entao na pratica os
 * dois fusos coincidem, e nos raros casos em que nao (alguem viajando) a pagina
 * segue coerente com o calendario que a pessoa ve no proprio aparelho.
 *
 * `en-CA` produz o formato ISO, que compara como string na ordem certa. Mesmo
 * truque da rota, de proposito: duas formas diferentes de achar "hoje" no mesmo
 * fluxo e como as duas datas divergentes que o corretivo de fuso ja corrigiu
 * uma vez.
 */
function hojeLocalISO(): string {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

/**
 * Evento ja comecou e ainda nao terminou.
 *
 * `inicio < hoje` e nao `<=`: evento que COMECA hoje nao e "acontecendo agora",
 * e sim estreia de hoje, e segue no grupo do mes junto com os proximos. Quem
 * abre a pagina no dia da estreia acha o evento no lugar em que ele sempre
 * esteve.
 */
function estaAcontecendo(evento: Evento, hoje: string): boolean {
  if (!evento.inicio || !evento.fim) return false;
  return evento.inicio < hoje && evento.fim >= hoje;
}

/** Chave "AAAA-MM" para agrupar por mes. Null e recorrente ou a confirmar. */
function chaveMes(evento: Evento): string | null {
  return evento.inicio ? evento.inicio.slice(0, 7) : null;
}

function rotuloMes(chave: string): string {
  const [ano, mes] = chave.split("-");
  return `${MESES_PT[Number(mes) - 1]} de ${ano}`;
}

function eventInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function EventLogo({ name, logoUrl }: { name: string; logoUrl: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-[3px_3px_0_var(--bnt-shadow)]">
      <span
        className={`font-display text-sm font-black leading-none text-fuchsia-700 ${loaded ? "opacity-0" : "opacity-100"}`}
      >
        {eventInitials(name)}
      </span>
      <img
        src={logoUrl}
        alt={`Logo ${name}`}
        className={`absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
    </span>
  );
}

const ALL = "";
// Sentinela de borda p/ o BntSelect: o Radix Select proibe SelectItem value="".
// Os filtros usam ALL="" como "todos"; mapeamos "" <-> sentinela SO na borda, o
// state segue "". Campos isolados (categoria/formato), sem colisao entre eles.
const FILTRO_TODOS = "__todos__";

/**
 * Recorte "Internacional" do filtro de UF, que NAO e uma UF.
 *
 * O select lista as 27 unidades da federacao mais "Brasil: nacional ou
 * itinerante", e um evento fora do pais nao cabe em nenhuma delas: ele chega do
 * banco com `uf` nulo. Sem esta opcao, os eventos internacionais so apareciam
 * em "Todos os estados" e nao havia como pedi-los.
 *
 * O predicado e `uf` nulo E modalidade diferente de Online, os dois juntos.
 * Sem a segunda metade o recorte pegaria tambem todo evento online brasileiro,
 * que tambem tem `uf` nulo por nao ter lugar fisico, e ai "Internacional"
 * devolveria uma lista majoritariamente nacional, que e pior que nao ter o
 * filtro. Fica sentinela e nao valor de UF de proposito: gravar "INT" na coluna
 * seria inventar uma UF que o banco nao tem.
 */
const FILTRO_INTERNACIONAL = "__internacional__";

type Tab = "todos" | "webinars" | "hackathons";

const TAB_DEFS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: "todos", label: "Todos os eventos", Icon: LayoutGrid },
  { id: "webinars", label: "Webinars", Icon: Video },
  { id: "hackathons", label: "Hackathons", Icon: Trophy },
];

function matchTab(categoria: string, tab: Tab): boolean {
  if (tab === "hackathons")
    return categoria.toLowerCase().includes("hackathon");
  if (tab === "webinars") return categoria.toLowerCase().includes("webinar");
  return true;
}

function EventoCard({ ev }: { ev: Evento }) {
  const agenda = googleCalendarUrl(ev);
  return (
    <div className="card-brutal bg-white rounded-xl p-6 flex flex-col shadow-[5px_5px_0_#f0abfc]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <EventLogo name={ev.nome} logoUrl={ev.logoUrl} />
          <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full font-medium border border-fuchsia-200">
            {ev.categoria}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`max-w-[220px] rounded-full border-2 px-2 py-0.5 text-xs font-black ${ev.valor.toLowerCase() === "gratuito" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}
          >
            {ev.valor}
          </span>
          <FavoriteButton
            compact
            item={{
              id: ev.id,
              type: "evento",
              title: ev.nome,
              subtitle: ev.categoria,
              url: ev.link,
            }}
          />
        </div>
      </div>
      <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
        {ev.nome}
      </h3>
      <p className="text-sm text-slate-600 mb-4 flex-1">{ev.descricao}</p>
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 shrink-0" /> {textoData(ev)}{" "}
          {ev.horario !== "Vários horários" && `· ${ev.horario}`}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-2">
            {ev.cidade} · {rotuloEstado(ev)} · {ev.formato}
          </span>
        </div>
        {ev.local ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5 shrink-0" /> {ev.local}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">{ev.organizador}</span>
        <div className="flex flex-wrap gap-2">
          {agenda ? (
            <a
              href={agenda}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-slate-900 text-xs font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] hover:shadow-[3px_3px_0_var(--bnt-shadow)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              Google Calendar <CalendarPlus className="w-3 h-3 shrink-0" />
            </a>
          ) : null}
          <a
            href={ev.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-fuchsia-600 text-white text-xs font-semibold rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] hover:shadow-[3px_3px_0_var(--bnt-shadow)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            Inscrever <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Eventos() {
  const [tab, setTab] = useState<Tab>("todos");
  const [categoria, setCategoria] = useState(ALL);
  const [formato, setFormato] = useState(ALL);
  const [estadoUF, setEstadoUF] = useState<
    "" | EstadoUfSigla | typeof FILTRO_INTERNACIONAL
  >(ALL);
  const [apenasGratuitos, setApenasGratuitos] = useState(false);

  const [eventos, setEventos] = useState<Evento[] | null>(null);
  // Estado de erro NOMEADO, distinto de lista vazia. Eventos nao tem estatico
  // para cair, entao "nao consegui carregar" e "nao ha eventos" seriam a mesma
  // tela se este estado nao existisse.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visiveis, setVisiveis] = useState(LOTE);

  const carregar = useCallback(() => {
    let ativo = true;
    setEventos(null);
    setLoadError(null);
    getEventos()
      .then((payload) => {
        if (ativo) setEventos(payload.eventos);
      })
      .catch((error: unknown) => {
        if (!ativo) return;
        setEventos([]);
        // TODO(Ana)
        setLoadError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar os eventos.",
        );
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => carregar(), [carregar]);

  const carregados = useMemo(() => eventos ?? [], [eventos]);

  const tabCounts = useMemo(
    () => ({
      todos: carregados.length,
      webinars: carregados.filter((e) => matchTab(e.categoria, "webinars"))
        .length,
      hackathons: carregados.filter((e) => matchTab(e.categoria, "hackathons"))
        .length,
    }),
    [carregados],
  );

  const categoriasUnicas = useMemo(
    () =>
      Array.from(new Set(carregados.map((e) => e.categoria)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [carregados],
  );

  const filtered = useMemo(
    () =>
      carregados.filter((e) => {
        const matchTipo = matchTab(e.categoria, tab);
        const matchCat = !categoria || e.categoria === categoria;
        const matchFmt = !formato || e.formato === formato;
        const matchEst =
          !estadoUF ||
          (estadoUF === FILTRO_INTERNACIONAL
            ? e.uf === null && e.formato !== "Online"
            : e.uf === estadoUF);
        // Enum exato no lugar do `includes("gratuito")` sobre texto livre. O
        // comportamento observavel e o mesmo de antes: "misto" era o que a
        // pagina antiga chamava de "Gratuito e pago" e ja contava como gratuito.
        const matchGratuito =
          !apenasGratuitos ||
          e.precoTipo === "gratuito" ||
          e.precoTipo === "misto";
        return matchTipo && matchCat && matchFmt && matchEst && matchGratuito;
      }),
    [carregados, tab, categoria, formato, estadoUF, apenasGratuitos],
  );

  // Reinicia o lote a cada mudanca de recorte: manter 300 cards abertos depois
  // de trocar o filtro entregaria a lista inteira sem o usuario pedir.
  useEffect(() => {
    setVisiveis(LOTE);
  }, [tab, categoria, formato, estadoUF, apenasGratuitos]);

  const exibidos = useMemo(
    () => filtered.slice(0, visiveis),
    [filtered, visiveis],
  );

  /**
   * Agrupamento por mes sobre a FATIA visivel, nao sobre `filtered`: os
   * cabecalhos aparecem junto com os cards que eles encabecam, e nunca sobra
   * cabecalho de mes vazio esperando o proximo lote.
   */
  const grupos = useMemo(() => {
    const hoje = hojeLocalISO();
    const porMes = new Map<string, Evento[]>();
    const semData: Evento[] = [];
    const acontecendo: Evento[] = [];
    for (const e of exibidos) {
      // Os em andamento saem ANTES do agrupamento: eles ganham secao propria no
      // topo e nao podem aparecer tambem no grupo do mes em que comecaram, que
      // seria a mesma pessoa vendo o mesmo card duas vezes na mesma tela.
      if (estaAcontecendo(e, hoje)) {
        acontecendo.push(e);
        continue;
      }
      const chave = chaveMes(e);
      if (!chave || e.recorrente) {
        semData.push(e);
        continue;
      }
      const atual = porMes.get(chave);
      if (atual) atual.push(e);
      else porMes.set(chave, [e]);
    }
    return {
      // Ordenado por quem TERMINA primeiro, nao por quem comecou: e o que a
      // pessoa esta prestes a perder. Um congresso que acaba amanha vem antes
      // de um hackathon cuja inscricao fica aberta ate o ano que vem.
      acontecendo: acontecendo.sort((a, b) =>
        (a.fim ?? "").localeCompare(b.fim ?? ""),
      ),
      meses: Array.from(porMes.entries()).sort((a, b) =>
        a[0].localeCompare(b[0]),
      ),
      semData,
    };
  }, [exibidos]);

  return (
    <Layout>
      <SEO
        title="Eventos Tech · Hackathons, meetups e conferências de tecnologia"
        description="Encontre eventos de tecnologia, hackathons, meetups e conferências para aprender, fazer networking e entrar no mercado tech."
        keywords={[
          "eventos tech brasil",
          "hackathon programação",
          "meetup tecnologia",
          "conferências ti",
        ]}
        url="/eventos"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden bg-fuchsia-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#c026d3_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-fuchsia-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_var(--bnt-shadow)]">
              networking e movimento
            </p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">
              Eventos Tech
            </h1>
            <p className="text-slate-950 text-lg">
              Encontre eventos de tecnologia, networking e aprendizado perto de
              você.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-fuchsia-50 border-b-2 border-fuchsia-200 py-4">
        <div className="container">
          <div
            role="tablist"
            aria-label="Tipo de evento"
            className="mb-4 flex flex-wrap gap-2"
          >
            {TAB_DEFS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  className={`inline-flex items-center gap-2 rounded-full border-2 border-slate-900 px-4 py-2 text-sm font-black transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-200 ${
                    active
                      ? "bg-fuchsia-500 text-white shadow-[3px_3px_0_var(--bnt-shadow)]"
                      : "bg-white text-slate-900 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_var(--bnt-shadow)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-black ${
                      active
                        ? "bg-white/25 text-white"
                        : "bg-fuchsia-100 text-fuchsia-700"
                    }`}
                  >
                    {tabCounts[id]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {tab === "todos" && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="filter-evento-tipo"
                  className="text-xs font-bold text-slate-700"
                >
                  {LABEL_FILTROS.categoria}
                </label>
                <BntSelect
                  accent="pink"
                  id="filter-evento-tipo"
                  fullWidth={false}
                  value={categoria === ALL ? FILTRO_TODOS : categoria}
                  onValueChange={(v) =>
                    setCategoria(v === FILTRO_TODOS ? ALL : v)
                  }
                  options={[
                    ...categoriasUnicas.map((c) => ({ value: c, label: c })),
                    { value: FILTRO_TODOS, label: LABEL_FILTROS.categoria },
                  ]}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="filter-evento-modalidade"
                className="text-xs font-bold text-slate-700"
              >
                {LABEL_FILTROS.modalidade}
              </label>
              <BntSelect
                accent="pink"
                id="filter-evento-modalidade"
                fullWidth={false}
                value={formato === ALL ? FILTRO_TODOS : formato}
                onValueChange={(v) => setFormato(v === FILTRO_TODOS ? ALL : v)}
                options={[
                  { value: "Presencial", label: "Presencial" },
                  { value: "Online", label: "Online" },
                  { value: "Híbrido", label: "Híbrido (presencial + remoto)" },
                  { value: FILTRO_TODOS, label: LABEL_FILTROS.modalidade },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="filter-evento-estado"
                className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900"
              >
                <MapPin className="h-3.5 w-3.5 text-pink-600" />
                {LABEL_FILTROS.estado} (UF)
              </label>
              <BntSelect
                accent="pink"
                id="filter-evento-estado"
                fullWidth={false}
                triggerClassName="min-w-[13rem]"
                leadingIcon={<MapPin className="h-4 w-4 text-pink-600" />}
                value={estadoUF === ALL ? FILTRO_TODOS : estadoUF}
                onValueChange={(v) =>
                  setEstadoUF(
                    v === FILTRO_TODOS
                      ? ALL
                      : v === FILTRO_INTERNACIONAL
                        ? FILTRO_INTERNACIONAL
                        : (v as EstadoUfSigla),
                  )
                }
                options={[
                  ...ESTADO_UF_OPTS.map(({ sigla, nome }) => ({
                    value: sigla,
                    label: nome,
                  })),
                  { value: FILTRO_INTERNACIONAL, label: "Internacional" },
                  { value: FILTRO_TODOS, label: "Todos os estados" },
                ]}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={apenasGratuitos}
                onChange={(e) => setApenasGratuitos(e.target.checked)}
                className="w-4 h-4 accent-fuchsia-600"
              />
              Apenas gratuitos
            </label>
          </div>
        </div>
      </section>

      <section className="bg-[var(--bnt-surface)] py-12">
        <div className="container">
          {eventos === null ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-xl border-2 border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : null}

          {loadError ? (
            <div className="card-brutal rounded-xl bg-white p-6 text-center">
              {/* TODO(Ana) */}
              <p className="font-display text-xl font-black text-rose-800">
                Não foi possível carregar a agenda
              </p>
              {/* TODO(Ana) */}
              <p className="mx-auto mt-2 max-w-lg text-sm font-semibold text-slate-600">
                Isto não é uma agenda vazia: ela não chegou. Os eventos
                continuam lá, é a busca que falhou.
              </p>
              <p className="mx-auto mt-3 max-w-lg rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
                {loadError}
              </p>
              {/* TODO(Ana) */}
              <button
                type="button"
                onClick={() => carregar()}
                className="mt-4 rounded-full border-2 border-slate-900 bg-yellow-300 px-5 py-2.5 text-sm font-black"
              >
                Tentar de novo
              </button>
            </div>
          ) : null}

          {grupos.acontecendo.length > 0 && (
            <section className="mb-10">
              {/* TODO(Ana) */}
              <h2 className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-emerald-200 px-4 py-1.5 font-display text-sm font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_var(--bnt-shadow)]">
                Acontecendo agora
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {grupos.acontecendo.map((ev) => (
                  <EventoCard key={ev.id} ev={ev} />
                ))}
              </div>
            </section>
          )}

          {grupos.meses.map(([chave, doMes]) => (
            <section key={chave} className="mb-10">
              <h2 className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-fuchsia-200 px-4 py-1.5 font-display text-sm font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_var(--bnt-shadow)]">
                {rotuloMes(chave)}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {doMes.map((ev) => (
                  <EventoCard key={ev.id} ev={ev} />
                ))}
              </div>
            </section>
          ))}

          {grupos.semData.length > 0 && (
            <section className="mb-10">
              {/* TODO(Ana) */}
              <h2 className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-violet-200 px-4 py-1.5 font-display text-sm font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_var(--bnt-shadow)]">
                Recorrentes e a confirmar
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {grupos.semData.map((ev) => (
                  <EventoCard key={ev.id} ev={ev} />
                ))}
              </div>
            </section>
          )}

          {filtered.length > exibidos.length && (
            <div className="mb-10 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setVisiveis((n) => n + LOTE)}
                className="rounded-full border-2 border-slate-900 bg-fuchsia-500 px-6 py-3 text-sm font-black text-white shadow-[4px_4px_0_var(--bnt-shadow)] transition-all hover:-translate-y-0.5"
              >
                {/* TODO(Ana) */}
                Mostrar mais eventos
              </button>
              {/* TODO(Ana) */}
              <p className="text-xs font-bold text-slate-500">
                Mostrando {exibidos.length} de {filtered.length}
              </p>
            </div>
          )}

          {eventos !== null &&
            !loadError &&
            filtered.length === 0 &&
            (tabCounts[tab] === 0 ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-3">🗓️</p>
                <p className="text-slate-600 font-medium">
                  Ainda não temos eventos desse tipo por aqui.
                </p>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-3xl mb-3">📅</p>
                <p className="text-slate-600 font-medium">
                  Nenhum evento encontrado com esses filtros.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoria(ALL);
                    setFormato(ALL);
                    setEstadoUF(ALL);
                    setApenasGratuitos(false);
                  }}
                  className="mt-4 text-fuchsia-700 text-sm font-medium hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            ))}

          <div className="mt-10 p-5 bg-fuchsia-50 border-2 border-fuchsia-200 rounded-xl">
            <h3 className="font-display font-semibold text-slate-900 mb-2">
              Dica: como encontrar mais eventos
            </h3>
            <p className="text-sm text-slate-600">
              Além dos eventos listados aqui, você pode buscar eventos no{" "}
              <strong>Meetup.com</strong>, <strong>Sympla</strong> e{" "}
              <strong>Eventbrite</strong>. Pesquise por &quot;tech&quot;,
              &quot;programação&quot;, &quot;UX&quot; ou &quot;dados&quot; na
              sua cidade.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
