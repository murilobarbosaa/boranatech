import { Resend } from "resend";

import {
  escapeCampaignHtml,
  renderCampaignBodyHtml,
} from "../../shared/emailCampaignBody";
import type { Gender } from "../../shared/gender";
import { getProBenefitLabels } from "../../shared/proFeatures";
import { env } from "./env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const FROM_TRANSACTIONAL = '"Bora na Tech?" <noreply@boranatech.com.br>';
const FROM_RELATIONSHIP = '"Bora na Tech?" <oi@boranatech.com.br>';

const APP_URL = "https://boranatech.com.br";

const EMAIL_ASSETS =
  "https://vlcvaanlkqyxemrxsxzn.supabase.co/storage/v1/object/public/email-assets";

// Redes do footer. slug = nome do arquivo PNG (social-<slug>.png); url = link oficial.
const SOCIAL = [
  {
    name: "Instagram",
    slug: "instagram",
    url: "https://www.instagram.com/boranatech/",
  },
  {
    name: "LinkedIn",
    slug: "linkedin",
    url: "https://www.linkedin.com/in/bora-na-tech-b17107412/",
  },
  { name: "TikTok", slug: "tiktok", url: "https://www.tiktok.com/@boranatech_" },
  { name: "X", slug: "x", url: "https://x.com/boranatech" },
];

type EmailTheme = {
  brand: string; // cor principal (faixa do header e fundo do botao)
  accent: string; // faixa fina, circulo do logo, marcadores de lista, circulo dos icones sociais
  buttonText: string; // cor do texto do botao sobre brand
  accentText: string; // cor que contrasta sobre accent (icones sociais e fallback de alt)
};

// Tema unico neutro para todos os e-mails (sem segregacao por genero).
const NEUTRAL_THEME: EmailTheme = {
  brand: "#FCC700",
  accent: "#6B1FC9",
  buttonText: "#1a1a1a",
  accentText: "#ffffff",
};

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

