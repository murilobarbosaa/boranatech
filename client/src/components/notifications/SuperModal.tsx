import { useEffect, useId, useRef, type ReactNode } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";

// Modal interstitial da notificacao SUPER. Componente PURAMENTE apresentacional:
// recebe os campos super_* e dois callbacks (fechar / CTA). NAO busca dados nem
// grava dismiss (a Fase 3 conecta ao interstitial/sino). Fiel ao mockup do
// produto, mas usando os TOKENS reais do projeto (index.css :root):
//   - ambar   = var(--brand-yellow) (#ffb800), nao o #FBBF24 do mockup;
//   - ink     = #0f172a (= --brand-slate) no texto do CTA;
//   - fontes  = font-display (Space Grotesk) em titulo/eyebrow/CTA,
//               font-mono (Fira Code) nos doodles de codigo.
// O gradiente roxo e decorativo (tons proximos ao mockup, nao token).

// Subconjunto do activeSuper da Fase 1 (server): os campos que o modal renderiza.
// Estruturalmente compativel com o payload de GET /api/me/notifications.
export type PublicSuperNotification = {
  id: string;
  super_eyebrow: string | null;
  super_title: string | null;
  super_subtitle: string | null;
  super_cta_label: string | null;
  super_cta_url: string | null;
};

// Destaque do titulo: *palavra* vira ambar; o resto fica branco. Split num par de
// asteriscos: os segmentos IMPARES (dentro do par) sao o destaque.
// Casos: "*a* b" -> ["","a"," b"] (a ambar); "a *b* c *d*" -> b,d ambar;
// sem asterisco -> texto puro; asterisco solto (sem par) -> fica literal, sem
// destaque. SEM escape: asterisco literal nao e suportado (documentado).
export function renderHighlightedTitle(title: string): ReactNode[] {
  return title.split(/\*([^*]+)\*/g).map((segment, index) =>
    index % 2 === 1 ? (
      <span key={index} style={{ color: "var(--brand-yellow)" }}>
        {segment}
      </span>
    ) : (
      <span key={index}>{segment}</span>
    ),
  );
}

// Tinta ambar translucida a partir do token real (mesmo valor, com alfa).
const amberTint = (percent: number) =>
  `color-mix(in srgb, var(--brand-yellow) ${percent}%, transparent)`;

// Ilustracao FIXA (nao editavel): pilha de cards levemente rotacionados, o de
// cima branco com "</>" roxo. Flutua com bnt-float. Selo NOVO ambar sobre ela.
function SuperIllustration() {
  return (
    <div className="pointer-events-none relative flex items-center justify-center">
      <div className="animate-bnt-float relative h-[150px] w-[150px] md:h-[230px] md:w-[230px]">
        <div className="absolute inset-0 translate-x-4 translate-y-5 rotate-[8deg] rounded-3xl border-2 border-slate-950/30 bg-white/10" />
        <div className="absolute inset-0 -translate-x-3 translate-y-2 -rotate-6 rounded-3xl border-2 border-slate-950/40 bg-white/20" />
        <div className="absolute inset-0 flex rotate-[-2deg] items-center justify-center rounded-3xl border-2 border-slate-950 bg-white shadow-[8px_8px_0_rgba(11,16,32,0.55)]">
          <span
            className="font-mono text-4xl font-bold md:text-5xl"
            style={{ color: "var(--brand-violet)" }}
          >
            {"</>"}
          </span>
        </div>
      </div>
      <span
        className="absolute -right-1 top-2 rotate-12 rounded-full border-2 border-slate-950 px-3 py-1 font-display text-xs font-black uppercase tracking-widest text-slate-950 shadow-[3px_3px_0_rgba(11,16,32,0.5)] md:-right-2 md:top-4"
        style={{ backgroundColor: "var(--brand-yellow)" }}
      >
        Novo
      </span>
    </div>
  );
}

// Enfeites de FUNDO do card inteiro: grid pontilhado sutil + glow ambar. z-0,
// SEMPRE atras do conteudo (colunas em z-10). Sao de baixissimo contraste, entao
// nao afetam a legibilidade do texto por cima. Confetti e doodles NAO ficam aqui
// (ver IllustrationDecor): eles vivem na zona da ilustracao pra nunca cair sobre
// a copy, seja no layout de 2 colunas (desktop) ou empilhado (mobile).
function SuperBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: amberTint(22) }}
      />
    </div>
  );
}

