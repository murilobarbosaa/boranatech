import { useEffect, useState } from "react";
import { Check, Copy, Ticket } from "lucide-react";

import { formatarCentavos } from "@/lib/formatarCentavos";
import type { CreatorDashboardCodigo } from "@shared/creatorDashboard";

// O CODIGO DO CREATOR NA SUPERFICIE `secondary` (a do hover dos cards da Visao
// do admin, `dark:hover:bg-secondary` no Admin.tsx), com borda da tinta, sombra
// dura e os rotulos violeta do poster de conta do /perfil. Foi o poster ambar de
// assinatura ate o lote 07b: o tom ambar (`--bnt-ticket-pro`, rotulos e divisor
// ambar) foi reprovado. A esquerda o codigo e os chips, a direita o link com o
// botao de copiar; embaixo, depois do divisor tracejado, os quatro numeros.
//
// TEMA ESCURO SEM VARIANTE: `--secondary` tem par no `.dark`, as classes violeta
// invertem pela paleta gerada, e os chips brancos viram `--bnt-surface` pelo
// mecanismo do site.

const ICONE = "h-3.5 w-3.5";

const ROTULO =
  "flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-violet-700";

const CHIP =
  "rounded-full border-2 border-slate-900 bg-white px-2.5 py-0.5 text-xs font-black text-slate-900";

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
          className="bnt-pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-slate-950 bg-slate-950 px-3 py-1.5 text-xs font-black text-white min-h-10 sm:min-h-0"
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
      className="rounded-3xl border-2 border-[var(--bnt-ink)] bg-secondary p-6 shadow-[4px_4px_0_var(--bnt-shadow)] md:p-8"
    >
      <div className="md:grid md:grid-cols-[1fr_minmax(0,1.2fr)] md:gap-8">
        <div>
          <p className={ROTULO}>
            <Ticket aria-hidden="true" className={ICONE} />
            {/* TODO(Ana) */}
            cupom
          </p>
          <p className="font-display mt-2 break-all text-3xl font-black leading-none tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
            {codigo.code}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={CHIP}>
              {/* TODO(Ana) */}
              {codigo.discount_percent > 0
                ? `${percentual(codigo.discount_percent)} de desconto para quem usar`
                : "Sem desconto para quem usar"}
            </span>
            <span className={CHIP}>
              {/* TODO(Ana) */}
              {`Comissão de ${percentual(codigo.commission_percent)}`}
            </span>
            {codigo.status !== "active" ? (
              <span
                data-testid={`creator-codigo-pausado-${codigo.code}`}
                className="rounded-full border-2 border-rose-700 bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-800"
              >
                {/* TODO(Ana) */}
                Pausado
              </span>
            ) : null}
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

        <div className="mt-6 md:mt-0">
          <p className={ROTULO}>
            {/* TODO(Ana) */}
            seu link
          </p>
          <CampoDoLink link={codigo.link} />
        </div>
      </div>

      <div className="my-6 border-t-2 border-dashed border-violet-200" />

      <dl
        data-testid={`creator-cupom-numeros-${codigo.code}`}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {numeros.map((item) => (
          <div key={item.rotulo}>
            <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-violet-700">
              {item.rotulo}
            </dt>
            <dd className="font-display mt-1 text-xl font-black tabular-nums text-slate-950">
              {item.valor}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
