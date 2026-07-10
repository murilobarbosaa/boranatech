import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Check,
  Compass,
  HelpCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { areasCount } from "@/lib/countsGenerated";

// Copy desta secao e rascunho da Ana (texto final e dela).
// TODO(Ana): revisar headline, personas e beneficios antes de publicar.
const PERSONAS = [
  {
    icon: HelpCircle,
    title: "Não sei nada de TI",
    desc: "Quer entender o que é cada área e por onde dar o primeiro passo.",
  },
  {
    icon: Compass,
    title: "Sei, mas estou perdido",
    desc: "Já estudou um pouco, mas falta um caminho claro pra seguir.",
  },
  {
    icon: TrendingUp,
    title: "Já estou na área",
    desc: "Quer se organizar, evoluir com método e dar o próximo passo.",
  },
];

const BENEFICIOS = [
  "Descobrir a área que combina com você",
  "Ter um caminho claro do que estudar",
  "Parar de se perder no meio de tanto conteúdo",
  "Evoluir no seu ritmo, com método",
];

export default function ProQuemE() {
  const reduce = useReducedMotion();
  const totalAreas = areasCount;

  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-28">
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-violet-700"
          >
            O que é o Bora na Tech
          </motion.p>
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 font-display font-black text-slate-950 leading-[1.05]"
            style={{ fontSize: "clamp(36px, 6vw, 68px)" }}
          >
            A bússola pra quem está começando{" "}
            <span className="text-violet-700">ou se sentindo perdido</span> na
            TI.
          </motion.h2>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base md:text-lg font-medium text-slate-700"
          >
            A gente organiza a entrada na tecnologia em uma jornada clara, do
            primeiro contato até o próximo passo da sua carreira.
          </motion.p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PERSONAS.map((persona, index) => {
            const Icon = persona.icon;
            return (
              <motion.div
                key={persona.title}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border-2 border-slate-950 bg-[#faf8f4] p-6 shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-100 shadow-[2px_2px_0_#0f172a]">
                  <Icon
                    size={24}
                    className="text-violet-700"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 font-display text-xl font-black text-slate-950">
                  {persona.title}
                </h3>
                <p className="mt-2 text-sm md:text-base font-medium text-slate-700">
                  {persona.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 rounded-3xl border-2 border-slate-950 bg-amber-50 p-6 shadow-[4px_4px_0_#0f172a] md:p-10"
        >
          <p className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-amber-700">
            O que você vai conseguir
          </p>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-300">
                  <Check
                    size={14}
                    className="text-slate-950"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-base md:text-lg font-bold text-slate-900">
                  {beneficio}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 flex flex-col items-center gap-4 text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">
            <Sparkles
              size={16}
              className="text-violet-600"
              aria-hidden="true"
            />
            {totalAreas} áreas da TI mapeadas pra você explorar
          </p>
          <p className="max-w-xl text-base md:text-lg font-medium text-slate-700">
            E tem mais esperando lá dentro: quiz, trilhas passo a passo e
            ferramentas pra cada etapa.
          </p>
          <Link
            href="/cadastro"
            className="font-display inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-8 py-4 font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a] active:translate-y-0 active:shadow-[2px_2px_0_#0f172a]"
          >
            Começar agora
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
