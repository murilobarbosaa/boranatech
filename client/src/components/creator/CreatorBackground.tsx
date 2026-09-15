import { motion, useReducedMotion } from "framer-motion";

// FUNDO EXCLUSIVO DO /creator: base de tinta, aurora, textura, vinheta e o foco
// atras do cabecalho. Mesma estrutura do ProfileBackground (fixed, -z-10,
// aria-hidden, dentro de um wrapper `relative isolate`) e o mesmo tratamento
// de movimento: com useReducedMotion, a deriva inteira desliga.
//
// ESCURO NOS DOIS TEMAS, entao so entram tokens que NAO invertem no `.dark`:
// --bnt-ink-on-accent (a tinta escura estavel do tema), --brand-yellow,
// --color-violet-500 e --color-teal-400 (iguais nos dois blocos) e
// --brand-yellow-soft (claro por design). Um token que inverte, como
// --bnt-ink, viraria cor clara no tema escuro.
//
// O FOCO fica fora da camada fixa: ele acompanha o cabecalho quando a pagina
// rola, entao e absoluto em relacao ao wrapper, dentro de uma faixa com
// overflow escondido para nao abrir rolagem lateral no celular.

const DERIVA = {
  duration: 80,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
} as const;

type Mancha = {
  chave: string;
  posicao: string;
  cor: string;
  deriva: { x: number[]; y: number[] };
};

const MANCHAS: Mancha[] = [
  {
    chave: "violeta",
    posicao:
      "-left-[30%] -top-[20%] h-[55vh] w-[55vh] md:-left-[15%] md:h-[85vh] md:w-[85vh]",
    cor: "bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-violet-500)_70%,transparent),transparent)]",
    deriva: { x: [0, 80, -30], y: [0, 50, 20] },
  },
  {
    chave: "dourado",
    posicao:
      "-right-[30%] top-[30%] h-[50vh] w-[50vh] md:-right-[15%] md:h-[80vh] md:w-[80vh]",
    cor: "bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-yellow)_45%,transparent),transparent)]",
    deriva: { x: [0, -70, 20], y: [0, -40, 30] },
  },
  {
    chave: "verde-agua",
    posicao:
      "-bottom-[25%] left-[10%] h-[45vh] w-[45vh] md:left-[30%] md:h-[70vh] md:w-[70vh]",
    cor: "bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-teal-400)_30%,transparent),transparent)]",
    deriva: { x: [0, 40, -50], y: [0, -30, 10] },
  },
];

export function CreatorBackground() {
  const reduzir = useReducedMotion() === true;

  return (
    <>
      <div
        data-testid="creator-fundo"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div
          data-testid="creator-fundo-base"
          className="absolute inset-0 bg-[var(--bnt-ink-on-accent)]"
        />

        {MANCHAS.map((mancha) => (
          <motion.div
            key={mancha.chave}
            data-testid={`creator-fundo-mancha-${mancha.chave}`}
            data-deriva={reduzir ? "desligada" : "ligada"}
            className={`absolute rounded-full opacity-50 mix-blend-screen blur-[70px] md:opacity-70 md:blur-[120px] ${mancha.posicao} ${mancha.cor}`}
            animate={reduzir ? undefined : mancha.deriva}
            transition={reduzir ? undefined : DERIVA}
          />
        ))}

        <div
          data-testid="creator-fundo-textura"
          className="absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--brand-yellow-soft)_0_1px,transparent_1px_12px)] opacity-[0.05]"
        />

        <div
          data-testid="creator-fundo-vinheta"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,color-mix(in_oklch,var(--bnt-ink-on-accent)_85%,transparent)_100%)]"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] overflow-hidden"
        aria-hidden="true"
      >
        <div
          data-testid="creator-fundo-foco"
          className="absolute left-1/2 top-24 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-yellow)_22%,transparent),transparent)] blur-2xl md:top-28 md:h-[26rem] md:w-[64rem] md:blur-3xl"
        />
      </div>
    </>
  );
}
