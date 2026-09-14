import { describe, expect, it } from "vitest";

import {
  CLASSE_SESSAO_PERSISTIDA,
  chaveDaSessaoSupabase,
  liberarMarcaDeSessaoEstatica,
} from "./persistedSession";

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

// A marca que o sessao-init.js poe no <html> so vale ate o React montar: dali em
// diante quem decide o bloco de auth e o Header vivo.
describe("liberarMarcaDeSessaoEstatica", () => {
  it("tira a classe do <html> e preserva as outras", () => {
    const html = document.documentElement;
    html.classList.add("dark", CLASSE_SESSAO_PERSISTIDA);
    liberarMarcaDeSessaoEstatica();
    expect(html.classList.contains(CLASSE_SESSAO_PERSISTIDA)).toBe(false);
    expect(html.classList.contains("dark")).toBe(true);
    html.classList.remove("dark");
  });
});
