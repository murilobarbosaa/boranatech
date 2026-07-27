/**
 * Classificação do estado de RLS de uma tabela, a partir das duas leituras.
 *
 * Mora fora do script para poder ser testada: a regra tem um caso que só
 * aparece em produção (erro de privilégio) e não pode ser verificada a olho.
 */

export type LeituraContagem =
  | { tipo: "ok"; n: number }
  | { tipo: "sem-privilegio" }
  | { tipo: "erro"; detalhe: string };

export type VeredictoRls =
  /** RLS ativa: o papel anon PODE consultar e a policy não devolve linha. */
  | { veredito: "protegida-por-policy" }
  /** REVOKE ou ausência de GRANT: o papel anon nem chega na tabela. */
  | { veredito: "protegida-por-privilegio" }
  /** Anon lê linhas E existe policy de SELECT pública que justifica. */
  | { veredito: "publica-declarada" }
  /** Anon lê linhas SEM policy que justifique: exposição. */
  | { veredito: "exposta"; comServico: number; comAnon: number }
  /** Sem veredito. NUNCA conta como verde. */
  | { veredito: "inconclusiva"; motivo: string };

/**
 * Por que "sem privilégio" é protegida e não inconclusiva: o papel anon recebeu
 * `42501 insufficient_privilege`, ou seja, o Postgres barrou antes de qualquer
 * policy. É uma defesa MAIS forte que RLS, não a ausência de uma.
 *
 * Por que ela é reportada em separado: as duas protegem em camadas diferentes.
 * Numa tabela protegida só por privilégio, a policy de RLS nunca é exercida por
 * esta verificação, então um `GRANT SELECT ... TO anon` futuro passaria a
 * depender de uma policy que ninguém conferiu.
 *
 * Por que erro NUNCA vira protegida: a versão anterior devolvia -1 para
 * qualquer resposta não-ok e o chamador tratava `<= 0` como protegida, então
 * uma falha de rede na leitura anon contava como sucesso do instrumento.
 */
export function classificarRls(
  comServico: LeituraContagem,
  comAnon: LeituraContagem | null,
  temSelectPublico: boolean,
): VeredictoRls {
  if (comServico.tipo === "erro") {
    return { veredito: "inconclusiva", motivo: `service role nao leu: ${comServico.detalhe}` };
  }
  if (comServico.tipo === "sem-privilegio") {
    return { veredito: "inconclusiva", motivo: "service role sem privilegio" };
  }
  if (comServico.n < 0) {
    return { veredito: "inconclusiva", motivo: "service role nao leu" };
  }
  // Tabela vazia nao prova nada: anon ver zero pode ser RLS ou pode ser que nao
  // ha o que ver.
  if (comServico.n === 0) return { veredito: "inconclusiva", motivo: "vazia" };
  if (comAnon === null) {
    return { veredito: "inconclusiva", motivo: "leitura anon nao foi feita" };
  }
  if (comAnon.tipo === "sem-privilegio") {
    return { veredito: "protegida-por-privilegio" };
  }
  if (comAnon.tipo === "erro") {
    return { veredito: "inconclusiva", motivo: `leitura anon falhou: ${comAnon.detalhe}` };
  }
  if (comAnon.n <= 0) return { veredito: "protegida-por-policy" };
  if (temSelectPublico) return { veredito: "publica-declarada" };
  return { veredito: "exposta", comServico: comServico.n, comAnon: comAnon.n };
}
