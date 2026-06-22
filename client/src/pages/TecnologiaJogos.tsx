import { type CSSProperties, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Cpu,
  Code2,
  ExternalLink,
  Gamepad2,
  Search,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/Layout";
import PageHero from "@/components/shared/PageHero";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { motion } from "framer-motion";
import { gamesTech } from "@/lib/gamesTech";
import { cn } from "@/lib/utils";

const CARD_THEMES = [
  { from: "from-violet-500", to: "to-violet-700" },
  { from: "from-blue-500", to: "to-blue-700" },
  { from: "from-fuchsia-500", to: "to-fuchsia-700" },
  { from: "from-rose-500", to: "to-rose-700" },
  { from: "from-indigo-500", to: "to-indigo-700" },
  { from: "from-orange-500", to: "to-orange-600" },
  { from: "from-emerald-500", to: "to-emerald-700" },
  { from: "from-cyan-500", to: "to-cyan-700" },
  { from: "from-pink-500", to: "to-pink-700" },
  { from: "from-teal-500", to: "to-teal-700" },
  { from: "from-amber-500", to: "to-amber-600" },
  { from: "from-sky-500", to: "to-sky-700" },
];

function themeFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CARD_THEMES[hash % CARD_THEMES.length];
}

const GAME_EMOJI: Record<string, string> = {
  "Among Us": "🚀",
  "Angry Birds": "🐦",
  "Apex Legends": "🎯",
  "Baba Is You": "🧩",
  "Battlefield 1": "🎖️",
  "Beat Saber": "🎶",
  Celeste: "🏔️",
  "Cities: Skylines": "🏙️",
  "Counter-Strike: Global Offensive": "🔫",
  Cuphead: "☕",
  "Cyberpunk 2077": "🌃",
  "Dead Cells": "⚔️",
  "Disco Elysium": "🕵️",
  Doom: "😈",
  "Dota 2": "🛡️",
  "EA Sports FC 24": "⚽",
  "Enter the Gungeon": "🔫",
  Factorio: "🏭",
  "Final Fantasy VII Remake": "🗡️",
  Fortnite: "🪂",
  "Gears of War": "⚙️",
  "Genshin Impact": "⛩️",
  "Grand Theft Auto V": "🚗",
  "Half-Life 2": "🧪",
  Hearthstone: "🃏",
  "Hellblade: Senua's Sacrifice": "🌀",
  "Hollow Knight": "🪲",
  "Hotline Miami": "🌴",
  "Hyper Light Drifter": "⚡",
  "Katana Zero": "🥷",
  "Kerbal Space Program": "🛰️",
  "Minecraft: Java Edition": "⛏️",
  "Monument Valley": "🏛️",
  "Ori and the Blind Forest": "🌲",
  "Papers, Please": "🛂",
  "Pokemon Go": "📱",
  "Portal 2": "🌀",
  "PUBG: Battlegrounds": "🍳",
  Quake: "👹",
  "Red Dead Redemption 2": "🤠",
  RimWorld: "🪐",
  "Risk of Rain": "🌧️",
  "Rocket League": "🏎️",
  "RollerCoaster Tycoon": "🎢",
  "Sea of Thieves": "🏴‍☠️",
  "Slay the Spire": "🗼",
  Spelunky: "🏺",
  "Stardew Valley": "🌾",
  "Street Fighter 6": "🥊",
  Subnautica: "🌊",
  "Super Mario 64": "🍄",
  "Team Fortress 2": "🎩",
  Terraria: "🪓",
  "The Witcher 3: Wild Hunt": "🐺",
  Undertale: "❤️",
  Valorant: "🎯",
  "Vampire Survivors": "🧛",
  "Wolfenstein 3D": "🪖",
};

const GAME_BG_STYLES = [
  "pixel",
  "fliperama",
  "scanlines",
  "plataforma",
  "tiles",
] as const;
type GameBgStyle = (typeof GAME_BG_STYLES)[number];

