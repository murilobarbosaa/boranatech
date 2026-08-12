// Assinatura XMLDSig da DPS e dos eventos do Sistema Nacional NFS-e.
//
// O QUE O LEIAUTE EXIGE, e de onde veio:
//   - `NFSe/infNFSe/DPS/infDPS/Signature` e "Assinatura XML segundo o Padrao
//     XML Digital Signature", com a observacao "Obrigatorio quando for enviado
//     para API" (aba "LEIAUTE DPS_NFS-e" do ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe
//     v1.01, linha 415). A rejeicao correspondente e a E0714, "Arquivo enviado
//     com erro na assinatura" (aba "RN DPS_NFS-e", linha 642).
//   - O XSD `DPS_v1.01.xsd` declara `TCDPS` como `infDPS` seguido de
//     `ds:Signature` opcional, ou seja, assinatura ENVELOPED com a `Signature`
//     irma do elemento assinado, e o `Id` de `infDPS` como alvo da Reference.
//
// POR QUE BIBLIOTECA E NAO IMPLEMENTACAO PROPRIA. O passo que quebra assinatura
// XML na pratica e a canonicalizacao (C14N): ordem de atributos, declaracoes de
// namespace herdadas, normalizacao de espacos. Escrever isso a mao produz um
// digest que bate nos nossos testes e nao bate no validador do provedor, com a
// mensagem generica E0714 e nenhuma pista. O `xml-crypto` carrega C14N testada.
//
// ALGORITMOS SAO PARAMETRO, NAO CONSTANTE. Nem o XSD nem as abas de regra que
// consultei declaram qual digest/canonicalizacao o Sistema Nacional exige (o
// XSD so importa o `xmldsig-core-schema` padrao, que aceita varios). Os
// defaults abaixo seguem a convencao da familia SPED, mas convencao nao e
// documentacao: ficam configuraveis para a homologacao trocar sem mexer em
// codigo. Ver TODO(homologacao).

import { SignedXml } from "xml-crypto";

import type { MaterialCriptografico } from "./certificado";

/**
 * TODO(homologacao): confirmar digest e canonicalizacao aceitos pelo validador
 * nacional. Os valores abaixo sao os da familia SPED (NF-e/CT-e), que e a
 * origem do padrao, mas o Sistema Nacional NFS-e e posterior e pode exigir
 * SHA-256. Trocar aqui NAO exige mexer no resto: o modulo inteiro recebe isto
 * por parametro.
 */
export const ALGORITMOS_PADRAO = {
  canonicalizationAlgorithm:
    "http://www.w3.org/TR/2001/REC-xml-c14n-20010315" as const,
  signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1" as const,
  digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1" as const,
};

export type OpcoesAssinatura = {
  /** Nome do elemento a assinar: "infDPS" na DPS, "infPedReg" no evento. */
  elemento: string;
  /** Valor do atributo Id daquele elemento; vira a URI da Reference ("#Id"). */
  id: string;
  material: MaterialCriptografico;
  algoritmos?: typeof ALGORITMOS_PADRAO;
};

/**
 * Assina um XML no padrao enveloped, com a `Signature` como IRMA do elemento
 * assinado (e nao dentro dele).
 *
 * Isso importa: o XSD posiciona `ds:Signature` depois de `infDPS`, dentro de
 * `DPS`. Uma assinatura colocada DENTRO de `infDPS` produziria um documento que
 * falha na validacao de schema antes mesmo de a assinatura ser conferida.
 */
export function assinarXml(xml: string, opcoes: OpcoesAssinatura): string {
  const algoritmos = opcoes.algoritmos ?? ALGORITMOS_PADRAO;

  const sig = new SignedXml({
    privateKey: opcoes.material.privateKeyPem,
    publicCert: opcoes.material.certificatePem,
    canonicalizationAlgorithm: algoritmos.canonicalizationAlgorithm,
    signatureAlgorithm: algoritmos.signatureAlgorithm,
  });

  sig.addReference({
    // Referencia pelo Id do elemento, que e como o padrao SPED faz e o que o
    // `Id` obrigatorio de `infDPS` existe para permitir.
    xpath: `//*[local-name(.)='${opcoes.elemento}']`,
    uri: `#${opcoes.id}`,
    transforms: [
      // A ordem NAO e livre: primeiro remove-se a propria assinatura do
      // material assinado (enveloped-signature), depois canonicaliza-se. O
      // inverso canonicalizaria um documento que ainda contem a Signature e o
      // digest nunca fecharia na verificacao.
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      algoritmos.canonicalizationAlgorithm,
    ],
    digestAlgorithm: algoritmos.digestAlgorithm,
  });

  sig.computeSignature(xml, {
    location: {
      // Irma do elemento assinado, imediatamente depois dele.
      reference: `//*[local-name(.)='${opcoes.elemento}']`,
      action: "after",
    },
  });

  return sig.getSignedXml();
}

/**
 * Confere uma assinatura. Existe para o TESTE fechar o ciclo (assina e
 * verifica) e para o script de homologacao poder conferir antes de transmitir:
 * descobrir a assinatura quebrada aqui custa nada, descobrir pela E0714 custa
 * uma ida e volta ao provedor com o numero da DPS ja queimado.
 */
export function verificarAssinatura(
  xmlAssinado: string,
  certificatePem: string,
): boolean {
  const sig = new SignedXml({ publicCert: certificatePem });
  const signatureNode =
    /<(\w+:)?Signature[\s>][\s\S]*<\/(\w+:)?Signature>/.exec(xmlAssinado);
  if (!signatureNode) return false;
  sig.loadSignature(signatureNode[0]);
  return sig.checkSignature(xmlAssinado);
}
