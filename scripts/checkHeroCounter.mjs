// Verificação de largura do contador do hero, em Chrome de verdade.
//
// Por que existe: o contador ficou travado em "+0" no mobile e as duas
// correções anteriores passaram verde. O motivo é que o defeito era GEOMÉTRICO
// (o alvo do IntersectionObserver caía dentro da faixa morta lateral criada por
// um rootMargin negativo), e jsdom não tem layout: lá todo getBoundingClientRect
// é zero e nenhum teste de unidade consegue enxergar a condição. Este script é
// o instrumento que roda no ambiente que genuinamente TEM layout.
//
// Uso:
//   pnpm dev:client                       # em outro terminal
//   pnpm check:hero-counter
//   BASE_URL=http://localhost:4173 pnpm check:hero-counter
//
// Não roda no CI porque depende de um Chrome instalado e de um servidor de pé.
// É verificação de release manual, versionada aqui de propósito: checklist que
// mora só na conversa some na primeira compactação de contexto.
//
// LIMITE CONHECIDO: TODAS as amostras rodam DESLOGADAS.
//
// O que este script cobre é a home de um visitante anônimo. Nesse caminho os dois
// gates que envolvem o Router em `App.tsx` são passagem pura: o `AuthCallbackGate`
// devolve `children` direto sem `callbackIssue`, e o `ConsentGate` devolve
// `children` quando `!gateActive`, sendo `gateActive = Boolean(userId) && ...`.
// Sem sessão, nenhum dos dois monta DOM nem adia o mount do hero.
//
// Logado é outra árvore. O `ConsentGate` passa a poder renderizar o estado
// `checking` (tela cheia com spinner) antes de liberar o Router, e o hero só monta
// depois disso. Esse caminho NÃO é exercitado aqui, então um "26 amostras OK" não
// autoriza a conclusão "o contador está certo para todo mundo", só para quem chega
// deslogado.
//
// Cobrir o caso logado exige semear sessão do Supabase no browser (token no
// storage que o supabase-js lê), o que é trabalho à parte e não está feito.
// Enquanto não estiver, este comentário é o que impede o próximo leitor de ler
// cobertura total onde há cobertura parcial: instrumento cujo escopo encolheu em
// silêncio é a classe de defeito que o CLAUDE.md cataloga, e a versão barata da
// contramedida é dizer no próprio instrumento o que ele não mede.

import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const { default: puppeteer } = await import("puppeteer-core");

// VALOR SERVIDO PELO TESTE, não valor esperado do mundo real.
//
// A versão anterior comparava com a constante "2776" e semeava o `localStorage`,
// afirmando no comentário que assim não dependia do backend. **Isso era falso.**
// O componente lê o cache só como valor INICIAL e em seguida busca
// `/api/stats/users-count`; quando o backend responde, a resposta sobrescreve a
// semente. Em desenvolvimento o dev server fala com a API real, então o script
// media contra o dado de produção. Em 2026-07-28 a contagem passou de 2776 para
// 2922 e as 26 amostras reprovaram por DADO, não por defeito da página.
//
// Teste que reprova pelo motivo errado é teste que alguém desativa, e este é
// justamente o instrumento que provou o bug original.
//
// Agora o script INTERCEPTA a chamada e serve um valor conhecido. A asserção
// passou a ser relacional: "o contador chega ao valor que a API devolveu", em
// todas as larguras. Nenhum número literal do mundo real aparece aqui, então não
// há o que envelhecer.
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SERVED_COUNT = Number(process.env.HERO_COUNTER_VALUE ?? 4321);
if (!Number.isInteger(SERVED_COUNT) || SERVED_COUNT <= 0) {
  console.error(
    `[hero-counter] HERO_COUNTER_VALUE inválido: ${process.env.HERO_COUNTER_VALUE}`,
  );
  process.exit(1);
}
// O que a página deve exibir, formatado como o componente formata (pt-BR).
const EXPECTED = SERVED_COUNT.toLocaleString("pt-BR").replace(/[.\s]/g, "");
const ENDPOINT = "/api/stats/users-count";

// Larguras cobertas. As quatro do meio são as que quebravam em produção; 360
// entra porque é a largura "de teste" onde o bug NÃO aparecia, e foi por isso
// que ele sobreviveu a duas correções.
const WIDTHS = [320, 344, 360, 375, 390, 402, 412, 430, 480, 640, 768, 1024, 1440];

function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    console.error(
      "[hero-counter] Chrome não encontrado. Defina CHROME_PATH apontando para o binário.",
    );
    process.exit(1);
  }
  return found;
}

