import { useCallback, useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  ONBOARDING_PERFIS,
  ONBOARDING_TOURS,
  type OnboardingDef,
  type OnboardingHow,
  type OnboardingPerfil,
  type OnboardingStepDef,
  type OnboardingTour,
} from "@/lib/onboarding/types";
import type { OnboardingIconName } from "@/lib/onboarding/icons";
import { OnbIcon, OnbLogo, OnbStar } from "./icons";
import "./onboarding.css";

// Porte React do motor de design/onboardings/Onboarding_01_Home_1.html
// (blocos 3 e 5 a 11). O comportamento e o mesmo: pilha de cards, arraste,
// teclado, escolhas com auto-avanco, altura acompanhando o card ativo e
// confete no final.
//
// DUAS diferencas deliberadas em relacao ao HTML, as duas por ser overlay de
// app e nao pagina de demonstracao:
//   1. `finish()` NAO tem o setTimeout de 1600ms que devolvia o botao ao estado
//      normal e re-renderizava. Aquilo e comportamento de demo (reabrir para o
//      proximo visitante); aqui o overlay fecha na hora.
//   2. o scroll de volta ao topo e do CONTAINER do overlay, nao da window: a
//      pagina embaixo continua onde estava.
//   3. o fundo da pagina standalone (`.dots-bg` e os icones flutuantes) NAO foi
//      mantido: aqui quem fica atras e a pagina de verdade, desfocada pelo
//      backdrop. Cenario proprio em cima de conteudo real seria ruido.
//
// A fase de saida vem do `saindo` do host: o overlay precisa continuar montado
// enquanto a animacao roda, entao quem desmonta e o host, depois dela.

export interface OnboardingResultData {
  perfil?: OnboardingPerfil;
  tour?: OnboardingTour;
}

interface OnboardingStoriesProps {
  def: OnboardingDef;
  /** Chamado uma unica vez, no concluir ou no pular. */
  onFinish: (how: OnboardingHow, data: OnboardingResultData) => void;
  /** Fase de saida: liga a animacao de fechamento antes de o host desmontar. */
  saindo?: boolean;
}

const SWIPE_THRESHOLD = 68;

/** Icones fantasma no fundo do card, em posicoes fixas por indice. */
const GHOSTS: ReadonlyArray<
  readonly [name: OnboardingIconName, x: number, y: number, size: number]
> = [
  ["code", 6, 22, 44],
  ["braces", 88, 16, 40],
  ["term", 4, 55, 46],
  ["cloud", 86, 52, 52],
  ["cursor", 90, 78, 40],
  ["chart", 5, 80, 42],
  ["braces", 78, 34, 34],
];

const SPARKS: ReadonlyArray<
  readonly [x: number, y: number, size: number, color: string]
> = [
  [84, 26, 15, "#FFC61E"],
  [13, 42, 13, "#fff"],
  [90, 62, 12, "#fff"],
  [10, 68, 14, "#FFC61E"],
  [80, 88, 11, "#fff"],
];

const CONFETTI_COLORS = [
  "#FCC700",
  "#F25CA2",
  "#6D28D9",
  "#15803D",
  "#1D4ED8",
  "#E5252F",
];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Mesma funcao do HTML: usada nos rotulos acessiveis, nunca no render visual. */
const stripTags = (value: string) => String(value).replace(/<[^>]+>/g, "");

function emit(
  screen: string,
  type: "step" | "choice" | "finish",
  detail: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  // Saida para analytics futura. O postMessage do HTML (que servia ao preview
  // em iframe) nao foi portado: aqui nao existe iframe.
  window.dispatchEvent(
    new CustomEvent("bnt:onboarding", {
      detail: { source: "bnt-onboarding", screen, type, ...detail },
    }),
  );
}

