/**
 * A INSTRUCAO SOBRE REEMBOLSO DE PIX, escrita UMA vez.
 *
 * Ela aparece em tres lugares que o admin alcanca por caminhos diferentes:
 *
 *   1. o 409 `refund_provider_not_stripe` de POST /users/:id/refunds;
 *   2. o 409 `external_refund_provider_not_supported` de
 *      POST /users/:id/external-refunds;
 *   3. a dica de saldo Pix no extrato do usuario
 *      (client/src/components/admin/users/UserTransactions.tsx).
 *
 * ATE 2026-09-02 OS TRES DIZIAM COISAS DIFERENTES, e duas delas estavam
 * erradas: (1) e (3) mandavam registrar como devolucao externa, e a rota de
 * devolucao externa NAO aceita Pix, porque ela chaveia por `stripe_charge_id` (a
 * busca do alvo, a pre-checagem de idempotencia e a coluna de `admin_refunds`).
 * A orientacao levava a um beco, e o admin descobriria isso tentando.
 *
 * A CONSTANTE E A CONTRAMEDIDA, nao a frase em si: tres copias do mesmo texto
 * divergem na primeira correcao aplicada so numa delas, e foi exatamente assim
 * que as tres passaram a discordar. Mora em `shared/` porque duas delas sao do
 * servidor e uma e do cliente.
 */
export const PIX_REFUND_COPY =
  "Reembolso de Pix é feito no painel do Asaas. O estorno chega pelo webhook e aparece aqui como devolução.";
