// DEV ONLY - remover antes de producao.
// Rotas de visualizacao/teste que so existem fora de producao. Guarda dupla: o
// router se auto-desliga (404) quando NODE_ENV === "production" E ele so e
// montado no app fora de producao (server/app.ts). Sem auth: peca publica com
// dados de exemplo, nada sensivel.
import { Router } from "express";

import { renderCertificateSvg } from "../lib/certificateRender";
import { env } from "../lib/env";

const router = Router();

router.use((_req, res, next) => {
  if (env.isProd) {
    res.status(404).end();
    return;
  }
  next();
});

// Dados de EXEMPLO fixos. holderName em caixa mista de proposito, para provar
// que o render aplica o uppercase do design.
const SAMPLE = {
  holderName: "Maria da Silva Santos",
  roadmapTitle: "Desenvolvimento Web",
  hours: 40,
  issuedAt: new Date().toISOString(),
  code: "BNT-TEST-0001",
} as const;

router.get("/certificate-preview.svg", async (_req, res, next) => {
  try {
    const svg = await renderCertificateSvg(SAMPLE);
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(svg);
  } catch (err) {
    next(err);
  }
});

export default router;
