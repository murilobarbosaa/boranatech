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
const H = "shared/linkedin/sectionHeadings.ts";
const L = "shared/linkedin/numeralLastro.ts";
const S = "shared/linkedin/schema.ts";
const V = "shared/linkedin/reguaV2.ts";
const C = "server/lib/linkedinChecks.ts";
const A = "server/lib/linkedinAnalyze.ts";
const I = "server/lib/linkedinIdioma.ts";

// [arquivo, nome do limiar, string original, string mutada]
const MUT = [
  [
    N,
    "MAX_CONTINUATION_LEN",
    "const MAX_CONTINUATION_LEN = 40;",
    "const MAX_CONTINUATION_LEN = 4;",
  ],
  [
    N,
    "MAX_FRAGMENTO_LEN",
    "const MAX_FRAGMENTO_LEN = 30;",
    "const MAX_FRAGMENTO_LEN = 3;",
  ],
  [
    N,
    "MAX_FRAGMENTO_TOKENS",
    "const MAX_FRAGMENTO_TOKENS = 3;",
    "const MAX_FRAGMENTO_TOKENS = 1;",
  ],
  [
    N,
    "guarda de linha de data (80)",
    "DATE_LINE_LIKE.test(atual) && atual.length <= 80",
    "DATE_LINE_LIKE.test(atual) && atual.length <= 8",
  ],
  [
    L,
    "faixa de ano (1900..2100)",
    "if (n >= 1900 && n <= 2100) return true;",
    "if (n >= 1990 && n <= 1991) return true;",
  ],
  [
    H,
    "cabecalho de secao, len max (60)",
    "if (normalized.length === 0 || normalized.length > 60) return null;",
    "if (normalized.length === 0 || normalized.length > 6) return null;",
  ],
  [
    P,
    "isDateRangeLine, len max (80)",
    "if (l.length > 80) return false;",
    "if (l.length > 8) return false;",
  ],
  [
    P,
    "identidade em secao, sobra minima da secao (1)",
    "if (fim - inicio + 1 - dentro < 1) return false;",
    "if (fim - inicio + 1 - dentro < 2) return false;",
  ],
  [
    P,
    "identidade em secao, palavras minimas da ancora de nome (2)",
    "nomeAncora.trim().split(/\\s+/).length < 2",
    "nomeAncora.trim().split(/\\s+/).length < 1",
  ],
  [
    P,
    "localizacao, len max (60)",
    "if (t.length === 0 || t.length > 60) return false;",
    "if (t.length === 0 || t.length > 6) return false;",
  ],
  [
    P,
    "localizacao, max palavras (7)",
    "if (t.split(/\\s+/).length > 7) return false;",
    "if (t.split(/\\s+/).length > 1) return false;",
  ],
  [
    P,
    "localizacao, max partes (3)",
    "if (partes.length === 0 || partes.length > 3) return false;",
    "if (partes.length === 0 || partes.length > 1) return false;",
  ],
  [
    P,
    "localizacao, palavras por parte (4)",
    "return partes.every((p) => comecaMaiuscula(p) && p.split(/\\s+/).length <= 4);",
    "return partes.every((p) => comecaMaiuscula(p) && p.split(/\\s+/).length <= 1);",
  ],
  [
    P,
    "cabecalho de bloco, len max (80)",
    "if (t.length === 0 || t.length > 80) return false;",
    "if (t.length === 0 || t.length > 8) return false;",
  ],
  [
    P,
    "cabecalho de bloco, max palavras (12)",
    "if (t.split(/\\s+/).length > 12) return false;",
    "if (t.split(/\\s+/).length > 2) return false;",
  ],
  [
    P,
    "headline candidata, len min (6)",
    "if (trimmed.length < 6 || trimmed.length > 250) return false;",
    "if (trimmed.length < 60 || trimmed.length > 250) return false;",
  ],
  [
    P,
    "headline candidata, len max (250)",
    "if (trimmed.length < 6 || trimmed.length > 250) return false;",
    "if (trimmed.length < 6 || trimmed.length > 25) return false;",
  ],
  [
    P,
    "continuacao de headline, len min (2)",
    "if (t.length < 2 || t.length > 60) return false;",
    "if (t.length < 20 || t.length > 60) return false;",
  ],
  [
    P,
    "continuacao de headline, len max (60)",
    "if (t.length < 2 || t.length > 60) return false;",
    "if (t.length < 2 || t.length > 6) return false;",
  ],
  [
    P,
    "heading desconhecido, faixa de tamanho (6..60)",
    "if (t.length < 6 || t.length > 60) return false;",
    "if (t.length < 60 || t.length > 60) return false;",
  ],
  [
    P,
    "heading desconhecido, faixa de palavras (2..6)",
    "if (palavras.length < 2 || palavras.length > 6) return false;",
    "if (palavras.length < 20 || palavras.length > 6) return false;",
  ],
  [
    P,
    "fronteira principal proxima da identidade (4 linhas)",
    "firstMainIndex > grupo.fim && firstMainIndex - grupo.fim <= 4;",
    "firstMainIndex > grupo.fim && firstMainIndex - grupo.fim <= 1;",
  ],
  [
    P,
    "preambulo sem secao (20 linhas)",
    "Math.min(20, lines.length)",
    "Math.min(2, lines.length)",
  ],
  [
    P,
    "linha de nome, len max (60)",
    "anterior.length <= 60 &&",
    "anterior.length <= 6 &&",
  ],
  [
    P,
    "linha de nome, max palavras (6)",
    "anterior.split(/\\s+/).length <= 6 &&",
    "anterior.split(/\\s+/).length <= 1 &&",
  ],
  [
    P,
    "clip da headline (250)",
    'clip(valorComposto.replace(/\\s+/g, " "), 250)',
    'clip(valorComposto.replace(/\\s+/g, " "), 25)',
  ],
  [
    P,
    "possivel identidade em skills, min palavras (2)",
    "palavras.length >= 2 && pareceNomeEstrutural(linha)",
    "palavras.length >= 20 && pareceNomeEstrutural(linha)",
  ],
  [
    P,
    "skill, len min (2)",
    "if (skill.length >= 2 && skill.length <= 60) out.push(skill);",
    "if (skill.length >= 20 && skill.length <= 60) out.push(skill);",
  ],
  [
    P,
    "skill, len max (60)",
    "if (skill.length >= 2 && skill.length <= 60) out.push(skill);",
    "if (skill.length >= 2 && skill.length <= 6) out.push(skill);",
  ],
  [
    P,
    "teto de skills (50)",
    "return Array.from(new Set(out)).slice(0, 50);",
    "return Array.from(new Set(out)).slice(0, 1);",
  ],
  [
    P,
    "linhas de metadado apos a data (2)",
    "for (let n = 0; n < 2 && inicio < fim; n += 1) {",
    "for (let n = 0; n < 0 && inicio < fim; n += 1) {",
  ],
  [
    S,
    "faixa inicio (39)",
    'if (score <= 39) return "inicio";',
    'if (score <= 3) return "inicio";',
  ],
  [
    S,
    "faixa em-construcao (69)",
    'if (score <= 69) return "em-construcao";',
    'if (score <= 6) return "em-construcao";',
  ],
  [
    S,
    "faixa forte (89)",
    'if (score <= 89) return "forte";',
    'if (score <= 8) return "forte";',
  ],
  [
    S,
    "QUALITATIVE_VERSION",
    "export const QUALITATIVE_VERSION = 3;",
    "export const QUALITATIVE_VERSION = 9;",
  ],
  // Piso do numero da experiencia (Fase 2, lote 1). Entra em MUT, e nao em
  // NAO_LIMIAR, porque e fronteira de verdade: e ele que faz zero e negativo
  // serem barrados pelo SCHEMA, uma camada antes do lastro. Note que a
  // descoberta automatica NAO enxerga `.min(1)` (nenhum PADROES_SITIO casa com
  // essa forma), entao sem esta entrada o limiar ficaria sem cobertura e o
  // guard reportaria sucesso, que e a falha classica deste arquivo. A ancora e
  // conferida contra a fonte pelo modo --auditar.
  [
    S,
    "piso do experienciaNumero (1)",
    "    .int()\n    .min(1)",
    "    .int()\n    .min(0)",
  ],
  // Limiares do detector de idioma (Fase 2, lote 6). Todos em MUT, e nao em
  // NAO_LIMIAR, porque sao fronteira de verdade: mexer neles muda quem reprova,
  // e reprovar de menos deixa passar texto no idioma errado enquanto reprovar
  // de mais custa uma chamada paga e troca texto bom por generico. Os testes
  // que travam cada um estao em server/lib/linkedinIdioma.test.ts.
  [
    I,
    "MIN_PALAVRAS do detector de idioma",
    "const MIN_PALAVRAS = 6;",
    "const MIN_PALAVRAS = 1;",
  ],
  [
    I,
    "MIN_SINAIS do detector de idioma",
    "const MIN_SINAIS = 2;",
    "const MIN_SINAIS = 1;",
  ],
  [
    I,
    "MARGEM_MINIMA do detector de idioma",
    "const MARGEM_MINIMA = 2;",
    "const MARGEM_MINIMA = 1;",
  ],
  [
    I,
    "FATOR_DOMINANCIA do detector de idioma",
    "const FATOR_DOMINANCIA = 2;",
    "const FATOR_DOMINANCIA = 1;",
  ],
  // Limites de entrada e persistência, não pesos da régua. Ainda são
  // fronteiras de contrato e uma mudança acidental precisa quebrar teste.
  [
    S,
    "LINKEDIN_SKILLS_MAX",
    "export const LINKEDIN_SKILLS_MAX = 3_000;",
    "export const LINKEDIN_SKILLS_MAX = 300;",
  ],
  [
    S,
    "HEADLINE_MANUAL_MAX",
    "export const HEADLINE_MANUAL_MAX = 250;",
    "export const HEADLINE_MANUAL_MAX = 25;",
  ],
  [
    S,
    "DETERMINISTIC_VERSION",
    "export const DETERMINISTIC_VERSION = 8;",
    "export const DETERMINISTIC_VERSION = 99;",
  ],
  [S, "peso essencial (10)", "  essencial: 10,", "  essencial: 11,"],
  [S, "peso importante (6)", "  importante: 6,", "  importante: 7,"],
  [S, "peso opcional (3)", "  opcional: 3,", "  opcional: 4,"],
  [
    A,
    "MIN_DESCRICAO_PARA_BULLETS (48)",
    "const MIN_DESCRICAO_PARA_BULLETS = 48;",
    "const MIN_DESCRICAO_PARA_BULLETS = 999;",
  ],
  [
    A,
    "SOBRE_LIMIT (3000)",
    "const SOBRE_LIMIT = 3000;",
    "const SOBRE_LIMIT = 30;",
  ],
  [
    A,
    "EXPERIENCIAS_LIMIT (6000)",
    "const EXPERIENCIAS_LIMIT = 6000;",
    "const EXPERIENCIAS_LIMIT = 60;",
  ],
  [
    A,
    "pontosFortes da resposta da IA (3)",
    "if (validation.data.pontosFortes.length < 3) {",
    "if (validation.data.pontosFortes.length < 30) {",
  ],
  [
    C,
    "headline-stack, min techs (2)",
    "aprovado: headlineTechs >= 2,",
    "aprovado: headlineTechs >= 9,",
  ],
  [
    C,
    "headline-tamanho, min (40)",
    "const ok = len >= 40 && len <= 220;",
    "const ok = len >= 400 && len <= 220;",
  ],
  [
    C,
    "headline-tamanho, max (220)",
    "const ok = len >= 40 && len <= 220;",
    "const ok = len >= 40 && len <= 22;",
  ],
  [
    C,
    "sobre-existe, min (200)",
    "const ok = sobre.trim().length >= 200;",
    "const ok = sobre.trim().length >= 2000;",
  ],
  [
    C,
    "sobre-gancho, max 1a frase (140)",
    "        first.length <= 140 &&",
    "        first.length <= 14 &&",
  ],
  [
    C,
    "sobre-stack, min techs (3)",
    "aprovado: sobreTechs >= 3,",
    "aprovado: sobreTechs >= 9,",
  ],
  [
    C,
    "exp-existe, min (1)",
    "aprovado: parsed.experiencias.length >= 1,",
    "aprovado: parsed.experiencias.length >= 9,",
  ],
  [
    C,
    "exp-verbos-acao, min (2)",
    "aprovado: verbCount >= 2,",
    "aprovado: verbCount >= 99,",
  ],
  [
    C,
    "exp-tecnologias, min (2)",
    "aprovado: expTechs >= 2,",
    "aprovado: expTechs >= 99,",
  ],
  [
    C,
    "skills-quantidade (10)",
    "aprovado: skillsForm.length >= 10,",
    "aprovado: skillsForm.length >= 1,",
  ],
  [
    C,
    "skills-quantidade-otima (25)",
    "aprovado: skillsForm.length >= 25,",
    "aprovado: skillsForm.length >= 1,",
  ],
  [
    V,
    "cobertura v2, teto absoluto essencial (6)",
    "Math.min(6, Math.ceil(pool / 2))",
    "Math.min(1, Math.ceil(pool / 2))",
  ],
  [
    V,
    "corte de competencias: limitado pelo comprovado",
    "Math.min(essencial, tecnologiasComprovadas)",
    "Math.min(essencial, tecnologiasComprovadas + 9)",
  ],
  [
    V,
    "corte de competencias: guarda de zero",
    "alcancavel: tecnologiasComprovadas > 0",
    "alcancavel: tecnologiasComprovadas >= 0",
  ],
  [
    V,
    "cobertura v2, teto absoluto otima (10)",
    "Math.min(10, Math.ceil(pool * 0.75))",
    "Math.min(1, Math.ceil(pool * 0.75))",
  ],
  [
    V,
    "cobertura v2, proporcao essencial (2)",
    "Math.ceil(pool / 2)",
    "Math.ceil(pool / 9)",
  ],
  [
    V,
    "cobertura v2, proporcao otima (0.75)",
    "Math.ceil(pool * 0.75)",
    "Math.ceil(pool * 0.05)",
  ],
  [V, "densidade leve, sobreMin (300)", "sobreMin: 300,", "sobreMin: 30,"],
  [
    V,
    "sobreMax (2200)",
    "sobreMax: 2200,\n        descricaoPorExperiencia: 50,",
    "sobreMax: 220,\n        descricaoPorExperiencia: 50,",
  ],
  [V, "densidade padrao, sobreMin (500)", "sobreMin: 500,", "sobreMin: 50,"],
  [
    V,
    "densidade leve, descricao por experiencia (50)",
    "descricaoPorExperiencia: 50,",
    "descricaoPorExperiencia: 5,",
  ],
  [
    V,
    "densidade padrao, descricao por experiencia (100)",
    "descricaoPorExperiencia: 100,",
    "descricaoPorExperiencia: 10,",
  ],
];