const BG_PATTERNS: Record<GameBgStyle, CSSProperties> = {
  pixel: {
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.18) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.18) 2px, transparent 2px)",
    backgroundSize: "16px 16px",
  },
  fliperama: {
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 16px), repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 16px), radial-gradient(circle at 50% 130%, rgba(255,255,255,0.4), transparent 60%)",
    backgroundSize: "16px 16px, 16px 16px, 100% 100%",
  },
  scanlines: {
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 5px)",
    backgroundSize: "100% 5px",
  },
  plataforma: {
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,0.22), transparent 42%)",
    backgroundSize: "22px 22px, 100% 100%",
  },
  tiles: {
    backgroundImage:
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0 10px, transparent 10px 20px)",
    backgroundSize: "28px 28px",
  },
};

const STYLE_BY_GAME: Record<string, GameBgStyle> = {
  "Among Us": "tiles",
  "Angry Birds": "plataforma",
  "Apex Legends": "fliperama",
  "Baba Is You": "tiles",
  "Battlefield 1": "scanlines",
  "Beat Saber": "fliperama",
  Celeste: "pixel",
  "Cities: Skylines": "tiles",
  "Counter-Strike: Global Offensive": "fliperama",
  Cuphead: "pixel",
  "Cyberpunk 2077": "fliperama",
  "Dead Cells": "pixel",
  "Disco Elysium": "tiles",
  Doom: "scanlines",
  "Dota 2": "fliperama",
  "EA Sports FC 24": "fliperama",
  "Enter the Gungeon": "pixel",
  Factorio: "tiles",
  "Final Fantasy VII Remake": "scanlines",
  Fortnite: "fliperama",
  "Gears of War": "scanlines",
  "Genshin Impact": "plataforma",
  "Grand Theft Auto V": "fliperama",
  "Half-Life 2": "scanlines",
  Hearthstone: "tiles",
  "Hellblade: Senua's Sacrifice": "scanlines",
  "Hollow Knight": "plataforma",
  "Hotline Miami": "fliperama",
  "Hyper Light Drifter": "pixel",
  "Katana Zero": "pixel",
  "Kerbal Space Program": "tiles",
  "Minecraft: Java Edition": "pixel",
  "Monument Valley": "tiles",
  "Ori and the Blind Forest": "plataforma",
  "Papers, Please": "scanlines",
  "Pokemon Go": "tiles",
  "Portal 2": "scanlines",
  "PUBG: Battlegrounds": "fliperama",
  Quake: "scanlines",
  "Red Dead Redemption 2": "plataforma",
  RimWorld: "tiles",
  "Risk of Rain": "pixel",
  "Rocket League": "fliperama",
  "RollerCoaster Tycoon": "tiles",
  "Sea of Thieves": "plataforma",
  "Slay the Spire": "tiles",
  Spelunky: "pixel",
  "Stardew Valley": "pixel",
  "Street Fighter 6": "fliperama",
  Subnautica: "plataforma",
  "Super Mario 64": "plataforma",
  "Team Fortress 2": "fliperama",
  Terraria: "pixel",
  "The Witcher 3: Wild Hunt": "plataforma",
  Undertale: "pixel",
  Valorant: "fliperama",
  "Vampire Survivors": "pixel",
  "Wolfenstein 3D": "scanlines",
};

function styleFor(name: string, year?: number): GameBgStyle {
  return STYLE_BY_GAME[name] ?? (year && year <= 1999 ? "scanlines" : "pixel");
}

const JOGOS_DOODLES = [
  { Icon: Gamepad2, cls: "left-[4%] top-[20%] text-fuchsia-500", size: "h-12 w-12" },
  { Icon: Sparkles, cls: "right-[8%] top-[16%] text-violet-500", size: "h-10 w-10" },
  { Icon: Code2, cls: "right-[24%] top-[66%] text-blue-500", size: "h-9 w-9" },
  { Icon: Gamepad2, cls: "left-[18%] top-[68%] text-rose-500", size: "h-9 w-9" },
];

