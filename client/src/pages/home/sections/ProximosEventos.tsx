import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarDays, ExternalLink, MapPin } from "lucide-react";

type Evento = (typeof import("@/lib/eventosData"))["eventos"][number];

// Card na home com os proximos eventos, lendo a mesma fonte real da pagina de
// Eventos (array `eventos` de @/lib/eventosData). So mostra eventos que ainda
// nao passaram E que tem link/material publico. Nao inventa evento: se nao
// houver nenhum, mostra estado vazio elegante.
// O array e o filtro carregam sob demanda no mount (dynamic import) para nao
// entrarem no grafo do boot; o eventFilters tambem e dinamico porque importa
// de eventosData. Enquanto carrega, skeletons reservam o espaco (sem layout
// shift).
export default function ProximosEventos() {
  const [proximos, setProximos] = useState<Evento[] | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([import("@/lib/eventosData"), import("@/lib/eventFilters")])
      .then(([{ eventos }, { isEventoPassado }]) => {
        if (!ativo) return;
        setProximos(
          eventos
            .filter((evento) => !isEventoPassado(evento) && Boolean(evento.link))
            .slice(0, 3),
        );
      })
      .catch(() => {
        if (ativo) setProximos([]);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-violet-800">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Próximos eventos
          </span>
          <Link
            href="/eventos"
            className="inline-flex items-center gap-1 text-sm font-black text-violet-800 hover:underline"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {proximos === null ? (
          <ul
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            aria-hidden="true"
          >
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <div className="h-52 animate-pulse rounded-2xl border-2 border-slate-200 bg-slate-100" />
              </li>
            ))}
          </ul>
        ) : proximos.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proximos.map((evento) => (
              <li key={evento.id}>
                <a
                  href={evento.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_#0f172a] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[6px_6px_0_#0f172a]"
                >
                  <span className="mb-2 inline-flex w-fit rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-black uppercase text-violet-800">
                    {evento.categoria}
                  </span>
                  <h3 className="font-display text-lg font-black leading-snug text-slate-950">
                    {evento.nome}
                  </h3>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-slate-700">
                    <CalendarDays
                      className="h-4 w-4 shrink-0 text-violet-600"
                      aria-hidden
                    />
                    {evento.data}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {evento.cidade}, {evento.estado} · {evento.formato}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-violet-800">
                    Ver evento
                    <ExternalLink
                      className="h-3.5 w-3.5 transition-transform motion-safe:group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-display text-lg font-black text-slate-950">
              Nenhum evento agendado por enquanto
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Assim que rolar um evento novo, ele aparece aqui.
            </p>
            <Link
              href="/eventos"
              className="mt-4 inline-flex items-center gap-1 text-sm font-black text-violet-800 hover:underline"
            >
              Ir para os eventos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
