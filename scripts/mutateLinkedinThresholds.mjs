// Varredura de MUTACAO dos limiares numericos do Analisador de LinkedIn.
//
// Para cada limiar da tabela abaixo: troca o numero por um claramente
// diferente, roda a suite de testes do LinkedIn, e reporta se algum teste
// quebrou. Limiar cuja mutacao NAO quebra teste nenhum e limiar sem rede: da
// para mudar o valor em producao e nada acusa.
//
// Por que existe: na Fase 1B duas mutacoes acidentais (MIN_DESCRICAO_PARA_BULLETS
// de 48 para 999, e o limiar de candidata a headline de 6 para 9) passaram
// verdes. O segundo e exatamente o limiar que truncou "Node" e gerou a critica
// falsa sobre a headline. A varredura da Fase 1B-bis achou 5 descobertos em 49
// e os fechou; este script existe para a proxima fase que mexer em limiar rodar
// antes e depois.
//
// Uso: node scripts/mutateLinkedinThresholds.mjs
// Nao altera o repositorio: cada arquivo e restaurado logo apos a rodada.
// Interrupcao no meio (Ctrl+C) pode deixar UM arquivo mutado; confira git diff.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const R = process.cwd();
const N = "shared/linkedin/normalizeProfileText.ts";
const P = "shared/linkedin/parse.ts";
const L = "shared/linkedin/numeralLastro.ts";
const S = "shared/linkedin/schema.ts";
const C = "server/lib/linkedinChecks.ts";
const A = "server/lib/linkedinAnalyze.ts";

// [arquivo, nome do limiar, string original, string mutada]
const MUT = [
  [N, "MAX_CONTINUATION_LEN", "const MAX_CONTINUATION_LEN = 40;", "const MAX_CONTINUATION_LEN = 4;"],
  [N, "MAX_FRAGMENTO_LEN", "const MAX_FRAGMENTO_LEN = 30;", "const MAX_FRAGMENTO_LEN = 3;"],
  [N, "MAX_FRAGMENTO_TOKENS", "const MAX_FRAGMENTO_TOKENS = 3;", "const MAX_FRAGMENTO_TOKENS = 1;"],
  [N, "guarda de linha de data (80)", "DATE_LINE_LIKE.test(atual) && atual.length <= 80", "DATE_LINE_LIKE.test(atual) && atual.length <= 8"],
  [L, "faixa de ano (1900..2100)", "if (n >= 1900 && n <= 2100) return true;", "if (n >= 1990 && n <= 1991) return true;"],
  [P, "cabecalho de secao, len max (40)", "if (l.length === 0 || l.length > 40) return null;", "if (l.length === 0 || l.length > 4) return null;"],
  [P, "isDateRangeLine, len max (80)", "if (l.length > 80) return false;", "if (l.length > 8) return false;"],
  [P, "localizacao, len max (60)", "if (t.length === 0 || t.length > 60) return false;", "if (t.length === 0 || t.length > 6) return false;"],
  [P, "localizacao, max palavras (7)", "if (t.split(/\\s+/).length > 7) return false;", "if (t.split(/\\s+/).length > 1) return false;"],
  [P, "localizacao, max partes (4)", "if (partes.length === 0 || partes.length > 4) return false;", "if (partes.length === 0 || partes.length > 1) return false;"],
  [P, "localizacao, palavras por parte (4)", "(p) => comecaMaiuscula(p) && p.split(/\\s+/).length <= 4,", "(p) => comecaMaiuscula(p) && p.split(/\\s+/).length <= 1,"],
  [P, "cabecalho de bloco, len max (80)", "if (t.length === 0 || t.length > 80) return false;", "if (t.length === 0 || t.length > 8) return false;"],
  [P, "cabecalho de bloco, max palavras (12)", "if (t.split(/\\s+/).length > 12) return false;", "if (t.split(/\\s+/).length > 2) return false;"],
  [P, "headline candidata, len min (6)", "if (trimmed.length < 6 || trimmed.length > 250) return false;", "if (trimmed.length < 60 || trimmed.length > 250) return false;"],
  [P, "headline candidata, len max (250)", "if (trimmed.length < 6 || trimmed.length > 250) return false;", "if (trimmed.length < 6 || trimmed.length > 25) return false;"],
  [P, "preambulo sem secao (20 linhas)", "lines.slice(0, firstMainIndex) : lines.slice(0, 20);", "lines.slice(0, firstMainIndex) : lines.slice(0, 2);"],
  [P, "clip da headline (250)", "return clip(strong[strong.length - 1], 250);", "return clip(strong[strong.length - 1], 25);"],
  [P, "skill, len min (2)", "if (skill.length >= 2 && skill.length <= 60) out.push(skill);", "if (skill.length >= 20 && skill.length <= 60) out.push(skill);"],
  [P, "skill, len max (60)", "if (skill.length >= 2 && skill.length <= 60) out.push(skill);", "if (skill.length >= 2 && skill.length <= 6) out.push(skill);"],
  [P, "teto de skills (50)", "return Array.from(new Set(out)).slice(0, 50);", "return Array.from(new Set(out)).slice(0, 1);"],
  [P, "linhas de metadado apos a data (2)", "for (let n = 0; n < 2 && inicio < fim; n += 1) {", "for (let n = 0; n < 0 && inicio < fim; n += 1) {"],
  [S, "faixa inicio (39)", "if (score <= 39) return \"inicio\";", "if (score <= 3) return \"inicio\";"],
  [S, "faixa em-construcao (69)", "if (score <= 69) return \"em-construcao\";", "if (score <= 6) return \"em-construcao\";"],
  [S, "faixa forte (89)", "if (score <= 89) return \"forte\";", "if (score <= 8) return \"forte\";"],
  [S, "QUALITATIVE_VERSION", "export const QUALITATIVE_VERSION = 3;", "export const QUALITATIVE_VERSION = 9;"],
  [S, "DETERMINISTIC_VERSION", "export const DETERMINISTIC_VERSION = 3;", "export const DETERMINISTIC_VERSION = 9;"],
  [S, "peso essencial (10)", "  essencial: 10,", "  essencial: 11,"],
  [S, "peso importante (6)", "  importante: 6,", "  importante: 7,"],
  [S, "peso opcional (3)", "  opcional: 3,", "  opcional: 4,"],
  [A, "MIN_DESCRICAO_PARA_BULLETS (48)", "const MIN_DESCRICAO_PARA_BULLETS = 48;", "const MIN_DESCRICAO_PARA_BULLETS = 999;"],
  [A, "SOBRE_LIMIT (3000)", "const SOBRE_LIMIT = 3000;", "const SOBRE_LIMIT = 30;"],
  [A, "EXPERIENCIAS_LIMIT (6000)", "const EXPERIENCIAS_LIMIT = 6000;", "const EXPERIENCIAS_LIMIT = 60;"],
  [C, "headline-stack, min techs (2)", "aprovado: headlineTechs >= 2,", "aprovado: headlineTechs >= 9,"],
  [C, "headline-tamanho, min (40)", "const ok = len >= 40 && len <= 220;", "const ok = len >= 400 && len <= 220;"],
  [C, "headline-tamanho, max (220)", "const ok = len >= 40 && len <= 220;", "const ok = len >= 40 && len <= 22;"],
  [C, "sobre-existe, min (200)", "const ok = sobre.trim().length >= 200;", "const ok = sobre.trim().length >= 2000;"],
  [C, "sobre-gancho, max 1a frase (140)", "        first.length <= 140 &&", "        first.length <= 14 &&"],
  [C, "sobre-stack, min techs (3)", "aprovado: sobreTechs >= 3,", "aprovado: sobreTechs >= 9,"],
  [C, "sobre-tamanho, min (500)", "const ok = len >= 500 && len <= 2200;", "const ok = len >= 5000 && len <= 2200;"],
  [C, "sobre-tamanho, max (2200)", "const ok = len >= 500 && len <= 2200;", "const ok = len >= 500 && len <= 220;"],
  [C, "exp-existe, min (1)", "aprovado: parsed.experiencias.length >= 1,", "aprovado: parsed.experiencias.length >= 9,"],
  [C, "exp-descricoes, min chars (100)", "const ok = len >= 100;", "const ok = len >= 100000;"],
  [C, "exp-verbos-acao, min (2)", "aprovado: verbCount >= 2,", "aprovado: verbCount >= 99,"],
  [C, "exp-tecnologias, min (2)", "aprovado: expTechs >= 2,", "aprovado: expTechs >= 99,"],
  [C, "cobertura-keywords-area (0.5)", "aprovado: coverageRatio >= 0.5,", "aprovado: coverageRatio >= 0.01,"],
  [C, "cobertura-keywords-otima (0.75)", "aprovado: coverageRatio >= 0.75,", "aprovado: coverageRatio >= 0.01,"],
  [C, "skills-quantidade (10)", "aprovado: skillsForm.length >= 10,", "aprovado: skillsForm.length >= 1,"],
  [C, "skills-cobertura (0.5)", "aprovado: skillsRatio >= 0.5,", "aprovado: skillsRatio >= 0.01,"],
  [C, "skills-quantidade-otima (25)", "aprovado: skillsForm.length >= 25,", "aprovado: skillsForm.length >= 1,"],
];

