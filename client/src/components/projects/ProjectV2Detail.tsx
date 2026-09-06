import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, ExternalLink, Lightbulb } from "lucide-react";
import { roadmapLoaders } from "@/lib/roadmapV2/loaders";
import type { ProjetoCatalogo } from "@shared/projects/catalog";
import type { ProjetoV2Detalhe } from "@shared/projects/v2/types";

// Detalhe v2 de um projeto: os sete blocos que substituem a grade v1 quando o
// card abre. Sem estado proprio alem do carregamento da trilha, e o bloco de
// entrega vem por `children` para a pagina continuar dona do que e Pro e do
// que e conclusao.

type Props = {
  projeto: ProjetoCatalogo;
  detalhe: ProjetoV2Detalhe;
  etapasMarcadas: Record<string, string>;
  onToggleEtapa: (etapaId: string) => void;
  // Proximo projeto ja resolvido pela pagina (ela tem o catalogo em maos).
  // undefined cai no texto livre de `proximoProjeto`, como na v1.
  proximo?: { id: string; nome: string };
  children?: React.ReactNode;
};

const ROTULO = "text-xs font-medium text-slate-500 uppercase tracking-wide";
const BLOCO = "card-brutal rounded-lg border-slate-200 bg-white p-4";

function formatarTempo(t: ProjetoV2Detalhe["briefing"]["tempoEstimado"]) {
  const horas = `${t.horas[0]} a ${t.horas[1]} h`;
  if (!t.semanas) return horas;
  return `${horas}, ${t.semanas[0]} a ${t.semanas[1]} semanas`;
}

