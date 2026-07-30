import type { ReactNode } from "react";

// Linha compacta de lista de definicao: rotulo pequeno em cima, valor embaixo,
// sem caixa. A hierarquia vem do peso da tipografia, nao de borda/fundo. Campo
// vazio continua visivel, mas esmaecido: o admin ve que esta vazio sem o texto
// disputar peso com dado real.
//
// `empty` e EXPLICITO. Antes, o componente comparava `value === NAO_INFORMADO`,
// o que acoplava estilo a uma string de copy: mudar o texto "Não informado"
// apagaria o esmaecido de todos os campos, sem nada quebrar. Quem chama sabe se
// o dado existe; use semValor() de userFormat.ts para decidir.
export function Field({
  label,
  value,
  empty = false,
}: {
  label: string;
  value: ReactNode;
  empty?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={
          empty
            ? "break-words text-sm font-medium text-slate-400"
            : "break-words text-sm font-bold text-slate-950"
        }
      >
        {value}
      </p>
    </div>
  );
}