// Icones sociais via PNGs hospedadas (EMAIL_ASSETS), sem depender de CDN externo.
// Usado tanto pelo layout() dos transacionais quanto pelo waitlistLayout().
// TODO(Ana): aparencia final dos icones (inclusive contraste no footer escuro dos transacionais).
function socialIcons() {
  const cells = SOCIAL.map(
    (s) => `
                <td style="padding:0 8px;">
                  <a href="${s.url}" style="text-decoration:none;">
                    <img src="${EMAIL_ASSETS}/social-${s.slug}.png" width="40" height="40" alt="${s.name}" style="display:block;border:0;outline:none;">
                  </a>
                </td>`,
  ).join("");
  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>${cells}</tr></table>`;
}

function waitlistLayout(
  title: string,
  body: string,
  heroImageUrl: string,
  preheader: string,
) {
  return `
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;font-size:1px;line-height:1px;color:#FFFFFF;">${preheader}&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;margin:0;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#FFFFFF;border:4px solid #0F172A;">
        <tr><td style="padding:0;font-size:0;line-height:0;">
          <img src="${heroImageUrl}" width="600" alt="Boas vindas ao Bora na Tech. Voce esta na lista de espera." style="display:block;width:100%;max-width:600px;height:auto;border:0;">
        </td></tr>
        <tr><td style="padding:36px 40px 0 40px;">
          <h1 style="margin:0;font-family:'Space Grotesk',Arial,Helvetica,sans-serif;font-size:28px;line-height:1.15;font-weight:700;color:#0F172A;">${title}</h1>
        </td></tr>
        <tr><td style="padding:14px 40px 0 40px;">${body}</td></tr>
        <tr><td style="padding:30px 40px 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid #E2E8F0;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
        <tr><td style="padding:22px 40px 34px 40px;text-align:center;">
          <p style="margin:0 0 16px;font-family:'Space Grotesk',Arial,Helvetica,sans-serif;font-size:15px;line-height:1.4;font-weight:700;color:#0F172A;text-align:center;">Acompanha a gente nas redes pra nao perder nada ate la</p>
          ${socialIcons()}
          <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#94A3B8;text-align:center;">Bora na Tech. Sua bussola para comecar na tecnologia</p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
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
              ${socialIcons()}
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
  text?: string;
  headers?: Record<string, string>;
}) {
  if (!env.resendApiKey || !resend) {
    console.warn("[email] RESEND_API_KEY ausente. E-mail não enviado.");
    return;
  }

  // List-Unsubscribe (so mailto por enquanto) vale para todos os envios.
  // Retorna o resultado do Resend (erro de API vem no campo error, sem throw)
  // pra quem precisa distinguir sucesso de falha (campanhas). Os transacionais
  // existentes ignoram o retorno, comportamento inalterado.
  return resend.emails.send({
    ...params,
    headers: {
      "List-Unsubscribe": "<mailto:oi@boranatech.com.br?subject=unsubscribe>",
      ...params.headers,
    },
  });
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  _gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  // TODO(Ana): saudacao neutra fixa (sem genero).
  const hello = "Olá";
  const theme = NEUTRAL_THEME;
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

export async function sendWaitlistConfirmationEmail(to: string, _name?: string) {
  const heroImageUrl = `${EMAIL_ASSETS}/waitlist-hero.jpeg`;
  // TODO(Ana): copy final do e-mail de boas-vindas a lista de espera.
  const title = "Boas-vindas ao Bora na Tech";
  const body = `
    <p style="margin:0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#334155;">Seu lugar na lista de espera está confirmado. Isso quer dizer que você vai ser um dos primeiros a entrar quando o <strong style="color:#0F172A;">Bora na Tech</strong> abrir as portas.</p>
    <p style="margin:20px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#334155;">No lançamento você vai ter acesso a quiz vocacional, roadmaps, conteúdo selecionado, glossário e comunidade. Tudo pra te dar uma direção clara de por onde começar.</p>
  `;
  // TODO(Ana): subject acompanha o titulo da copy nova.
  // TODO(Ana): preheader (previa na caixa de entrada, nao repetir o titulo)
  const preheader =
    "Seu lugar no Bora na Tech esta confirmado. Veja o que vem por ai.";

  // TODO(Ana): versao texto plano do e-mail de boas-vindas a lista de espera
  const text = [
    "Boas-vindas ao Bora na Tech",
    "",
    "Seu lugar na lista de espera esta confirmado. Voce vai ser um dos primeiros a entrar quando o Bora na Tech abrir as portas.",
    "",
    "No lancamento voce vai ter acesso a quiz vocacional, roadmaps, conteudo selecionado, glossario e comunidade. Tudo pra te dar uma direcao clara de por onde comecar.",
    "",
    "Acompanha a gente nas redes pra nao perder nada ate la.",
    "",
    "Bora na Tech. Sua bussola para comecar na tecnologia.",
  ].join("\n");

  await sendEmail({
    to,
    from: FROM_RELATIONSHIP,
    subject: title,
    html: waitlistLayout(title, body, heroImageUrl, preheader),
    text,
  });
}

export async function sendNewsletterConfirmEmail(
  to: string,
  confirmUrl: string,
) {
  const theme = NEUTRAL_THEME;
  // TODO(Ana): copy final do e-mail de confirmacao de inscricao (double opt-in).
  const title = "Confirme sua inscrição na newsletter";
  const body = `
    ${paragraph("Falta um passo para você começar a receber a newsletter do Bora na Tech.")}
    ${paragraph("Clique no botão abaixo para confirmar sua inscrição.")}
    ${button("Confirmar inscrição", confirmUrl, theme)}
    ${paragraph("Se não foi você que pediu, ignore este e-mail.")}
  `;
  // TODO(Ana): versao texto plano do e-mail de confirmacao de inscricao.
  const text = [
    "Confirme sua inscricao na newsletter",
    "",
    "Falta um passo para voce comecar a receber a newsletter do Bora na Tech.",
    "Confirme sua inscricao neste link:",
    confirmUrl,
    "",
    "Se nao foi voce que pediu, ignore este e-mail.",
  ].join("\n");

  // E-mail transacional de double opt-in: nao adiciona header List-Unsubscribe
  // proprio (o mailto central de sendEmail permanece intacto).
  await sendEmail({
    to,
    from: FROM_RELATIONSHIP,
    subject: title,
    html: layout(theme, title, body),
    text,
  });
}

export async function sendNewsletterWelcomeEmail(
  to: string,
  unsubscribeUrl: string,
) {
  const theme = NEUTRAL_THEME;
  // TODO(Ana): copy final do e-mail de boas-vindas pos-confirmacao da newsletter.
  const title = "Inscrição confirmada!";
  const body = `
    ${paragraph("Sua inscrição na newsletter do Bora na Tech está confirmada.")}
    ${paragraph("A partir de agora você recebe novidades da tech direto no seu inbox.")}
    ${paragraph(`Para sair quando quiser, <a href="${unsubscribeUrl}" style="color:${theme.accent};">clique aqui</a>.`)}
  `;
  // TODO(Ana): versao texto plano do e-mail de boas-vindas da newsletter.
  const text = [
    "Inscricao confirmada!",
    "",
    "Sua inscricao na newsletter do Bora na Tech esta confirmada.",
    "A partir de agora voce recebe novidades da tech direto no seu inbox.",
    "",
    "Para sair quando quiser, acesse:",
    unsubscribeUrl,
  ].join("\n");

  await sendEmail({
    to,
    from: FROM_RELATIONSHIP,
    subject: title,
    html: layout(theme, title, body),
    text,
  });
}

export async function sendProUpgradeEmail(
  to: string,
  name: string,
  planName: string,
  _gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  const safePlanName = escapeHtml(planName);
  const theme = NEUTRAL_THEME;
  // TODO(Ana): subject neutro (sem genero).
  const title = "Seu plano Pro está ativo!";
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
  _gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  const theme = NEUTRAL_THEME;
  const date = new Date(effectiveAt);
  const formattedDate = Number.isNaN(date.getTime())
    ? "o fim do período pago"
    : date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  const safeDate = escapeHtml(formattedDate);
  // TODO(Ana): subject neutro (sem genero).
  const title = "Seu cancelamento foi agendado";
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
  _gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  const theme = NEUTRAL_THEME;
  // TODO(Ana): subject neutro (sem genero).
  const title = "Sua assinatura foi encerrada";
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

// Layout das campanhas para a waitlist: nome no topo, titulo, imagem opcional
// logo apos o titulo, corpo renderizado (shared/emailCampaignBody) e rodape com
// link de descadastro e endereco do remetente.
function campaignLayout(opts: {
  title: string;
  bodyHtml: string;
  imageUrl: string | null;
  unsubscribeUrl: string;
}) {
  const imageHtml = opts.imageUrl
    ? `
        <tr><td style="padding:18px 40px 0 40px;">
          <img src="${escapeCampaignHtml(opts.imageUrl)}" alt="" style="display:block;width:100%;max-width:100%;height:auto;border:0;">
        </td></tr>`
    : "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;margin:0;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#FFFFFF;border:4px solid #0F172A;">
        <tr><td style="padding:26px 40px 0 40px;">
          <div style="font-family:'Space Grotesk',Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;color:#0F172A;">BORA NA TECH</div>
        </td></tr>
        <tr><td style="padding:18px 40px 0 40px;">
          <h1 style="margin:0;font-family:'Space Grotesk',Arial,Helvetica,sans-serif;font-size:26px;line-height:1.2;font-weight:700;color:#0F172A;">${opts.title}</h1>
        </td></tr>
        ${imageHtml}
        <tr><td style="padding:18px 40px 8px 40px;">${opts.bodyHtml}</td></tr>
        <tr><td style="padding:8px 40px 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid #E2E8F0;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
        <tr><td style="padding:18px 40px 30px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#94A3B8;">Voce esta recebendo este e-mail porque entrou na lista de espera do Bora na Tech.</p>
          <p style="margin:0 0 8px;font-size:12px;line-height:1.5;">
            <a href="${opts.unsubscribeUrl}" style="color:#64748B;">Nao quero mais receber estes e-mails</a>
          </p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:#94A3B8;">Enviado por Bora na Tech (oi@boranatech.com.br)</p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}
// TODO(Ana): textos fixos do template de campanha acima (nome no topo e rodape).

// Envio de campanha: diferente dos transacionais, falha NUNCA colapsa em
// sucesso. Sem Resend configurado ou com erro de API, lanca; o worker da fila
// marca o destinatario como failed apos esgotar as tentativas.
export async function sendCampaignEmail(params: {
  to: string;
  subject: string;
  body: string;
  imageUrl: string | null;
  unsubscribeUrl: string;
}) {
  if (!env.resendApiKey || !resend) {
    throw new Error("RESEND_API_KEY ausente. Envio de campanha requer Resend.");
  }
  const title = escapeCampaignHtml(params.subject);
  const html = campaignLayout({
    title,
    bodyHtml: renderCampaignBodyHtml(params.body),
    imageUrl: params.imageUrl,
    unsubscribeUrl: params.unsubscribeUrl,
  });
  const result = await sendEmail({
    to: params.to,
    from: FROM_RELATIONSHIP,
    subject: params.subject,
    html,
    headers: {
      // Alem do mailto padrao, a URL de descadastro da campanha. O header
      // List-Unsubscribe-Post habilita o one-click dos provedores (POST direto
      // na URL, sem body; a rota aceita token via query string).
      "List-Unsubscribe": `<${params.unsubscribeUrl}>, <mailto:oi@boranatech.com.br?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (!result) {
    throw new Error("Envio de campanha nao executado (Resend indisponivel).");
  }
  if (result.error) {
    throw new Error(result.error.message || "Erro do Resend ao enviar.");
  }
}

export async function sendPaymentFailedEmail(
  to: string,
  name: string,
  _gender?: Gender | null,
) {
  const safeName = escapeHtml(name);
  const theme = NEUTRAL_THEME;
  // TODO(Ana): subject neutro (sem genero).
  const title = "Tivemos um problema no pagamento";
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
