import type { ComponentType } from "react";
import { FileCode2, Gauge, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS: { n: string; text: string }[] = [
  { n: "1", text: "Escolha perfil ou repositório e cole seu usuário ou a URL." },
  { n: "2", text: "A gente lê os dados públicos do GitHub e roda checagens automáticas." },
  {
    n: "3",
    text: "Você recebe uma nota, um checklist do que falta e uma análise da IA com melhorias priorizadas.",
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
    text: "Pontuação objetiva e reproduzível, baseada em checagens reais.",
  },
  {
    icon: ListChecks,
    iconBg: "bg-emerald-300",
    title: "Checklist do que falta",
    text: "Item por item, o que está bom e o que falta, com explicação.",
  },
  {
    icon: Sparkles,
    iconBg: "bg-violet-300",
    title: "Análise da IA",
    text: "Leitura do seu README e do seu perfil, com pontos fortes e a melhorar.",
  },
  {
    icon: FileCode2,
    iconBg: "bg-sky-300",
    title: "Sugestão de README",
    text: "Um modelo pronto pra copiar e adaptar.",
  },
];

export function HowItWorks() {
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-black text-slate-950">Como funciona</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="card-brutal rounded-2xl border-slate-950 bg-white p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 font-display text-lg font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">
              {step.n}
            </span>
            <p className="mt-3 text-sm font-medium text-slate-700">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WhatYouGet() {
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-black text-slate-950">O que você recebe</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="card-brutal rounded-2xl border-slate-950 bg-white p-5">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 text-slate-950 shadow-[3px_3px_0_#0f172a]",
                item.iconBg,
              )}
            >
              <item.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-base font-black text-slate-950">{item.title}</p>
            <p className="mt-1 text-sm text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
