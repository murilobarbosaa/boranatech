import { Resend } from "resend";

import type { Gender } from "../../shared/gender";
import { greet } from "../../shared/greeting";
import { getProBenefitLabels } from "../../shared/proFeatures";
import { env } from "./env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const FROM_TRANSACTIONAL = '"Bora na Tech?" <noreply@boranatech.com.br>';
const FROM_RELATIONSHIP = '"Bora na Tech?" <oi@boranatech.com.br>';

const APP_URL = "https://boranatech.com.br";

// Redes do footer. slug = icone simple-icons; url = destino (placeholder ate termos as oficiais).
const SOCIAL = [
  { name: "Instagram", slug: "instagram", url: "INSTAGRAM_URL" },
  { name: "LinkedIn", slug: "linkedin", url: "LINKEDIN_URL" },
  { name: "TikTok", slug: "tiktok", url: "TIKTOK_URL" },
  { name: "X", slug: "x", url: "X_URL" },
];

type EmailTheme = {
  brand: string; // cor principal (faixa do header e fundo do botao)
  accent: string; // faixa fina, circulo do logo, marcadores de lista, circulo dos icones sociais
  buttonText: string; // cor do texto do botao sobre brand
  accentText: string; // cor que contrasta sobre accent (icones sociais e fallback de alt)
};

const GENDER_THEMES: Record<"feminino" | "masculino" | "default", EmailTheme> =
  {
    feminino: {
      brand: "#6B1FC9",
      accent: "#FCC700",
      buttonText: "#ffffff",
      accentText: "#1a1a1a",
    },
    masculino: {
      brand: "#3B7DD8",
      accent: "#FCC700",
      buttonText: "#ffffff",
      accentText: "#1a1a1a",
    },
    default: {
      brand: "#FCC700",
      accent: "#6B1FC9",
      buttonText: "#1a1a1a",
      accentText: "#ffffff",
    },
  };

function themeFor(gender?: Gender | null): EmailTheme {
  if (gender === "feminino") return GENDER_THEMES.feminino;
  if (gender === "masculino") return GENDER_THEMES.masculino;
  return GENDER_THEMES.default; // outro, prefiro_nao_dizer, null
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraph(html: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444444;">${html}</p>`;
}

function list(theme: EmailTheme, items: string[]) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td valign="top" style="padding:0 10px 8px 0;">
            <div style="width:7px;height:7px;border-radius:50%;background:${theme.accent};margin-top:6px;"></div>
          </td>
          <td style="padding:0 0 8px;font-size:15px;line-height:1.5;color:#444444;">${item}</td>
        </tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 0;">${rows}</table>`;
}

function button(label: string, href: string, theme: EmailTheme) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
      <tr>
        <td style="border-radius:999px;background:${theme.brand};">
          <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:${theme.buttonText};text-decoration:none;border-radius:999px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

function socialIcons(theme: EmailTheme) {
  // Cor embutida na propria URL do icone (simple-icons), sem depender de filter CSS
  // (ignorado por Outlook e outros). O circulo usa background accent; se a imagem nao
  // carregar, o alt text aparece na cor accentText e o footer continua legivel.
  const iconColor = theme.accentText.replace("#", "");
  const cells = SOCIAL.map(
    (social) => `
                  <td style="padding:0 4px;">
                    <a href="${social.url}" style="text-decoration:none;color:${theme.accentText};font-size:10px;font-weight:bold;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="34" height="34" align="center" valign="middle" style="width:34px;height:34px;background:${theme.accent};border-radius:50%;">
                            <img src="https://cdn.simpleicons.org/${social.slug}/${iconColor}" width="17" height="17" alt="${social.name}" style="display:inline-block;border:0;outline:none;vertical-align:middle;" />
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>`,
  ).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;"><tr>${cells}</tr></table>`;
}

function layout(theme: EmailTheme, title: string, body: string) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f0e8;margin:0;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <!-- HEADER: faixa BRAND + pilula do logo (CSS solido).
               Para usar imagem no futuro, troque o bloco da pilula por <img src="..." width="..." alt="Bora na Tech?" />. -->
          <tr>
            <td style="background:${theme.brand};padding:18px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="right">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:999px;">
                      <tr>
                        <td style="padding:8px 14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td valign="middle" style="padding-right:8px;">
                                <div style="width:22px;height:22px;border-radius:50%;background:${theme.accent};"></div>
                              </td>
                              <td valign="middle">
                                <div style="font-size:13px;font-weight:bold;color:#1a1a1a;line-height:1.1;">BORA NA TECH?</div>
                                <div style="font-size:10px;color:#6b6b6b;line-height:1.3;">Sua bússola na TI</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- faixa fina de acento -->
          <tr><td style="height:5px;background:${theme.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
          <!-- MIOLO -->
          <tr>
            <td style="padding:32px 28px;">
              <h1 style="margin:0 0 16px;font-size:23px;font-weight:bold;color:#1a1a1a;line-height:1.25;">${title}</h1>
              ${body}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background:#1a1a1a;padding:22px 28px;">
              ${socialIcons(theme)}
              <div style="color:#9a9a9a;font-size:11px;line-height:1.5;">Bora na Tech? Sua bússola para começar na tecnologia.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

