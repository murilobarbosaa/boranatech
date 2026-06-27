import { useState } from "react";
import { useReducedMotion } from "framer-motion";

// Faixa de creators que apoiam o projeto. Espelha a faixa da landing estatica
// (client/public/lancamento.html) como componente React, reusando as MESMAS
// fotos em /creators e a mesma lista. Marquee em loop, pausa no hover, fade nas
// pontas; em prefers-reduced-motion vira um wrap estatico com todos visiveis.

interface Creator {
  handle: string;
  photo: string;
  url: string;
}

// TODO(Ana): conferir os @ e adicionar/remover creators aqui (espelha a landing).
const CREATORS: Creator[] = [
  {
    handle: "grazi.tech",
    photo: "/creators/grazi-tech.jpg",
    url: "https://instagram.com/grazi.tech",
  },
  {
    handle: "jess.data",
    photo: "/creators/jess-data.jpg",
    url: "https://instagram.com/jess.data",
  },
  {
    handle: "gama18k",
    photo: "/creators/gama18k.jpg",
    url: "https://instagram.com/gama18k",
  },
  {
    handle: "gabrielsm.dev",
    photo: "/creators/gabrielsm-dev.jpg",
    url: "https://instagram.com/gabrielsm.dev",
  },
  {
    handle: "carolpaier.tech",
    photo: "/creators/carolpaier.jpg",
    url: "https://instagram.com/carolpaier.tech",
  },
  {
    handle: "code.evelyn",
    photo: "/creators/code-evelyn.jpg",
    url: "https://instagram.com/code.evelyn",
  },
  {
    handle: "ketlyncode",
    photo: "/creators/ketlyncode.jpg",
    url: "https://instagram.com/ketlyncode",
  },
];

// Cor de fundo por card, ciclando por posicao. Cores da marca, iguais a landing.
const CARD_COLORS = [
  { bg: "#FCC700", text: "#0F172A", avatarBorder: "#0F172A" }, // yellow
  { bg: "#5719a6", text: "#ffffff", avatarBorder: "#ffffff" }, // violet-deep
  { bg: "#ECE6FA", text: "#0F172A", avatarBorder: "#0F172A" }, // lavender
  { bg: "#8b4ff5", text: "#ffffff", avatarBorder: "#ffffff" }, // violet-bright
];

const FADE_MASK =
  "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)";

function initials(handle: string): string {
  const parts = handle
    .replace(/[^a-zA-Z]+/g, " ")
    .trim()
    .split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return handle.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "@";
}

function Avatar({
  creator,
  borderColor,
}: {
  creator: Creator;
  borderColor: string;
}) {
  // Se a foto faltar (404), cai nas iniciais sem quebrar.
  const [failed, setFailed] = useState(false);
  return (
    <span
      className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-full border-2 bg-white font-display text-[0.82rem] font-bold text-slate-950"
      style={{ borderColor }}
      aria-hidden
    >
      {failed ? (
        initials(creator.handle)
      ) : (
        <img
          src={creator.photo}
          alt=""
          decoding="async"
          onError={() => setFailed(true)}
          className="relative z-[1] block h-full w-full object-cover"
        />
      )}
    </span>
  );
}

function Chip({
  creator,
  index,
  duplicated,
}: {
  creator: Creator;
  index: number;
  duplicated?: boolean;
}) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  return (
    <a
      href={creator.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Instagram de @${creator.handle}`}
      aria-hidden={duplicated}
      tabIndex={duplicated ? -1 : undefined}
      className="mr-3 inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border-2 border-slate-950 py-1.5 pl-1.5 pr-[15px] font-display text-[0.92rem] font-bold shadow-[3px_3px_0_#0f172a] transition-all duration-150 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[5px_5px_0_#0f172a]"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      <Avatar creator={creator} borderColor={color.avatarBorder} />
      <span>@{creator.handle}</span>
    </a>
  );
}

export default function CreatorsBand() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      aria-label="Creators que apoiam o projeto"
      className="overflow-hidden border-y-2 border-slate-950 bg-[#6b1fc9] py-3"
    >
      {/* TODO(Ana): revisar a copy do titulo da faixa de creators */}
      <p className="mb-2.5 text-center font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#FCC700]">
        Creators que apoiam
      </p>

      {reduce ? (
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-y-3 px-4">
          {CREATORS.map((creator, i) => (
            <Chip key={creator.handle} creator={creator} index={i} />
          ))}
        </div>
      ) : (
        <div
          className="bnt-marquee overflow-hidden"
          style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }}
        >
          <div className="bnt-marquee-track flex w-max items-center">
            {[...CREATORS, ...CREATORS].map((creator, i) => (
              <Chip
                key={`${creator.handle}-${i}`}
                creator={creator}
                index={i % CREATORS.length}
                duplicated={i >= CREATORS.length}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
