import { useState } from "react";
import Layout from "@/components/Layout";
import PageHero from "@/components/shared/PageHero";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import type { FreelaFirstProject } from "@/lib/careerToolsData";
import { firstFreelaProjects, freelancePlatforms } from "@/lib/careerToolsData";
import { cn, youtubeEmbedUrl } from "@/lib/utils";
import { BookOpen, ExternalLink, PlayCircle } from "lucide-react";

const ac = getPageAccentUi("orange");

function FreelaHelpSection({ project }: { project: FreelaFirstProject }) {
  const { video, articles } = project.help;
  const embedSrc = video.youtubeId ? youtubeEmbedUrl(video.youtubeId) : null;

  return (
    <div className="mt-4 border-t-2 border-slate-900/10 pt-4">
      <p className={cn("text-xs font-black uppercase tracking-wide", ac.tbodyAccent)}>Materiais de apoio</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {embedSrc ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn(
                  "h-9 shrink-0 gap-2 border-2 border-slate-900 font-black shadow-[3px_3px_0_0_rgb(15_23_42)]",
                  "hover:bg-slate-50"
                )}
              >
                <PlayCircle className="size-4" aria-hidden />
                Assistir vídeo
              </Button>
            </DialogTrigger>
            <DialogContent
              showCloseButton
              className="max-h-[92vh] w-[calc(100%-1.25rem)] max-w-4xl gap-4 overflow-y-auto border-2 border-slate-900 p-4 sm:p-6"
            >
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-lg font-black sm:text-xl">
                  {video.title}
                </DialogTitle>
              </DialogHeader>
              <div className="aspect-video overflow-hidden rounded-xl border-2 border-slate-900 bg-black shadow-[4px_4px_0_0_rgb(15_23_42)]">
                <iframe
                  title={video.title}
                  src={`${embedSrc}?rel=0`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="h-full w-full"
                />
              </div>
              <Button asChild variant="secondary" size="sm" className="w-full gap-2 font-black sm:w-auto">
                <a href={video.href} target="_blank" rel="noopener noreferrer">
                  Abrir no YouTube
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </Button>
            </DialogContent>
          </Dialog>
        ) : (
          <Button asChild variant="outline" size="sm" className="h-9 gap-2 border-2 border-slate-900 font-black shadow-[3px_3px_0_0_rgb(15_23_42)]">
            <a href={video.href} target="_blank" rel="noopener noreferrer">
              Ver vídeos e guias
              <ExternalLink className="size-4 shrink-0" aria-hidden />
            </a>
          </Button>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {articles.map((article) => (
          <li key={article.href}>
            <a
              href={article.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex gap-2 text-sm leading-snug font-bold text-slate-800 underline-offset-2 hover:text-slate-950 hover:underline"
            >
              <BookOpen
                className="mt-0.5 size-4 shrink-0 text-orange-700 opacity-90 group-hover:opacity-100"
                aria-hidden
              />
              <span>{article.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Freelance() {
  const [hours, setHours] = useState(20);
  const [level, setLevel] = useState("Iniciante");
  const multiplier = level === "Avançado" ? 140 : level === "Intermediário" ? 95 : 60;
  const ideal = hours * multiplier;

  return (
    <Layout>
      <PageHero
        accent="orange"
        eyebrow="renda antes do CLT"
        title="Freelance em Tech"
        subtitle="Como ganhar dinheiro com tecnologia antes do primeiro emprego."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className={cn("card-brutal rounded-2xl border-2 p-6", ac.panelBorder, ac.panelSoft)}>
            <h2 className="font-display text-2xl font-black">Calculadora de precificação de freela</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="font-black">
                Tipo de projeto
                <select className="mt-1 w-full rounded-xl border-2 border-slate-900 p-3">
                  <option>Landing page</option>
                  <option>App web</option>
                  <option>API</option>
                  <option>Bot</option>
                  <option>Automação</option>
                  <option>Design</option>
                </select>
              </label>
              <label className="font-black">
                Horas estimadas
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border-2 border-slate-900 p-3"
                  value={hours}
                  onChange={(event) => setHours(Number(event.target.value))}
                />
              </label>
              <label className="font-black">
                Nível
                <select
                  className="mt-1 w-full rounded-xl border-2 border-slate-900 p-3"
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                >
                  <option>Iniciante</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                </select>
              </label>
            </div>
            <p className="mt-5 rounded-2xl border-2 border-slate-900 bg-white p-5 font-display text-2xl font-black">
              Valor sugerido: R$ {Math.round(ideal * 0.8).toLocaleString("pt-BR")} a R$ {Math.round(ideal * 1.4).toLocaleString("pt-BR")}. Não
              cobre menos que R$ {Math.round(ideal * 0.7).toLocaleString("pt-BR")}.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {freelancePlatforms.map((platform) => (
              <article key={platform.name} className="card-brutal rounded-2xl bg-white p-5">
                <h2 className="font-display text-xl font-black">{platform.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{platform.focus}</p>
                <p className="mt-3 text-sm">
                  <strong>Dificuldade:</strong> {platform.difficulty}
                </p>
                <p className="text-sm">
                  <strong>Comissão:</strong> {platform.fee}
                </p>
                <span
                  className={cn(
                    "mt-3 inline-flex rounded-full px-2 py-1 text-xs font-black",
                    platform.beginner ? cn(ac.panelSoft, ac.tbodyAccent) : "bg-slate-200 text-slate-600"
                  )}
                >
                  {platform.beginner ? "Boa para iniciante" : "Mais seletiva"}
                </span>
              </article>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {firstFreelaProjects.map((project) => (
              <article key={project.name} className="card-brutal flex flex-col rounded-2xl bg-white p-5">
                <h3 className="font-display text-xl font-black">{project.name}</h3>
                <p className="mt-2 text-sm">
                  <strong>Dificuldade:</strong> {project.difficulty}
                </p>
                <p className="text-sm">
                  <strong>Tempo:</strong> {project.time}
                </p>
                <p className="text-sm">
                  <strong>Valor:</strong> {project.value}
                </p>
                <p className="mt-2 text-sm text-slate-600">{project.clients}</p>
                <div className="flex-1" />
                <FreelaHelpSection project={project} />
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
