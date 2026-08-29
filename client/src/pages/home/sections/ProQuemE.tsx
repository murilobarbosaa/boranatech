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
import SectionLabel from "@/components/shared/SectionLabel";
import SecaoDecorada, {
  VIEWPORT_ENTRADA,
  type OrbSpec,
} from "../SecaoDecorada";

/**
 * Dois orbs suaves, em base clara.
 *
 * Alfa entre 0.14 e 0.20: a faixa medida nas seções de referência de base clara
 * (PraVoce usa 0.20 e 0.25). O Pro chega a 0.24, mas o fundo dele é escuro, onde
 * o glow precisa de mais massa para aparecer.
 */
const ORBS: OrbSpec[] = [
  {
    posicao: "left-[6%] top-[10%]",
    tamanho: "500px",
    blur: "56px",
    cor: "rgba(167, 139, 250, 0.20)",
  },
  {
    posicao: "right-[4%] bottom-[8%]",
    tamanho: "420px",
    blur: "64px",
    cor: "rgba(232, 121, 249, 0.14)",
  },
];

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
    // Base `#f5f3ff` e nao branco puro, e a escolha nao e de gosto: o LogoLoop
    // logo acima termina num gradiente que vai de `#faf8f4` a `#f5f3ff` (medido),
    // entao comecar exatamente em `#f5f3ff` faz a emenda desaparecer por
    // construcao, sem borda para disfarcar o corte.
    <SecaoDecorada
      id="o-que-e-bora-na-tech"
      base="bg-[#f5f3ff]"
      variante="glow"
      orbs={ORBS}
    >
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ENTRADA}
            transition={{ duration: 0.5 }}
          >
            {/* SectionLabel como ESTRUTURA, tipografia da home por className.
                O componente traz `tracking-[0.18em]` e nao traz `font-display`;
                as nove secoes da home usam `font-display ... tracking-[0.2em]`.
                Adotar o componente sem repor isso faria estas quatro divergirem
                das outras nove, invertendo o problema em vez de resolver.
                `justify-center` porque SectionLabel e flex, e `text-center` do
                pai nao centraliza caixa flex. */}
            <SectionLabel className="justify-center font-display text-xs md:text-sm tracking-[0.2em] text-violet-700">
              O que é o Bora na Tech
            </SectionLabel>
          </motion.div>
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ENTRADA}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 font-display font-black text-slate-950 leading-[1.05]"
            style={{ fontSize: "clamp(36px, 6vw, 72px)" }}
          >
            A bússola pra quem está começando{" "}
            <span className="text-violet-700">ou se sentindo perdido</span> na
            TI.
          </motion.h2>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ENTRADA}
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
                viewport={VIEWPORT_ENTRADA}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border-2 border-slate-950 bg-[#faf8f4] p-6 shadow-[4px_4px_0_var(--bnt-shadow)] transition-transform hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-100 shadow-[2px_2px_0_var(--bnt-shadow)]">
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
          viewport={VIEWPORT_ENTRADA}
          transition={{ duration: 0.5 }}
          className="mt-12 rounded-3xl border-2 border-slate-950 bg-amber-50 p-6 shadow-[4px_4px_0_var(--bnt-shadow)] md:p-10"
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
          viewport={VIEWPORT_ENTRADA}
          transition={{ duration: 0.5 }}
          className="mt-12 flex flex-col items-center gap-4 text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_var(--bnt-shadow)]">
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
            className="font-display inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-8 py-4 font-black text-slate-950 shadow-[4px_4px_0_var(--bnt-shadow)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--bnt-shadow)] active:translate-y-0 active:shadow-[2px_2px_0_var(--bnt-shadow)]"
          >
            Começar agora
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </SecaoDecorada>
  );
}
