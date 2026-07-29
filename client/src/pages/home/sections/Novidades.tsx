import { useEffect, useState, type ReactNode } from "react";
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

// UM skeleton POR TIPO DE CARD, cada um espelhando o proprio card.
//
// O que havia antes era um `h-64` (256px) escolhido a mao, que nao correspondia a
// nenhuma altura real: medidas em Chrome real, os cards dao 194 (noticia), 274
// (eventos) e 224 (dica). A secao encolhia 98px no mobile e crescia 18px no
// desktop quando o fetch chegava. Isso quase nao pontuava CLS, porque a secao
// esta abaixo da dobra na carga, mas movia todas as ancoras abaixo dela.
//
// Um skeleton generico para os tres nao resolve, e isso foi medido: no desktop a
// grade iguala tudo pela altura do mais alto e um valor unico basta, mas no
// mobile os cards empilham com alturas genuinamente diferentes (194 noticia, 274
// eventos, 224 dica) e nenhuma caixa unica bate com as tres. A tentativa com um
// skeleton so trocou -98px por +92px: mesma amplitude, sinal invertido.
//
// Aqui cada skeleton tem as MESMAS linhas do card que substitui, na mesma caixa
// (`CARD_BASE`, mesmo padding e raio), entao a altura reservada e derivada da
// mesma estrutura em vez de escolhida a mao.
//
// Borda `border-slate-200` em vez da `border-slate-950` do card real de proposito:
// ocupar o espaco certo sem se parecer com conteudo pronto.
function SkeletonCaixa({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${CARD_BASE} border-slate-200 motion-safe:animate-pulse`}
      aria-busy="true"
      aria-label="Carregando"
    >
      {children}
    </div>
  );
}

/**
 * Uma linha de texto falsa, com a altura DERIVADA da tipografia herdada.
 *
 * O `&nbsp;` faz o bloco ocupar exatamente um `line-height` do contexto em que
 * esta, entao quem define a altura e a MESMA classe de tipografia do card real
 * (`text-lg leading-snug`, `text-base leading-snug`, `text-sm`...). Nao ha pixel
 * escrito a mao aqui, e nao ha o que atualizar quando a tipografia mudar: a
 * altura acompanha sozinha.
 *
 * Era isso que faltava na versao anterior, que usava `h-6`, `h-5`, `h-[22px]` e
 * ficava sistematicamente 14 a 20px curta por card.
 */
function SkeletonLinha({ w, tom = "bg-slate-200" }: { w: string; tom?: string }) {
  return (
    <div className={`${w} ${tom} rounded`} aria-hidden>
      &nbsp;
    </div>
  );
}

// Espelha CARD_LABEL: `text-sm` com `mb-3`, e um icone de 16px que nao estoura a
// linha de 20px.
function SkeletonRotulo() {
  return (
    <div className="mb-3 text-sm">
      <SkeletonLinha w="w-36" />
    </div>
  );
}

// Espelha CARD_LINK: `mt-auto` com `pt-4`, `text-sm`.
function SkeletonLink() {
  return (
    <div className="mt-auto pt-4 text-sm">
      <SkeletonLinha w="w-24" />
    </div>
  );
}

// Noticia: rotulo + titulo `h3.font-display.text-lg.leading-snug` + link.
// Tres linhas: e o que o titulo de noticia ocupa em 390px (medido: 74px, tres
// linhas de 24.7px). Titulo curto sobra, titulo longo falta -- ver o residuo
// declarado no comentario do topo.
function NoticiaSkeleton() {
  return (
    <SkeletonCaixa>
      <SkeletonRotulo />
      <div className="font-display text-lg leading-snug">
        <SkeletonLinha w="w-full" />
        <SkeletonLinha w="w-full" />
        <SkeletonLinha w="w-3/5" />
      </div>
      <SkeletonLink />
    </SkeletonCaixa>
  );
}

// Eventos: rotulo + lista de 3 itens em `space-y-3`, cada item com nome
// (`text-sm leading-snug`) e data (`mt-0.5 text-xs`) + link.
//
// E o unico dos tres cuja altura NAO depende de texto variavel: a lista e sempre
// `slice(0, 3)`, e nome de evento cabe em uma linha nas medicoes feitas.
function EventosSkeleton() {
  return (
    <SkeletonCaixa>
      <SkeletonRotulo />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="text-sm leading-snug">
              <SkeletonLinha w="w-full" />
            </div>
            {/* `leading-snug` sem `text-xs`, e os dois detalhes sao medidos.
                No card real a data e um `inline-flex` dentro de um
                `<a class="block">`: um elemento inline-level assenta numa caixa
                de linha governada pelo contexto, e nao pelo `text-xs` dele
                proprio. Copiar `text-xs` dava 16px e deixava o card 18px curto;
                herdar a linha base dava 24px e passava 6px, quebrando o zero do
                desktop. A caixa real mede 22px, que e `leading-snug` sobre a
                fonte base. */}
            <div className="mt-0.5 leading-snug">
              <SkeletonLinha w="w-28" tom="bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
      <SkeletonLink />
    </SkeletonCaixa>
  );
}

// Dica: rotulo + paragrafo `text-base leading-snug` + a faixa de acoes, que tem
// um botao (`h-9` com padding proprio) e nao um link comum.
//
// Tres linhas e a mediana. A dica exibida e SORTEADA a cada carga
// (`Math.random()` em DicaCard), entao a altura real deste card varia entre uma
// visita e outra por desenho, e nenhuma reserva fixa acerta sempre.
function DicaSkeleton() {
  return (
    <SkeletonCaixa>
      <SkeletonRotulo />
      <div className="font-display text-base leading-snug">
        <SkeletonLinha w="w-full" />
        <SkeletonLinha w="w-full" />
        <SkeletonLinha w="w-3/5" />
      </div>
      <div className="mt-auto flex items-center gap-3 pt-4">
        <div className="h-9 w-32 rounded-full bg-slate-200" aria-hidden />
        <div className="text-sm">
          <SkeletonLinha w="w-20" />
        </div>
      </div>
    </SkeletonCaixa>
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

  if (carregando) return <NoticiaSkeleton />;
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

  if (proximos === null) return <EventosSkeleton />;
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

  if (dicas === null) return <DicaSkeleton />;
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
