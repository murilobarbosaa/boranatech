import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Seção da home com fundo decorado.
 *
 * Extraído em 2026-07-29 a partir do que a home JÁ FAZIA, não inventado: as nove
 * seções decoradas repetiam o mesmo par de técnicas em divs absolutas coladas e
 * recoladas, e nenhuma delas importava nada de `components/shared`. Os valores
 * abaixo são os medidos em Chrome real nessas seções, não escolhidos aqui.
 *
 * O que este componente NÃO faz, de propósito: nada de noise, mesh gradient,
 * borda iluminada ou `mix-blend-mode`. A home não usa nenhum dos quatro, e
 * introduzir técnica nova junto com a extração faria o diff contar duas
 * histórias.
 *
 * A decoração inteira é `aria-hidden` e `pointer-events-none`: é textura, não
 * conteúdo, e não pode entrar na árvore de acessibilidade nem capturar clique.
 */

/** Técnicas de fundo, com os valores medidos nas seções de referência. */
export type VarianteFundo = "glow" | "pontos" | "listras";

/**
 * Preset de entrada.
 *
 * `-80px` só na borda de BAIXO, e não nos quatro lados. Margem negativa lateral
 * encolhe a root do IntersectionObserver e volta a excluir alvos estreitos, que
 * foi exatamente a causa do contador do hero travar em 0 nas viewports de 320 a
 * 402 (ver o comentário do `AnimatedCounter` em sections/Hero.tsx).
 *
 * As seções antigas usam `margin: "-100px"` nos quatro lados. A conversão desses
 * sítios é tarefa separada, registrada em docs/copy-provisoria-e-pendencias.md.
 */
export const VIEWPORT_ENTRADA = {
  once: true,
  margin: "0px 0px -80px 0px",
} as const;

interface Comum {
  id: string;
  /** Classe de fundo da seção. Ex.: "bg-[#faf8f4]". */
  base: string;
  /** Padding vertical. Padrão: o das seções de referência. */
  padding?: string;
  ariaLabelledBy?: string;
  className?: string;
  children: ReactNode;
}

/**
 * União discriminada pela variante, e não um objeto com tudo opcional.
 *
 * `orbs` só existe para `glow` e `acento` só existe para `pontos` e `listras`.
 * Com campos opcionais soltos dava para pedir `glow` sem orb nenhum (seção sem
 * decoração, silenciosamente) ou passar `acento` para `glow`, onde ele não é
 * lido. Aqui o compilador cobra o que a variante exige e recusa o que ela ignora.
 */
type Props = Comum &
  (
    | {
        variante: "glow";
        orbs: OrbSpec[];
        acento?: never;
      }
    | {
        variante: "pontos" | "listras";
        /**
         * Cor da decoração, em classe utilitária de TEXTO (`text-violet-300`).
         *
         * `currentColor` é o que permite a malha e as listras usarem a cor sem
         * passar valor hex por prop: o gradiente lê a cor do texto do próprio
         * elemento. Mantém o acento no vocabulário de tokens do Tailwind em vez
         * de string solta.
         */
        acento: string;
        orbs?: never;
      }
  );

/** Malha de pontos: raio de 1.2px em grade de 32px. Medido em Mapa e PraVoce. */
function Pontos({ acento }: { acento: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 opacity-30", acento)}
      style={{
        backgroundImage:
          "radial-gradient(circle, currentColor 1.2px, transparent 1.2px)",
        backgroundSize: "32px 32px",
      }}
    />
  );
}

/** Listras diagonais de 28px a 45 graus. Medido em PorOndeComecar. */
function Listras({ acento }: { acento: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 opacity-35", acento)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 28px, currentColor 28px, currentColor 29px, transparent 29px, transparent 57px)",
      }}
    />
  );
}

/**
 * Orbs com blur.
 *
 * Dois, e não três ou quatro. As referências que usam quatro (Pro) e três
 * (Numeros) têm fundo ESCURO, onde o glow precisa de mais massa para aparecer.
 * Em base clara dois bastam, e mais que isso vira sujeira.
 *
 * Tamanhos e blur na faixa medida: 360 a 600px de diâmetro, blur de 40 a 70px.
 */
function Glow({ orbs }: { orbs: OrbSpec[] }) {
  return (
    <>
      {orbs.map((orb, i) => (
        <div
          key={i}
          aria-hidden
          className={cn(
            "pointer-events-none absolute rounded-full",
            orb.posicao,
          )}
          style={{
            width: orb.tamanho,
            height: orb.tamanho,
            backgroundImage: `radial-gradient(circle, ${orb.cor} 0%, transparent 70%)`,
            filter: `blur(${orb.blur})`,
          }}
        />
      ))}
    </>
  );
}

export interface OrbSpec {
  /** Classes de posicionamento (`left-[5%] top-[10%]`). */
  posicao: string;
  /** Diâmetro. Faixa medida nas referências: 360px a 600px. */
  tamanho: string;
  /** Blur. Faixa medida: 40px a 70px. */
  blur: string;
  /** Cor com alfa. Faixa medida em base clara: 0.10 a 0.24. */
  cor: string;
}

/**
 * Escolhe a decoração a partir da união, SEM destruturar antes.
 *
 * Destruturar `acento` e `orbs` no componente quebraria o estreitamento: o
 * TypeScript perde o vínculo entre `variante` e os outros campos assim que eles
 * viram variáveis soltas, e sobrava `acento!`. Passando o objeto inteiro o
 * compilador estreita sozinho e não há asserção nenhuma.
 */
function Decoracao(props: Props) {
  if (props.variante === "glow") return <Glow orbs={props.orbs} />;
  if (props.variante === "pontos") return <Pontos acento={props.acento} />;
  return <Listras acento={props.acento} />;
}

export default function SecaoDecorada(props: Props) {
  const {
    id,
    base,
    padding = "py-20 md:py-28",
    ariaLabelledBy,
    className,
    children,
  } = props;

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "bnt-ancora relative overflow-hidden",
        base,
        padding,
        className,
      )}
    >
      <Decoracao {...props} />
      {children}
    </section>
  );
}