function initials(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function TecnologiaJogos() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("Todas");

  const languages = useMemo(
    () => ["Todas", ...Array.from(new Set(gamesTech.map((g) => g.language))).sort()],
    [],
  );

  const filtered = useMemo(
    () =>
      gamesTech.filter((g) => {
        const matchesLang = lang === "Todas" || g.language === lang;
        const text = `${g.game} ${g.engine} ${g.language}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        return matchesLang && matchesQuery;
      }),
    [query, lang],
  );

  return (
    <Layout>
      <PageHero
        accent="fuchsia"
        eyebrow="tecnologia dos jogos 🎮"
        title="Como os jogos famosos foram feitos"
        subtitle={`Todo jogo nasce de uma engine e uma linguagem de programacao. Aqui voce ve com o que ${gamesTech.length} jogos famosos foram construidos, do Doom ao Fortnite.`}
        topSlot={
          <Link
            href="/tecnologias"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Voltar pra Tecnologias
          </Link>
        }
        backgroundSlot={
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            {JOGOS_DOODLES.map((doodle, index) => {
              const Icon = doodle.Icon;
              return (
                <span
                  key={index}
                  className={`animate-gentle-float absolute opacity-[0.18] ${doodle.cls}`}
                  style={{ animationDelay: `${index * 0.6}s` }}
                >
                  <Icon className={doodle.size} aria-hidden />
                </span>
              );
            })}
          </div>
        }
      />

      <section className="relative z-40 border-b-2 border-slate-900 bg-fuchsia-50 py-4 md:sticky md:top-16">
        <div className="container space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar jogo, engine ou linguagem..."
              className="w-full rounded-2xl border-2 border-slate-900 bg-white py-3 pl-11 pr-4 text-sm shadow-[4px_4px_0_#0f172a] outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
            />
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar por linguagem"
          >
            {languages.map((item) => (
              <button
                key={item}
                onClick={() => setLang(item)}
                aria-pressed={lang === item}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-black ${
                  lang === item
                    ? "border-slate-900 bg-fuchsia-300 text-slate-950 shadow-[2px_2px_0_#0f172a]"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-fuchsia-100"
                }`}
              >
                {item === "Todas" ? "Todas as linguagens" : item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fdf4ff] py-12">
        <div className="container">
          <p className="mb-6 text-sm text-slate-500">
            {filtered.length} jogo{filtered.length !== 1 ? "s" : ""}
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g, index) => {
              const theme = themeFor(g.game);
              const emoji = GAME_EMOJI[g.game];
              const patternStyle = BG_PATTERNS[styleFor(g.game, g.year)];
              return (
                <AnimatedContent
                  key={g.game}
                  distance={14}
                  duration={0.4}
                  delay={Math.min(index * 0.03, 0.3)}
                  className="h-full"
                >
                  <motion.div
                    whileHover={{ y: -6, rotate: -1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-950 bg-white shadow-[5px_5px_0_#0f172a] transition-shadow duration-200 hover:shadow-[8px_8px_0_#0f172a]"
                  >
                    <div
                      className={cn(
                        "relative flex items-center gap-3 bg-gradient-to-br px-5 py-4 text-white",
                        theme.from,
                        theme.to,
                      )}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={patternStyle}
                      />
                      {emoji ? (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute -right-2 -top-3 select-none text-6xl opacity-20 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                        >
                          {emoji}
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/70 bg-white/15 font-display font-black transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6",
                          emoji ? "text-2xl" : "text-lg",
                        )}
                      >
                        {emoji ?? initials(g.game)}
                      </span>
                      <div className="relative min-w-0">
                        <h2 className="font-display text-lg font-black leading-tight">
                          {g.game}
                        </h2>
                        {g.year ? (
                          <p className="text-xs font-bold text-white/80">
                            {g.year}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-black text-white">
                          <Cpu className="h-3.5 w-3.5" aria-hidden />
                          {g.engine}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-900">
                          <Code2 className="h-3.5 w-3.5" aria-hidden />
                          {g.language}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {g.made}
                      </p>
                      {g.source ? (
                        <a
                          href={g.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto inline-flex items-center gap-1 text-xs font-black text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                        >
                          fonte
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </motion.div>
                </AnimatedContent>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-3xl">🎮</p>
              <p className="mt-3 font-bold text-slate-700">
                Nenhum jogo encontrado.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setLang("Todas");
                }}
                className="mt-3 text-sm font-bold text-slate-950 hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
