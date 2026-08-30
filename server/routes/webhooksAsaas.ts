import { timingSafeEqual } from "crypto";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { env } from "../lib/env";
import { processAsaasEvent, type AsaasEvent } from "../providers/asaas";

const router = Router();

/**
 * Comparacao de tempo constante entre o token recebido e o configurado.
 *
 * `timingSafeEqual` LANCA quando os buffers tem tamanhos diferentes, e o
 * tamanho e justamente o que um atacante controla, entao comparar o tamanho
 * antes reintroduziria o vazamento por outro caminho. A saida e comparar sempre
 * buffers do MESMO tamanho: um token de tamanho errado falha na igualdade, nao
 * no comprimento.
 */
export function tokenConfere(recebido: string, esperado: string): boolean {
  const a = Buffer.from(recebido, "utf8");
  const b = Buffer.from(esperado, "utf8");
  if (b.length === 0) return false;
  // Normaliza para o tamanho do esperado. Um recebido mais curto ou mais longo
  // produz bytes diferentes e cai na comparacao, sem atalho de tamanho.
  const alvo = Buffer.alloc(b.length);
  const dado = Buffer.alloc(b.length);
  b.copy(alvo);
  a.copy(dado, 0, 0, Math.min(a.length, b.length));
  return timingSafeEqual(dado, alvo) && a.length === b.length;
}

/**
 * Webhook do Asaas. Rota FIXA, sem seletor de provedor.
 *
 * CORPO: `express.json` global basta. Ao contrario da Stripe, a autenticacao
 * aqui NAO e assinatura sobre os bytes crus, e sim um token estatico no header,
 * entao nao ha nada a preservar antes do parse.
 *
 * CONTRATO DE STATUS, e ele e desenhado para a FILA do Asaas, que pausa a conta
 * inteira depois de uma sequencia de falhas:
 *   401  token ausente ou errado, sem corpo. Nao e a fila legitima.
 *   503  Asaas desligado por configuracao incompleta. Fail-closed: melhor a fila
 *        reter o evento do que processar com meia configuracao.
 *   200  evento processado, duplicado, ou de tipo que nao tratamos. Tipo
 *        desconhecido NUNCA devolve 4xx: pausaria a fila por um evento que nao
 *        nos interessa.
 *   500  falha de processamento, para a reentrega acontecer.
 */
export async function handleAsaasWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const bruto = req.headers["asaas-access-token"];
  const recebido = Array.isArray(bruto) ? bruto[0] : bruto;

  if (!env.asaasEnabled) {
    // Antes da checagem de token de proposito: sem configuracao nao ha token
    // esperado com que comparar, e responder 401 aqui diria "credencial errada"
    // sobre um ambiente que simplesmente nao tem Asaas.
    console.error(
      "[webhook/asaas] recebido com Asaas desligado (configuracao incompleta); rejeitando.",
    );
    return res.status(503).json({
      error: { code: "asaas_disabled", message: "Integração indisponível." },
    });
  }

  if (!recebido || !tokenConfere(recebido, env.asaasWebhookToken)) {
    // Sem corpo: nada a dizer a quem nao provou ser a fila do Asaas.
    return res.status(401).end();
  }

  try {
    const resultado = await processAsaasEvent(req.body as AsaasEvent);
    return res.json(resultado);
  } catch (err) {
    return next(err);
  }
}

router.post("/asaas", handleAsaasWebhook);

export default router;
