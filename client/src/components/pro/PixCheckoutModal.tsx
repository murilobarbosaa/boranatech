import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatPixRemaining, parseAsaasDate } from "@/lib/pixExpiration";
import { nextPixPollStep } from "@/lib/pixPolling";
import { getPixQrCode, type PixQrCode } from "@/services/subscriptionService";

/**
 * PAGAMENTO PIX NA PROPRIA TELA DO CHECKOUT.
 *
 * O 2h tirou o QR da fatura hospedada do Asaas e o trouxe para a pagina de
 * assinatura. Consertou o DESTINO e nao a VIAGEM: o checkout ainda navegava para
 * outra pagina e o QR aparecia no rodape de um card, fora da vista. A queixa era
 * a mesma de antes, perda de contexto, so que dentro de casa. Aqui a cobranca
 * nasce e e paga sem sair do lugar.
 *
 * O BLOCO DA PAGINA DE ASSINATURA CONTINUA EXISTINDO, de proposito: ele e a
 * superficie de RETORNO FRIO, para quem fechou o modal, trocou de aparelho ou
 * voltou horas depois. Este modal e o caminho quente.
 *
 * O QUE NAO MORA AQUI: a regra de parada do polling (`pixPolling.ts`) e a
 * leitura do prazo (`pixExpiration.ts`). As duas sao puras e testadas isoladas,
 * porque errar nelas nao produz sintoma visual.
 */

/**
 * Formatador local, e nao um import: o equivalente em `Perfil.tsx` e funcao
 * privada daquele arquivo. Extrair para uma lib seria refactor de codigo
 * adjacente, fora do escopo deste lote; fica registrado como candidato.
 */
function formatarBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

type Fase =
  | { nome: "carregando" }
  | { nome: "pronto"; qr: PixQrCode }
  | { nome: "erro" }
  | { nome: "confirmado" };

