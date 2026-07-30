import { describe, expect, it } from "vitest";

import {
  chaveDeIp,
  FATOR_TETO_IP,
  identidadeDeCota,
  subDoBearer,
} from "./rateLimitKey";

/**
 * O bug medido: 28 dos 29 `profile_fetch_exhausted` do Sentry eram HTTP 429 em
 * `GET /api/me`, espalhados por 6 cidades. Causa: o limiter contava por
 * `req.ip`, e em NAT de operadora dezenas de pessoas dividem o mesmo IP e
 * portanto o mesmo balde de 180/min.
 */

/** Monta um JWT de teste (assinatura irrelevante: nada aqui a verifica). */
function jwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.assinatura-falsa`;
}

const UID_A = "9f2b1c44-0e51-4a77-9d3a-1b8f5e6c2a10";
const UID_B = "1a00f6ac-77d2-4b31-8c55-9e0011223344";

describe("subDoBearer", () => {
  it("extrai o sub de um Bearer bem formado", () => {
    expect(subDoBearer(`Bearer ${jwt({ sub: UID_A })}`)).toBe(UID_A);
  });

  it("aceita 'bearer' minusculo e espaco extra", () => {
    expect(subDoBearer(`bearer   ${jwt({ sub: UID_A })}`)).toBe(UID_A);
    expect(subDoBearer(`  Bearer ${jwt({ sub: UID_A })}  `)).toBe(UID_A);
  });

  it("devolve null para tudo que nao e JWT com sub utilizavel", () => {
    expect(subDoBearer(undefined)).toBeNull();
    expect(subDoBearer(null)).toBeNull();
    expect(subDoBearer("")).toBeNull();
    expect(subDoBearer("Basic dXNlcjpzZW5oYQ==")).toBeNull();
    expect(subDoBearer("Bearer nao-e-jwt")).toBeNull();
    expect(subDoBearer("Bearer a.b")).toBeNull(); // 2 segmentos
    expect(subDoBearer(`Bearer ${jwt({ sub: "" })}`)).toBeNull();
    expect(subDoBearer(`Bearer ${jwt({ sub: 123 })}`)).toBeNull();
    expect(subDoBearer(`Bearer ${jwt({ semSub: true })}`)).toBeNull();
  });

  it("payload corrompido NAO lanca: header torto e caso esperado", () => {
    expect(() => subDoBearer("Bearer aaa.!!!nao-base64!!!.ccc")).not.toThrow();
    expect(subDoBearer("Bearer aaa.!!!nao-base64!!!.ccc")).toBeNull();
    const naoObjeto = Buffer.from('"sou uma string"').toString("base64url");
    expect(subDoBearer(`Bearer x.${naoObjeto}.y`)).toBeNull();
  });
});

describe("identidadeDeCota", () => {
  it("A CORRECAO: duas pessoas no MESMO IP contam em baldes diferentes", () => {
    const ip = "189.40.12.7"; // NAT de operadora
    const a = identidadeDeCota(`Bearer ${jwt({ sub: UID_A })}`, ip);
    const b = identidadeDeCota(`Bearer ${jwt({ sub: UID_B })}`, ip);
    expect(a.chave).not.toBe(b.chave);
    expect(a.porUsuario).toBe(true);
    expect(b.porUsuario).toBe(true);
  });

  it("a MESMA pessoa em IPs diferentes conta no MESMO balde", () => {
    // Trocar de wifi para 4G no meio da navegacao nao devolve cota nova.
    const casa = identidadeDeCota(`Bearer ${jwt({ sub: UID_A })}`, "10.0.0.2");
    const rua = identidadeDeCota(`Bearer ${jwt({ sub: UID_A })}`, "189.40.12.7");
    expect(casa.chave).toBe(rua.chave);
  });

  it("sem token, continua contando por IP (comportamento anterior)", () => {
    const s = identidadeDeCota(undefined, "189.40.12.7");
    expect(s).toEqual({ chave: "ip:189.40.12.7", porUsuario: false });
  });

  it("token invalido degrada para IP, nao para balde proprio", () => {
    // Importante: token torto NAO pode virar identidade, senao qualquer lixo no
    // header ganharia cota propria sem passar pelo requireAuth.
    expect(identidadeDeCota("Bearer nao-e-jwt", "1.2.3.4")).toEqual({
      chave: "ip:1.2.3.4",
      porUsuario: false,
    });
  });

  it("IP ausente nao gera chave vazia", () => {
    expect(identidadeDeCota(undefined, undefined).chave).toBe("ip:unknown");
    expect(identidadeDeCota(undefined, "").chave).toBe("ip:unknown");
  });

  it("prefixos impedem colisao entre sub e IP no mesmo espaco de chaves", () => {
    // Um `sub` que por acaso fosse igual a um IP dividiria balde com ele.
    const comoSub = identidadeDeCota(`Bearer ${jwt({ sub: "1.2.3.4" })}`, "9.9.9.9");
    const comoIp = identidadeDeCota(undefined, "1.2.3.4");
    expect(comoSub.chave).toBe("u:1.2.3.4");
    expect(comoIp.chave).toBe("ip:1.2.3.4");
    expect(comoSub.chave).not.toBe(comoIp.chave);
  });
});

describe("teto por IP (a guarda contra sub forjado)", () => {
  it("chaveDeIp casa com a chave que a requisicao sem token usaria", () => {
    // As duas contagens precisam cair no MESMO balde, senao o teto por IP
    // mediria uma coisa e o limite sem token mediria outra.
    expect(chaveDeIp("189.40.12.7")).toBe(
      identidadeDeCota(undefined, "189.40.12.7").chave,
    );
    expect(chaveDeIp(undefined)).toBe("ip:unknown");
  });

  it("o fator e maior que 1: o teto por IP precisa ser mais frouxo que o do usuario", () => {
    // Fator 1 faria o teto por IP anular a correcao (voltaria a derrubar o NAT);
    // fator ausente deixaria `sub` forjado sem teto nenhum.
    expect(FATOR_TETO_IP).toBeGreaterThan(1);
    expect(FATOR_TETO_IP).toBe(6);
  });
});
