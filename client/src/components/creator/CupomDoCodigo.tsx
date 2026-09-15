import { useEffect, useState } from "react";
import { Check, Copy, Ticket } from "lucide-react";

import { formatarCentavos } from "@/lib/formatarCentavos";
import type { CreatorDashboardCodigo } from "@shared/creatorDashboard";

// O CODIGO DO CREATOR EM FORMATO DE CUPOM: fundo amarelo da marca, borda e
// sombra duras do resto do site, e os dois recortes semicirculares nas laterais
// (a tecnica de "ticket", o unico ornamento que nao existe em outra pagina).
// A esquerda o codigo e os selos, a direita o link com o botao de copiar,
// separados por uma linha tracejada; embaixo, os quatro numeros do codigo.
//
// TEMA ESCURO SEM VARIANTE DE TINTA: `bg-[var(--brand-yellow)]` casa o
// "contexto amarelo" do index.css, que no `.dark` devolve a paleta clara aos
// descendentes, entao texto, bordas e o botao escuro continuam iguais. So o
// fundo fecha um tom, para `--brand-yellow-deep`.
//
// O RECORTE e um circulo na cor da pagina (`--brand-cream`, que acompanha o
// tema) centrado na borda externa. So a metade de DENTRO tem contorno: o
// circulo gira 45 graus com duas bordas coloridas, e o arco colorido cai
// exatamente na metade que fica sobre o cupom. Sem `overflow-hidden` no cupom
// de proposito: ele recortaria o circulo no limite do padding e a borda reta
// passaria por cima do recorte.

const ICONE = "h-3.5 w-3.5";

const SELO =
  "inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs font-black";

const ROTULO =
  "flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-amber-950";

const RECORTE_ESQUERDO =
  "before:absolute before:-left-4 before:top-1/2 before:h-7 before:w-7 before:-translate-y-1/2 before:rotate-45 before:rounded-full before:border-2 before:border-transparent before:border-r-slate-950 before:border-t-slate-950 before:bg-[var(--brand-cream)]";

const RECORTE_DIREITO =
  "after:absolute after:-right-4 after:top-1/2 after:h-7 after:w-7 after:-translate-y-1/2 after:rotate-45 after:rounded-full after:border-2 after:border-transparent after:border-b-slate-950 after:border-l-slate-950 after:bg-[var(--brand-cream)]";

function inteiro(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

function percentual(valor: number): string {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function CampoDoLink({ link }: { link: string }) {
  const [estado, setEstado] = useState<"parado" | "copiado" | "falhou">(
    "parado",
  );

  useEffect(() => {
    if (estado !== "copiado") return;
    const timer = setTimeout(() => setEstado("parado"), 2000);
    return () => clearTimeout(timer);
  }, [estado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setEstado("copiado");
    } catch {
      setEstado("falhou");
    }
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-white py-1.5 pl-3 pr-1.5">
        <span className="min-w-0 flex-1 break-all font-mono text-xs font-bold text-slate-700 sm:text-sm">
          {link}
        </span>
        <button
          type="button"
          onClick={() => void copiar()}
          className="bnt-pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-slate-950 bg-slate-950 px-3 py-1.5 text-xs font-black text-white"
        >
          {estado === "copiado" ? (
            <Check className={ICONE} />
          ) : (
            <Copy className={ICONE} />
          )}
          {/* TODO(Ana) */}
          {estado === "copiado" ? "Copiado" : "Copiar"}
        </button>
      </div>
      {estado === "falhou" ? (
        <p className="mt-1.5 text-xs font-bold text-rose-900">
          {/* TODO(Ana) */}
          Não deu para copiar. Selecione o link e copie à mão.
        </p>
      ) : null}
    </div>
  );
}

export function CupomDoCodigo({
  codigo,
  visao,
}: {
  codigo: CreatorDashboardCodigo;
  visao: "creator" | "admin";
}) {
  const numeros = [
    // TODO(Ana)
    { rotulo: "Cliques", valor: inteiro(codigo.clicks) },
    // TODO(Ana)
    { rotulo: "Vendas", valor: inteiro(codigo.sales) },
    // TODO(Ana)
    { rotulo: "Receita", valor: formatarCentavos(codigo.revenue_cents) },
    {
      // TODO(Ana)
      rotulo: "A receber",
      valor: formatarCentavos(codigo.commission_due_cents),
    },
  ];

  return (
    <article
      data-testid={`creator-codigo-${codigo.code}`}
      className="rounded-3xl border-2 border-slate-950 bg-[var(--brand-yellow)] shadow-[4px_4px_0_var(--bnt-shadow)] dark:bg-[var(--brand-yellow-deep)]"
    >
      <div
        data-testid={`creator-cupom-corpo-${codigo.code}`}
        className={`relative grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] ${RECORTE_ESQUERDO} ${RECORTE_DIREITO}`}
      >
        <div className="p-5 sm:p-6">
          <p className={ROTULO}>
            <Ticket aria-hidden="true" className={ICONE} />
            {/* TODO(Ana) */}
            Cupom
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="font-mono text-3xl font-black tracking-wider text-slate-950 sm:text-4xl">
              {codigo.code}
            </p>
            {codigo.status !== "active" ? (
              <span className="rounded-full border-2 border-slate-950 bg-white px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-slate-950">
                {/* TODO(Ana) */}
                Pausado
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`${SELO} border-emerald-700 bg-emerald-50 text-emerald-900`}
            >
              {/* TODO(Ana) */}
              {codigo.discount_percent > 0
                ? `${percentual(codigo.discount_percent)} de desconto para quem usar`
                : "Sem desconto para quem usar"}
            </span>
            <span
              className={`${SELO} border-violet-700 bg-violet-50 text-violet-900`}
            >
              {/* TODO(Ana) */}
              {`Comissão de ${percentual(codigo.commission_percent)}`}
            </span>
          </div>
          {visao === "admin" && codigo.notes ? (
            <p
              data-testid={`creator-codigo-notas-${codigo.code}`}
              className="mt-3 rounded-xl border-2 border-dashed border-slate-950 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              {codigo.notes}
            </p>
          ) : null}
        </div>

        <div className="border-t-2 border-dashed border-slate-950 p-5 sm:p-6 md:border-l-2 md:border-t-0">
          <p className={ROTULO}>
            {/* TODO(Ana) */}
            Seu link
          </p>
          <CampoDoLink link={codigo.link} />
        </div>
      </div>

      <dl
        data-testid={`creator-cupom-numeros-${codigo.code}`}
        className="grid grid-cols-2 gap-y-3 rounded-b-[1.375rem] border-t-2 border-slate-950 bg-[var(--brand-yellow-soft)] py-3 sm:grid-cols-4 sm:divide-x-2 sm:divide-slate-950"
      >
        {numeros.map((item) => (
          <div key={item.rotulo} className="px-4">
            <dt className="text-[11px] font-black uppercase tracking-wide text-slate-600">
              {item.rotulo}
            </dt>
            <dd className="font-display text-lg font-black tabular-nums text-slate-950">
              {item.valor}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
