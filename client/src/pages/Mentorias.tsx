import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import PageHero from "@/components/shared/PageHero";
import ProGate from "@/components/pro/ProGate";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  ebooks,
  mentorias,
  type RecursoTipo,
} from "@/lib/mentoriasEbooks";

const ac = getPageAccentUi("amber");

const filtros = ["Todas", "Grátis", "Pagas"] as const;
type Filtro = (typeof filtros)[number];

const TIPO_BADGE: Record<RecursoTipo, string> = {
  Grátis: "border-emerald-400 bg-emerald-100 text-emerald-900",
  Paga: "border-amber-400 bg-amber-200 text-amber-950",
};

function matchFiltro(tipo: RecursoTipo, filtro: Filtro) {
  if (filtro === "Todas") return true;
  if (filtro === "Grátis") return tipo === "Grátis";
  return tipo === "Paga";
}

interface RecursoCardProps {
  titulo: string;
  pessoa: string;
  descricao: string;
  tipo: RecursoTipo;
  link: string;
  index: number;
  reduce: boolean;
}

function RecursoCard({
  titulo,
  pessoa,
  descricao,
  tipo,
  link,
  index,
  reduce,
}: RecursoCardProps) {
  return (
    <motion.a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      className="group flex h-full flex-col rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_#0f172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-black leading-tight text-slate-950">
          {titulo}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full border-2 px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wide",
            TIPO_BADGE[tipo],
          )}
        >
          {tipo}
        </span>
      </div>
      <p className="mt-1 text-sm font-bold text-slate-600">{pessoa}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-700">
        {descricao}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-amber-800">
        Acessar
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </motion.a>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-sm font-bold text-slate-700">{texto}</p>
    </div>
  );
}

export default function Mentorias() {
  const { isPro } = useSubscription();
  const [filtro, setFiltro] = useState<Filtro>("Todas");
  const reduce = useReducedMotion() ?? false;

  const mentoriasFiltradas = mentorias.filter((m) =>
    matchFiltro(m.tipo, filtro),
  );
  const ebooksFiltrados = ebooks.filter((e) => matchFiltro(e.tipo, filtro));

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Mentorias e ebooks para carreira em tech"
        description="Mentorias com profissionais da área e ebooks selecionados para acelerar sua carreira em tecnologia, do primeiro passo até a sua primeira vaga."
        url="/mentorias"
        schemaType="CollectionPage"
      />
      <PageHero
        accent="amber"
        eyebrow="conteúdo premium"
        title="Mentorias e Ebooks"
        subtitle="Mentorias com profissionais e ebooks selecionados pra acelerar sua carreira em tech."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          {!isPro ? (
            <ProGate description="Mentorias com profissionais de tech e ebooks selecionados de parceiros, com curadoria pra acelerar sua carreira." />
          ) : (
            <div className="space-y-12">
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filtrar por tipo"
              >
                {filtros.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltro(f)}
                    aria-pressed={filtro === f}
                    className={cn(
                      "rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-black transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-y-0",
                      filtro === f ? ac.filterActive : ac.filterInactive,
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div>
                <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-black text-slate-950">
                  <Users className="h-6 w-6 text-amber-700" aria-hidden />
                  Mentorias
                </h2>
                {mentoriasFiltradas.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {mentoriasFiltradas.map((m, index) => (
                      <RecursoCard
                        key={m.id}
                        titulo={m.titulo}
                        pessoa={m.mentor}
                        descricao={m.descricao}
                        tipo={m.tipo}
                        link={m.link}
                        index={index}
                        reduce={reduce}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState texto="Estamos fechando parcerias. Em breve, mentorias aqui." />
                )}
              </div>

              <div>
                <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-black text-slate-950">
                  <BookOpen className="h-6 w-6 text-amber-700" aria-hidden />
                  Ebooks
                </h2>
                {ebooksFiltrados.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {ebooksFiltrados.map((e, index) => (
                      <RecursoCard
                        key={e.id}
                        titulo={e.titulo}
                        pessoa={e.autor}
                        descricao={e.descricao}
                        tipo={e.tipo}
                        link={e.link}
                        index={index}
                        reduce={reduce}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState texto="Em breve, ebooks de parceiros aqui." />
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
