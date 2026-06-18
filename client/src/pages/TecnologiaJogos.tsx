import { useMemo, useState } from "react";
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
import { gamesTech } from "@/lib/gamesTech";
import { cn } from "@/lib/utils";

const CARD_COLORS = [
  "bg-violet-600",
  "bg-blue-600",
  "bg-fuchsia-600",
  "bg-rose-600",
  "bg-indigo-600",
  "bg-orange-600",
  "bg-emerald-700",
  "bg-cyan-700",
  "bg-pink-600",
  "bg-teal-700",
];

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
              const color = CARD_COLORS[index % CARD_COLORS.length];
              return (
                <AnimatedContent
                  key={g.game}
                  distance={14}
                  duration={0.4}
                  delay={Math.min(index * 0.03, 0.3)}
                  className="h-full"
                >
                  <div className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-950 bg-white shadow-[5px_5px_0_#0f172a] transition-all duration-200 ease-out motion-safe:hover:-translate-y-1">
                    <div
                      className={cn(
                        "flex items-center gap-3 px-5 py-4 text-white",
                        color,
                      )}
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/70 bg-white/15 font-display text-lg font-black">
                        {initials(g.game)}
                      </span>
                      <div className="min-w-0">
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
                  </div>
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
