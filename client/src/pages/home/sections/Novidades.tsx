import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  Lightbulb,
  Newspaper,
  Shuffle,
} from "lucide-react";
import { getNews, type NewsItem } from "@/services/contentApi";

// Bloco unico de "Novidades" no topo da home (logo apos o hero): reune as tres
// atualizacoes reais (ultima noticia, proximos eventos e dica rapida) que antes
// viviam soltas la embaixo. Cada card carrega sua fonte de forma independente,
// mostra skeleton enquanto busca e se esconde se a fonte falhar ou vier vazia,
// sem derrubar a secao. Nao inventa dado.

type Evento = (typeof import("@/lib/eventosData"))["eventos"][number];
type Dica = (typeof import("@/lib/dicasData"))["dicas"][number];

// Altura minima do card, a partir de `sm`.
//
// 274px e a altura MEDIDA do card mais alto (eventos) em Chrome real, e a partir
// de `sm` a grade iguala todos por ela de qualquer jeito, entao reservar aqui nao
// muda nada do layout final e elimina o salto. Abaixo de `sm` os cards empilham
// com altura natural (medidas: 194, 274, 202), e forcar 274 nos tres custaria
// cerca de 150px de espaco vazio numa secao que e curta de proposito.
const CARD_MIN_H = "sm:min-h-[274px]";

const CARD_BASE =
  `flex h-full flex-col rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[5px_5px_0_#0f172a] ${CARD_MIN_H}`;

const CARD_LABEL =
  "mb-3 inline-flex w-fit items-center gap-2 text-sm font-black uppercase tracking-[0.2em]";

const CARD_LINK =
  "mt-auto inline-flex w-fit items-center gap-1 pt-4 text-sm font-black text-violet-800 hover:underline";

// Skeleton ESTRUTURAL: mesma caixa do card real (mesmo padding, raio, borda e
// `min-h`), com blocos internos no lugar do label, do titulo, do texto e do
// link. A altura passa a ser DERIVADA da mesma caixa, em vez de um `h-64` (256px)
// escolhido a mao.
//
// O 256 nao correspondia a nenhuma altura real: medidas em Chrome real, os cards
// dao 194 (noticia), 274 (eventos) e 202 (dica). O resultado era a secao encolher
// 98px no mobile e crescer 18px no desktop quando o fetch chegava. Isso quase nao
// pontuava CLS, porque a secao esta abaixo da dobra na carga, mas movia todas as
// ancoras abaixo dela, que e o que a Demanda 3 precisa que fique parado.
//
// A borda fica `border-slate-200` (e nao a `border-slate-950` do card real) de
// proposito: o skeleton deve ocupar o espaco certo sem se parecer com conteudo
// pronto.
function CardSkeleton() {
  return (
    <div
      className={`${CARD_BASE} border-slate-200 motion-safe:animate-pulse`}
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="mb-3 h-4 w-32 rounded bg-slate-200" />
      <div className="h-5 w-full rounded bg-slate-200" />
      <div className="mt-2 h-5 w-4/5 rounded bg-slate-200" />
      <div className="mt-4 h-4 w-full rounded bg-slate-100" />
      <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
      <div className="mt-auto h-4 w-24 rounded bg-slate-200" />
    </div>
  );
}

function NoticiaCard() {
  const [item, setItem] = useState<NewsItem | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    getNews({ limit: 1 })
      .then((res) => {
        if (ativo) setItem(res?.items[0] ?? null);
      })
      .catch(() => {
        if (ativo) setItem(null);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) return <CardSkeleton />;
  if (!item) return null;

  return (
    <article className={CARD_BASE}>
      <span className={`${CARD_LABEL} text-violet-800`}>
        <Newspaper className="h-4 w-4" aria-hidden />
        Última notícia
      </span>
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
      >
        <h3 className="font-display text-lg font-black leading-snug text-slate-950 group-hover:underline">
          {item.titulo}
        </h3>
      </a>
      <Link href="/noticias" className={CARD_LINK}>
        Ver todas
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}

function EventosCard() {
  const [proximos, setProximos] = useState<Evento[] | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([import("@/lib/eventosData"), import("@/lib/eventFilters")])
      .then(([{ eventos }, { isEventoPassado, eventoSortKey }]) => {
        if (!ativo) return;
        setProximos(
          eventos
            .filter((evento) => !isEventoPassado(evento) && Boolean(evento.link))
            .sort((a, b) => eventoSortKey(a).localeCompare(eventoSortKey(b)))
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

  if (proximos === null) return <CardSkeleton />;
  if (proximos.length === 0) return null;

  return (
    <div className={CARD_BASE} aria-label="Próximos eventos" role="group">
      <span className={`${CARD_LABEL} text-violet-800`}>
        <CalendarDays className="h-4 w-4" aria-hidden />
        Próximos eventos
      </span>
      <ul className="space-y-3">
        {proximos.map((evento) => (
          <li key={evento.id}>
            <a
              href={evento.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
            >
              <span className="block font-display text-sm font-black leading-snug text-slate-950 group-hover:underline">
                {evento.nome}
              </span>
              <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <CalendarDays
                  className="h-3.5 w-3.5 shrink-0 text-violet-600"
                  aria-hidden
                />
                {evento.data}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <Link href="/eventos" className={CARD_LINK}>
        Ver todos
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function DicaCard() {
  const [dicas, setDicas] = useState<Dica[] | null>(null);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    let ativo = true;
    import("@/lib/dicasData")
      .then((mod) => {
        if (!ativo) return;
        setDicas(mod.dicas);
        if (mod.dicas.length > 0) {
          setIndice(Math.floor(Math.random() * mod.dicas.length));
        }
      })
      .catch(() => {
        if (ativo) setDicas([]);
      });
    return () => {
      ativo = false;
    };
  }, []);

  function outra() {
    if (!dicas || dicas.length < 2) return;
    let proximo = indice;
    while (proximo === indice) {
      proximo = Math.floor(Math.random() * dicas.length);
    }
    setIndice(proximo);
  }

  if (dicas === null) return <CardSkeleton />;
  const dica = dicas[indice];
  if (!dica) return null;

  return (
    <div className={CARD_BASE}>
      <span className={`${CARD_LABEL} text-amber-700`}>
        <Lightbulb className="h-4 w-4" aria-hidden />
        Dica rápida
      </span>
      <p className="font-display text-base font-bold leading-snug text-slate-950">
        {dica.texto}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        <button
          type="button"
          onClick={outra}
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-amber-300 px-3 py-1.5 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all motion-safe:hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
        >
          <Shuffle className="h-4 w-4" aria-hidden />
          Outra dica
        </button>
        <Link
          href="/dicas"
          className="inline-flex items-center gap-1 text-sm font-black text-violet-800 hover:underline"
        >
          Ver todas
        </Link>
      </div>
    </div>
  );
}

export default function Novidades() {
  return (
    <section id="novidades" aria-label="Novidades" className="bnt-ancora bg-[#faf8f4] py-16 sm:py-20">
      <div className="container">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl font-black text-slate-950">
            Novidades
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            O que está rolando agora na tech.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <NoticiaCard />
          <EventosCard />
          <DicaCard />
        </div>
      </div>
    </section>
  );
}
