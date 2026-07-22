// Preenchimento do template SVG do certificado (Parte 1: so gera o SVG; a
// conversao para PDF/PNG e a Parte 2). Funcao pura que le o template do disco
// (uma vez, cache em memoria), troca SO o texto interno das 5 ancoras
// (id="cert-*") e substitui o QR decorativo falso do design por um QR real
// escaneavel. Nenhuma alteracao no desenho alem disso.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import QRCode from "qrcode";

// Base URL da pagina publica de verificacao. Valor CANONICO em
// client/src/components/certificates/constants.ts (SITE_URL / verificationUrl);
// replicado aqui de proposito porque aquele modulo e client-only e nao deve
// entrar no bundle do server. Duplicacao SINALIZADA: se um dia virar shared,
// unificar os dois pontos. Nao chumbar em nenhum lugar novo sem este aviso.
const SITE_URL = "https://boranatech.com.br";
function verificationUrl(code: string): string {
  return `${SITE_URL}/certificados/${code}`;
}

// Caixa do QR no design (a MESMA regiao ocupada pelo QR falso removido). rx=12
// preserva o canto arredondado original do fundo branco.
const QR_BOX = { x: 1644, y: 1820, size: 220 } as const;
const QR_INSET = 12;

// O esbuild nao empacota o .svg no bundle; ele e lido via fs. Em producao o
// build copia o template para dist/templates/ (scripts/copyCertTemplate.mjs);
// em dev ele vive em server/templates/. Resolve o primeiro que existir, para
// funcionar nos dois ambientes independentemente de o Railway podar (ou nao) o
// codigo-fonte em runtime.
const TEMPLATE_CANDIDATES = [
  path.resolve(process.cwd(), "dist/templates/certificate.svg"),
  path.resolve(process.cwd(), "server/templates/certificate.svg"),
];

let cachedTemplate: string | null = null;
function loadTemplate(): string {
  if (cachedTemplate === null) {
    const templatePath = TEMPLATE_CANDIDATES.find((candidate) =>
      existsSync(candidate),
    );
    if (!templatePath) {
      throw new Error(
        "template do certificado nao encontrado (dist/templates ou server/templates)",
      );
    }
    cachedTemplate = readFileSync(templatePath, "utf8");
  }
  return cachedTemplate;
}

// Escape XML: um nome com & ou < nunca pode quebrar o SVG.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Substituicao SEGURA: localiza a ancora pela id e troca SO o texto interno de
// <tspan id="cert-<id>">...</tspan>. Nao usa regex fragil sobre o SVG inteiro;
// opera por indices das fronteiras exatas da tag.
function setAnchor(svg: string, id: string, value: string): string {
  const marker = `id="cert-${id}"`;
  const markerIdx = svg.indexOf(marker);
  if (markerIdx === -1) {
    throw new Error(`ancora cert-${id} ausente no template do certificado`);
  }
  const openEnd = svg.indexOf(">", markerIdx);
  const closeIdx = svg.indexOf("</tspan>", openEnd);
  if (openEnd === -1 || closeIdx === -1) {
    throw new Error(`tspan cert-${id} malformado no template do certificado`);
  }
  return svg.slice(0, openEnd + 1) + escapeXml(value) + svg.slice(closeIdx);
}

