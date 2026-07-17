// Canal de suporte Pro no WhatsApp. O numero vive em VITE_WHATSAPP_NUMBER
// (publico no bundle Vite), formato E.164 sem "+" nem simbolos, ex: 556185852345.
// Retorna null quando a env var esta vazia, para o CTA nao renderizar um wa.me
// quebrado. A mensagem pre-preenchida e opcional; o default serve para pontos
// persistentes (perfil), enquanto a tela de sucesso passa a sua propria copy.
const DEFAULT_SUPPORT_MESSAGE =
  "Olá! Sou assinante Pro e gostaria de suporte.";

export function whatsappSupportUrl(
  message: string = DEFAULT_SUPPORT_MESSAGE,
): string | null {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
