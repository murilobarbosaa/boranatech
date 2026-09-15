import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * useCreatorPerfil: a busca do perfil que a PAGINA faz (lote 08b).
 *
 * Ate o lote 08 quem buscava era o formulario. O que se afirma aqui e o que
 * saiu de la: uma requisicao so, o erro como estado proprio (e nao perfil
 * vazio), e o "tentar de novo" refazendo a MESMA busca.
 */

const estado = vi.hoisted(() => ({
  chamadas: [] as string[],
  responder: (async () => ({})) as () => Promise<unknown>,
}));

vi.mock("@/lib/adminApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/adminApi")>();
  return {
    ...real,
    contentFetch: async (path: string) => {
      estado.chamadas.push(path);
      return estado.responder();
    },
  };
});

import { AdminApiError } from "@/lib/adminApi";
import type { CreatorPerfilDados } from "@shared/creatorProfile";
import { useCreatorPerfil } from "./useCreatorPerfil";

const PERFIL: CreatorPerfilDados = {
  instagram_handle: "ana.cria",
  tiktok_handle: null,
  instagram_followers: 1200,
  tiktok_followers: null,
  followers_updated_at: "2026-09-14T12:00:00Z",
  visible_to_creators: false,
  pix: {
    tipo: "cpf",
    mascarada: "***.***.247-**",
    updated_at: "2026-09-14T12:00:00Z",
  },
};

/** Sonda: mostra o estado do hook e expoe os comandos como botoes. */
function Sonda() {
  const {
    estado: atual,
    recarregar,
    definirPerfil,
    definirPix,
  } = useCreatorPerfil();
  return (
    <div>
      <p data-testid="tipo">{atual.tipo}</p>
      <p data-testid="instagram">
        {atual.tipo === "ok" ? (atual.perfil.instagram_handle ?? "") : ""}
      </p>
      <p data-testid="pix">
        {atual.tipo === "ok"
          ? (atual.perfil.pix?.mascarada ?? "sem chave")
          : ""}
      </p>
      <button type="button" onClick={recarregar}>
        recarregar
      </button>
      <button
        type="button"
        onClick={() => definirPerfil({ ...PERFIL, instagram_handle: "outra" })}
      >
        definir perfil
      </button>
      <button type="button" onClick={() => definirPix(null)}>
        definir pix
      </button>
    </div>
  );
}

beforeEach(() => {
  estado.chamadas = [];
});

afterEach(() => {
  cleanup();
});

describe("useCreatorPerfil", () => {
  it("busca GET /creator/profile uma vez e entrega o perfil", async () => {
    estado.responder = async () => ({ data: PERFIL });
    render(<Sonda />);
    await vi.waitFor(() =>
      expect(screen.getByTestId("tipo").textContent).toBe("ok"),
    );
    expect(estado.chamadas).toEqual(["/creator/profile"]);
    expect(screen.getByTestId("instagram").textContent).toBe("ana.cria");
  });

  it("erro na busca vira estado de erro, e recarregar refaz a mesma busca", async () => {
    let vez = 0;
    estado.responder = async () => {
      vez += 1;
      if (vez === 1) throw new AdminApiError("falhou", 500, "db_error");
      return { data: PERFIL };
    };
    render(<Sonda />);
    await vi.waitFor(() =>
      expect(screen.getByTestId("tipo").textContent).toBe("erro"),
    );
    fireEvent.click(screen.getByRole("button", { name: "recarregar" }));
    await vi.waitFor(() =>
      expect(screen.getByTestId("tipo").textContent).toBe("ok"),
    );
    expect(estado.chamadas).toEqual(["/creator/profile", "/creator/profile"]);
  });

  it("resposta fora do formato vira erro, nunca perfil vazio", async () => {
    estado.responder = async () => ({ data: { ok: true } });
    render(<Sonda />);
    await vi.waitFor(() =>
      expect(screen.getByTestId("tipo").textContent).toBe("erro"),
    );
    expect(screen.getByTestId("instagram").textContent).toBe("");
  });

  it("definirPerfil e definirPix trocam o estado sem buscar de novo", async () => {
    estado.responder = async () => ({ data: PERFIL });
    render(<Sonda />);
    await vi.waitFor(() =>
      expect(screen.getByTestId("tipo").textContent).toBe("ok"),
    );
    fireEvent.click(screen.getByRole("button", { name: "definir perfil" }));
    expect(screen.getByTestId("instagram").textContent).toBe("outra");
    fireEvent.click(screen.getByRole("button", { name: "definir pix" }));
    expect(screen.getByTestId("pix").textContent).toBe("sem chave");
    expect(estado.chamadas).toHaveLength(1);
  });
});
