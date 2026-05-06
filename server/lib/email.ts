import { Resend } from "resend";

import { env } from "./env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const FROM_TRANSACTIONAL = '"Bora na Tech?" <noreply@boranatech.com.br>';
const FROM_RELATIONSHIP = '"Bora na Tech?" <oi@boranatech.com.br>';

const proBenefits = [
  "Quiz de área com IA",
  "Roadmaps completos",
  "Plano de estudos personalizado",
  "Analisador de GitHub",
  "Analisador de currículo com IA",
  "Otimizador de LinkedIn com IA",
  "Comparativo de salários",
  "Análise de empregabilidade",
  "Preparação para entrevistas",
  "Networking e comunidade",
  "Notícias tech filtradas",
  "Comparador de áreas",
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, body: string) {
  return `
    <div style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
      <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
        <div style="background:#1a1a1a;color:#FFB800;border-radius:18px 18px 0 0;padding:22px 24px;font-weight:900;font-size:20px;">
          BORA NA TECH?
        </div>
        <div style="background:#ffffff;border:2px solid #1a1a1a;border-top:0;padding:28px 24px;box-shadow:4px 4px 0 #0f172a;">
          <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;font-weight:900;color:#1a1a1a;">${title}</h1>
          ${body}
        </div>
        <div style="background:#1a1a1a;color:#ffffff;border-radius:0 0 18px 18px;padding:18px 24px;font-size:12px;">
          © 2026 Bora na Tech?
        </div>
      </div>
    </div>
  `;
}

function button(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:18px;background:#FFB800;color:#1a1a1a;border:2px solid #1a1a1a;border-radius:999px;padding:12px 20px;font-weight:900;text-decoration:none;">${label}</a>`;
}

function list(items: string[]) {
  return `<ol style="margin:18px 0 0;padding-left:22px;">${items.map((item) => `<li style="margin:8px 0;font-weight:700;">${item}</li>`).join("")}</ol>`;
}

async function sendEmail(params: { to: string; from: string; subject: string; html: string }) {
  if (!env.resendApiKey || !resend) {
    console.warn("[email] RESEND_API_KEY ausente. E-mail não enviado.");
    return;
  }

  await resend.emails.send(params);
}

export async function sendWelcomeEmail(to: string, name: string) {
  const safeName = escapeHtml(name);
  await sendEmail({
    to,
    from: FROM_RELATIONSHIP,
    subject: `Bem-vindo ao Bora na Tech?, ${safeName}! 🧭`,
    html: layout(
      "Sua bússola está pronta.",
      `
        <p style="font-size:16px;line-height:1.6;font-weight:700;">Olá ${safeName}, sua conta foi criada com sucesso. Agora você tem acesso a áreas, roadmaps, cursos gratuitos e muito mais.</p>
        ${list([
          "Descubra sua área ideal com o Quiz de Carreira",
          "Explore os roadmaps para sua área",
          "Salve cursos e conteúdos nos favoritos",
          "Registre seus estudos no Diário",
        ])}
        ${button("Começar agora", "https://boranatech.com.br")}
        <p style="margin-top:20px;font-size:14px;font-weight:700;">P.S.: Quando quiser ir mais fundo, conheça o Plano Pro.</p>
      `,
    ),
  });
}

export async function sendProUpgradeEmail(to: string, name: string, planName: string) {
  const safeName = escapeHtml(name);
  const safePlanName = escapeHtml(planName);
  await sendEmail({
    to,
    from: FROM_TRANSACTIONAL,
    subject: "Você é Pro agora! ⚡",
    html: layout(
      `Bem-vindo ao Pro, ${safeName}!`,
      `
        <p style="font-size:16px;line-height:1.6;font-weight:700;">Sua assinatura ${safePlanName} está ativa. Todos os recursos estão desbloqueados.</p>
        ${list(proBenefits)}
        ${button("Acessar recursos Pro", "https://boranatech.com.br/pro/sucesso")}
        <p style="margin-top:20px;font-size:14px;font-weight:700;">Em caso de dúvidas, responda este e-mail.</p>
      `,
    ),
  });
}

export async function sendCancellationEmail(to: string, name: string) {
  const safeName = escapeHtml(name);
  await sendEmail({
    to,
    from: FROM_TRANSACTIONAL,
    subject: "Sua assinatura foi cancelada",
    html: layout(
      `Sentiremos sua falta, ${safeName}.`,
      `
        <p style="font-size:16px;line-height:1.6;font-weight:700;">Sua assinatura Pro foi cancelada. Você continua com acesso gratuito à plataforma.</p>
        <p style="font-size:16px;line-height:1.6;font-weight:700;">Se quiser voltar quando estiver pronto, é só acessar a página de planos.</p>
        ${button("Ver planos", "https://boranatech.com.br/pro")}
        <p style="margin-top:20px;font-size:14px;font-weight:700;">Antes de ir, conta pra gente: <a href="mailto:oi@boranatech.com.br" style="color:#1a1a1a;">o que poderíamos ter feito melhor?</a></p>
      `,
    ),
  });
}

export async function sendPaymentFailedEmail(to: string, name: string) {
  const safeName = escapeHtml(name);
  await sendEmail({
    to,
    from: FROM_TRANSACTIONAL,
    subject: "Problema com seu pagamento — ação necessária",
    html: layout(
      "Não conseguimos processar seu pagamento.",
      `
        <p style="font-size:16px;line-height:1.6;font-weight:700;">Olá ${safeName}, houve um problema ao cobrar sua assinatura Pro. Para manter o acesso, atualize seu método de pagamento.</p>
        ${button("Atualizar pagamento", "https://boranatech.com.br/perfil")}
        <p style="margin-top:20px;font-size:14px;font-weight:700;">Se não resolver, sua assinatura será cancelada em breve.</p>
      `,
    ),
  });
}
