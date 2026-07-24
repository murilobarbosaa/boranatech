import { describe, expect, it } from "vitest";

import { paginateRange, type PaginatedPage } from "./paginate";

type Row = { n: number };

// Simula uma origem paginada: `total` linhas, mas o servidor NUNCA devolve mais
// que `serverCap` por pagina (imita db-max-rows abaixo do pageSize pedido).
function makeSource(total: number, serverCap: number) {
  const calls: Array<{ from: number; to: number }> = [];
  const fetchPage = (from: number, to: number): PaginatedPage<Row> => {
    calls.push({ from, to });
    const requested = to - from + 1;
    const pageSize = Math.min(requested, serverCap);
    const rows: Row[] = [];
    for (let i = from; i < from + pageSize && i < total; i += 1) {
      rows.push({ n: i });
    }
    return { data: rows, error: null };
  };
  return { fetchPage, calls };
}

async function collect(gen: AsyncGenerator<Row>): Promise<number[]> {
  const out: number[] = [];
  for await (const row of gen) out.push(row.n);
  return out;
}

describe("paginateRange", () => {
  it("varre todas as linhas quando o servidor honra o pageSize", async () => {
    const { fetchPage } = makeSource(2011, 1000);
    const rows = await collect(
      paginateRange(fetchPage, { errorLabel: "x", pageSize: 1000 }),
    );
    expect(rows).toHaveLength(2011);
    expect(rows[0]).toBe(0);
    expect(rows[2010]).toBe(2010);
  });

  it("NAO trunca quando o servidor capa abaixo do pageSize (o bug do padrao antigo)", async () => {
    // pede 1000 por pagina, mas o servidor so devolve 300: o padrao antigo
    // (break em rows.length < PAGE) pararia na 1a pagina com 300 linhas.
    const { fetchPage } = makeSource(2011, 300);
    const rows = await collect(
      paginateRange(fetchPage, { errorLabel: "x", pageSize: 1000 }),
    );
    expect(rows).toHaveLength(2011);
    // sem pular linhas: sequencia contigua 0..2010.
    expect(rows).toEqual(Array.from({ length: 2011 }, (_, i) => i));
  });

  it("avanca pelo tamanho real da pagina, sem pular linhas", async () => {
    const { fetchPage, calls } = makeSource(750, 300);
    await collect(paginateRange(fetchPage, { errorLabel: "x", pageSize: 1000 }));
    // paginas: [0,999]->300, [300,1299]->300, [600,1599]->150, [750,1749]->0.
    expect(calls.map((c) => c.from)).toEqual([0, 300, 600, 750]);
  });

  it("para na pagina vazia (uma consulta extra ao final)", async () => {
    const { fetchPage, calls } = makeSource(1000, 1000);
    await collect(paginateRange(fetchPage, { errorLabel: "x", pageSize: 1000 }));
    // [0,999]->1000, [1000,1999]->0 (para aqui).
    expect(calls).toHaveLength(2);
  });

  it("origem vazia nao itera nada", async () => {
    const { fetchPage, calls } = makeSource(0, 1000);
    const rows = await collect(
      paginateRange(fetchPage, { errorLabel: "x", pageSize: 1000 }),
    );
    expect(rows).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it("propaga o erro com o errorLabel como prefixo", async () => {
    const fetchPage = (): PaginatedPage<Row> => ({
      data: null,
      error: { message: "boom" },
    });
    await expect(
      collect(
        paginateRange(fetchPage, { errorLabel: "Falha ao buscar", pageSize: 10 }),
      ),
    ).rejects.toThrow("Falha ao buscar: boom");
  });

  it("o break do consumidor encerra a varredura", async () => {
    const { fetchPage, calls } = makeSource(5000, 1000);
    const out: number[] = [];
    for await (const row of paginateRange(fetchPage, {
      errorLabel: "x",
      pageSize: 1000,
    })) {
      out.push(row.n);
      if (out.length >= 3) break;
    }
    expect(out).toEqual([0, 1, 2]);
    // so a 1a pagina foi buscada antes do break.
    expect(calls).toHaveLength(1);
  });
});