async function sendEmail(params: {
  to: string;
  from: string;
  subject: string;
  html: string;
}) {
  if (!env.resendApiKey || !resend) {
    console.warn("[email] RESEND_API_KEY ausente. E-mail não enviado.");
    return;
  }

  await resend.emails.send(params);
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  const hello = greet(gender);
  const theme = themeFor(gender);
  const title = "Boas-vindas ao Bora na Tech!";
  const body = `
    ${paragraph(`${hello}, ${safeName}! Que bom ter você por aqui. Sua conta está pronta e o acesso é todo seu.`)}
    ${paragraph("Na plataforma você encontra:")}
    ${list(theme, [
      "Roadmaps para cada área da tecnologia",
      "Cursos selecionados para começar do zero",
      "Ferramentas de IA para currículo, portfólio e entrevistas",
      "Vagas e oportunidades para quem está começando",
      "Uma comunidade para trocar ideias e evoluir junto",
    ])}
    ${button("Explorar a plataforma", APP_URL, theme)}
  `;
  await sendEmail({
    to,
    from: FROM_RELATIONSHIP,
    subject: title,
    html: layout(theme, title, body),
  });
}

export async function sendWaitlistConfirmationEmail(to: string, name?: string) {
  const safeName = name ? escapeHtml(name) : "";
  const theme = themeFor(null);
  // TODO(Ana): copy final do e-mail de confirmacao da lista de espera.
  const title = "Voce esta na lista!";
  const greeting = safeName ? `Oi, ${safeName}!` : "Oi!";
  const body = `
    ${paragraph(`${greeting} Recebemos seu cadastro na lista de espera do Bora na Tech.`)}
    ${paragraph("Assim que o acesso for liberado, a gente avisa por aqui.")}
  `;
  await sendEmail({
    to,
    from: FROM_RELATIONSHIP,
    subject: title,
    html: layout(theme, title, body),
  });
}

export async function sendProUpgradeEmail(
  to: string,
  name: string,
  planName: string,
  gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  const safePlanName = escapeHtml(planName);
  const hello = greet(gender);
  const theme = themeFor(gender);
  const title = `${hello}, seu plano Pro está ativo!`;
  const body = `
    ${paragraph(`Obrigado por assinar o ${safePlanName}, ${safeName}. Seu acesso completo já está liberado.`)}
    ${paragraph("A partir de agora você tem:")}
    ${list(theme, getProBenefitLabels())}
    ${button("Ver meu plano", `${APP_URL}/perfil`, theme)}
    ${paragraph("Qualquer dúvida, é só responder este e-mail.")}
  `;
  await sendEmail({
    to,
    from: FROM_TRANSACTIONAL,
    subject: title,
    html: layout(theme, title, body),
  });
}

export async function sendCancellationScheduledEmail(
  to: string,
  name: string,
  effectiveAt: string,
  gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  const hello = greet(gender);
  const theme = themeFor(gender);
  const date = new Date(effectiveAt);
  const formattedDate = Number.isNaN(date.getTime())
    ? "o fim do período pago"
    : date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  const safeDate = escapeHtml(formattedDate);
  const title = `${hello}, seu cancelamento foi agendado`;
  const body = `
    ${paragraph(`Recebemos seu pedido de cancelamento, ${safeName}. Você mantém o acesso completo ao Pro até <strong>${safeDate}</strong>.`)}
    ${paragraph("Mudou de ideia? Dá para reativar antes dessa data e continuar sem perder nada.")}
    ${button("Reativar meu plano", `${APP_URL}/perfil`, theme)}
  `;
  await sendEmail({
    to,
    from: FROM_TRANSACTIONAL,
    subject: title,
    html: layout(theme, title, body),
  });
}

export async function sendCancellationEmail(
  to: string,
  name: string,
  gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  const hello = greet(gender);
  const theme = themeFor(gender);
  const title = `${hello}, sua assinatura foi encerrada`;
  const body = `
    ${paragraph(`Sua assinatura Pro foi encerrada, ${safeName}. Obrigado por ter feito parte do Pro.`)}
    ${paragraph("Você continua com acesso gratuito à plataforma. Quando quiser voltar, a porta está aberta.")}
    ${button("Voltar para o Pro", `${APP_URL}/planos`, theme)}
  `;
  await sendEmail({
    to,
    from: FROM_TRANSACTIONAL,
    subject: title,
    html: layout(theme, title, body),
  });
}

export async function sendPaymentFailedEmail(
  to: string,
  name: string,
  gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  const hello = greet(gender);
  const theme = themeFor(gender);
  const title = `${hello}, tivemos um problema no pagamento`;
  const body = `
    ${paragraph(`Não conseguimos processar o pagamento da sua assinatura Pro, ${safeName}.`)}
    ${paragraph("Para manter seu acesso, atualize sua forma de pagamento. Leva menos de um minuto.")}
    ${button("Atualizar pagamento", `${APP_URL}/perfil`, theme)}
    ${paragraph("Se o pagamento não for regularizado, o acesso Pro pode ser suspenso.")}
  `;
  await sendEmail({
    to,
    from: FROM_TRANSACTIONAL,
    subject: title,
    html: layout(theme, title, body),
  });
}
