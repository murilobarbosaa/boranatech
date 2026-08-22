import type { NextFunction, Request, Response } from "express";

import {
  HEADLINE_MANUAL_MAX,
  LINKEDIN_OBJETIVO_MAX,
  LINKEDIN_PROFILE_TEXT_MAX,
  LINKEDIN_SKILLS_MAX,
} from "../../shared/linkedin/schema";

/**
 * TETO DE CORPO POR ROTA do analisador de LinkedIn.
 *
 * O teto global do Express e 2mb (`server/app.ts`), e ele existe para servir a
 * plataforma inteira, incluindo rotas que recebem base64 de imagem. Para o
 * analisador ele e largo demais por ordens de grandeza: o maior corpo LEGITIMO
 * da analise cabe em cerca de 93 KB, e o da rota de progresso em algumas dezenas
 * de BYTES. A diferenca e trabalho que o processo faz de graca para quem manda
 * lixo, antes de qualquer validacao.
 *
 * ESTES SAO TETOS TECNICOS, nao de produto. A conta esta em cada constante, e o
 * criterio e o mesmo dos outros lotes desta fase: o teto fica uma ordem de
 * grandeza acima do maior uso plausivel, entao nenhum usuario legitimo o alcanca.
 * Quem colar um perfil grande demais continua recebendo o 400 do zod, com a
 * mensagem que explica o problema, e NAO um 413 generico: e por isso que o teto
 * de corpo precisa ficar confortavelmente ACIMA do maior corpo que o zod aceita.
 */

/**
 * Soma dos maximos de todo campo de TEXTO LIVRE do request de analise.
 *
 * Derivada dos proprios `.max()` do zod, nunca de literal solto: se alguem subir
 * o teto do texto do perfil, o teto de corpo sobe junto, sem ninguem precisar
 * lembrar. Os enums e booleanos ficam de fora porque cabem na folga estrutural.
 */
export const LINKEDIN_CARACTERES_LIVRES_MAX =
  LINKEDIN_PROFILE_TEXT_MAX +
  LINKEDIN_SKILLS_MAX +
  LINKEDIN_OBJETIVO_MAX +
  HEADLINE_MANUAL_MAX;

/**
 * Pior caso de bytes por caractere depois da serializacao JSON.
 *
 * E um limite SUPERIOR de verdade, nao uma media: o pior caso do
 * `JSON.stringify` e o escape de caractere de controle (`\\u0000`), que custa
 * seis bytes por caractere de origem. Acentuado em UTF-8 custa dois e nao e
 * escapado. Usar o pior caso e o que garante que texto legitimo nunca esbarre.
 */
export const BYTES_POR_CARACTERE_PIOR_CASO = 6;

/**
 * Folga para o que nao e texto livre: chaves do JSON, os seis enums, aspas,
 * `entryPath` e o overhead de transporte. O corpo estrutural real fica em
 * algumas centenas de bytes; 2 KB e folga com sobra.
 */
export const FOLGA_ESTRUTURAL_BYTES = 2_048;

/**
 * TETO DE CORPO DA ROTA DE ANALISE, derivado.
 *
 * A conta, com os valores de hoje:
 *   texto livre: 12.000 + 3.000 + 300 + 250 = 15.550 caracteres
 *   pior caso:   15.550 x 6                 = 93.300 bytes
 *   estrutura:   + 2.048                    = 95.348 bytes (cerca de 93 KB)
 *
 * Contra os 2 MB do global, e cerca de 22 vezes menor. Contra o maior corpo
 * legitimo REAL (texto em portugues, dois bytes por acento, sem escape de
 * controle: perto de 32 KB), ainda sobra o triplo.
 */
// TODO(Ana): calibrar o teto tecnico de corpo da analise se o uso real mudar.
export const TETO_CORPO_ANALISE_BYTES =
  LINKEDIN_CARACTERES_LIVRES_MAX * BYTES_POR_CARACTERE_PIOR_CASO +
  FOLGA_ESTRUTURAL_BYTES;

/**
 * TETO DE CORPO DAS ROTAS MENORES (progresso, e qualquer outra do router).
 *
 * O unico corpo que elas recebem e o do PUT de progresso, que e
 * `{"done":true,"revision":12}`: vinte e oito bytes. As demais sao GET e nao tem
 * corpo nenhum. 4 KB e cerca de 146 vezes o maior corpo legitimo, e ainda assim
 * 500 vezes menor que o global.
 */
// TODO(Ana): calibrar o teto tecnico de corpo das rotas menores se o uso mudar.
export const TETO_CORPO_ROTA_MENOR_BYTES = 4_096;

/**
 * Codigo do erro de corpo grande demais, na convencao da casa.
 *
 * Sem isto, o `PayloadTooLargeError` do body-parser chega ao `errorHandler` com
 * `err.code` indefinido e sai como `internal_error` num 413. Medido: o erro tem
 * `type: "entity.too.large"`, `statusCode: 413` e `code: undefined`. Um 413
 * rotulado de erro interno e a mesma familia de defeito que o resto desta fase
 * persegue: o instrumento diz uma coisa e o fato e outra.
 */
export const CODIGO_CORPO_GRANDE = "payload_too_large";

interface ErroDeCorpo extends Error {
  type?: string;
  statusCode?: number;
  code?: string;
}

/**
 * Traduz o erro do body-parser para a convencao de erro nomeado da casa.
 *
 * ESCOPO ESTREITO de proposito: montado so no caminho do analisador. Traduzir
 * isto globalmente melhoraria a resposta de todas as rotas, e e provavelmente o
 * certo, mas seria mudanca de comportamento global fora do raio medido nesta
 * fase. Fica registrado no relatorio como candidato.
 */
export function traduzirErroDeCorpo(
  err: ErroDeCorpo,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (err?.type === "entity.too.large") {
    err.code = CODIGO_CORPO_GRANDE;
    // TODO(Ana): mensagem de corpo grande demais na analise (413).
    err.message =
      "O conteúdo enviado é grande demais. Reduza o texto do perfil e tente de novo.";
  }
  next(err);
}
