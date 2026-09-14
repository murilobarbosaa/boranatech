// Centavos em reais, no formato do Intl ("R$ 62,79", com o espaco nao
// separavel que o pt-BR poe entre o simbolo e o numero).
//
// Mora em lib, e nao no painel de pagamentos orfaos onde nasceu: o painel de
// creator tambem formata centavos, e importar de dentro de um componente do
// admin arrastava esse componente para o chunk da pagina do creator.
//
// `null` e "sem valor registrado", nunca R$ 0,00: zero seria lido como valor
// medido.
export function formatarCentavos(cents: number | null): string {
  if (cents === null) return "valor não registrado";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
