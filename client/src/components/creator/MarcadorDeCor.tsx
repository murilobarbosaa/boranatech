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
  compacto = false,
  testId,
  className = "",
}: {
  cor: string | null | undefined;
  /** Dica do ponteiro (o nome de quem e a cor). */
  nome?: string;
  /** Os MEUS marcadores ganham o anel do acento: e assim que o meu dia se
   * distingue na grade sem ponto amarelo a parte. */
  meu?: boolean;
  /** Menor no celular (lote 11m): a grade de 7 colunas a 360 px nao
   * cabe o circulo de 12 px com borda de 2. `sm:` volta ao tamanho de sempre.
   * A borda vem do mapa de cores (`border-2`), compartilhado com as outras
   * telas, entao aqui ela so e afinada abaixo de `sm`. */
  compacto?: boolean;
  testId?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      title={nome}
      data-testid={testId}
      data-cor={cor ?? ""}
      className={`inline-block shrink-0 rounded-full ${
        compacto ? "h-2 w-2 max-sm:border sm:h-3 sm:w-3" : "h-3 w-3"
      } ${classeDoMarcador(cor)} ${
        meu ? "ring-2 ring-[var(--bnt-accent-solid)] ring-offset-1" : ""
      } ${className}`}
    />
  );
}