const res = await fetch(BASE_URL).catch(() => null);
if (!res || !res.ok) {
  console.error(
    `[hero-counter] ${BASE_URL} não respondeu. Suba o servidor antes (pnpm dev:client).`,
  );
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: resolveChrome(),
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

// Lê o número renderizado no badge do hero. Devolve null se o badge não existir:
// badge ausente é FALHA, nunca "pulado". Um seletor que deixou de casar tem que
// derrubar a verificação, senão ela passa sobre uma superfície vazia.
async function readCounter(page) {
  return page.evaluate(() => {
    const badge = Array.from(document.querySelectorAll("span")).find((s) =>
      /pessoas já encontraram/.test(s.textContent || ""),
    );
    if (!badge) return null;
    const m = (badge.textContent || "").match(/\+\s*([\d.]+)\s*pessoas/);
    return m ? m[1].replace(/[.\s]/g, "") : null;
  });
}

async function sample({ width, reduced }) {
  const page = await browser.newPage();
  try {
    if (reduced) {
      await page.emulateMediaFeatures([
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
    }
    await page.setViewport({ width, height: 800, deviceScaleFactor: 1 });

    // INTERCEPTA a chamada do contador e serve um valor conhecido.
    //
    // Substitui a semeadura do `localStorage`, que não isolava nada: o cache é
    // só o valor INICIAL, e a resposta da API sobrescreve. Interceptar corta a
    // dependência na origem, e a asserção passa a ser "a página exibe o que a
    // API devolveu", que continua verdadeira quando a contagem real mudar.
    //
    // `atendida` prova que a rota foi de fato exercitada: se o componente parar
    // de chamar este endpoint, a intercepção nunca dispara e o teste passaria
    // medindo um valor que veio de outro lugar. Sem essa contagem, o instrumento
    // encolheria em silêncio.
    let atendida = 0;
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (req.url().includes(ENDPOINT)) {
        atendida += 1;
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ count: SERVED_COUNT }),
        });
        return;
      }
      req.continue();
    });

    // Sem semear o `localStorage`: a resposta interceptada tem que ser a única
    // origem do número. Se o cache entrasse aqui, um acerto poderia vir dele.
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });

    // Movimento reduzido: tem que já estar no valor final, sem animar.
    await new Promise((r) => setTimeout(r, 250));
    const early = await readCounter(page);

    await new Promise((r) => setTimeout(r, 2500));
    const final = await readCounter(page);

    return { early, final, atendida };
  } finally {
    await page.close();
  }
}

const failures = [];

for (const reduced of [false, true]) {
  console.log(
    `\n[hero-counter] prefers-reduced-motion: ${reduced ? "reduce" : "no-preference"}`,
  );
  console.log("  largura | @250ms | final  | veredito");
  console.log("  --------|--------|--------|---------");
  for (const width of WIDTHS) {
    const { early, final, atendida } = await sample({ width, reduced });

    const problems = [];
    // Rota não exercitada: o número na tela veio de outro lugar que não a
    // resposta que este teste controla, e comparar com ele não prova nada.
    if (atendida === 0) problems.push("a página não chamou " + ENDPOINT);
    if (final === null) problems.push("badge não encontrado");
    else if (final !== EXPECTED)
      problems.push(`final=${final}, servido=${EXPECTED}`);
    // Movimento reduzido não pode animar: o valor final já tem que estar lá.
    if (reduced && early !== EXPECTED) problems.push(`animou (@250ms=${early})`);

    if (problems.length) failures.push({ width, reduced, problems });
    console.log(
      `  ${String(width).padEnd(7)} | ${String(early ?? "-").padEnd(6)} | ${String(
        final ?? "-",
      ).padEnd(6)} | ${problems.length ? "FALHOU: " + problems.join(", ") : "ok"}`,
    );
  }
}

await browser.close();

const total = WIDTHS.length * 2;
if (failures.length) {
  console.error(
    `\n[hero-counter] ${failures.length} de ${total} amostras falharam:`,
  );
  for (const f of failures) {
    console.error(
      `  - ${f.width}px (reduced=${f.reduced}): ${f.problems.join(", ")}`,
    );
  }
  process.exit(1);
}

console.log(
  `\n[hero-counter] ${total} amostras OK (${WIDTHS.length} larguras x 2 modos de movimento), todas no valor servido pela API interceptada (+${SERVED_COUNT.toLocaleString("pt-BR")}).`,
);
