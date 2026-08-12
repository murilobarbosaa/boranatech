// Extracao da chave privada e do certificado de um e-CNPJ A1 (.pfx / PKCS#12).
//
// POR QUE PRECISA DE BIBLIOTECA. O Node fala mTLS com PKCS#12 nativamente
// (`https.Agent({ pfx, passphrase })`), mas NAO expoe a chave privada de dentro
// do arquivo. A assinatura XMLDSig precisa da chave em PEM, e nao ha API de
// PKCS#12 em `node:crypto`. Dai o `node-forge`, que faz isso em JS puro (sem
// binario externo, sem dependencia do openssl do container).
//
// SEGREDO NAO VAZA DAQUI. Nada neste modulo loga o conteudo do .pfx, a senha ou
// a chave privada, nem em mensagem de erro: um `catch` que imprime o objeto de
// erro do forge pode carregar material sensivel junto, entao os erros sao
// reescritos com mensagem propria.
//
// REQUISITOS DO CERTIFICADO (regra de validacao E0714 e vizinhas, aba
// "RN DPS_NFS-e" do ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe-v1.01): versao 3;
// BasicConstraint true se informado; KeyUsage com "Assinatura Digital" e "Nao
// Recusa"; extensao de CNPJ (OtherName OID 2.16.76.1.3.3). Nao validamos isso
// aqui de proposito: quem valida e o provedor, e replicar a regra do lado de ca
// criaria uma segunda fonte de verdade que diverge na primeira mudanca. O que
// fazemos e falhar CEDO e com mensagem clara quando o arquivo nao abre.

import forge from "node-forge";

export type MaterialCriptografico = {
  /** Chave privada em PEM (PKCS#8/PKCS#1), para o xml-crypto assinar. */
  privateKeyPem: string;
  /** Certificado do titular em PEM, para ir no KeyInfo/X509Certificate. */
  certificatePem: string;
  /** Certificado em base64 sem cabecalho, como o XMLDSig exige em X509Certificate. */
  certificateBase64: string;
  /** Titular, so para log operacional (nunca contem segredo). */
  subject: string;
  notAfter: Date;
};

function erroDeCertificado(mensagem: string): Error {
  // Mensagem PROPRIA, sem encadear a original: erros do forge em PKCS#12
  // costumam carregar trechos do arquivo, e isso nao pode ir para log nem
  // para o Sentry.
  return new Error(`[nfse/certificado] ${mensagem}`);
}

/**
 * Abre o .pfx e devolve o material de assinatura.
 *
 * Recebe o BUFFER e a senha; quem le a env e o chamador. Assim este modulo e
 * puro o suficiente para o teste construir um PKCS#12 na hora, sem fixture de
 * certificado real no repositorio.
 */
export function extrairMaterial(
  pfx: Buffer,
  senha: string,
): MaterialCriptografico {
  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const asn1 = forge.asn1.fromDer(
      forge.util.createBuffer(pfx.toString("binary")),
    );
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, senha);
  } catch {
    throw erroDeCertificado(
      "nao foi possivel abrir o arquivo PKCS#12. Verifique NFSE_CERT_PFX_BASE64 (base64 do .pfx) e NFSE_CERT_SENHA.",
    );
  }

  // A chave pode estar em qualquer um dos dois bagTypes, dependendo de como a
  // AC gerou o arquivo. Procurar so um deles funciona com um certificado e
  // falha com outro, sem motivo aparente.
  const chaveBags = {
    ...p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag }),
    ...p12.getBags({ bagType: forge.pki.oids.keyBag }),
  };
  const chaveBag = Object.values(chaveBags)
    .flat()
    .find((bag) => bag?.key);
  if (!chaveBag?.key) {
    throw erroDeCertificado("o arquivo nao contem chave privada.");
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certs = Object.values(certBags)
    .flat()
    .map((bag) => bag?.cert)
    .filter((cert): cert is forge.pki.Certificate => Boolean(cert));
  if (certs.length === 0) {
    throw erroDeCertificado("o arquivo nao contem certificado.");
  }

  // CADEIA vs TITULAR: um .pfx costuma trazer o certificado do titular E os da
  // AC. O que vai no X509Certificate da assinatura e o do TITULAR, ou seja, o
  // que casa com a chave privada. Pegar `certs[0]` daria certo por acidente na
  // maioria dos arquivos e erraria em alguns, com rejeicao E0714 que nao aponta
  // para a causa. A comparacao e por modulo da chave publica.
  const chave = chaveBag.key as forge.pki.rsa.PrivateKey;
  const titular =
    certs.find((cert) => {
      const publica = cert.publicKey as forge.pki.rsa.PublicKey | undefined;
      return publica?.n && chave.n && publica.n.compareTo(chave.n) === 0;
    }) ?? null;
  if (!titular) {
    throw erroDeCertificado(
      "nenhum certificado do arquivo corresponde a chave privada (cadeia sem o certificado do titular).",
    );
  }

  const certificatePem = forge.pki.certificateToPem(titular);

  return {
    privateKeyPem: forge.pki.privateKeyToPem(chave),
    certificatePem,
    // X509Certificate no XMLDSig leva o DER em base64, sem as linhas BEGIN/END
    // e sem quebras: e o que o padrao pede, nao o PEM inteiro.
    certificateBase64: certificatePem
      .replace(/-----(BEGIN|END) CERTIFICATE-----/g, "")
      .replace(/\s+/g, ""),
    subject: titular.subject.attributes
      .map((a) => `${a.shortName ?? a.name}=${String(a.value ?? "")}`)
      .join(", "),
    notAfter: titular.validity.notAfter,
  };
}

/** Conveniencia: abre a partir do base64 da env. */
export function extrairMaterialDeBase64(
  pfxBase64: string,
  senha: string,
): MaterialCriptografico {
  if (!pfxBase64) {
    throw erroDeCertificado("NFSE_CERT_PFX_BASE64 vazio.");
  }
  return extrairMaterial(Buffer.from(pfxBase64, "base64"), senha);
}
