// Formato do codigo de afiliado, a unica fonte: a rota publica de clique e de
// desconto (server/routes/affiliates.ts) e o formulario de criar codigo do
// admin (client/src/components/admin/users/CreatorCodesBlock.tsx) validam com
// o MESMO padrao. Duas copias da regra divergiriam na primeira mudanca, e o
// sintoma seria um codigo que o admin cria e o link nunca encontra.

export const AFFILIATE_CODE_PATTERN = /^[A-Z0-9]{3,32}$/;

/** A mesma normalizacao da rota publica: sem espacos nas pontas, maiusculas. */
export function normalizarCodigoDeAfiliado(valor: string): string {
  return valor.trim().toUpperCase();
}
