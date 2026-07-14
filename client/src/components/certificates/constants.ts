// Constantes de certificado compartilhadas pelos componentes da fase 2B.

// Mesmo valor de siteUrl em SEO.tsx / completionCtas.ts. A pagina publica de
// verificacao vive em /certificados/{code}.
export const SITE_URL = "https://boranatech.com.br";

export function verificationUrl(code: string): string {
  return `${SITE_URL}/certificados/${code}`;
}

// Company Page do LinkedIn ainda NAO existe. Enquanto for null, o botao "Add to
// Profile" envia o nome da organizacao como texto (organizationName).
// TODO(Ana): trocar por organizationId quando a Company Page existir.
export const CERT_LINKEDIN_ORG_ID: string | null = null;

// Razao social emissora, exibida no certificado e na verificacao publica.
// TODO(Ana): incluir CNPJ.
export const CERT_ISSUER_NAME = "Bora Ecosystem LTDA";

// Nome da organizacao usado no Add to Profile do LinkedIn enquanto nao ha
// organizationId. TODO(Ana): revisar.
export const CERT_LINKEDIN_ORG_NAME = "Bora na Tech";
