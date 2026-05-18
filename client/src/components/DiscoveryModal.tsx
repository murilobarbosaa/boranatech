import { Link } from "wouter";
import { BrainCircuit, Compass, Sparkles, X } from "lucide-react";

interface DiscoveryModalProps {
  open: boolean;
  onClose: () => void;
}

const options = [
  {
    title: "Não sei qual curso eu quero",
    desc: "Comece comparando cursos, tempo de estudo e perfil de cada trilha.",
  },
  {
    title: "Não sei qual área eu quero",
    desc: "Responda perguntas rápidas para conectar interesses com áreas de TI.",
  },
  {
    title: "Não sei nada",
    desc: "Receba uma rota inicial sem jargão, feita para sair do zero.",
  },
];

export default function DiscoveryModal({ open, onClose }: DiscoveryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="card-brutal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-indigo-50 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="social-badge mb-3 inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              descubra sua área
            </div>
            <h2 className="font-display text-3xl font-black text-slate-950">Vamos descobrir seu próximo passo?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Escolha a frase que mais parece com você. Todas levam para o quiz de descoberta de carreira.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border-2 border-slate-900 bg-white p-2 shadow-[2px_2px_0_#0f172a]"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3">
          {options.map((option) => (
            <Link
              key={option.title}
              href="/quiz-carreira"
              onClick={onClose}
              className="card-invite rounded-2xl bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl border-2 border-slate-900 bg-amber-300 p-2">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-slate-950">{option.title}</h3>
                  <p className="text-sm text-slate-600">{option.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/quiz-carreira"
          onClick={onClose}
          className="btn-brutal-accent mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black"
        >
          Ir para o quiz agora
          <BrainCircuit className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