// MODO VIZINHANCA (--vizinhanca). As mutacoes da tabela acima sao de ordem de
// grandeza e respondem "esse limiar e usado?". A Fase 3 move fronteiras por
// poucos pontos, e a pergunta dela e outra: "essa fronteira esta no lugar
// certo?". Um limiar pode estar coberto contra 40 -> 4 e descoberto contra
// 40 -> 41. Foi assim que o peso `essencial` apareceu como buraco: o mutante
// que o pegou era de +1.
//
// [arquivo, nome, template com {N}, valor atual]
const VIZINHOS = [
  [S, "peso essencial", "  essencial: {N},", "10"],
  [S, "peso importante", "  importante: {N},", "6"],
  [S, "peso opcional", "  opcional: {N},", "3"],
  [C, "skills-quantidade", "aprovado: skillsForm.length >= {N},", "10"],
  [C, "skills-quantidade-otima", "aprovado: skillsForm.length >= {N},", "25"],
  [C, "sobre-tamanho, min", "const ok = len >= {N} && len <= 2200;", "500"],
  [C, "sobre-tamanho, max", "const ok = len >= 500 && len <= {N};", "2200"],
  [C, "exp-descricoes", "const ok = len >= {N};", "100"],
  [S, "faixa inicio", 'if (score <= {N}) return "inicio";', "39"],
  [S, "faixa em-construcao", 'if (score <= {N}) return "em-construcao";', "69"],
  [S, "faixa forte", 'if (score <= {N}) return "forte";', "89"],
  [
    V,
    "densidade leve, sobreMin",
    "sobreMin: {N},\n        sobreMax: 2200,\n        descricaoPorExperiencia: 50,",
    "300",
  ],
  [
    V,
    "densidade leve, descricao/exp",
    "descricaoPorExperiencia: {N},\n      }",
    "50",
  ],
];

