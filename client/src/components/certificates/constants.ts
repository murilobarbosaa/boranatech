// Constantes de certificado compartilhadas pelos componentes de certificado.

// Mesmo valor de siteUrl em SEO.tsx / completionCtas.ts. A pagina publica de
// verificacao vive em /certificados/{code}.
export const SITE_URL = "https://boranatech.com.br";

export function verificationUrl(code: string): string {
  return `${SITE_URL}/certificados/${code}`;
}

// Organization ID da Company Page da BoraNaTech no LinkedIn, usado no Add to
// Profile de certificacao.
export const CERT_LINKEDIN_ORG_ID = "135254003";

// Rodape legal definitivo do emissor (razao social, CNPJ, CNAE). Exibido no
// certificado em HTML e nas paginas publicas de certificado.
export const CERT_ISSUER_LEGAL =
  "Emitido por BORA ECOSYSTEM LTDA, CNPJ 67.688.579/0001-06. Certificado de curso livre (CNAE 8599-6/04). Não é diploma e não confere título ou registro profissional.";

// Bloco de assinatura institucional (sem imagem, sem nome de pessoa fisica).
// Vai onde o design do certificado pedir (fase do PDF).
export const CERT_ISSUER_SIGNATURE = [
  "BORA ECOSYSTEM LTDA",
  "Coordenação BoraNaTech",
];
