import { classeDoMarcador } from "@/lib/corDoCalendario";

// O PONTINHO DE COR DO CREATOR (lote 10c): o mesmo marcador na grade do
// calendario, no painel do dia, no select da aba Perfil, ao lado do titulo
// "Redes" e no cartao do admin. Um componente para as cinco telas desenharem
// o mesmo circulo do mesmo tamanho.
//
// Decorativo (`aria-hidden`): a cor nunca e a unica informacao, o nome esta
// sempre ao lado, e o `title` e so a dica do ponteiro.
export function MarcadorDeCor({
  cor,
  nome,
  meu = false,
  testId,
  className = "",
}: {
  cor: string | null | undefined;
  /** Dica do ponteiro (o nome de quem e a cor). */
  nome?: string;
  /** Os MEUS marcadores ganham o anel do acento: e assim que o meu dia se
   * distingue na grade sem ponto amarelo a parte. */
  meu?: boolean;
  testId?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      title={nome}
      data-testid={testId}
      data-cor={cor ?? ""}
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${classeDoMarcador(cor)} ${
        meu ? "ring-2 ring-[var(--bnt-accent-solid)] ring-offset-1" : ""
      } ${className}`}
    />
  );
}
