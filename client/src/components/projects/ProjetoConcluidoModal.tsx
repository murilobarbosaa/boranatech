import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CopyButton from "@/components/shared/CopyButton";
import { fireProCelebration } from "@/lib/proConfetti";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { ProximoProjeto } from "@/components/projects/ProjetoLateral";

// Acima do `z-50` do overlay e do conteudo do dialog, no mesmo patamar que
// `dialog.tsx` documenta para o admin (`z-[2000]`).
const Z_INDEX_CONFETE = 2000;

export default function ProjetoConcluidoModal({
  aberto,
  onOpenChange,
  nome,
  entregue = false,
  verificacoes = null,
  nota,
  totalEtapas,
  post,
  url,
  proximo,
  onValidar,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  nome: string;
  /** Veio do formulario de entrega, e nao do botao de autodeclaracao. */
  entregue?: boolean;
  /**
   * Quantas conferencias automaticas passaram, quando a comemoracao veio de uma
   * verificacao que fechou. `null` quando nao veio dai.
   *
   * Separa "entregue" de "verificado", que e a distincao inteira deste lote:
   * entregar so grava links, e quem conclui e o resultado das conferencias.
   */
  verificacoes?: number | null;
  /** Veio da validacao por IA: muda o titulo e mostra a nota. */
  nota?: { atendidos: number; total: number; perfeito: boolean } | null;
  totalEtapas: number | null;
  post: string;
  url: string;
  proximo: ProximoProjeto | null;
  onValidar?: () => void;
}) {
  const reduzirMovimento = usePrefersReducedMotion();

  useEffect(() => {
    if (!aberto || reduzirMovimento) return;
    const parar = fireProCelebration(
      { x: 0.5, y: 0.35 },
      { zIndex: Z_INDEX_CONFETE },
    );
    return parar;
  }, [aberto, reduzirMovimento]);

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Check className="h-5 w-5 text-emerald-600" strokeWidth={3.5} />
            {nota
              ? "Projeto validado!"
              : verificacoes
                ? "Projeto verificado!"
                : entregue
                  ? "Projeto entregue!"
                  : "Projeto concluído!"}
          </DialogTitle>
          <DialogDescription>
            {nota
              ? `Nota: ${nota.atendidos} de ${nota.total}.`
              : verificacoes
                ? `Você entregou ${nome} e passou nas ${verificacoes} conferências.`
                : entregue
                  ? `Você entregou ${nome}.`
                  : totalEtapas === null
                    ? `Você fechou ${nome}.`
                    : `Você fechou ${nome} em ${totalEtapas} etapas.`}
          </DialogDescription>
          {nota?.perfeito && (
            <span className="inline-flex w-fit items-center rounded-full border-2 border-ink bg-[var(--brand-yellow)] px-2.5 py-0.5 font-display text-xs font-black text-ink-on-accent">
              100%
            </span>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {onValidar ? (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onValidar();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-[var(--brand-yellow)] px-4 py-2.5 font-display text-sm font-bold text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]"
            >
              Agora valide seu projeto
            </button>
          ) : (
            <CopyButton
              text={`${post}\n\n${url}`}
              label="Copiar post para o LinkedIn"
              className="justify-center"
            />
          )}
          <CopyButton
            text={url}
            label="Compartilhar"
            copiedLabel="Link copiado!"
            className="justify-center border-border shadow-none"
          />
          {proximo && (
            <Link
              href={`/projetos/${proximo.id}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-xl border-2 border-border bg-card p-3 transition-colors hover:border-ink"
            >
              <span className="min-w-0 text-left">
                <span className="block text-xs font-bold text-muted-foreground">
                  Próximo projeto
                </span>
                <span className="block font-display text-sm font-bold text-foreground">
                  {proximo.nome}
                </span>
              </span>
              <ArrowRight
                className="ml-auto h-5 w-5 shrink-0 text-violet-600"
                aria-hidden
              />
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
