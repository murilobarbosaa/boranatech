import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// O overlay do onboarding precisa ficar ACIMA de todo chrome fixo da pagina.
// Ele nasceu em z-95 e o header publico e z-1000: o header ficava nitido por
// cima do backdrop e escondia a barra de progresso e o steppill.
//
// jsdom nao calcula layout nem empilhamento, entao nao da para testar o efeito
// aqui; o efeito foi verificado em navegador de verdade. O que ESTE teste
// protege e a premissa: se alguem subir o z do header (ou de um FAB novo)
// acima do overlay, o mesmo bug volta em silencio. Compara os numeros
// DECLARADOS nas fontes, que e o que da para afirmar sem layout.

const CLIENT = path.resolve(import.meta.dirname, "..", "..");

function lerZIndicesTailwind(arquivoRelativo: string): number[] {
  const src = readFileSync(path.join(CLIENT, arquivoRelativo), "utf8");

  // Contagem AMPLA contra leitura ESTRUTURADA: `z-` seguido de digito ou de
  // colchete. Se a forma arbitraria e a forma de escala divergirem do total, o
  // parser encolheu e o teste aborta em vez de medir superficie menor.
  const amplas = src.match(/\bz-(?:\[|\d)/g) ?? [];
  const arbitrarios = Array.from(src.matchAll(/\bz-\[(\d+)\]/g), (m) =>
    Number(m[1]),
  );
  const escala = Array.from(src.matchAll(/\bz-(\d+)\b/g), (m) => Number(m[1]));

  expect(
    arbitrarios.length + escala.length,
    `${arquivoRelativo}: o parser de z-index leu menos do que existe`,
  ).toBe(amplas.length);

  return arbitrarios.concat(escala);
}

function lerZIndexDoOverlay(): number {
  const css = readFileSync(
    path.join(CLIENT, "components", "onboarding", "onboarding.css"),
    "utf8",
  );
  const regra = css.slice(css.indexOf(".bnt-onb {"));
  const m = regra.match(/z-index:\s*(\d+);/);
  if (!m) throw new Error("z-index do .bnt-onb nao encontrado");
  return Number(m[1]);
}

describe("empilhamento do overlay de onboarding", () => {
  const overlay = lerZIndexDoOverlay();

  it("fica acima de TODO z-index declarado no Header", () => {
    const doHeader = lerZIndicesTailwind("components/Header.tsx");
    // Header fixo (1000), dropdown (1001), backdrop do drawer (1001) e o
    // proprio drawer (1002). O overlay precisa vencer os quatro.
    expect(doHeader.length).toBeGreaterThan(0);
    expect(Math.max(...doHeader)).toBe(1002);
    expect(overlay).toBeGreaterThan(Math.max(...doHeader));
  });

  it("fica acima do FAB do Natechinho", () => {
    const doWidget = lerZIndicesTailwind("components/agent/AgentWidget.tsx");
    expect(doWidget.length).toBeGreaterThan(0);
    expect(overlay).toBeGreaterThan(Math.max(...doWidget));
  });

  it("passa por cima do ConsentGate, e isso e deliberado", () => {
    const consent = lerZIndicesTailwind("components/consent/ConsentGate.tsx");
    // Nao ha como cobrir um header z-1000 e ficar abaixo de um modal z-100.
    // A ordem contra o consentimento e ESTRUTURAL: o OnboardingHost e filho do
    // ConsentGate e so renderiza quando ele libera os children, entao os dois
    // nunca coexistem. Este teste registra a escolha em vez de deixa-la
    // parecer descuido.
    expect(Math.max(...consent)).toBe(100);
    expect(overlay).toBeGreaterThan(100);
  });
});
