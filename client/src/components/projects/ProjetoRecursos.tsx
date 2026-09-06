import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

import { roadmapLoaders } from "@/lib/roadmapV2/loaders";
import { labelForProjectArea } from "@/lib/projectAreaGroup";
import type { ProjetoV2Detalhe } from "@shared/projects/v2/types";

// Titulos dos nos de trilha citados em `ajuda.trilha`. A trilha carrega SO
// quando este bloco monta, um chunk por trilha. Falha vira null e o bloco
// degrada para o link da trilha.
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

const H3 = "font-display text-sm font-bold text-foreground";

export default function ProjetoRecursos({
  briefing,
  kit,
  ajuda,
}: {
  briefing: ProjetoV2Detalhe["briefing"];
  kit: ProjetoV2Detalhe["kit"];
  ajuda: ProjetoV2Detalhe["ajuda"];
}) {
  const titulos = useTitulosDeNo(ajuda?.trilha?.slug, ajuda?.trilha?.nodeIds);

  return (
    <>
      <section>
        <h3 className={H3}>Antes de começar</h3>
        <ul className="mt-2 grid gap-1.5">
          {briefing.preRequisitos.map((pr) => (
            <li key={pr.href + pr.rotulo} className="text-sm">
              <Link
                href={pr.href}
                className="rounded font-medium text-orange-700 underline-offset-2 hover:underline dark:text-orange-400"
              >
                {pr.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {kit && kit.length > 0 && (
        <section>
          <h3 className={H3}>Kit</h3>
          <ul className="mt-2 grid gap-2">
            {kit.map((item) => (
              <li
                key={item.titulo}
                className="rounded-[10px] border border-border bg-card p-3 text-sm"
              >
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-foreground underline-offset-2 hover:underline"
                  >
                    {item.titulo} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="block font-bold text-foreground">
                    {item.titulo}
                  </span>
                )}
                {item.nota && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.nota}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ajuda && (ajuda.trilha || ajuda.termos?.length) && (
        <section>
          <h3 className={H3}>Se travar</h3>
          {ajuda.trilha && (
            <div className="mt-2 text-sm">
              <Link
                href={`/roadmaps/${ajuda.trilha.slug}`}
                className="rounded font-bold text-orange-700 underline-offset-2 hover:underline dark:text-orange-400"
              >
                Ver na trilha de {labelForProjectArea(ajuda.trilha.slug)}
              </Link>
              {titulos && (
                <ul className="mt-1 grid gap-0.5 text-muted-foreground">
                  {ajuda.trilha.nodeIds.map((id) => {
                    const titulo = titulos.get(id);
                    if (!titulo) return null;
                    return <li key={id}>{titulo}</li>;
                  })}
                </ul>
              )}
            </div>
          )}
          {ajuda.termos && ajuda.termos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ajuda.termos.map((termo) => (
                <Link
                  key={termo}
                  href={`/dicionario?termo=${encodeURIComponent(termo)}`}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground"
                >
                  {termo}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