// Data de emissao estavel em DD/MM/AAAA, fixada em America/Sao_Paulo para nunca
// "voltar um dia" por conversao de fuso UTC.
function formatDateBR(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

// QR real como SVG, encaixado na caixa do design. Cor escura #0B1020 sobre
// branco (mesmo contraste do design), com quiet zone (margin) + fundo branco
// arredondado, centralizado na caixa. O SVG do qrcode e aninhado com seu
// proprio viewBox, escalado para caber na area util.
async function buildQrGroup(code: string): Promise<string> {
  const url = verificationUrl(code);
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    color: { dark: "#0B1020", light: "#FFFFFF" },
  });
  const viewBox = /viewBox="([^"]+)"/.exec(qrSvg)?.[1] ?? "0 0 33 33";
  const inner = qrSvg.slice(
    qrSvg.indexOf(">") + 1,
    qrSvg.lastIndexOf("</svg>"),
  );
  const innerX = QR_BOX.x + QR_INSET;
  const innerY = QR_BOX.y + QR_INSET;
  const innerSize = QR_BOX.size - QR_INSET * 2;
  return (
    `<g id="cert-qr">` +
    `<rect x="${QR_BOX.x}" y="${QR_BOX.y}" width="${QR_BOX.size}" height="${QR_BOX.size}" rx="12" fill="#FFFFFF"/>` +
    `<svg x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" ` +
    `viewBox="${viewBox}" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">` +
    `${inner}</svg>` +
    `</g>`
  );
}

// Fronteiras exatas do bloco do QR falso: do fundo branco 220x220 (unico no
// arquivo) ate o inicio do texto do codigo (elemento imediatamente seguinte).
// Ambas as strings sao unicas no template, entao o corte e deterministico.
const FAKE_QR_START =
  '<rect x="1644.0" y="1820" width="220" height="220" rx="12" fill="#FFFFFF"/>';
const FAKE_QR_END = '<text x="1754.0" y="2090"';

function replaceFakeQr(svg: string, qrGroup: string): string {
  const start = svg.indexOf(FAKE_QR_START);
  const end = svg.indexOf(FAKE_QR_END, start);
  if (start === -1 || end === -1) {
    throw new Error("bloco do QR falso nao localizado no template do certificado");
  }
  return svg.slice(0, start) + qrGroup + svg.slice(end);
}

export interface CertificateRenderData {
  holderName: string;
  roadmapTitle: string;
  hours: number;
  issuedAt: string;
  code: string;
}

// Preenche um template (com ou sem fontes embutidas) com os dados do snapshot.
// Ordem: ancoras primeiro (texto), QR por ultimo (troca de bloco).
async function fillTemplate(
  template: string,
  data: CertificateRenderData,
): Promise<string> {
  let svg = template;
  // O design mostra o nome em caixa alta: uppercase pt-BR (preserva acentos).
  svg = setAnchor(svg, "nome", data.holderName.toLocaleUpperCase("pt-BR"));
  svg = setAnchor(svg, "trilha", data.roadmapTitle);
  svg = setAnchor(svg, "horas", `${data.hours} HORAS`);
  svg = setAnchor(svg, "data", formatDateBR(data.issuedAt));
  svg = setAnchor(svg, "codigo", data.code);
  const qrGroup = await buildQrGroup(data.code);
  return replaceFakeQr(svg, qrGroup);
}

// SVG com as fontes EMBUTIDAS (base64). E este que o PDF e o PNG usam: o
// Chromium precisa das fontes embutidas. NAO alterar o comportamento aqui.
export async function renderCertificateSvg(
  data: CertificateRenderData,
): Promise<string> {
  return fillTemplate(loadTemplate(), data);
}

// SVG de TELA, LEVE: sem o bloco de fontes embutidas (~263KB). A pagina do
// certificado carrega Outfit/Bricolage via @font-face e renderiza este SVG
// INLINE, entao as fontes vem da pagina (identico visualmente, muito mais leve).
// NAO usar para PDF/PNG (que precisam das fontes embutidas).
let cachedScreenTemplate: string | null = null;
function loadScreenTemplate(): string {
  if (cachedScreenTemplate === null) {
    // Remove o unico <style> do template (o bloco de @font-face nos defs).
    cachedScreenTemplate = loadTemplate().replace(/<style>[\s\S]*?<\/style>/, "");
  }
  return cachedScreenTemplate;
}

export async function renderCertificateScreenSvg(
  data: CertificateRenderData,
): Promise<string> {
  return fillTemplate(loadScreenTemplate(), data);
}
