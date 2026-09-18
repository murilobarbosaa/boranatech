// STATUS DA PUBLICACAO NAS LISTAS (lote 10b): o chip que diz se a publicacao
// ja foi conferida pelo admin (vale ponto) ou ainda aguarda. Um lugar so para
// a lista do creator e a do admin desenharem o mesmo chip com as mesmas
// palavras.
//
// Resolver com fallback neutro, como manda a regra de lookup por valor do
// servidor: status que este bundle nao conhece, ou AUSENTE (o backend anterior
// ao lote 10b nao manda o campo, e na janela de deploy o front novo fala com
// ele), nao desenha chip nenhum em vez de derrubar a lista. Ausente e "nao
// sei", nunca "pendente".

/** `pendente` apaga a linha um pouco: ela ainda nao conta. */
export function classeDaLinhaPorStatus(status: string | undefined): string {
  return status === "pendente" ? "opacity-70" : "";
}

export function ChipDeStatusDaPublicacao({
  status,
}: {
  status: string | undefined;
}) {
  if (status === "confirmado") {
    return (
      <span
        data-testid="publicacao-status-confirmada"
        className="rounded-full border-2 border-emerald-700 bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-800"
      >
        {/* TODO(Ana) */}
        confirmada
      </span>
    );
  }
  if (status === "pendente") {
    return (
      <span
        data-testid="publicacao-status-pendente"
        className="rounded-full border-2 border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600"
      >
        {/* TODO(Ana) */}
        aguardando conferência
      </span>
    );
  }
  return null;
}

/** Chip de contagem "M aguardando", em slate: pendencia, sem alarme. */
export function ChipDeAguardando({
  quantas,
  testId,
}: {
  quantas: number;
  testId: string;
}) {
  if (quantas <= 0) return null;
  return (
    <span
      data-testid={testId}
      className="inline-flex items-center rounded-full border-2 border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
    >
      {/* TODO(Ana) */}
      {`${quantas} aguardando`}
    </span>
  );
}