const ALVOS = "shared/linkedin server/lib/linkedin client/src/components/linkedin";
const linhas = [];
for (const [rel, nome, de, para] of MUT) {
  const abs = `${R}/${rel}`;
  const orig = readFileSync(abs, "utf8");
  const ocorrencias = orig.split(de).length - 1;
  if (ocorrencias !== 1) {
    linhas.push({ rel, nome, status: ocorrencias === 0 ? "ANCORA NAO ENCONTRADA" : `ANCORA AMBIGUA (${ocorrencias}x)` });
    continue;
  }
  const linha = orig.slice(0, orig.indexOf(de)).split("\n").length;
  writeFileSync(abs, orig.replace(de, para));
  let coberto = false, saida = "";
  try {
    execSync(`npx vitest run ${ALVOS} --silent 2>&1`, { cwd: R, encoding: "utf8", stdio: "pipe" });
  } catch (e) {
    coberto = true;
    saida = String(e.stdout ?? "");
  }
  writeFileSync(abs, orig);
  const quebrados = [...saida.matchAll(/^\s+×\s+(.+?)\s+\d+ms$/gm)].map((m) => m[1]);
  linhas.push({ rel, linha, nome, de: de.trim(), para: para.trim(), coberto, quebrados: quebrados.slice(0, 2) });
  console.log(`${coberto ? "OK  " : "GAP "} ${rel}:${linha}  ${nome}`);
}
if (process.env.SP) writeFileSync(`${process.env.SP}/mutacao.json`, JSON.stringify(linhas, null, 2));
const gaps = linhas.filter((l) => l.coberto === false);
console.log(`\n=== ${linhas.length} limiares | cobertos: ${linhas.filter((l) => l.coberto).length} | DESCOBERTOS: ${gaps.length} ===`);
for (const g of gaps) console.log(`  GAP  ${g.rel}:${g.linha}  ${g.nome}`);
for (const l of linhas.filter((x) => x.status)) console.log(`  ??   ${l.rel}  ${l.nome}: ${l.status}`);