export default function OnboardingStories({
  def,
  onFinish,
  saindo = false,
}: OnboardingStoriesProps) {
  const steps = def.steps;
  const total = steps.length;
  const reducedMotion = usePrefersReducedMotion();

  const [step, setStep] = useState(0);
  const [profileIndex, setProfileIndex] = useState<number | null>(null);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[] | null>(
    null,
  );

  const stackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [stackHeight, setStackHeight] = useState<number | null>(null);

  // `done` em ref, nao em estado: finish() precisa ser idempotente DENTRO do
  // mesmo tick (Esc segurado, clique duplo no botao), e estado so chegaria no
  // render seguinte.
  const doneRef = useRef(false);
  const confettiFiredRef = useRef(false);

  const isLast = step === total - 1;
  const currentStep = steps[step];

  const scrollOverlayTop = useCallback(() => {
    const root = stackRef.current?.closest(".bnt-onb") as HTMLElement | null;
    if (!root || root.scrollTop <= 4) return;
    root.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  const go = useCallback(
    (to: number) => {
      setStep(Math.max(0, Math.min(total - 1, to)));
    },
    [total],
  );

  // Efeitos da TROCA de card (foco, scroll, evento), fora do setState: o
  // updater do useState precisa ser puro, senao o StrictMode dispara tudo duas
  // vezes. Pula a primeira renderizacao porque abrir o onboarding nao e
  // "navegar", e o HTML de referencia tambem nao emitia nada no boot.
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    cardRefs.current[step]
      ?.querySelector<HTMLElement>(".plaque")
      ?.focus({ preventScroll: true });
    scrollOverlayTop();
    emit(def.screen, "step", { index: step, key: steps[step].key });
  }, [def.screen, scrollOverlayTop, step, steps]);

  const finish = useCallback(
    (how: OnboardingHow) => {
      if (doneRef.current) return;
      doneRef.current = true;
      const data: OnboardingResultData = {};
      if (profileIndex !== null) data.perfil = ONBOARDING_PERFIS[profileIndex];
      if (tourIndex !== null) data.tour = ONBOARDING_TOURS[tourIndex];

      emit(def.screen, "finish", {
        how,
        result: {
          completed: how === "concluido",
          perfil: data.perfil ?? null,
          tour: data.tour ?? null,
        },
      });
      onFinish(how, data);
    },
    [def.screen, onFinish, profileIndex, tourIndex],
  );

  /* --- altura da pilha acompanhando o card ativo ------------------------ */
  useEffect(() => {
    const card = cardRefs.current[step];
    if (!card) return;

    const measure = () => {
      const height = card.offsetHeight;
      if (height) setStackHeight(height);
    };
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    window.addEventListener("resize", measure, { passive: true });
    // As fontes chegando depois mudam a altura do card; sem isto a pilha fica
    // com a altura medida com a fonte de fallback.
    void document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [step]);

  /* --- confete no card final ------------------------------------------- */
  useEffect(() => {
    if (!isLast || !currentStep.finale) return;
    if (confettiFiredRef.current || reducedMotion) return;
    confettiFiredRef.current = true;
    setConfettiPieces(
      Array.from({ length: 46 }, (_, i) => ({
        left: rnd(0, 100).toFixed(1),
        background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        duration: rnd(2.2, 4.4).toFixed(2),
        delay: rnd(0, 0.6).toFixed(2),
        rotate: rnd(0, 360) | 0,
      })),
    );
    const timer = window.setTimeout(() => setConfettiPieces(null), 5600);
    return () => window.clearTimeout(timer);
  }, [isLast, currentStep.finale, reducedMotion]);

  /* --- teclado --------------------------------------------------------- */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      // As setas dentro do radiogroup navegam entre opcoes, nao entre cards.
      if (target instanceof Element && target.closest(".opt")) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (step < total - 1) go(step + 1);
        else finish("concluido");
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(step - 1);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        finish("pulado");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [finish, go, step, total]);

  /* --- arraste --------------------------------------------------------- */
  const drag = useRef({
    active: false,
    startX: 0,
    startY: 0,
    axis: null as null | "x" | "y",
    pointerId: -1,
  });

  const endDrag = useCallback(
    (event: React.PointerEvent | null) => {
      const state = drag.current;
      if (!state.active) return;
      if (event && event.pointerId !== state.pointerId) return;
      state.active = false;

      const card = cardRefs.current[step];
      if (card) {
        card.classList.remove("dragging");
        card.style.transform = "";
      }
      if (state.axis !== "x" || !event) {
        state.axis = null;
        return;
      }
      const dx = event.clientX - state.startX;
      state.axis = null;
      if (dx < -SWIPE_THRESHOLD && step < total - 1) go(step + 1);
      else if (dx > SWIPE_THRESHOLD && step > 0) go(step - 1);
    },
    [go, step, total],
  );

  const onPointerDown = (event: React.PointerEvent) => {
    if ((event.target as Element).closest("button")) return;
    drag.current = {
      active: true,
      axis: null,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    cardRefs.current[step]?.classList.add("dragging");
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const state = drag.current;
    if (!state.active || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    if (state.axis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      state.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (state.axis === "x") {
        try {
          stackRef.current?.setPointerCapture(state.pointerId);
        } catch {
          // Alguns navegadores recusam a captura; o arraste segue sem ela.
        }
      }
    }
    if (state.axis !== "x") return;
    event.preventDefault();
    // Resistencia nos limites: no primeiro card puxando para a direita e no
    // ultimo puxando para a esquerda o card anda 28% do dedo.
    const limit =
      (step === 0 && dx > 0) || (step === total - 1 && dx < 0) ? 0.28 : 1;
    const card = cardRefs.current[step];
    if (card) {
      card.style.transform = `translateX(${dx * limit}px) rotate(${
        (dx * limit) / 36
      }deg)`;
    }
  };

  useEffect(() => {
    const onBlur = () => endDrag(null);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [endDrag]);

  /* --- escolhas -------------------------------------------------------- */
  const onChoice = (stepIndex: number, choiceIndex: number) => {
    const stepDef = steps[stepIndex];
    if (stepDef.key === "profile") setProfileIndex(choiceIndex);
    if (stepDef.key === "tour") setTourIndex(choiceIndex);
    emit(def.screen, "choice", {
      step: stepDef.key,
      index: choiceIndex,
      label: stepDef.choices?.[choiceIndex][1],
    });
    // Auto-avanco de 300ms: da tempo de ver a opcao ficar amarela antes do card
    // sair. Mesmo valor do HTML de referencia.
    if (stepIndex < total - 1) {
      window.setTimeout(() => go(stepIndex + 1), 300);
    }
  };

  const onChoiceKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const group = event.currentTarget.parentElement;
    if (!group) return;
    const list = Array.from(group.querySelectorAll<HTMLButtonElement>(".opt"));
    const at = list.indexOf(event.currentTarget);
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      list[(at + 1) % list.length]?.focus();
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      list[(at - 1 + list.length) % list.length]?.focus();
    }
  };

  const cardClass = (index: number) => {
    if (index < step) return "gone";
    if (index === step) return "front";
    if (index === step + 1) return "b1";
    if (index === step + 2) return "b2";
    return "hide";
  };

  return (
    <div className={saindo ? "bnt-onb saindo" : "bnt-onb"}>
      <main className="stage">
        <section
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bnt-onb-title"
          aria-describedby="bnt-onb-hint"
        >
          <h1 className="sr" id="bnt-onb-title">
            {def.ariaTitle}
          </h1>

          <div
            className="bar"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={step + 1}
            aria-label="Progresso do onboarding"
          >
            <i style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>

          <div
            className="stack"
            ref={stackRef}
            style={stackHeight ? { height: `${stackHeight}px` } : undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {steps.map((cardStep, index) => (
              <Card
                key={cardStep.key}
                step={cardStep}
                index={index}
                total={total}
                className={cardClass(index)}
                inactive={index !== step}
                profileIndex={profileIndex}
                selectedChoice={
                  cardStep.key === "profile"
                    ? profileIndex
                    : cardStep.key === "tour"
                      ? tourIndex
                      : null
                }
                onChoice={(choiceIndex) => onChoice(index, choiceIndex)}
                onChoiceKeyDown={onChoiceKeyDown}
                cardRef={(node) => {
                  cardRefs.current[index] = node;
                }}
              />
            ))}
          </div>

          <div className="foot">
            <div className="side">
              <button
                className="ghost"
                type="button"
                hidden={step === 0}
                onClick={() => go(step - 1)}
              >
                ← Voltar
              </button>
              <button
                className="ghost"
                type="button"
                hidden={isLast}
                onClick={() => finish("pulado")}
              >
                Pular
              </button>
            </div>
            <button
              className="next"
              type="button"
              onClick={() => (isLast ? finish("concluido") : go(step + 1))}
            >
              {isLast ? `${currentStep.cta || "Começar"} →` : "Próximo →"}
            </button>
          </div>

          <p className="hint" id="bnt-onb-hint">
            arraste o card ou use as setas ← → ·{" "}
            <span className="counter">
              {step + 1}/{total}
            </span>
          </p>
          <p className="sr" role="status" aria-live="polite">
            {`Passo ${step + 1} de ${total}: ${stripTags(currentStep.title)}`}
          </p>
        </section>
      </main>

      {confettiPieces && (
        <div className="confetti" aria-hidden="true">
          {confettiPieces.map((piece, i) => (
            <i
              key={i}
              style={{
                left: `${piece.left}%`,
                background: piece.background,
                animationDuration: `${piece.duration}s`,
                animationDelay: `${piece.delay}s`,
                transform: `rotate(${piece.rotate}deg)`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ConfettiPiece {
  left: string;
  background: string;
  duration: string;
  delay: string;
  rotate: number;
}

interface CardProps {
  step: OnboardingStepDef;
  index: number;
  total: number;
  className: string;
  inactive: boolean;
  /** Perfil escolhido, para a etiqueta "PRA VOCÊ" e a opacidade dos points. */
  profileIndex: number | null;
  selectedChoice: number | null;
  onChoice: (choiceIndex: number) => void;
  onChoiceKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  cardRef: (node: HTMLElement | null) => void;
}

function Card({
  step,
  index,
  total,
  className,
  inactive,
  profileIndex,
  selectedChoice,
  onChoice,
  onChoiceKeyDown,
  cardRef,
}: CardProps) {
  return (
    <article
      ref={cardRef}
      className={`card ${className}`}
      style={{ "--bg": step.bg } as React.CSSProperties}
      aria-label={`Passo ${index + 1} de ${total}`}
      aria-hidden={inactive}
      inert={inactive}
    >
      <div className="gridbg" aria-hidden="true" />
      <div className="ghosts" aria-hidden="true">
        {GHOSTS.map(([name, x, y, size], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%` }}>
            <OnbIcon name={name} size={size} color="#fff" width={2} />
          </span>
        ))}
      </div>
      <div className="sparks" aria-hidden="true">
        {SPARKS.map(([x, y, size, color], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%` }}>
            <OnbStar size={size} color={color} />
          </span>
        ))}
      </div>

      <div className="top">
        <div className="brandbit">
          <OnbLogo size={28} />
          <span className="tagpill">BORA NA TECH?</span>
        </div>
        <span className="steppill">
          <i>
            <OnbIcon name="check" size={10} color="#FCC700" width={3} />
          </i>
          {index + 1} DE {total}
        </span>
      </div>

      <div className="inner">
        <p className="eyebrow">{step.eyebrow}</p>
        <h2 className="plaque" tabIndex={-1}>
          {step.title}
        </h2>
        <Hero step={step} />
        <p className="lead">{step.lead}</p>

        {step.choices && (
          <div
            className="opts"
            role="radiogroup"
            aria-label={stripTags(step.title)}
          >
            {step.choices.map(([icon, label, description], k) => (
              <button
                key={k}
                className="opt"
                type="button"
                role="radio"
                aria-checked={selectedChoice === k}
                tabIndex={inactive ? -1 : 0}
                onClick={(event) => {
                  event.stopPropagation();
                  onChoice(k);
                }}
                onKeyDown={onChoiceKeyDown}
              >
                <span className="oic">
                  <OnbIcon name={icon} size={22} color="#0B1020" width={1.9} />
                </span>
                <span>
                  <b>{label}</b>
                  <em>{description}</em>
                </span>
              </button>
            ))}
          </div>
        )}

        {step.points && (
          <ul className="points">
            {step.points.map(([icon, title, description, perfil], k) => {
              const match = perfil !== null && perfil === profileIndex;
              return (
                <li
                  key={k}
                  style={{ opacity: perfil === null || match ? 1 : 0.6 }}
                >
                  <span className="s">
                    <OnbIcon name={icon} size={19} color="#0B1020" width={2} />
                  </span>
                  <div>
                    <b className="pt">
                      {title}
                      <span className="tag" hidden={!match}>
                        PRA VOCÊ
                      </span>
                    </b>
                    <p>{description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {step.tools && (
          <div className="grid">
            {step.tools.map(([icon, label, pro], k) => (
              <div className="tool" key={k}>
                {pro ? <b className="pro">PRO</b> : null}
                <OnbIcon name={icon} size={21} color="#0B1020" width={1.95} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {step.stats && (
          <div className="stats">
            {step.stats.map(([value, label], k) => (
              <div className="stat" key={k}>
                <b>{value}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {step.chips && (
          <div className="chips">
            {step.chips.map(([label], k) => (
              <span className="chip" key={k}>
                {label}
              </span>
            ))}
          </div>
        )}

        {step.price && (
          <div className="price">
            <div>
              <b>{step.price[0]}</b>
              <span>{step.price[1]}</span>
            </div>
            <OnbIcon name="lock" size={26} color="#0B1020" width={2.2} />
          </div>
        )}

        {step.punch && (
          <div className="punch">
            <OnbIcon
              name={step.punch[0]}
              size={19}
              color="#FCC700"
              width={2.1}
            />
            <span>{step.punch[1]}</span>
          </div>
        )}
      </div>

      <div className="cardfoot">
        <div className="dash" aria-hidden="true">
          <i />
          <OnbStar size={13} color="#FCC700" />
          <i />
        </div>
        <div className="sig">
          <span className="who">
            <OnbLogo size={22} />
            <b>BORA NA TECH?</b>
          </span>
          <span className="slog">Sua bússola na TI</span>
        </div>
      </div>
    </article>
  );
}

function Hero({ step }: { step: OnboardingStepDef }) {
  if (step.hero === "logo") {
    return (
      <div className="hero">
        <div
          className="ring"
          style={{ "--hs": "104px" } as React.CSSProperties}
        >
          <div className="coin">
            <OnbLogo size={70} />
          </div>
        </div>
      </div>
    );
  }
  if (step.hero === "icon" && step.icon) {
    const size = step.heroSize || 96;
    return (
      <div className="hero">
        <div
          className="ring"
          style={{ "--hs": `${size}px` } as React.CSSProperties}
        >
          <OnbIcon
            name={step.icon}
            size={Math.round(size * 0.46)}
            color="#fff"
            width={2.1}
          />
        </div>
      </div>
    );
  }
  return null;
}
