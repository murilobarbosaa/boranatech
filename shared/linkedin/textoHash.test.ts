import { describe, expect, it } from "vitest";

import {
  analiseAnteriorDoMesmoTexto,
  mesmoTextoHash,
  normalizarTextoParaHash,
  textoHashValido,
} from "./textoHash";
import { hashLinkedinTextNoCliente } from "../../client/src/lib/linkedinTextHash";
import { hashDoTexto } from "../../server/lib/linkedinTextoHash";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

describe("identidade forte do histórico", () => {
  it("só associa SHA-256 válido e idêntico", () => {
    expect(mesmoTextoHash(HASH_A, HASH_A)).toBe(true);
    expect(mesmoTextoHash(HASH_A, HASH_B)).toBe(false);
    expect(mesmoTextoHash(null, null)).toBe(false);
    expect(mesmoTextoHash("64", "64")).toBe(false);
  });

  it("não usa fallback por tamanho ou estrutura", () => {
    const analyses = [
      { id: "mesmo-tamanho", textoHash: HASH_B },
      { id: "legado", textoHash: null },
      { id: "correto", textoHash: HASH_A },
    ];
    expect(analiseAnteriorDoMesmoTexto(analyses, HASH_A)?.id).toBe("correto");
    expect(analiseAnteriorDoMesmoTexto(analyses, null)).toBeUndefined();
  });

  it("valida a forma e compartilha a normalização mínima", () => {
    expect(textoHashValido(HASH_A)).toBe(true);
    expect(textoHashValido("A".repeat(64))).toBe(false);
    expect(normalizarTextoParaHash("  linha 1\r\nlinha 2  ")).toBe(
      "linha 1\nlinha 2",
    );
  });

  it.each([
    "texto comum",
    "linha 1\r\nlinha 2",
    "linha 1\nlinha 2",
    "   espaços nas pontas   ",
    "espaços  internos   preservados",
    "ação, São Paulo e café",
    "漢字 e Unicode",
    "perfil com emoji 👩🏽‍💻🚀",
    "quebra final\n",
  ])("browser e servidor produzem o mesmo SHA-256 para %j", async (texto) => {
    expect(await hashLinkedinTextNoCliente(texto)).toBe(hashDoTexto(texto));
  });

  it("normaliza somente CRLF/CR e pontas, sem colapsar espaço interno", () => {
    expect(hashDoTexto("linha 1\r\nlinha 2")).toBe(
      hashDoTexto("linha 1\nlinha 2"),
    );
    expect(hashDoTexto("  texto  ")).toBe(hashDoTexto("texto"));
    expect(hashDoTexto("texto\n")).toBe(hashDoTexto("texto"));
    expect(hashDoTexto("a  b")).not.toBe(hashDoTexto("a b"));
  });
});
