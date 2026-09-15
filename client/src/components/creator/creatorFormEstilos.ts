// CLASSES DOS FORMULARIOS DO PERFIL DE CREATOR, num lugar so.
//
// Ate o lote 08b elas viviam dentro do formulario unico. Com o corte em dois
// cartoes (redes e pagamento), duas copias divergiriam na primeira mudanca, e
// dois campos lado a lado com alturas diferentes sao visiveis na hora.
//
// As formas sao as do FiscalDataModal (client/src/components/fiscal), que e o
// formulario de referencia do projeto. O secundario e o primario com fundo
// branco no lugar do amarelo.

export const inputClass =
  "w-full rounded-[11px] border-[2.5px] border-slate-900 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-950 shadow-[3px_3px_0_var(--bnt-shadow)] outline-none focus:-translate-y-px focus:shadow-[4px_4px_0_var(--bnt-shadow)]";

export const labelClass =
  "mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700";

export const erroClass = "mt-1 block text-xs font-bold text-red-600";

export const BOTAO_PRIMARIO =
  "inline-flex items-center justify-center rounded-[11px] border-[2.5px] border-slate-900 bg-[var(--brand-yellow)] px-4 py-2.5 text-sm font-black text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_var(--bnt-shadow)] disabled:cursor-not-allowed disabled:opacity-50";

export const BOTAO_SECUNDARIO =
  "inline-flex items-center justify-center rounded-[11px] border-[2.5px] border-slate-900 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-[3px_3px_0_var(--bnt-shadow)] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_var(--bnt-shadow)] disabled:cursor-not-allowed disabled:opacity-50";
