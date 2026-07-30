import type { ReactNode } from "react";

import { NAO_INFORMADO } from "./userFormat";

// Linha compacta de lista de definicao: rotulo pequeno em cima, valor embaixo,
// sem caixa. A hierarquia vem do peso da tipografia, nao de borda/fundo. Campo
// vazio (NAO_INFORMADO vindo dos formatadores) continua visivel, mas esmaecido:
// o admin ve que esta vazio sem o texto disputar peso com dado real.
export function Field({ label, value }: { label: string; value: ReactNode }) {
  const isEmpty = value === NAO_INFORMADO;
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={
          isEmpty
            ? "break-words text-sm font-medium text-slate-400"
            : "break-words text-sm font-bold text-slate-950"
        }
      >
        {value}
      </p>
    </div>
  );
}
