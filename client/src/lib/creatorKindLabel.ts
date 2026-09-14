// Rotulo do tipo de creator (kind da concessao), com inicial maiuscula, para
// selo e cartao. Fonte unica do painel do creator, do quadro do admin e do
// modal de usuario.

// TODO(Ana)
const ROTULO_DO_KIND: Record<string, string> = {
  influencer: "Influencer",
  afiliado: "Afiliado",
};

/**
 * Kind vem do servidor: resolver com fallback neutro (CLAUDE.md). A busca e por
 * chave PROPRIA do mapa, para um kind como "toString" nao devolver uma funcao
 * do prototipo no lugar do rotulo.
 */
export function rotuloDoKind(kind: string | null | undefined): string {
  if (kind && Object.prototype.hasOwnProperty.call(ROTULO_DO_KIND, kind)) {
    return ROTULO_DO_KIND[kind];
  }
  // TODO(Ana)
  return "Creator";
}
