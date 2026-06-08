import { Link } from "wouter";
import { ArrowRight, BookOpen, Briefcase, Compass, Map, X } from "lucide-react";

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: <Compass className="h-5 w-5" />,
    title: "Descubra sua área",
    desc: "Use o quiz e os cards de áreas para entender o que combina com seu jeito.",
    href: "/areas",
  },
  {
    icon: <Map className="h-5 w-5" />,
    title: "Escolha um roadmap",
    desc: "Siga planos de 10, 20, 30 ou 60 dias sem tentar aprender tudo de uma vez.",
    href: "/roadmaps",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Salve cursos e projetos",
    desc: "Monte uma lista do que estudar e do que publicar no portfólio.",
    href: "/cursos",
  },
  {
    icon: <Briefcase className="h-5 w-5" />,
    title: "Prepare sua carreira",
    desc: "Use dicas de LinkedIn, eventos, comunidades e vagas para criar presença.",
    href: "/estagio",
  },
];

export default function OnboardingTour({ open, onClose }: OnboardingTourProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="card-brutal max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase tracking-wide">
              tour da plataforma
            </p>
            <h2 className="font-display text-3xl font-black text-slate-950">
              Como usar o BORA NA TECH?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Pense na plataforma como uma bússola: ela mostra direção, próximos
              passos e lugares seguros para aprender.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border-2 border-slate-900 bg-white p-2 shadow-[2px_2px_0_#0f172a]"
            aria-label="Fechar onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <Link
              key={step.title}
              href={step.href}
              onClick={onClose}
              className="card-invite rounded-2xl border-indigo-100 bg-indigo-50 p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-200 font-black text-violet-900">
                  {index + 1}
                </span>
                <span className="rounded-xl border-2 border-slate-900 bg-white p-2">
                  {step.icon}
                </span>
              </div>
              <h3 className="font-display text-lg font-black text-slate-950">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{step.desc}</p>
            </Link>
          ))}
        </div>

        <Link
          href="/perfil"
          onClick={onClose}
          className="btn-brutal-accent mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black"
        >
          Criar meu perfil e salvar minha trilha
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
