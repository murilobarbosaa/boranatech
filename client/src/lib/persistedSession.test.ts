import { describe, expect, it } from "vitest";

import { chaveDaSessaoSupabase } from "./persistedSession";

// A chave e o unico ponto em que o Header depende de um detalhe do supabase-js.
// Se ela estiver errada, `temSessaoPersistida` responde sempre "nao" e o Header
// volta a mostrar "Entrar" para quem esta logado, sem erro nenhum. Os valores
// esperados sao escritos a mao.
describe("chaveDaSessaoSupabase", () => {
  it("usa o primeiro rotulo do host do projeto", () => {
    expect(chaveDaSessaoSupabase("https://abcdefgh.supabase.co")).toBe(
      "sb-abcdefgh-auth-token",
    );
  });

  it("ignora caminho e barra final", () => {
    expect(chaveDaSessaoSupabase("https://abcdefgh.supabase.co/")).toBe(
      "sb-abcdefgh-auth-token",
    );
  });

  it("sem URL ou com URL invalida nao inventa chave", () => {
    expect(chaveDaSessaoSupabase(undefined)).toBeNull();
    expect(chaveDaSessaoSupabase("")).toBeNull();
    expect(chaveDaSessaoSupabase("nao e url")).toBeNull();
  });
});