export default function PixCheckoutModal({
  open,
  amountCents,
  invoiceUrl,
  onDismiss,
  onConfirmedContinue,
  onExpiredRestart,
}: {
  open: boolean;
  /** Valor que o provedor registrou, em centavos. Ver `amountCents` do checkout. */
  amountCents?: number | null;
  /** Fatura hospedada, so como saida de emergencia quando o QR nao carrega. */
  invoiceUrl?: string | null;
  /** Fechou sem pagar: o chamador atualiza a assinatura e leva para a pagina dela. */
  onDismiss: () => void;
  /** Pagou: o chamador atualiza a assinatura e leva para a pagina dela. */
  onConfirmedContinue: () => void;
  /** Prazo esgotado: o chamador devolve a pessoa para a escolha de plano. */
  onExpiredRestart: () => void;
}) {
  const { isPro, refreshSubscription } = useSubscription();
  const [fase, setFase] = useState<Fase>({ nome: "carregando" });
  const [copiado, setCopiado] = useState(false);
  const [agora, setAgora] = useState(() => new Date());
  const inicioRef = useRef<number>(Date.now());

  // BUSCA DO QR. Refaz a cada abertura: um modal reaberto sobre outra cobranca
  // mostrando o QR da anterior seria pior que um erro visivel.
  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    setFase({ nome: "carregando" });
    inicioRef.current = Date.now();
    getPixQrCode()
      .then((qr) => {
        if (!cancelado) setFase({ nome: "pronto", qr });
      })
      .catch(() => {
        if (!cancelado) setFase({ nome: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [open]);

  // RELOGIO. Um tick por segundo enquanto o modal esta aberto e ninguem pagou.
  // Parar no `confirmado` evita render por segundo numa tela que ja terminou.
  useEffect(() => {
    if (!open || fase.nome === "confirmado") return;
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, [open, fase.nome]);

  // POLLING. A decisao inteira vem de `nextPixPollStep`; aqui so ha encanamento.
  useEffect(() => {
    if (!open || fase.nome === "confirmado") return;
    let vivo = true;
    let id: ReturnType<typeof setTimeout> | undefined;

    async function passo() {
      if (!vivo) return;
      const decisao = nextPixPollStep({
        isPro,
        elapsedMs: Date.now() - inicioRef.current,
      });
      if (decisao.action === "confirmed") {
        setFase({ nome: "confirmado" });
        return;
      }
      if (decisao.action === "stop") return;
      // `silent`: reconsulta de fundo nao pode piscar a tela inteira.
      await refreshSubscription({ silent: true });
      if (vivo) id = setTimeout(passo, decisao.delayMs);
    }

    id = setTimeout(passo, 0);
    return () => {
      vivo = false;
      if (id) clearTimeout(id);
    };
  }, [open, fase.nome, isPro, refreshSubscription]);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiar(payload: string) {
    try {
      await navigator.clipboard.writeText(payload);
      setCopiado(true);
    } catch {
      // Clipboard bloqueado (contexto inseguro, permissao negada): o codigo segue
      // visivel e selecionavel. Falhar aqui nao pode derrubar o modal.
      setCopiado(false);
    }
  }

  const qr = fase.nome === "pronto" ? fase.qr : null;
  const restante = formatPixRemaining(
    parseAsaasDate(qr?.expirationDate),
    agora,
  );
  const expirou = restante.kind === "expired";
  const valor =
    typeof amountCents === "number" ? formatarBRL(amountCents) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(aberto) => {
        if (aberto) return;
        if (fase.nome === "confirmado") onConfirmedContinue();
        else onDismiss();
      }}
    >
      {/* `max-h` com rolagem INTERNA: em viewport baixa o botao de copiar ficava
          fora da area visivel e nao havia como chegar nele. */}
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_var(--bnt-shadow)] sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            {/* TODO(Ana): titulo do modal de pagamento Pix. */}
            {fase.nome === "confirmado"
              ? "Pagamento confirmado!"
              : "Pague com Pix"}
          </DialogTitle>
        </DialogHeader>

        {fase.nome === "confirmado" ? (
          <div className="mt-4 flex flex-col items-center gap-4 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-300">
              <Check className="h-7 w-7 text-slate-950" strokeWidth={3} />
            </span>
            {/* TODO(Ana): mensagem de confirmacao do pagamento Pix. */}
            <p className="text-sm font-bold text-slate-700">
              Seu acesso Pro já está liberado.
            </p>
            <button
              type="button"
              onClick={onConfirmedContinue}
              className="bnt-pressable inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-[var(--brand-yellow)] px-5 py-2.5 font-display text-sm font-black text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)] transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* TODO(Ana): rotulo do botao apos a confirmacao. */}
              Ver meu Pro
            </button>
          </div>
        ) : expirou ? (
          <div className="mt-4 flex flex-col items-center gap-4 text-center">
            {/* TODO(Ana): mensagem de codigo Pix expirado. */}
            <p className="text-sm font-bold text-slate-700">
              Este código Pix expirou. Refaça o checkout para gerar um novo.
            </p>
            <button
              type="button"
              onClick={onExpiredRestart}
              className="bnt-pressable inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-[var(--brand-yellow)] px-5 py-2.5 font-display text-sm font-black text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)] transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* TODO(Ana): rotulo do botao de refazer o checkout. */}
              Escolher plano de novo
            </button>
          </div>
        ) : fase.nome === "carregando" ? (
          <p className="mt-4 text-sm font-bold text-slate-600">
            {/* TODO(Ana): estado de carregamento do codigo Pix no modal. */}
            Gerando seu código Pix...
          </p>
        ) : fase.nome === "erro" ? (
          <div className="mt-4 rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]">
            {/* TODO(Ana): copy da falha ao gerar o codigo Pix no modal. */}
            <p className="text-sm font-bold text-slate-800">
              Não foi possível gerar o código agora.
            </p>
            {invoiceUrl ? (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-violet-800 underline"
              >
                {/* TODO(Ana): rotulo do fallback para a fatura no modal. */}
                Abrir a fatura para pagar
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
              </a>
            ) : null}
          </div>
        ) : qr ? (
          <div className="mt-4 flex flex-col gap-4">
            {valor ? (
              <div className="flex items-baseline justify-between gap-3 rounded-2xl border-2 border-slate-950 bg-white px-4 py-3 shadow-[3px_3px_0_var(--bnt-shadow)]">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
                  {/* TODO(Ana): rotulo do valor no modal. */}
                  Valor
                </span>
                <span className="font-display text-xl font-black text-slate-950">
                  {valor}
                </span>
              </div>
            ) : null}

            {/* HIERARQUIA POR DISPOSITIVO, igual ao bloco do 2h: no mobile o
                copia e cola lidera, porque ninguem escaneia um QR exibido na
                propria tela do celular; no desktop o QR lidera. Um markup so,
                com a ordem do flex. */}
            <div className="flex flex-col-reverse gap-4 sm:flex-col">
              <div className="rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
                  {/* TODO(Ana): rotulo do copia e cola no modal. */}
                  Pix copia e cola
                </p>
                <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-slate-700">
                  {qr.payload}
                </p>
                <button
                  type="button"
                  onClick={() => void copiar(qr.payload)}
                  className="bnt-pressable mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-[var(--brand-yellow)] px-4 py-2 font-display text-sm font-black text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)] transition-all duration-200 hover:-translate-y-0.5"
                >
                  {copiado ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <Copy className="h-4 w-4" strokeWidth={2.5} />
                  )}
                  {/* TODO(Ana): rotulos do botao de copiar no modal. */}
                  {copiado ? "Copiado!" : "Copiar código"}
                </button>
              </div>

              <div className="flex flex-col items-center rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
                  <QrCode className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {/* TODO(Ana): rotulo do QR Code no modal. */}
                  Escaneie no app do banco
                </span>
                {/* `bnt-keep-colors`: o fundo imediato do QR fica claro nos dois temas, porque a leitura optica depende do contraste do proprio codigo, nao do tema. */}
                <img
                  src={`data:image/png;base64,${qr.encodedImage}`}
                  alt="QR Code do Pix"
                  className="bnt-keep-colors mt-3 h-44 w-44 rounded-xl border-2 border-slate-950 bg-white p-1"
                />
              </div>
            </div>

            {restante.kind === "near" ? (
              <p className="text-center font-mono text-sm font-black text-slate-950">
                {/* TODO(Ana): texto da contagem regressiva do codigo Pix. */}
                Expira em {restante.clock}
              </p>
            ) : restante.kind === "far" ? (
              <p className="text-center text-xs font-bold text-slate-600">
                {/* TODO(Ana): texto do prazo do codigo Pix. */}
                Vence em {restante.hours}h, até {restante.absolute}
              </p>
            ) : null}

            {/* TODO(Ana): aviso de confirmacao automatica. */}
            <p className="text-center text-xs font-medium text-slate-500">
              A confirmação é automática. Pode deixar esta tela aberta.
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
