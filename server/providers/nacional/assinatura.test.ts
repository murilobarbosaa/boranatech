import { describe, expect, it } from "vitest";
import forge from "node-forge";

import { extrairMaterial } from "./certificado";
import { assinarXml, verificarAssinatura } from "./assinatura";

/**
 * A assinatura e o ponto mais provavel de rejeicao na homologacao (E0714,
 * "Arquivo enviado com erro na assinatura"), e a mensagem do provedor nao diz
 * o que esta errado. Entao o ciclo fecha AQUI: assina, verifica, e confere as
 * propriedades que o leiaute exige.
 *
 * MATERIAL DE TESTE GERADO NO PROPRIO TESTE. Nenhum certificado real entra no
 * repositorio, nem de homologacao: um .pfx commitado e uma chave privada
 * commitada, e o fato de ser "so de teste" nao muda o que acontece quando o
 * repositorio vaza.
 */

/** Gera um par de chaves + certificado autoassinado + PKCS#12, na hora. */
function gerarPfxDeTeste(senha: string): Buffer {
  // 1024 bits: suficiente para exercitar o caminho e MUITO mais rapido que
  // 2048 num teste que roda a cada suite. Nao ha requisito de forca aqui, so
  // de forma.
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date("2026-01-01T00:00:00Z");
  cert.validity.notAfter = new Date("2030-01-01T00:00:00Z");
  const attrs = [
    { name: "commonName", value: "BORA NA TECH TESTE:67688579000106" },
    { name: "countryName", value: "BR" },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    { name: "keyUsage", digitalSignature: true, nonRepudiation: true },
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], senha, {
    algorithm: "3des",
  });
  return Buffer.from(forge.asn1.toDer(p12Asn1).getBytes(), "binary");
}

const SENHA = "senha-de-teste";
const pfx = gerarPfxDeTeste(SENHA);
const material = extrairMaterial(pfx, SENHA);

/** DPS minima, no formato do XSD v1.01 (ns e posicao da Signature). */
const ID_DPS = "DPS530010816768857900010600001000000000000001";
const XML_DPS = `<?xml version="1.0" encoding="UTF-8"?><DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.01"><infDPS Id="${ID_DPS}"><tpAmb>2</tpAmb><dhEmi>2026-09-01T10:00:00-03:00</dhEmi><verAplic>bnt-1.0</verAplic><serie>1</serie><nDPS>1</nDPS><dCompet>20260901</dCompet><tpEmit>1</tpEmit><cLocEmi>5300108</cLocEmi></infDPS></DPS>`;

describe("extrairMaterial (PKCS#12)", () => {
  it("abre o .pfx e devolve chave e certificado em PEM", () => {
    expect(material.privateKeyPem).toContain("PRIVATE KEY");
    expect(material.certificatePem).toContain("BEGIN CERTIFICATE");
    expect(material.subject).toContain("67688579000106");
  });

  it("certificateBase64 nao tem cabecalho nem quebra de linha", () => {
    // O XMLDSig pede o DER em base64 dentro de X509Certificate, nao o PEM.
    expect(material.certificateBase64).not.toContain("BEGIN");
    expect(material.certificateBase64).not.toMatch(/\s/);
  });

  it("LANCA com senha errada, sem vazar o conteudo no erro", () => {
    let mensagem = "";
    try {
      extrairMaterial(pfx, "senha-errada");
    } catch (err) {
      mensagem = err instanceof Error ? err.message : String(err);
    }
    expect(mensagem).toContain("PKCS#12");
    // O erro nao pode carregar material do arquivo nem a senha tentada.
    expect(mensagem).not.toContain("senha-errada");
    expect(mensagem.length).toBeLessThan(300);
  });
});

describe("assinarXml", () => {
  const assinado = assinarXml(XML_DPS, {
    elemento: "infDPS",
    id: ID_DPS,
    material,
  });

  it("produz uma assinatura que VERIFICA", () => {
    // O ciclo completo: se isto passa, C14N, digest e chave estao coerentes
    // entre si. O que resta para a homologacao e se o PROVEDOR aceita os
    // mesmos algoritmos (ver TODO(homologacao) em assinatura.ts).
    expect(verificarAssinatura(assinado, material.certificatePem)).toBe(true);
  });

  it("coloca a Signature como IRMA de infDPS, nao dentro dele", () => {
    // O XSD posiciona ds:Signature depois de infDPS, dentro de DPS. Assinatura
    // dentro de infDPS falharia na validacao de schema antes de a assinatura
    // ser sequer conferida.
    const fimInfDps = assinado.indexOf("</infDPS>");
    const inicioSig = assinado.search(/<(\w+:)?Signature[\s>]/);
    expect(fimInfDps).toBeGreaterThan(0);
    expect(inicioSig).toBeGreaterThan(fimInfDps);
  });

  it("referencia o Id de infDPS com URI de fragmento", () => {
    expect(assinado).toContain(`URI="#${ID_DPS}"`);
  });

  it("inclui o certificado no KeyInfo", () => {
    // Sem X509Certificate o provedor nao tem como validar a cadeia nem casar o
    // CNPJ do assinante com o do emitente.
    expect(assinado).toMatch(/<(\w+:)?X509Certificate>/);
  });

  it("aplica enveloped-signature ANTES da canonicalizacao NOS TRANSFORMS", () => {
    // Ordem invertida canonicalizaria um documento que ainda contem a
    // Signature, e o digest nunca fecharia na verificacao.
    //
    // A assercao e ESCOPADA ao bloco <Transforms>. A primeira versao deste
    // teste procurava as duas URIs no documento inteiro e falhava: o
    // `REC-xml-c14n-20010315` aparece antes, no CanonicalizationMethod do
    // SignedInfo, que e outra coisa. O teste estava errado, nao o codigo.
    const transforms =
      /<(?:\w+:)?Transforms>([\s\S]*?)<\/(?:\w+:)?Transforms>/.exec(
        assinado,
      )?.[1];
    expect(transforms).toBeTruthy();
    const enveloped = transforms!.indexOf("enveloped-signature");
    const c14n = transforms!.indexOf("REC-xml-c14n-20010315");
    expect(enveloped).toBeGreaterThanOrEqual(0);
    expect(c14n).toBeGreaterThan(enveloped);
  });

  it("assinar duas vezes o MESMO xml produz o mesmo DigestValue", () => {
    // Estabilidade do digest sob reserializacao: se o digest variasse entre
    // execucoes sobre a mesma entrada, a causa seria canonicalizacao instavel,
    // e a rejeicao no provedor seria intermitente (o pior tipo de bug fiscal).
    const outro = assinarXml(XML_DPS, {
      elemento: "infDPS",
      id: ID_DPS,
      material,
    });
    const digest = (x: string) => /<(?:\w+:)?DigestValue>([^<]+)</.exec(x)?.[1];
    expect(digest(assinado)).toBe(digest(outro));
    expect(digest(assinado)).toBeTruthy();
  });

  it("adulterar o conteudo assinado invalida a assinatura", () => {
    // A prova de que a verificacao acima nao esta passando por acidente.
    const adulterado = assinado.replace(
      "<cLocEmi>5300108</cLocEmi>",
      "<cLocEmi>3550308</cLocEmi>",
    );
    expect(adulterado).not.toBe(assinado);
    expect(verificarAssinatura(adulterado, material.certificatePem)).toBe(
      false,
    );
  });
});
