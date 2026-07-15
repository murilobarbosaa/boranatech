// Renderizacao do corpo das campanhas de e-mail, compartilhada entre o template
// do server (server/lib/email.ts) e o preview da aba Emails do admin, pra o
// preview refletir exatamente o que sai no e-mail. Regra: quebra de linha dupla
// vira <p>, quebra simples vira <br>, conteudo SEMPRE escapado (nunca
// interpolar HTML cru do formulario).

// Mesmo estilo do helper paragraph() de server/lib/email.ts.
const PARAGRAPH_STYLE =
  "margin:0 0 14px;font-size:15px;line-height:1.6;color:#444444;";

// Placeholder de nome (assunto e corpo das campanhas). Substituido no ENVIO, por
// destinatario. Documentado aqui como a UNICA forma reconhecida.
export const NAME_PLACEHOLDER = "{nome}";

// Troca {nome} pelo primeiro nome do destinatario. Opera no texto CRU, antes do
// escape (renderCampaignBodyHtml no corpo, escapeCampaignHtml no assunto), entao
// o nome passa pelo MESMO escape do resto: um "&" no nome nunca quebra o e-mail.
// Regras:
// - com nome: troca todas as ocorrencias do token exato {nome}.
// - sem nome (vazio/so espacos): o token SOME junto com um unico espaco/tab
//   imediatamente anterior ("Oi {nome}," -> "Oi,", nunca "Oi ,").
// - token nao reconhecido (ex: {nomee}) fica intacto: so o token exato e trocado,
//   entao "{nome}" literal nunca chega ao destinatario.
export function applyNamePlaceholder(text: string, firstName: string): string {
  const name = firstName.trim();
  if (name) {
    return text.split(NAME_PLACEHOLDER).join(name);
  }
  return text.replace(/[ \t]?\{nome\}/g, "");
}

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
