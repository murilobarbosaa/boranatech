import crypto from "crypto";

/**
 * Impressão digital do texto analisado, para saber se DUAS análises leram o
 * mesmo perfil sem guardar o perfil.
 *
 * O problema que resolve: `ReanalyzeCta` rodava nova análise com o texto que já
 * estava em memória, então quem aplicava as melhorias e clicava recebia a mesma
 * nota, gastava cota e aprendia que as melhorias não funcionam. Medido nas 157
 * linhas persistidas: 32 pares consecutivos do mesmo usuário analisaram texto
 * idêntico, e 25 deles (78%) devolveram nota idêntica.
 *
 * Por que HASH e não o texto: `profileText` é o perfil inteiro da pessoa, com
 * telefone, e-mail e histórico profissional. Guardar isso para responder uma
 * pergunta de sim/não seria trocar uma dívida de produto por uma de retenção. O
 * hash responde "é o mesmo texto?" e não responde mais nada: não dá para
 * reconstruir o perfil a partir dele, e ele não vaza nada se a linha vazar.
 *
 * Custo assumido, e é o mesmo da rodada anterior: o hash NÃO permite reprocessar
 * o passado. Quando a correção da headline mudou o que o parser entrega à régua,
 * não deu para simular a nota nova linha a linha justamente porque o texto não
 * está persistido, e o hash não muda isso. Ele serve para o FUTURO (esta análise
 * leu o mesmo texto da anterior?), não para arqueologia.
 *
 * NORMALIZA antes de hashear, e a normalização é mínima de propósito: `trim` nas
 * pontas e quebras de linha unificadas em `\n`. Sem isso, o MESMO PDF relido
 * daria hash diferente só porque o `\r\n` do Windows entrou na conta, e o aviso
 * de "texto igual" nunca dispararia no caso em que ele mais importa. Não
 * normaliza mais que isso (não colapsa espaço interno, não muda caixa) porque
 * qualquer edição real da pessoa PRECISA mudar o hash: normalizar demais faria o
 * aviso disparar sobre um texto que ela genuinamente editou.
 *
 * SHA-256 e não um hash curto: colisão aqui produziria um aviso falso de "nada
 * mudou" sobre um perfil que mudou, que é exatamente o bug que estamos
 * consertando, uma camada abaixo.
 */
export function hashDoTexto(texto: string): string {
  const normalizado = texto.replace(/\r\n?/g, "\n").trim();
  return crypto.createHash("sha256").update(normalizado, "utf8").digest("hex");
}
