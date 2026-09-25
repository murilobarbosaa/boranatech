import { describe, expect, it } from "vitest";
import { canonicalDoHtml, conferirCanonical } from "./canonicalDoSnapshot.mjs";

// Fixtures LITERAIS, escritas a mao. Nenhuma e montada a partir da funcao que
// esta sendo testada nem do componente SEO.
const HTML_CERTO =
  "<html><head><title>Front-end · Bora na Tech?</title>" +
  '<link rel="canonical" href="https://boranatech.com.br/areas/frontend">' +
  "</head><body>oi</body></html>";

const HTML_CONTAMINADO =
  "<html><head><title>Cadastro · Bora na Tech?</title>" +
  '<link rel="canonical" href="https://boranatech.com.br/cadastro">' +
  "</head><body>oi</body></html>";

const HTML_SEM_CANONICAL =
  "<html><head><title>Bora na Tech?</title></head><body>oi</body></html>";

describe("canonicalDoHtml", () => {
  it("extrai o href do canonical", () => {
    expect(canonicalDoHtml(HTML_CERTO)).toBe(
      "https://boranatech.com.br/areas/frontend",
    );
  });

  it("devolve null quando nao ha canonical", () => {
    expect(canonicalDoHtml(HTML_SEM_CANONICAL)).toBeNull();
  });
});

describe("conferirCanonical", () => {
  it("canonical da propria rota PASSA", () => {
    expect(conferirCanonical("/areas/frontend", HTML_CERTO)).toBeNull();
  });

  it("canonical de OUTRA rota REPROVA", () => {
    expect(conferirCanonical("/areas/frontend", HTML_CONTAMINADO)).toBe(
      "canonical de outra rota: https://boranatech.com.br/cadastro",
    );
  });

  it("canonical AUSENTE reprova", () => {
    expect(conferirCanonical("/areas/frontend", HTML_SEM_CANONICAL)).toBe(
      "sem canonical no snapshot",
    );
  });

  it("barra final nao conta como divergencia", () => {
    const html =
      '<link rel="canonical" href="https://boranatech.com.br/areas/frontend/">';
    expect(conferirCanonical("/areas/frontend", html)).toBeNull();
  });

  it("a raiz confere consigo mesma", () => {
    const html = '<link rel="canonical" href="https://boranatech.com.br/">';
    expect(conferirCanonical("/", html)).toBeNull();
  });
});

describe("redirects declarados", () => {
  it("rota que redireciona passa quando o canonical e o do DESTINO", () => {
    const html =
      '<link rel="canonical" href="https://boranatech.com.br/portfolio/analisar">';
    expect(conferirCanonical("/portfolio", html)).toBeNull();
  });

  it("rota que redireciona REPROVA se o canonical for de um terceiro lugar", () => {
    const html =
      '<link rel="canonical" href="https://boranatech.com.br/cadastro">';
    expect(conferirCanonical("/portfolio", html)).toBe(
      "redirect declarado para /portfolio/analisar, mas o canonical e https://boranatech.com.br/cadastro",
    );
  });

  it("rota SEM redirect declarado segue exigindo o proprio canonical", () => {
    const html =
      '<link rel="canonical" href="https://boranatech.com.br/vagas">';
    expect(conferirCanonical("/eventos", html)).toBe(
      "canonical de outra rota: https://boranatech.com.br/vagas",
    );
  });
});
