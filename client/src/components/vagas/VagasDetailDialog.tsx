import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BrutalActionButton from "@/components/shared/BrutalActionButton";
import {
  contractLabel,
  modalityLabel,
  publishedAgo,
  salaryLine,
  seniorityLabel,
  sourceLabel,
} from "@/components/vagas/VagasJobCard";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { fetchVaga, type VagaDetail } from "@/services/vagasService";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("cyan");

type DetailStatus = "loading" | "error" | "not_found" | "ready";

// Modal de detalhe da vaga (Pro). Aberto somente a partir dos cards Pro; a
// description e SEMPRE renderizada como texto (whitespace-pre-line), nunca
// como HTML.
export default function VagasDetailDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<DetailStatus>("loading");
  const [vaga, setVaga] = useState<VagaDetail | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setStatus("loading");
    setVaga(null);
    fetchVaga(id)
      .then((data) => {
        if (!active) return;
        setVaga(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setStatus(
          err instanceof Error && err.message === "NOT_FOUND"
            ? "not_found"
            : "error",
        );
      });
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  const meta =
    vaga !== null
      ? [
          vaga.country ? vaga.country.toUpperCase() : null,
          seniorityLabel(vaga.seniority),
          modalityLabel(vaga.modality),
          contractLabel(vaga.contract),
          publishedAgo(vaga.publishedAt),
        ].filter((value): value is string => value !== null)
      : [];
  const salary = vaga !== null ? salaryLine(vaga) : null;

  return (
    <Dialog open={id !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-2 border-slate-950 bg-white">
        {status === "loading" ? (
          <div aria-busy="true">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-black">
                Carregando vaga...
              </DialogTitle>
              <DialogDescription className="sr-only">
                Carregando os detalhes da vaga.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="h-32 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ) : status === "not_found" ? (
          <div>
            <DialogHeader>
              {/* TODO(Ana): validar a copy do 404 do detalhe. */}
              <DialogTitle className="font-display text-xl font-black">
                Vaga não encontrada
              </DialogTitle>
              <DialogDescription>
                Essa vaga pode ter sido despublicada ou preenchida.
              </DialogDescription>
            </DialogHeader>
          </div>
        ) : status === "error" ? (
          <div>
            <DialogHeader>
              {/* TODO(Ana): validar a copy do erro do detalhe. */}
              <DialogTitle className="font-display text-xl font-black">
                Não conseguimos abrir a vaga
              </DialogTitle>
              <DialogDescription>
                Pode ser uma instabilidade momentânea.
              </DialogDescription>
            </DialogHeader>
            <BrutalActionButton
              className="mt-4"
              icon={<RefreshCw className="h-4 w-4" aria-hidden />}
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Tentar de novo
            </BrutalActionButton>
          </div>
        ) : vaga !== null ? (
          <div>
            <DialogHeader>
              <DialogTitle className="pr-6 font-display text-xl font-black text-slate-950">
                {vaga.title}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-600">
                {[vaga.company, vaga.location].filter(Boolean).join(" · ") ||
                  "Empresa não informada"}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {meta.map((value) => (
                <span
                  key={value}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    ac.panelSoft,
                    ac.tbodyAccent,
                  )}
                >
                  {value}
                </span>
              ))}
            </div>
            {salary ? (
              <p className="mt-3 text-sm font-bold text-emerald-700">
                {salary}
              </p>
            ) : null}
            {vaga.description ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {vaga.description}
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                {/* TODO(Ana): validar a copy de vaga sem descricao. */}
                Sem descrição detalhada; veja a vaga completa no site original.
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">
                {sourceLabel(vaga)}
              </span>
              <a
                href={vaga.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bnt-pressable inline-flex items-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-5 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
              >
                Candidatar
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
