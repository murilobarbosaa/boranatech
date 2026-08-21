// Mensagens do aviso de retorno de OAuth não-conclusivo.
//
// Resolver com fallback neutro, NUNCA acesso direto ao mapa. É a convenção da base
// para qualquer lookup indexado por valor que vem de fora (`notificationTypeMetaOf`
// é a referência), e aqui o valor vem do provider, ou seja, de um conjunto que
// muda sem passar por deploy nosso: um `error_code` novo do Supabase com acesso
// direto derrubaria a tela inteira com "cannot read properties of undefined", e
// derrubaria justamente a tela cuja razão de existir é explicar uma falha.

export interface CallbackMessage {
  titulo: string;
  texto: string;
}

const GENERICO: CallbackMessage = {
  // TODO(Ana): copy do aviso genérico de falha no retorno do login social.
  titulo: "Não foi possível concluir seu login",
  texto:
    "O login com o Google não foi concluído. Isso costuma ser temporário: tente novamente.",
};

const POR_CODIGO: Record<string, CallbackMessage> = {
  access_denied: {
    // TODO(Ana): copy de "usuário cancelou no Google".
    titulo: "Login cancelado",
    texto:
      "Você fechou a tela do Google antes de concluir. Pode tentar de novo quando quiser.",
  },
  otp_expired: {
    // TODO(Ana): copy de link expirado.
    titulo: "Este link expirou",
    texto: "Links de acesso têm validade curta. Faça o login novamente.",
  },
  bad_oauth_state: {
    // TODO(Ana): copy de estado inválido (fluxo iniciado em outro navegador/app).
    titulo: "Não conseguimos validar seu login",
    texto:
      "O login parece ter começado em outro navegador ou aplicativo. Tente novamente nesta mesma janela.",
  },
};

export function callbackMessageForCode(
  code: string | null | undefined,
): CallbackMessage {
  if (!code) return GENERICO;
  return POR_CODIGO[code] ?? GENERICO;
}

// Estado "não deu para confirmar": diferente de falha do provider. Aqui não houve
// recusa, apenas não obtivemos confirmação dentro do limite, e a sessão pode até
// existir. A copy não pode afirmar que deu errado.
export const NAO_CONFIRMADO: CallbackMessage = {
  // TODO(Ana): copy do estado de sessão não confirmada.
  titulo: "Não foi possível confirmar sua sessão",
  texto:
    "Sua conexão demorou mais que o esperado e não conseguimos confirmar seu login. Nada foi perdido: tente novamente.",
};
