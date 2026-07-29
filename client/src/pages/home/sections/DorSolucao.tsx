import { motion, useReducedMotion } from "framer-motion";
import { Compass, HelpCircle } from "lucide-react";

import SectionLabel from "@/components/shared/SectionLabel";
import SecaoDecorada, {
  VIEWPORT_ENTRADA,
  type OrbSpec,
} from "../SecaoDecorada";

/**
 * Dois orbs, mais fracos que os do Pro.
 *
 * O Pro usa alfa até 0.24 porque o fundo dele é escuro, onde o glow precisa de
 * massa para aparecer. Aqui a base é o cream `#faf8f4`, e alfa alto vira mancha:
 * ficaram em 0.16 e 0.12, abaixo dos 0.20/0.14 da ProQuemE, porque esta seção é
 * o pivô emocional da página e o texto precisa dominar.
 */
const ORBS: OrbSpec[] = [
  {
    posicao: "left-[8%] top-[14%]",
    tamanho: "460px",
    blur: "60px",
    cor: "rgba(167, 139, 250, 0.16)",
  },
  {
    posicao: "right-[6%] bottom-[10%]",
    tamanho: "400px",
    blur: "68px",
    cor: "rgba(232, 121, 249, 0.12)",
  },
];

// Copy desta secao e rascunho da Ana (texto final e dela).
// TODO(Ana): revisar as perguntas de identificacao e a virada da solucao.
const DORES = [
  "Quer entrar na tecnologia mas não sabe por onde começar?",
  "Já sabe um pouco, mas se sente perdido no meio de tanto curso e opinião?",
  "Já está na área e quer evoluir, mas não sabe qual o próximo passo?",
];

export default function DorSolucao() {
  const reduce = useReducedMotion();

  return (
    // Cream mantido, e agora ele e o MEIO de uma alternancia, nao mais uma
    // continuacao: Novidades (violet) -> DorSolucao (cream) -> OQueEncontra
    // (off-white).
    //
    // ATENCAO A QUEM LER O HISTORICO: quando esta secao foi decorada, a
    // justificativa da base era "as duas vizinhas sao cream, emendas com delta
    // 0". As duas vizinhas mudaram de base logo em seguida, e as emendas #3 e #4
    // passaram de 0 para a faixa de 5 a 10. **Isso e esperado e e o objetivo**,
    // nao regressao: a alternancia so existe porque as bases passaram a diferir,
    // e 5 a 10 e a mesma faixa de degrau que a pagina ja usava entre Mapa,
    // PorOndeComecar e TurbineComIA antes deste trabalho.
    //
    // O `border-b-2` saiu porque a transicao passa a ser por cor de fundo, nao
    // por traco. Nenhuma das secoes de referencia usa borda de separacao.
    <SecaoDecorada
      id="talvez-seja-voce"
      base="bg-[#faf8f4]"
      variante="glow"
      orbs={ORBS}
      padding="py-20 md:py-28"
      ariaLabelledBy="dor-solucao-title"
    >
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ENTRADA}
          transition={{ duration: 0.5 }}
        >
          {/* TODO(Ana): eyebrow da secao de identificacao */}
          <SectionLabel className="justify-center font-display text-xs md:text-sm tracking-[0.2em] text-violet-700">
            Talvez isso seja você
          </SectionLabel>
        </motion.div>
        <motion.h2
          id="dor-solucao-title"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ENTRADA}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 font-display font-black leading-[1.05] text-slate-950"
          style={{ fontSize: "clamp(30px, 5vw, 64px)" }}
        >
          {/* TODO(Ana): headline de identificacao com a dor */}
          Entrar ou crescer na tech não precisa ser no escuro.
        </motion.h2>

        <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-left">
          {DORES.map((dor, index) => (
            <motion.li
              key={dor}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ENTRADA}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start gap-3 rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[4px_4px_0_#0f172a]"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-100 shadow-[2px_2px_0_#0f172a]"
                aria-hidden="true"
              >
                <HelpCircle size={18} className="text-violet-700" strokeWidth={2.5} />
              </span>
              <span className="text-base font-bold text-slate-900 md:text-lg">
                {dor}
              </span>
            </motion.li>
          ))}
        </ul>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ENTRADA}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-10 max-w-2xl rounded-3xl border-2 border-slate-950 bg-amber-300 p-6 shadow-[5px_5px_0_#0f172a] md:p-8"
        >
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-950 shadow-[3px_3px_0_#0f172a]">
            <Compass size={16} className="text-violet-600" aria-hidden="true" />
            {/* TODO(Ana): rotulo da virada */}
            A virada
          </p>
          {/* TODO(Ana): a frase da solucao (a bussola) */}
          <p className="mt-4 font-display text-2xl font-black text-slate-950 md:text-3xl">
            O Bora na Tech é a bússola que te orienta, seja qual for o seu
            momento na tecnologia.
          </p>
        </motion.div>
      </div>
    </SecaoDecorada>
  );
}
