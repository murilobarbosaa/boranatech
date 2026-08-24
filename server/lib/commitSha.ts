/**
 * SHA do commit que ESTE processo está servindo.
 *
 * Existe para "o deploy subiu?" ser uma linha de curl contra `/api/health` em
 * vez de aritmética sobre `uptime`. Uptime responde "há quanto tempo o processo
 * está de pé", que é outra pergunta: um restart sem deploy zera o uptime e
 * parece deploy, e um deploy que demora zera o uptime tarde e parece que não
 * subiu. O sha responde a pergunta que realmente se faz.
 *
 * A variável é injetada pelo Railway no ambiente do container. Fora dele (dev
 * local, CI, testes) ela não existe, e ISSO É UM ESTADO NOMEADO: `null`, nunca
 * string vazia. `""` no payload seria indistinguível de um sha que chegou
 * vazio, e quem lê o health não tem como separar os dois; a normalização de
 * `""` para `null` está aqui dentro, e não no call site, porque o call site é
 * quem esquece.
 *
 * Lê `process.env` A CADA CHAMADA de propósito, não no import: o custo é uma
 * leitura de objeto por requisição de health, e em troca os dois estados
 * (presente e ausente) são exercitáveis sem reimportar o módulo.
 */
export function commitShaAtual(): string | null {
  const bruto = process.env.RAILWAY_GIT_COMMIT_SHA?.trim();
  return bruto ? bruto : null;
}
