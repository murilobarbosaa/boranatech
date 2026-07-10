// Renderizacao do corpo das campanhas de e-mail, compartilhada entre o template
// do server (server/lib/email.ts) e o preview da aba Emails do admin, pra o
// preview refletir exatamente o que sai no e-mail. Regra: quebra de linha dupla
// vira <p>, quebra simples vira <br>, conteudo SEMPRE escapado (nunca
// interpolar HTML cru do formulario).

// Mesmo estilo do helper paragraph() de server/lib/email.ts.
const PARAGRAPH_STYLE =
  "margin:0 0 14px;font-size:15px;line-height:1.6;color:#444444;";

export function escapeCampaignHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderCampaignBodyHtml(body: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="${PARAGRAPH_STYLE}">${escapeCampaignHtml(block).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}