// Passo por limiar: razao usa 0.01 e 0.02, inteiro usa 1 e 2.
const passos = (valor) => (valor.includes(".") ? [0.01, 0.02] : [1, 2]);
const fmt = (base, delta) => {
  const n = Number(base) + delta;
  return base.includes(".") ? String(Number(n.toFixed(4))) : String(n);
};

// ============================================================================
// DESCOBERTA A PARTIR DA FONTE
//
// Terceira instancia do mesmo defeito nesta auditoria: guard cuja cobertura e
// lista escrita a mao. A migration dependia de alguem lembrar; o regex de
// checkMigrationsApplied cobria 38 de 72 tabelas; o pre-commit tinha lista de
// arquivos e liberou arvore vermelha. Todos falharam PASSANDO.
//
// A tabela MUT acima e exatamente isso: 49 limiares escritos a mao. Um limiar
// novo simplesmente nao apareceria, e o script reportaria 49/49 sobre uma
// superficie menor, com cara de tudo certo.
//
// A partir daqui a fonte de verdade e o CODIGO. O script varre os arquivos,
// enumera todo sitio numerico, e exige que cada um esteja em UMA das duas
// listas: coberto por MUT/VIZINHOS, ou declarado NAO-LIMIAR com motivo. Sitio
// em nenhuma das duas FALHA a execucao. Limiar novo na Fase 3 obriga uma
// decisao explicita em vez de sumir em silencio.
// ============================================================================

