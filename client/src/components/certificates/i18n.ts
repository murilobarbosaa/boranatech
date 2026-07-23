// Strings PT/EN da APRESENTACAO do certificado (pagina + modais + textos de
// post). A escolha de idioma vive so no estado da pagina (sem persistir); o
// snapshot/banco continua em PT. Copy EN dos posts e do rodape aprovada pela
// dona; os labels de UEI traduzi eu (marcados TODO(Ana) onde vale revisao).
export type CertLang = "pt" | "en";

// Data de emissao no idioma, fixada em America/Sao_Paulo (mesma regra do SVG).
// EN: mes por extenso ("July 22, 2026"), sem ambiguidade DD/MM.
export function formatCertDate(iso: string, lang: CertLang): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...(lang === "en"
      ? { month: "long", day: "numeric", year: "numeric" }
      : { day: "2-digit", month: "long", year: "numeric" }),
  }).format(date);
}

export function certI18n(lang: CertLang) {
  const en = lang === "en";
  return {
    // Pagina
    certificateOfCompletion: en
      ? "Certificate of completion"
      : "Certificado de conclusão",
    backToTrail: en ? "Back to the learning path" : "Voltar para a trilha",
    verified: en ? "VERIFIED" : "VERIFICADO",
    // Prosa de verificacao, com o nome em destaque (before/name/after).
    verificationProse: (name: string, trilha: string) =>
      en
        ? {
            before: "The account of ",
            name,
            after: ` has been verified. Bora na Tech certifies the completion of the ${trilha} learning path.`,
          }
        : {
            before: "A conta de ",
            name,
            after: ` foi verificada. A Bora na Tech certifica a conclusão da trilha ${trilha}.`,
          },
    recipient: en ? "Recipient" : "Titular",
    completedOn: en ? "Completed on" : "Concluído em",
    totalHours: en ? "Total hours" : "Carga horária",
    code: en ? "Code" : "Código",
    skillsTitle: en ? "Skills developed" : "Habilidades desenvolvidas",
    shareBtn: en ? "Share certificate" : "Compartilhar certificado",
    downloadBtn: en ? "Download certificate" : "Baixar certificado",
    notFoundTitle: en
      ? "Certificate not found."
      : "Certificado não encontrado.",
    notFoundBody: en
      ? "Check the code and try again."
      : "Confira o código e tente novamente.",
    revokedTitle: en ? "Certificate revoked." : "Certificado revogado.",
    revokedBody: en
      ? "This certificate has been revoked and is no longer valid."
      : "Este certificado foi revogado e não é válido.",
    revokedReason: en ? "Reason:" : "Motivo:",

    // Modal de download
    dl: {
      title: en ? "Download certificate" : "Baixar certificado",
      subtitle: en ? "Choose the file format." : "Escolha o formato do arquivo.",
      pdfHint: en ? "Great for printing and attaching" : "Ideal para imprimir e anexar",
      pngHint: en ? "Great for posting on social media" : "Ideal para postar nas redes",
      error: en
        ? "Couldn't generate the file right now. Please try again later."
        : "Não foi possível gerar o arquivo agora. Tente mais tarde.",
    },

    // Modal de compartilhar
    sh: {
      title: en ? "Share certificate" : "Compartilhar certificado",
      addTitle: en
        ? "Add to your Licenses & Certifications"
        : "Adicione às suas Licenças e Certificações",
      addSubtitle: en
        ? "Register this achievement directly on your LinkedIn profile."
        : "Registre esta conquista direto no seu perfil do LinkedIn.",
      addBtn: en ? "Add to profile" : "Adicionar ao perfil",
      linkLabel: en ? "Certificate link" : "Link do certificado",
      copy: en ? "Copy" : "Copiar",
      copied: en ? "Copied" : "Copiado",
      textLabel: en ? "Ready-to-paste text" : "Texto pronto para colar",
      copyText: en ? "Copy text" : "Copiar texto",
      tip: en
        ? "On LinkedIn, type @ and select Bora Na Tech to tag our page."
        : "No LinkedIn, digite @ e selecione Bora Na Tech para marcar a nossa página.",
      shareIn: en ? "Share on" : "Compartilhar em",
    },
  };
}

// Texto longo do post (literal aprovado; campos dinamicos). Skills = as 4
// primeiras da lista derivada; se a trilha tiver menos, so as existentes.
export function certPostText(
  lang: CertLang,
  trilha: string,
  hours: number,
  skills: string[],
  link: string,
): string {
  const lines = skills
    .slice(0, 4)
    .map((s) => `→ ${s}`)
    .join("\n");
  if (lang === "en") {
    return `🎓 Just completed the ${trilha} learning path at Bora na Tech!

${hours} hours of content, a final exam with a minimum passing score, and a verifiable certificate at the end. No shortcuts.

What I'm taking away:
${lines}

If you're thinking about starting (or growing) in tech: the hardest part is starting. The rest is consistency.

What skill are you learning right now? Let me know in the comments 👇

Verifiable certificate: ${link}

@Bora Na Tech #BoraNaTech #TechCareer #LifelongLearning`;
  }
  return `🎓 Trilha ${trilha} concluída na Bora na Tech!

Foram ${hours} horas de conteúdo, uma prova final com nota mínima e um certificado verificável no fim. Sem atalho.

O que eu levo dessa jornada:
${lines}

Se você está pensando em entrar (ou crescer) na área tech: o mais difícil é começar. O resto é constância.

Qual habilidade você está estudando agora? Me conta nos comentários 👇

Certificado verificável: ${link}

@Bora Na Tech #BoraNaTech #CarreiraTech #AprendizadoContinuo`;
}

// Texto curto do X (limite de caracteres).
export function certTweetText(
  lang: CertLang,
  trilha: string,
  hours: number,
  link: string,
): string {
  return lang === "en"
    ? `🎓 Just completed the ${trilha} learning path at Bora na Tech! ${hours}h of content and a verifiable certificate: ${link} #BoraNaTech`
    : `🎓 Trilha ${trilha} concluída na Bora na Tech! ${hours}h de conteúdo e certificado verificável: ${link} #BoraNaTech`;
}

// Assunto do email.
export function certEmailSubject(lang: CertLang, trilha: string): string {
  return lang === "en"
    ? `My Bora na Tech certificate - ${trilha}`
    : `Meu certificado Bora na Tech - ${trilha}`;
}
