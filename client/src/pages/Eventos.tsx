/*
  BORA NA TECH? (Eventos Page)
  Style: Neo-Brutalism Suavizado
*/

import { useMemo, useState } from "react";
import {
  Calendar,
  CalendarPlus,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import {
  ESTADO_UF_OPTS,
  LABEL_FILTROS,
  isEventoPassado,
  rotuloEstadoEvento,
} from "@/lib/eventFilters";
import type { EstadoUfSigla } from "@/lib/eventFilters";
import { eventos } from "@/lib/data";

function googleCalendarUrl(evento: (typeof eventos)[number]) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evento.nome,
    dates: `${evento.calendarStart}/${evento.calendarEnd}`,
    details: `${evento.descricao}\n\nOrganizador: ${evento.organizador}\nValor: ${evento.valor}\nLink: ${evento.link}`,
    location: `${evento.cidade}, ${rotuloEstadoEvento(evento.estado)} (${evento.formato})`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-[3px_3px_0_#0f172a]">
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

export default function Eventos() {
  const [categoria, setCategoria] = useState(ALL);
  const [formato, setFormato] = useState(ALL);
  const [estadoUF, setEstadoUF] = useState<"" | EstadoUfSigla>(ALL);
  const [apenasGratuitos, setApenasGratuitos] = useState(false);

  const categoriasUnicas = useMemo(
    () =>
      Array.from(new Set(eventos.map((e) => e.categoria))).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [],
  );

  const filtered = useMemo(
    () =>
      eventos.filter((e) => {
        if (isEventoPassado(e)) return false;

        const matchCat = !categoria || e.categoria === categoria;

        const matchFmt = !formato || e.formato === formato;

        const matchEst = !estadoUF || e.estado === estadoUF;

        const matchGratuito =
          !apenasGratuitos || e.valor.toLowerCase().includes("gratuito");
        return matchCat && matchFmt && matchEst && matchGratuito;
      }),
    [categoria, formato, estadoUF, apenasGratuitos],
  );

  const selectClass =
    "min-w-[10.5rem] max-w-[16rem] px-3 py-2 border-2 border-fuchsia-200 rounded-lg text-sm focus:outline-none focus:border-fuchsia-500 bg-white truncate";

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
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-fuchsia-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
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

      <section className="bg-fuchsia-50 border-b-2 border-fuchsia-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="filter-evento-tipo"
                className="text-xs font-bold text-slate-700"
              >
                {LABEL_FILTROS.categoria}
              </label>
              <select
                id="filter-evento-tipo"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={selectClass}
                title={LABEL_FILTROS.categoria}
              >
                {categoriasUnicas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="">{LABEL_FILTROS.categoria}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="filter-evento-modalidade"
                className="text-xs font-bold text-slate-700"
              >
                {LABEL_FILTROS.modalidade}
              </label>
              <select
                id="filter-evento-modalidade"
                value={formato}
                onChange={(e) => setFormato(e.target.value)}
                className={selectClass}
                title={LABEL_FILTROS.modalidade}
              >
                <option value="Presencial">Presencial</option>
                <option value="Online">Online</option>
                <option value="Híbrido">Híbrido (presencial + remoto)</option>
                <option value="">{LABEL_FILTROS.modalidade}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="filter-evento-estado"
                className="text-xs font-bold text-slate-700"
              >
                {LABEL_FILTROS.estado}
              </label>
              <select
                id="filter-evento-estado"
                value={estadoUF}
                onChange={(e) =>
                  setEstadoUF(e.target.value as "" | EstadoUfSigla)
                }
                className={`${selectClass} min-w-[13rem]`}
                title={LABEL_FILTROS.estado}
              >
                {ESTADO_UF_OPTS.map(({ sigla, nome }) => (
                  <option key={sigla} value={sigla}>
                    {nome}
                  </option>
                ))}
                <option value="">{LABEL_FILTROS.estado}</option>
              </select>
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

      <section className="bg-[#fdf4ff] py-12">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((ev) => (
              <div
                key={ev.id}
                className="card-brutal bg-white rounded-xl p-6 flex flex-col shadow-[5px_5px_0_#f0abfc]"
              >
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
                <p className="text-sm text-slate-600 mb-4 flex-1">
                  {ev.descricao}
                </p>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 shrink-0" /> {ev.data}{" "}
                    {ev.horario !== "Vários horários" && `· ${ev.horario}`}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-2">
                      {ev.cidade} · {rotuloEstadoEvento(ev.estado)} ·{" "}
                      {ev.formato}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5 shrink-0" /> {ev.area}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {ev.organizador}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={googleCalendarUrl(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-slate-900 text-xs font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] hover:shadow-[3px_3px_0_#0f172a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                    >
                      Google Calendar{" "}
                      <CalendarPlus className="w-3 h-3 shrink-0" />
                    </a>
                    <a
                      href={ev.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-fuchsia-600 text-white text-xs font-semibold rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] hover:shadow-[3px_3px_0_#0f172a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                    >
                      Inscrever <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
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
          )}

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
