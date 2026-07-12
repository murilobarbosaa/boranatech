import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  montarTrilha,
  NIVEIS_INGLES,
  OBJETIVOS_INGLES,
  type EnglishNivel,
  type EnglishObjetivo,
} from "@/lib/inglesRecursos";
import { AiCtaLink } from "@/components/shared/AiCta";

// Mapeia o nivel do mini quiz pro nivel do roadmap de ingles por nivel (secao
// "O que fazer em cada nivel" na pagina de Ingles), pro CTA gratis cair na
// etapa certa.
const NIVEL_TO_ROADMAP: Record<EnglishNivel, { slug: string; label: string }> = {
  Comecando: { slug: "basico", label: "Básico" },
  Intermediario: { slug: "intermediario", label: "Intermediário" },
  Avancado: { slug: "avancado", label: "Avançado" },
};

const NIVEL_LABEL: Record<EnglishNivel, string> = {
  Comecando: "Começando",
  Intermediario: "Intermediário",
  Avancado: "Avançado",
};

const NIVEL_HINT: Record<EnglishNivel, string> = {
  Comecando: "Entendo poucas palavras soltas.",
  Intermediario: "Leio com esforço, travo pra falar.",
  Avancado: "Me viro, quero lapidar.",
};

const CARD_COLORS = [
  "bg-violet-600",
  "bg-sky-600",
  "bg-emerald-700",
  "bg-fuchsia-600",
  "bg-orange-600",
];

function tile(nome: string): string {
  const parts = nome.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function InglesTrilhaQuiz() {
  const reduce = useReducedMotion();
  const [nivel, setNivel] = useState<EnglishNivel | null>(null);
  const [objetivo, setObjetivo] = useState<EnglishObjetivo | null>(null);

  const trilha = useMemo(
    () => (nivel && objetivo ? montarTrilha(nivel, objetivo) : []),
    [nivel, objetivo],
  );

  return (
    <div className="card-brutal rounded-2xl bg-white p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="rounded-xl border-2 border-slate-900 bg-amber-300 p-3 text-slate-950 shadow-[3px_3px_0_#0f172a]">
          <Wand2 className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-sky-700">
            mini quiz
          </p>
          <h2 className="font-display text-3xl font-black text-slate-950">
            Monte sua trilha de inglês
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Responda dois toques e receba de 3 a 5 recursos reais pro seu momento.
          </p>
        </div>
      </div>

      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-black text-slate-950">
          1. Onde você está hoje?
        </legend>
        <div className="flex flex-wrap gap-2">
          {NIVEIS_INGLES.map((item) => {
            const active = nivel === item;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => setNivel(item)}
                className={`rounded-xl border-2 px-4 py-2 text-left transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  active
                    ? "border-slate-900 bg-sky-300 shadow-[3px_3px_0_#0f172a]"
                    : "border-slate-300 bg-white hover:bg-sky-50"
                }`}
              >
                <span className="block text-sm font-black text-slate-950">
                  {NIVEL_LABEL[item]}
                </span>
                <span className="block text-xs text-slate-600">
                  {NIVEL_HINT[item]}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mb-2">
        <legend className="mb-2 text-sm font-black text-slate-950">
          2. Qual é o objetivo?
        </legend>
        <div className="flex flex-wrap gap-2">
          {OBJETIVOS_INGLES.map((item) => {
            const active = objetivo === item;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => setObjetivo(item)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-black transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  active
                    ? "border-slate-900 bg-violet-300 text-slate-950 shadow-[2px_2px_0_#0f172a]"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-violet-50"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite">
        {nivel && objetivo ? (
          <motion.div
            key={`${nivel}-${objetivo}`}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 font-display text-lg font-black text-slate-950">
                <Sparkles className="h-5 w-5 text-amber-500" aria-hidden />
                Sua trilha ({trilha.length}{" "}
                {trilha.length === 1 ? "recurso" : "recursos"})
              </p>
              <button
                type="button"
                onClick={() => {
                  setNivel(null);
                  setObjetivo(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Refazer
              </button>
            </div>

            <ol className="grid gap-3 md:grid-cols-2">
              {trilha.map((item, index) => (
                <li key={item.nome}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full items-start gap-3 rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[4px_4px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-black text-white ${
                        CARD_COLORS[index % CARD_COLORS.length]
                      }`}
                    >
                      {tile(item.nome)}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-black text-slate-950">
                          {item.nome}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase ${
                            item.gratuito
                              ? "bg-emerald-200 text-emerald-900"
                              : "bg-amber-200 text-amber-900"
                          }`}
                        >
                          {item.gratuito ? "grátis" : "pago"}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs font-bold text-sky-700">
                        {item.subarea}
                      </span>
                      <span className="mt-1 block text-sm text-slate-600">
                        {item.desc}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-black text-slate-500 group-hover:text-slate-900">
                        abrir
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>

            {/* Continuacao apos a trilha: sempre sai com algo util. */}
            {/* TODO(Ana): revisar a copy desta secao de proximo passo */}
            <div className="mt-6 border-t-2 border-dashed border-slate-200 pt-5">
              <p className="text-xs font-black uppercase tracking-wide text-sky-700">
                Próximo passo
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Você já tem os recursos. Agora siga um caminho de estudo (seu
                ponto de partida: nível {NIVEL_TO_ROADMAP[nivel].label}).
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`#roadmap-nivel-${NIVEL_TO_ROADMAP[nivel].slug}`}
                  className="group flex flex-1 flex-col rounded-2xl border-2 border-slate-950 bg-emerald-50 p-4 shadow-[4px_4px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <span className="inline-flex w-fit rounded-full border-2 border-slate-900 bg-emerald-200 px-2 py-0.5 text-[0.6rem] font-black uppercase text-emerald-900">
                    grátis
                  </span>
                  <span className="mt-2 font-display text-base font-black text-slate-950">
                    Roadmap de inglês por nível
                  </span>
                  <span className="mt-1 flex-1 text-sm text-slate-600">
                    Ações concretas pro nível {NIVEL_TO_ROADMAP[nivel].label} e o
                    critério claro pra subir de nível.
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-black text-emerald-700">
                    Ver meu roadmap
                    <ArrowRight
                      className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </a>
                <AiCtaLink
                  href="/roadmaps/ia"
                  accent="sky"
                  className="flex-1"
                  description={`Plano sob medida pro seu ritmo. Na primeira pergunta, diga que quer focar em inglês (nível ${NIVEL_TO_ROADMAP[nivel].label}).`}
                >
                  Plano de estudos com IA
                </AiCtaLink>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500">
                O roadmap por nível é grátis. O plano com IA (Pro) monta um
                caminho sob medida pro seu objetivo e ritmo.
              </p>
            </div>
          </motion.div>
        ) : (
          <p className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
            <ArrowRight className="h-4 w-4" aria-hidden />
            Escolha nível e objetivo pra ver a trilha.
          </p>
        )}
      </div>
    </div>
  );
}
