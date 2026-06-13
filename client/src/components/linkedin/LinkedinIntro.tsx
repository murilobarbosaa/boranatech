import type { ComponentType } from "react";
import {
  FileDown,
  Gauge,
  ListChecks,
  MessageSquare,
  Search,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS: { n: string; text: string }[] = [
  {
    n: "1",
    text: "No LinkedIn, abra seu perfil, clique em Mais e depois em Salvar como PDF.",
  },
  {
    n: "2",
    text: "Envie o PDF aqui (ele é lido no seu navegador) ou cole o texto do perfil.",
  },
  {
    n: "3",
    text: "Escolha sua área, o mercado-alvo e responda 6 perguntas rápidas sobre o perfil.",
  },
  {
    n: "4",
    text: "Receba uma nota, um diagnóstico e os textos prontos para colar no perfil.",
  },
];

const ITEMS: {
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  title: string;
  text: string;
}[] = [
  {
    icon: Gauge,
    iconBg: "bg-amber-300",
    title: "Nota de 0 a 100",
    text: "Pontuação objetiva, baseada em checagens reais do que recrutadores procuram.",
  },
  {
    icon: ListChecks,
    iconBg: "bg-emerald-300",
    title: "Checklist do que falta",
    text: "Item por item, o que já está bom e o que falta no seu perfil.",
  },
  {
    icon: Search,
    iconBg: "bg-sky-300",
    title: "Como um recrutador te encontra",
    text: "As palavras-chave que te colocam (ou não) nas buscas da sua área.",
  },
  {
    icon: Type,
    iconBg: "bg-violet-300",
    title: "Headline em 3 versões",
    text: "Três opções de headline prontas, na fórmula que aparece nas buscas.",
  },
  {
    icon: FileDown,
    iconBg: "bg-rose-300",
    title: "Sobre reescrito",
    text: "Um texto de Sobre completo, com gancho, prova e convite ao contato.",
  },
  {
    icon: Upload,
    iconBg: "bg-cyan-300",
    title: "Bullets de experiência",
    text: "Suas experiências reescritas com verbo de ação, tecnologia e resultado.",
  },
  {
    icon: Sparkles,
    iconBg: "bg-orange-300",
    title: "Skills para adicionar",
    text: "Sugestões de competências que valorizam o perfil, só o que você sabe.",
  },
  {
    icon: MessageSquare,
    iconBg: "bg-fuchsia-300",
    title: "Mensagem para recrutador",
    text: "Um modelo curto de abordagem que você pode enviar para se conectar.",
  },
];

export function HowItWorks() {
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-black text-slate-950">
        Como funciona
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="card-brutal rounded-2xl border-slate-950 bg-white p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 font-display text-lg font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">
              {step.n}
            </span>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WhatYouGet() {
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-black text-slate-950">
        O que você recebe
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="card-brutal rounded-2xl border-slate-950 bg-white p-5"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 text-slate-950 shadow-[3px_3px_0_#0f172a]",
                item.iconBg,
              )}
            >
              <item.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-base font-black text-slate-950">
              {item.title}
            </p>
            <p className="mt-1 text-sm text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
