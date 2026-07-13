import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { creators as CREATORS, type Creator } from "@/lib/creatorsData";

// Faixa de creators que apoiam o projeto. Le a fonte unica em lib/creatorsData
// e leva pra pagina /creators (o Instagram fica no detalhe de cada creator, pra
// dar credibilidade antes de sair pra rede). Marquee em loop, pausa no hover,
// fade nas pontas; em prefers-reduced-motion vira um wrap estatico visivel. A
// landing estatica (client/public/lancamento.html) mantem a propria copia.

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
      className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border-2 bg-white font-display text-[0.7rem] font-bold text-slate-950"
      style={{ borderColor }}
      aria-hidden
    >
      {failed ? (
        initials(creator.handle)
      ) : (
        <img
          src={creator.photo}
          alt=""
          width={28}
          height={28}
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
    <Link
      href="/creators"
      aria-label={`Ver ${creator.name} na página de creators`}
      aria-hidden={duplicated}
      tabIndex={duplicated ? -1 : undefined}
      className="mr-3 inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-2 border-slate-950 py-1 pl-1 pr-3 font-display text-[0.8rem] font-bold shadow-[3px_3px_0_#0f172a] transition-all duration-150 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[5px_5px_0_#0f172a]"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      <Avatar creator={creator} borderColor={color.avatarBorder} />
      <span>@{creator.handle}</span>
    </Link>
  );
}

export default function CreatorsBand() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      aria-label="Creators de conteúdo em tech"
      className="sticky top-16 z-40 overflow-hidden border-b-2 border-slate-950 bg-[#6b1fc9] py-2"
    >
      <p className="mb-1 hidden text-center font-mono text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#FCC700] sm:block">
        Creators de conteúdo em tech
      </p>

      {reduce ? (
        <div
          className="flex items-center overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }}
        >
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
