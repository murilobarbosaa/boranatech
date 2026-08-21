import express, { type Router } from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { errorHandler } from "../middleware/error";

/**
 * Cliente HTTP para os testes de integração das rotas de admin.
 *
 * `supertest` NÃO existe no projeto e não foi adicionado: um servidor efêmero
 * na porta 0 com o `fetch` global do Node faz o mesmo em poucas linhas, e
 * exercita o que interessa (roteamento real, express.json real, errorHandler
 * real de produção).
 *
 * O router entra por PARÂMETRO, e este arquivo não importa `./admin` nem
 * declara `vi.mock`. Foi assim que teve de ficar: quando ele importava o router
 * e declarava os próprios mocks, esses mocks vazavam para os arquivos de teste
 * que o importam e derrubavam as suítes deles. Helper de teste não pode ter
 * opinião sobre o registro de módulos de quem o usa.
 *
 * Não é `.test.ts` de propósito: seria coletado pelo vitest e cobraria um teste
 * dentro dele. Nenhum código de produção o importa, então não entra no bundle.
 */

export type RespostaHttp = { status: number; body: any };

export function criarClienteAdmin(router: Router) {
  let servidor: ReturnType<typeof createServer> | null = null;
  let base = "";

  async function garantir(): Promise<string> {
    if (base) return base;
    const app = express();
    app.use(express.json());
    // Mesmo caminho de produção: o req.path que chega ao errorHandler bate com
    // o real.
    app.use("/api/admin", router);
    app.use(errorHandler);

    servidor = createServer(app);
    await new Promise<void>((resolve) =>
      servidor!.listen(0, "127.0.0.1", resolve),
    );
    base = `http://127.0.0.1:${(servidor!.address() as AddressInfo).port}/api/admin`;
    return base;
  }

  return async function chamar(
    metodo: "GET" | "POST" | "PATCH" | "DELETE",
    caminho: string,
    corpo?: unknown,
  ): Promise<RespostaHttp> {
    const resposta = await fetch((await garantir()) + caminho, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    const texto = await resposta.text();
    // Nem toda resposta é JSON: o 404 padrão do Express devolve HTML. Tolerar
    // isso evita que um teste morra com "Unexpected token '<'" em vez de
    // mostrar o status que realmente veio.
    let body: unknown = null;
    if (texto) {
      try {
        body = JSON.parse(texto);
      } catch {
        body = { raw: texto };
      }
    }
    return { status: resposta.status, body };
  };
}