// Confetti + doodles de codigo, posicionados DENTRO da coluna da ilustracao
// (nao do card). Assim ficam sempre sobre/ao redor da ilustracao e nunca sobre o
// texto da copy, em qualquer layout. pointer-events-none.
function IllustrationDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute left-[10%] top-[20%] h-3 w-3 rotate-12 rounded-[3px] bg-amber-300/70" />
      <span className="absolute right-[16%] top-[14%] h-2.5 w-2.5 rounded-full bg-sky-400/70" />
      <span className="absolute right-[14%] bottom-[26%] h-3 w-3 -rotate-12 rounded-[3px] bg-emerald-400/70" />
      <span className="absolute left-[16%] bottom-[22%] h-2.5 w-2.5 rounded-full bg-pink-400/70" />
      <span className="absolute left-[24%] top-[54%] h-2 w-2 rounded-full bg-violet-300/70" />
      <span className="absolute left-[4%] top-[36%] font-mono text-4xl font-bold text-white/10">
        {"{ }"}
      </span>
      <span className="absolute bottom-[14%] right-[6%] font-mono text-3xl font-bold text-white/10">
        {"</>"}
      </span>
    </div>
  );
}

export default function SuperModal({
  super: notif,
  onClose,
  onCta,
}: {
  super: PublicSuperNotification;
  onClose: () => void;
  onCta: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const eyebrow = notif.super_eyebrow?.trim();
  const title = notif.super_title ?? "";
  const subtitle = notif.super_subtitle?.trim();
  const ctaLabel = notif.super_cta_label?.trim() || "Ver agora";

  // A11y: foco preso no card, foco inicial no card, Esc fecha, retorno de foco
  // ao desmontar, e trava o scroll do fundo enquanto aberto.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const card = cardRef.current;
    card?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !card) return;
      const focusables = card.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    // z-[90]: acima do chrome da pagina, ABAIXO do ConsentGate (z-[100]) e do
    // modal de consentimento, que sempre precisa vencer. A ordem de exibicao
    // (nunca sobre o consent) e garantida na Fase 3 pela montagem; aqui o z so
    // reforca a hierarquia.
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-bnt-pop relative flex max-h-[92vh] w-[min(380px,92vw)] flex-col overflow-hidden rounded-[34px] outline-none md:h-[min(600px,90vh)] md:w-[min(1000px,92vw)] md:flex-row md:rounded-[42px]"
        style={{
          background:
            "linear-gradient(135deg, #4c1d95 0%, #2a1a6b 55%, #0b1020 100%)",
        }}
      >
        {/* Hairline ambar no topo. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 h-[5px] md:h-[6px]"
          style={{ backgroundColor: "var(--brand-yellow)" }}
        />

        <SuperBackdrop />

        {/* Marca no topo-esquerdo. */}
        <div className="pointer-events-none absolute left-6 top-6 z-10 flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-slate-950 font-mono text-xs font-bold text-slate-950"
            style={{ backgroundColor: "var(--brand-yellow)" }}
          >
            {"</>"}
          </span>
          <span className="font-display text-sm font-black text-white">
            Bora na Tech
          </span>
        </div>

        {/* Fechar. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-5 top-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>

        {/* Ilustracao: coluna esquerda no desktop, topo no mobile. z-10 sobre o
            backdrop. Confetti/doodles vivem aqui (IllustrationDecor), nunca sobre
            a copy. pt menor no mobile (a ilustracao encolheu) so pra limpar a
            marca do topo. */}
        <div className="relative z-10 flex shrink-0 items-center justify-center px-6 pt-16 md:w-[420px] md:pt-6">
          <IllustrationDecor />
          <SuperIllustration />
        </div>

        {/* Copy: coluna direita no desktop; centralizada no mobile. Ancoragem
            estavel do CTA: o bloco de texto (eyebrow/titulo/subtitulo) e flex-1 e
            centraliza no espaco disponivel; o CTA e shrink-0, colado embaixo.
            Assim o CTA quase nao se move entre titulos de 1 e 4 linhas (no desktop
            a altura da coluna e fixa). overflow-y-auto no bloco de texto e a rede
            de seguranca pra titulos extremos. */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-7 pb-8 pt-2 text-center md:px-10 md:py-10 md:text-left">
          <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto">
            {eyebrow ? (
              <span
                className="mx-auto mb-4 inline-flex items-center gap-1.5 self-center rounded-full border px-3 py-1 font-display text-[11px] font-black uppercase tracking-[0.2em] md:mx-0 md:self-start"
                style={{
                  backgroundColor: amberTint(15),
                  borderColor: amberTint(40),
                  color: "var(--brand-yellow)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {eyebrow}
              </span>
            ) : null}

            <h2
              id={titleId}
              className="font-display text-3xl font-black leading-[1.05] text-white md:text-5xl"
            >
              {renderHighlightedTitle(title)}
            </h2>

            {subtitle ? (
              <p className="mt-4 text-[15px] leading-relaxed text-white/70 md:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-3 pt-7 md:items-start">
            <button
              type="button"
              onClick={onCta}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-sm font-black text-[#0f172a] shadow-[4px_4px_0_rgba(11,16,32,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(11,16,32,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ backgroundColor: "var(--brand-yellow)" }}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
            </button>
            <span className="font-mono text-xs font-semibold text-white/45">
              boranatech.com.br
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