const FONTES = [
  "shared/linkedin/normalizeProfileText.ts",
  "shared/linkedin/numeralLastro.ts",
  "shared/linkedin/parse.ts",
  "shared/linkedin/sectionHeadings.ts",
  "shared/linkedin/schema.ts",
  "shared/linkedin/proximosPassos.ts",
  "shared/linkedin/molduraAspiracional.ts",
  "shared/linkedin/reguaV2.ts",
  "server/lib/linkedinChecks.ts",
  "server/lib/linkedinAnalyze.ts",
  // Modulo da delimitacao anti-injection (Fase 2, lote 3). Entra aqui HOJE sem
  // nenhum sitio numerico, e e esse o ponto: o escopo do guard acompanha o
  // codigo, entao um limiar que nasca nele ja nasce tendo de ser classificado.
  // Guard cujo escopo e escrito a mao e revisto depois e a falha que este
  // arquivo inteiro documenta.
  "server/lib/linkedinBlocoDeDados.ts",
  // Costura do texto depois da remocao (Fase 2, lote 4). Mesmo motivo do
  // modulo acima: entra sem sitio numerico nenhum hoje, para que um limiar que
  // nasca aqui ja nasca tendo de ser classificado.
  "server/lib/linkedinCosturaDeTexto.ts",
  // Deteccao de invento em prosa (Fase 2, lote 5). Mesmo motivo dos dois
  // modulos acima: entra sem sitio numerico hoje, para que um limiar que nasca
  // aqui ja nasca tendo de ser classificado.
  "server/lib/linkedinLastroProsa.ts",
  // Detector de idioma (Fase 2, lote 6). Este ENTRA com limiares de verdade, e
  // os quatro estao em MUT: sao eles que decidem se um campo reprova e custa
  // uma chamada.
  "server/lib/linkedinIdioma.ts",
  // Tipos e agregacao do lastro (Fase 3, lote 4). Entra porque a janela do
  // painel de violacoes e o teto de sanidade da consulta nasceram aqui, e um
  // numero de consulta que ninguem classifica e exatamente o que este guard
  // existe para nao deixar passar. Os dois estao em NAO_LIMIAR com motivo: nao
  // decidem veredito nenhum sobre perfil.
  "shared/linkedin/lastro.ts",
];

