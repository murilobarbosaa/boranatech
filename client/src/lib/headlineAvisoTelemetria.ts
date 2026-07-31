import { parseLinkedinText } from "@shared/linkedin/parse";

import { assinaturaDeCorte, type AssinaturaDeCorte } from "./headlineCortada";

/**
 * Telemetria do aviso de headline cortada.
 *
 * Duas perguntas, e a segunda vale mais que a primeira:
 *   1. quantas pessoas VEEM o aviso (calibra a deteccao contra o trafego real);
 *   2. quantas CORRIGEM depois de ver (unica prova de que o aviso e lido).
 *
 * ONDE OS EVENTOS SAO DISPARADOS, e por que nao no lugar obvio: `parsed` na
 * pagina e um `useMemo` sobre `form.profileText`, entao recomputa A CADA TECLA
 * digitada no textarea. Capturar de la emitiria um evento por caractere e a taxa
 * medida seria lixo com cara de numero. Os eventos moram onde o TEXTO CHEGA:
 * `handleFile` (PDF) e o `onPaste` do textarea, que sao dois pontos discretos e
 * mutuamente exclusivos por caminho.
 *
 * As funcoes aqui sao PURAS de proposito: o `posthog.capture` fica na pagina, e
 * o que decide o conteudo do evento e testavel sem renderizar nada. A metrica
 * que vai decidir o futuro do aviso nao pode depender de um teste de
 * integracao que ninguem escreveu.
 *
 * VIES CONHECIDO de `corrigiu_apos_aviso`, e ele fica registrado aqui e nao so
 * na conversa: quem ve o aviso, apaga tudo e cola OUTRO perfil (sem corte) e
 * contado como correcao, igual a quem colou o mesmo perfil inteiro. Os dois sao
 * indistinguiveis do lado do cliente sem comparar o texto, e comparar texto de
 * perfil no cliente para telemetria e mais dado do que a pergunta merece. A
 * metrica e um teto, nao uma medida exata.
 */

export const EVENTO_REVISAO = "linkedin_headline_review";
export const EVENTO_ENVIO = "linkedin_analysis_submitted";

export type OrigemDoTexto = "pdf" | "paste";

export interface PayloadRevisao {
  cortada: boolean;
  assinatura: AssinaturaDeCorte | null;
  origem: OrigemDoTexto;
}

/**
 * Payload do evento de chegada de texto.
 *
 * Recebe o TEXTO CRU e parseia aqui, em vez de receber a headline pronta, para
 * o ponto de captura nao depender do `parsed` da pagina (que e o memo por
 * tecla). No caminho do paste o texto vem do `clipboardData`, antes de existir
 * no estado.
 */
export function payloadRevisao(
  textoDoPerfil: string,
  origem: OrigemDoTexto,
): PayloadRevisao {
  const texto = textoDoPerfil.trim();
  const headline = texto.length > 0 ? parseLinkedinText(texto).headline : null;
  const assinatura = assinaturaDeCorte(headline);
  return { cortada: assinatura !== null, assinatura, origem };
}

export interface PayloadEnvio {
  aviso_visto: boolean;
  corrigiu_apos_aviso: boolean;
}

/**
 * Payload do envio da analise.
 *
 * `corrigiu_apos_aviso` so pode ser verdadeiro quando o aviso apareceu ALGUMA
 * vez nesta sessao de formulario E a headline no instante do envio nao tem mais
 * assinatura. Quem nunca viu o aviso nao "corrigiu", e quem viu e enviou assim
 * mesmo tambem nao.
 */
export function payloadEnvio(
  avisoVisto: boolean,
  headlineNoEnvio: string | null | undefined,
): PayloadEnvio {
  return {
    aviso_visto: avisoVisto,
    corrigiu_apos_aviso:
      avisoVisto && assinaturaDeCorte(headlineNoEnvio) === null,
  };
}