function dataCurta(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Titulos dos nos de trilha citados em `ajuda.trilha`. A trilha e carregada
// SO quando este bloco monta, um chunk por trilha (mesmo mapa que a pagina de
// roadmap usa). Falha vira null e o bloco degrada para o link da trilha.
function useTitulosDeNo(
  slug: string | undefined,
  nodeIds: readonly string[] | undefined,
): Map<string, string> | null {
  const [titulos, setTitulos] = useState<Map<string, string> | null>(null);
  useEffect(() => {
    if (!slug || !nodeIds?.length) return;
    let cancelado = false;
    const loader = roadmapLoaders[slug];
    if (!loader) return;
    void loader()
      .then((trilha) => {
        if (cancelado) return;
        const mapa = new Map<string, string>();
        const anda = (
          nodes: { id: string; title: string; children?: unknown }[],
        ) => {
          for (const n of nodes) {
            mapa.set(n.id, n.title);
            if (Array.isArray(n.children))
              anda(n.children as { id: string; title: string }[]);
          }
        };
        for (const secao of trilha.sections) anda(secao.children);
        setTitulos(mapa);
      })
      .catch(() => {
        if (!cancelado) setTitulos(null);
      });
    return () => {
      cancelado = true;
    };
  }, [slug, nodeIds]);
  return titulos;
}

export default function ProjectV2Detail({
  projeto,
  detalhe,
  etapasMarcadas,
  onToggleEtapa,
  proximo,
  children,
}: Props) {
  const { briefing, requisitos, etapas, kit, ajuda } = detalhe;
  const titulos = useTitulosDeNo(ajuda?.trilha?.slug, ajuda?.trilha?.nodeIds);
  const marcadas = etapas.filter((e) => e.id in etapasMarcadas).length;

  return (
    <div className="space-y-6">
      <section>
        {/* TODO(Ana): titulo do bloco de contexto do projeto */}
        <p className={ROTULO}>Por que este projeto</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {briefing.contexto}
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            {/* TODO(Ana): titulo da lista de aprendizados */}
            <p className={ROTULO}>Você vai sair sabendo</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {briefing.aprende.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            {/* TODO(Ana): titulo dos pre-requisitos */}
            <p className={ROTULO}>Antes de começar</p>
            <ul className="mt-2 space-y-1">
              {briefing.preRequisitos.map((pr) => (
                <li key={pr.href + pr.rotulo}>
                  <Link
                    href={pr.href}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded text-sm font-medium text-orange-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    {pr.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {/* TODO(Ana): rotulo do tempo estimado */}
          Tempo estimado: {formatarTempo(briefing.tempoEstimado)} · Nível{" "}
          {projeto.nivel}
        </p>
      </section>

      <section>
        {/* TODO(Ana): titulo dos requisitos de aceite */}
        <p className={ROTULO}>O que precisa estar lá no fim</p>
        <ol className="mt-2 space-y-2">
          {requisitos.map((req, i) => (
            <li
              key={req.id}
              className="flex items-start gap-2 text-sm text-slate-700"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {i + 1}
              </span>
              {req.descricao}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="flex items-center justify-between">
          {/* TODO(Ana): titulo do bloco de etapas */}
          <p className={ROTULO}>Etapas</p>
          <span className="text-xs font-bold text-slate-400">
            {/* TODO(Ana): contador de etapas */}
            {marcadas} de {etapas.length} etapas
          </span>
        </div>
        <ul className="mt-2 space-y-3">
          {etapas.map((etapa) => {
            const marcada = etapa.id in etapasMarcadas;
            return (
              <li key={etapa.id} className={BLOCO}>
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={marcada}
                    aria-label={etapa.titulo}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEtapa(etapa.id);
                    }}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-[2.5px] border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      marcada ? "bg-emerald-500 text-white" : "bg-white"
                    }`}
                  >
                    {marcada && <Check className="h-3 w-3" strokeWidth={4} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {etapa.titulo}
                      </p>
                      <span className="text-xs text-slate-500">
                        {etapa.tempo}
                      </span>
                      {marcada && (
                        <span className="text-xs font-medium text-emerald-700">
                          {/* TODO(Ana): rotulo da data em que a etapa foi marcada */}
                          feito em {dataCurta(etapasMarcadas[etapa.id])}
                        </span>
                      )}
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {etapa.oQueFazer.map((o) => (
                        <li key={o} className="text-sm text-slate-700">
                          {o}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {/* TODO(Ana): rotulo do criterio de pronto da etapa */}
                      Pronto quando: {etapa.prontoQuando}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {kit && kit.length > 0 && (
        <section>
          {/* TODO(Ana): titulo do kit de materiais */}
          <p className={ROTULO}>Kit</p>
          <ul className="mt-2 space-y-2">
            {kit.map((item) => (
              <li key={item.titulo} className={BLOCO}>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 underline-offset-2 hover:underline"
                  >
                    {item.titulo} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm font-bold text-slate-900">
                    {item.titulo}
                  </p>
                )}
                {item.nota && (
                  <p className="mt-1 text-sm text-slate-700">{item.nota}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ajuda && (
        <section>
          {/* TODO(Ana): titulo do bloco de ajuda */}
          <p className={ROTULO}>Se travar</p>
          <div className="mt-2 space-y-2">
            {ajuda.trilha && (
              <div className={BLOCO}>
                <Link
                  href={`/roadmaps/${ajuda.trilha.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded text-sm font-bold text-orange-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  {/* TODO(Ana): rotulo do link para a trilha */}
                  Ver na trilha
                </Link>
                {titulos && (
                  <ul className="mt-1 space-y-0.5">
                    {ajuda.trilha.nodeIds.map((id) => {
                      const titulo = titulos.get(id);
                      if (!titulo) return null;
                      return (
                        <li key={id} className="text-sm text-slate-700">
                          {titulo}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {ajuda.termos && ajuda.termos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ajuda.termos.map((termo) => (
                  <Link
                    key={termo}
                    href={`/dicionario?termo=${encodeURIComponent(termo)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    {termo}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        {/* TODO(Ana): titulo do bloco de entrega */}
        <p className={ROTULO}>Entrega</p>
        {children}
      </section>

      <section>
        {/* TODO(Ana): titulo do bloco do que vem depois */}
        <p className={ROTULO}>Depois</p>
        <div className="card-brutal mt-2 rounded-lg border-orange-200 bg-orange-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-orange-700" />
            <p className="text-xs font-medium uppercase tracking-wide text-orange-700">
              Sugestão de post no LinkedIn
            </p>
          </div>
          <p className="text-xs italic text-slate-700">
            &quot;{projeto.sugestaoLinkedIn}&quot;
          </p>
        </div>
        <div className="mt-3 text-sm text-slate-700">
          <span className="font-medium">
            {/* TODO(Ana): rotulo da sugestao de proximo projeto */}
            Sugestão pra praticar depois:
          </span>{" "}
          {proximo ? (
            <Link
              href={`/projetos/${proximo.id}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded font-medium text-orange-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {proximo.nome}
            </Link>
          ) : (
            <span>{projeto.proximoProjeto}</span>
          )}
        </div>
      </section>
    </div>
  );
}