const PADROES_SITIO = [
  /^(?:export\s+)?const\s+[A-Z][A-Z0-9_]*\s*=\s*-?\d+(?:\.\d+)?\s*;/,
  /[<>]=?\s*-?\d+(?:\.\d+)?/,
  /===?\s*-?\d+(?:\.\d+)?/,
  /\.slice\(\s*-?\d+\s*(?:,\s*-?\d+\s*)?\)/,
  /:\s*-?\d+(?:\.\d+)?\s*,\s*$/,
];

// NAO-LIMIARES declarados, com motivo. Cada entrada e um par [regex, motivo].
// Entrar aqui e uma decisao: significa "este numero existe, eu olhei, e mudar
// ele nao muda comportamento observavel que valha teste de fronteira".
const NAO_LIMIAR = [
  [/\.length\s*===?\s*0\b/, "checagem de vazio, nao e fronteira"],
  [/\.length\s*>\s*0\b/, "checagem de nao-vazio, nao e fronteira"],
  [
    /\.size > 0\b/,
    "checagem de conjunto nao-vazio, mesma familia de .length > 0",
  ],
  [/^for \(let \w+ = 0;/, "contador de laco"],
  [/^for \(let \w+ = 1;/, "contador de laco"],
  [/^\s*(?:let|const) \w+ = -?[01];?$/, "inicializacao de acumulador"],
  [/i \+= 1|n \+= 1|from \+= |\+= PAGE/, "passo de laco"],
  [
    /melhor < 0|idx < 0|posTermo < 0|indexOf\(.*\) >= 0|>= 0\)/,
    "guarda de indice nao encontrado",
  ],
  [/slice\(0, 300\)/, "corte de mensagem de erro para log"],
  [/slice\(0, 1500\)/, "teto do texto de dedup persistido, nao entra em check"],
  [/temperature:/, "parametro do modelo, nao limiar de regra"],
  [
    /const (?:AI_MAX_ATTEMPTS|MAX_TOKENS) =/,
    "parametro operacional da chamada de IA",
  ],
  [/const AI_BACKOFF_MS/, "backoff de retry"],
  // --- Fase 3, lote 4: painel de violacoes de lastro no admin. Os dois sao de
  // CONSULTA, nao de regra: nenhum deles participa de check, nota, faixa ou
  // veredito sobre perfil de usuario. Mudar qualquer um muda o que o admin
  // enxerga, nunca o que a pessoa recebe, entao nao ha teste de comportamento
  // para um mutante derrubar. Regex estreitos de proposito, casando o nome.
  [
    /const LASTRO_JANELA_DIAS =/,
    "janela do painel do admin, nao entra em check nem em nota",
  ],
  [
    /const LASTRO_ANALISES_MAX =/,
    "teto de sanidade da consulta do admin, nao entra em check nem em nota",
  ],
  // --- Classificados em 2026-08-01, ao colocar este guard num gate. Ele
  // abortava na arvore limpa havia semanas com 6 orfaos, tres deles produzidos
  // pela propria auditoria. Cada regex e estreita de proposito: uma ampla
  // engoliria limiar de verdade no futuro, que e o oposto do que este arquivo
  // existe para fazer.
  [
    /^while \(\w+ > 0\)/,
    "guarda de laco para tras na juncao de headline, nao e fronteira",
  ],
  [
    /juntou: partes\.length > 1/,
    "quantos pedacos foram juntados, nao e limiar de regra",
  ],
  [
    /^\s*acimaIdx >= 0$/,
    "guarda de indice nao encontrado (sem parentese, o padrao geral nao casa)",
  ],
  [
    /^if \(dono < 0\) return true;$/,
    "guarda de indice nao encontrado: sem heading antes do bloco, ele nao e conteudo de secao",
  ],
  [
    /p\.possivel > 0/,
    "descarte de grupo vazio na decomposicao, nao e fronteira",
  ],
  [/cadastradas === 1/, "singular\/plural na copy do detalhe, nao e limiar"],
  [/possivel === 0/, "divisao por zero"],
  [/keyTechs\.length === 0/, "divisao por zero"],
  [/faixaFromScore|score <= /, "fronteira de faixa, coberta em VIZINHOS"],
  [/=== 1 \? "" : "s"|=== 1$|length === 1/, "plural de copy"],
  [/\+ 1\]|\- 1\]|\[i \+ 1\]|\[i - 1\]/, "acesso a vizinho de array"],
  [/hashEstavel|2166136261|16777619/, "constantes do hash FNV-1a"],
  [/charCodeAt|>>> 0/, "aritmetica do hash"],
  [
    /cobre\.length === 1|nomes\.length <= 1|partes\.length === 0/,
    "formatacao de lista",
  ],
  [
    /saida\.length >= MAX_ITENS|slice\(0, MAX_ITENS\)|< MAX_ITENS/,
    "uso do teto MAX_ITENS, declarado abaixo",
  ],
  [/const MAX_ITENS = 3;/, "teto de itens recomendados, nao entra em nota"],
  [
    /t\.length >= 4|length >= 4|length < 4/,
    "tamanho minimo de token de credencial, nao entra em nota",
  ],
  [
    /\.slice\(0, 20\)/,
    "teto de linhas de formacao e certificacoes, nao entra em check",
  ],
  [
    /\.slice\(0, 6\)|\.slice\(0, 7\)|slice\(0, -1\)|slice\(0, 2\)/,
    "teto de itens em texto de prompt ou copy",
  ],
  [
    /n === 0/,
    "estado vazio de descricao, coberto por MIN_DESCRICAO_PARA_BULLETS",
  ],
  [
    /nivel === alvo \? 1 : 0|cobre\.length \* 3/,
    "pesos da recomendacao, nao entram em nota",
  ],
  [/for \(let n = 0; n < 2/, "metadados apos a data, coberto em MUT"],
  [
    /abertos\.length > 0|restante \/ abertos\.length/,
    "water-filling do orcamento",
  ],
  [/token\.length > 3/, "tamanho minimo de token no casamento de contexto"],
  [/\bn >= 1900\b|n <= 2100/, "faixa de ano, coberta em MUT"],
  [/content\.slice\(1\)/, "pula a linha de titulo quando a secao nao tem data"],
  [
    /: outputChars > 0/,
    "houve saida do modelo, mesma checagem de nao-vazio de .length > 0: decide entre estimar por chars e nao estimar, nao e fronteira de valor",
  ],
  [
    /posMarcador >= 0 && posMarcador < posTermo/,
    "ordem entre indices, nao e numero de regra",
  ],
  [
    /if \(idx <= 0\) return null;/,
    "guarda de indice em palavraAnterior: zero significa numeral no inicio do texto, nao ha palavra antes. Nao e fronteira de valor",
  ],
  [/headlineIdx <= 0/, "guarda de indice: nao ha linha anterior a headline"],
  [
    /indice: -1|indice: confirmado \? inicio : -1|grupo\.inicio === 0|grupo\.inicio > 0|inicio > 0|offset === 0/,
    "sentinelas e guardas de posição na região estrutural, não são limiares",
  ],
  [
    /identidadeStart >= 0|firstMainIndex >= 0/,
    "sentinela de posicao estrutural encontrada no parser, nao e limiar",
  ],
  [
    /headingAnterior >= 0 && headingPosterior >= 0|boundary < 0/,
    "sentinelas de fronteira estrutural encontrada, nao sao limiares",
  ],
  [/porItem\.total > 0/, "guarda de lista vazia no veredito por item"],
  [/porItem\.reprovadas\.length > 1/, "plural de copy"],
  [
    /sobreMax: 2200,/,
    "teto do Sobre, coberto em VIZINHOS pelo mutante de sobre-tamanho",
  ],
  [
    /Math\.max\(essencial \+ 1/,
    "trava otima > essencial, coberta por teste dedicado com pool 1",
  ],
  [
    /mudaram\.length > 0/,
    "guarda de lista vazia na deteccao de autodeclaracao",
  ],
  [/skillsRatio/, "razao antiga, mantida so no calculo do detail informativo"],
  [
    /\.filter\(\(i\) => i > 0\)/,
    "sentinela 0 = indice base-1 valido, nao e limiar",
  ],
];

function descobrirSitios() {
  const sitios = [];
  for (const rel of FONTES) {
    const linhas = readFileSync(`${R}/${rel}`, "utf8").split("\n");
    linhas.forEach((bruta, i) => {
      const t = bruta.trim();
      if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
      if (!PADROES_SITIO.some((re) => re.test(t))) return;
      sitios.push({ rel, linha: i + 1, texto: t });
    });
  }
  return sitios;
}

function auditarCobertura() {
  const conhecidos = [
    ...MUT.map(([rel, , de]) => ({ rel, de })),
    ...VIZINHOS.map(([rel, , template, valor]) => ({
      rel,
      de: template.replace("{N}", valor),
    })),
  ];
  const sitios = descobrirSitios();
  const orfaos = [];
  let cobertos = 0;
  let declarados = 0;
  for (const s of sitios) {
    // Casa nos DOIS sentidos. Cada avaliador de check escreve o mesmo limiar
    // duas vezes, uma no `aprovado` e outra na copy do `detail`, e a segunda
    // aparece como sitio proprio, mais curto. O nome da variavel vai junto na
    // comparacao de proposito: `headlineTechs >= 2`, `verbCount >= 2` e
    // `expTechs >= 2` sao TRES limiares distintos com o mesmo numero, e casar
    // so por operador e numero daria cobertura falsa a dois deles.
    const casa = (k) =>
      k.rel === s.rel &&
      (s.texto.includes(k.de.trim()) || k.de.trim().includes(s.texto));
    if (conhecidos.some(casa)) {
      cobertos += 1;
      continue;
    }
    if (NAO_LIMIAR.some(([re]) => re.test(s.texto))) {
      declarados += 1;
      continue;
    }
    orfaos.push(s);
  }
  // OS DOIS NUMEROS CONTAM COISAS DIFERENTES, e a saida diz isso de propósito.
  // "sitios cobertos" sao LINHAS de codigo que casaram com alguma ancora;
  // "limiares" sao ENTRADAS da tabela MUT. Nao podem ser iguais por construcao:
  //   - uma linha com dois numeros (`length < 6 || length > 250`) e UM sitio e
  //     DUAS entradas;
  //   - uma entrada pode casar com DOIS sitios (o `aprovado` e a copy do
  //     `detail` repetem a mesma comparacao).
  // Sem este rotulo, 54 contra 55 se le como off-by-one, que e exatamente a
  // classe de defeito que este script existe para nao ter.
  const ancoras = new Set(conhecidos.map((k) => `${k.rel}|${k.de.trim()}`));
  console.log(
    `[descoberta] ${sitios.length} sitios numericos na fonte | ${cobertos} SITIOS cobertos por ancora | ${declarados} declarados nao-limiar | ${orfaos.length} ORFAOS`,
  );
  console.log(
    `[descoberta] ${conhecidos.length} ENTRADAS de mutante em ${ancoras.size} ancoras distintas (entrada != sitio: ver comentario em auditarCobertura)`,
  );
  if (orfaos.length > 0) {
    console.log(
      "\nSITIO NUMERICO QUE O SCRIPT NAO CONHECE. Classifique cada um: se for",
    );
    console.log(
      "limiar, acrescente em MUT (e em VIZINHOS se a Fase 3 mexer nele); se nao",
    );
    console.log("for, acrescente em NAO_LIMIAR com o motivo.\n");
    for (const o of orfaos)
      console.log(`  ${o.rel}:${o.linha}  ${o.texto.slice(0, 100)}`);
    process.exit(1);
  }
  return sitios.length;
}

const ALVOS =
  "shared/linkedin server/lib/linkedin client/src/components/linkedin";
const VIZINHANCA = process.argv.includes("--vizinhanca");

/**
 * MODO AUDITORIA (--auditar). Roda so a descoberta e a conferencia de ancoras,
 * sem mutar nada e sem rodar a suite. Leva segundos; o modo completo leva mais
 * de dez minutos, porque roda a suite inteira uma vez por mutante.
 *
 * Existe porque este script estava FORA de qualquer gate e abortava na arvore
 * limpa havia semanas, com 6 sitios numericos orfaos, tres deles produzidos
 * pela propria auditoria que o criou. Guard que ninguem invoca carrega a mesma
 * informacao que um que sempre passa: zero. E o modo completo nao cabe num
 * gate, entao a parte que cabe e esta.
 *
 * O que ele afirma, e sao duas direcoes:
 *   - todo sitio numerico da fonte esta classificado (em MUT ou NAO_LIMIAR);
 *   - toda ancora de MUT ainda CASA com a fonte.
 *
 * A segunda foi acrescentada em 2026-08-01 porque duas ancoras estavam
 * obsoletas e o script reportava `??` saindo com exit 0: `clip da headline
 * (250)` parou de casar quando o `eeda681` mudou a linha, e `DETERMINISTIC_VERSION`
 * quando a versao passou de 4. Limiar que deixa de ser mutado nao e testado, e
 * o silencio era indistinguivel de cobertura.
 */
const AUDITAR = process.argv.includes("--auditar");

// Auditoria de escopo SEMPRE, nos dois modos: um limiar novo nao pode passar
// despercebido so porque a rodada era de vizinhanca.
auditarCobertura();

if (AUDITAR) {
  const semAncora = MUT.filter(([rel, , de]) => {
    const fonte = readFileSync(`${R}/${rel}`, "utf8");
    return !fonte.includes(de);
  });
  if (semAncora.length > 0) {
    console.error(
      `\nANCORA DE MUTANTE QUE NAO CASA MAIS COM A FONTE (${semAncora.length}).`,
    );
    console.error(
      "O limiar deixou de ser mutado, entao deixou de ser testado, e o script",
    );
    console.error("reportava isso como `??` saindo com exit 0.\n");
    for (const [rel, nome, de] of semAncora) {
      console.error(`  ${rel}  ${nome}\n      esperava: ${de}`);
    }
    process.exit(1);
  }
  console.log(
    `[auditar] ok: todo sitio numerico classificado, e as ${MUT.length} ancoras de mutante casam com a fonte.`,
  );
  process.exit(0);
}

function rodarTestes(R, ALVOS) {
  try {
    execSync(`npx vitest run ${ALVOS} --silent 2>&1`, {
      cwd: R,
      encoding: "utf8",
      stdio: "pipe",
    });
    return false;
  } catch {
    return true;
  }
}

if (VIZINHANCA) {
  const out = [];
  for (const [rel, nome, template, valor] of VIZINHOS) {
    const abs = `${R}/${rel}`;
    const orig = readFileSync(abs, "utf8");
    const de = template.replace("{N}", valor);
    if (orig.split(de).length - 1 !== 1) {
      out.push({ nome, rel, status: "ANCORA NAO ENCONTRADA OU AMBIGUA", de });
      console.log(`??   ${rel}  ${nome}: ancora "${de}" nao bate`);
      continue;
    }
    const linha = orig.slice(0, orig.indexOf(de)).split("\n").length;
    const resultado = {};
    for (const passo of passos(valor)) {
      for (const sinal of [-1, 1]) {
        const novo = fmt(valor, sinal * passo);
        writeFileSync(abs, orig.replace(de, template.replace("{N}", novo)));
        resultado[`${sinal > 0 ? "+" : "-"}${passo}`] = rodarTestes(R, ALVOS);
        writeFileSync(abs, orig);
      }
    }
    const menor = passos(valor)[0];
    const cobertoNoMenor = resultado[`-${menor}`] || resultado[`+${menor}`];
    out.push({ nome, rel, linha, valor, resultado, cobertoNoMenor });
    const marca = Object.entries(resultado)
      .map(([k, v]) => `${k}:${v ? "quebra" : "PASSA"}`)
      .join("  ");
    console.log(
      `${cobertoNoMenor ? "OK  " : "GAP "} ${nome.padEnd(26)} ${valor.padEnd(6)} ${marca}`,
    );
  }
  // Artefato so quando pedido: escrever na raiz do repo por padrao ja fez
  // um vizinhanca.json entrar em commit por engano.
  if (process.env.SP)
    writeFileSync(
      `${process.env.SP}/vizinhanca.json`,
      JSON.stringify(out, null, 2),
    );
  const gaps = out.filter((o) => o.cobertoNoMenor === false);
  console.log(
    `\n=== vizinhanca: ${out.length} limiares | com cobertura de fronteira: ${out.length - gaps.length} | SEM: ${gaps.length} ===`,
  );
  for (const g of gaps)
    console.log(`  GAP  ${g.rel}:${g.linha}  ${g.nome} (${g.valor})`);
  process.exit(0);
}

const linhas = [];
for (const [rel, nome, de, para] of MUT) {
  const abs = `${R}/${rel}`;
  const orig = readFileSync(abs, "utf8");
  const ocorrencias = orig.split(de).length - 1;
  if (ocorrencias !== 1) {
    linhas.push({
      rel,
      nome,
      status:
        ocorrencias === 0
          ? "ANCORA NAO ENCONTRADA"
          : `ANCORA AMBIGUA (${ocorrencias}x)`,
    });
    continue;
  }
  const linha = orig.slice(0, orig.indexOf(de)).split("\n").length;
  writeFileSync(abs, orig.replace(de, para));
  let coberto = false,
    saida = "";
  try {
    execSync(`npx vitest run ${ALVOS} --silent 2>&1`, {
      cwd: R,
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch (e) {
    coberto = true;
    saida = String(e.stdout ?? "");
  }
  writeFileSync(abs, orig);
  const quebrados = [...saida.matchAll(/^\s+×\s+(.+?)\s+\d+ms$/gm)].map(
    (m) => m[1],
  );
  linhas.push({
    rel,
    linha,
    nome,
    de: de.trim(),
    para: para.trim(),
    coberto,
    quebrados: quebrados.slice(0, 2),
  });
  console.log(`${coberto ? "OK  " : "GAP "} ${rel}:${linha}  ${nome}`);
}
if (process.env.SP)
  writeFileSync(
    `${process.env.SP}/mutacao.json`,
    JSON.stringify(linhas, null, 2),
  );
const gaps = linhas.filter((l) => l.coberto === false);
console.log(
  `\n=== ${linhas.length} limiares | cobertos: ${linhas.filter((l) => l.coberto).length} | DESCOBERTOS: ${gaps.length} ===`,
);
for (const g of gaps) console.log(`  GAP  ${g.rel}:${g.linha}  ${g.nome}`);
for (const l of linhas.filter((x) => x.status))
  console.log(`  ??   ${l.rel}  ${l.nome}: ${l.status}`);
