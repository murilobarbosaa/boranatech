import type { TipoViolacao, Violacao } from "../../shared/linkedin/lastro";

/**
 * PAYLOAD SEGURO DE OBSERVABILIDADE do analisador de LinkedIn (Fase 4).
 *
 * A Fase 3 tirou texto de usuario da telemetria do cliente. Este modulo faz o
 * mesmo do lado do servidor, onde o vazamento era maior: `registrarViolacao`
 * gravava `contexto` no `console.warn` (que vai para o stdout do Railway) e no
 * `extra` do Sentry, e `contexto` NAO e um rotulo, e o texto. Medido nas
 * origens em `linkedinAnalyze.ts`: `sobreReescrito` e
 * `modeloMensagemRecrutador` INTEIROS, a headline sugerida e o rotulo da
 * experiencia do perfil.
 *
 * Agravante de volume: o log sai em TODA ocorrencia por desenho (e ele que da a
 * contagem exata), enquanto o Sentry e amostrado a 60s por tipo. O stdout via,
 * portanto, o total, nao a amostra.
 *
 * A PROTECAO MORA AQUI DENTRO, e nao nos doze sitios que montam `Violacao`.
 * Regra da casa: guarda no chamador precisa ser repetida em cada chamador e
 * some no primeiro que alguem esquecer; guarda dentro da funcao cobre todos por
 * construcao, inclusive os que ainda nao existem.
 */

/**
 * ESCOPO DESTA CORRECAO, e o que ficou deliberadamente de fora.
 *
 * `contexto` SAI. Ele carrega campo inteiro e e 100% do vazamento medido.
 *
 * `termo` FICA, e com teto de tamanho. A decisao merece registro porque a
 * primeira versao deste modulo redigia `termo` tambem, por leitura literal da
 * regra ("texto de usuario ou derivado"), e isso custava mais do que entregava:
 *
 *   - `termo` nunca e campo de perfil. E um token curto de uma de quatro
 *     familias: tecnologia do catalogo `ALL_TECHNOLOGIES`, numeral
 *     (`40%`, `37`), contagem estrutural (`3 bullet(s)`,
 *     `experienciaNumero 5 fora de 1..3`) ou enum de gate (`idioma`);
 *   - e o unico campo que diz O QUE o modelo fabricou, que e exatamente o que
 *     calibra o prompt. Sem ele o painel sabe que houve invencao e nao sabe de
 *     que, e o lote existe para dar visibilidade, nao para tirar;
 *   - redigi-lo mudaria quatro valores congelados em tres goldens e tres
 *     expectativas de teste ja existentes, e o protocolo do harness exige
 *     autorizacao previa para mexer em golden. Nao ha autorizacao neste lote.
 *
 * O teto existe porque uma das familias (`skill_estudo_sem_lastro`) traz uma
 * string que o MODELO escreveu, e por isso nao tem tamanho garantido por
 * catalogo. `MAX_TERMO_CHARS` a limita sem alterar nenhum valor real: o maior
 * termo observado nos goldens tem 32 caracteres.
 *
 * PENDENCIA REGISTRADA: se a decisao de produto for redigir `termo` tambem, o
 * caminho e autorizar a regravacao dos quatro valores nos goldens
 * `prosa-numeral-inventado`, `prosa-tech-inventada` e `skills-estudo-filtradas`
 * e atualizar tres asserts em `linkedinLastroProsa.test.ts` e
 * `linkedinSkillsEstudo.test.ts`.
 */
export const MAX_TERMO_CHARS = 80;

/**
 * TODOS os tipos da uniao, para o teste comparar por IGUALDADE DE CONJUNTO com
 * `TipoViolacao`.
 *
 * Existe porque a primeira versao deste modulo classificou `termo` a partir de
 * uma leitura PARCIAL da uniao: `prosa_tecnologia_sem_lastro` ficou de fora e o
 * comportamento divergiu em silencio ate um teste alheio acusar. A contramedida
 * da casa para essa classe e afirmar o TOTAL, nao a pertinencia. Tipo novo na
 * uniao quebra o teste e obriga uma decisao explicita sobre o `termo` dele.
 */
export const TODOS_OS_TIPOS_CLASSIFICADOS: ReadonlySet<TipoViolacao> =
  new Set<TipoViolacao>([
    "numeral_fabricado",
    "numeral_tipo_trocado",
    "tecnologia_sem_lastro",
    "bullet_sem_origem",
    "bloco_experiencia_invalida",
    "skill_estudo_sem_lastro",
    "prosa_tecnologia_sem_lastro",
    "prosa_numeral_sem_lastro",
    "colar_tecnologia_sem_lastro",
    "colar_numeral_sem_lastro",
    "idioma_incorreto",
    "vazamento_delimitador",
  ]);

/** Sufixo do corte, para ninguem ler um termo cortado como termo inteiro. */
export const SUFIXO_CORTE = "[cortado]";

export interface ViolacaoParaLog {
  tipo: TipoViolacao;
  campo: string;
  /**
   * Tamanho do contexto, NUNCA o contexto. Serve para distinguir um campo curto
   * de um Sobre inteiro sem carregar uma letra do texto.
   */
  contextoChars: number;
  /** Token curto do que foi fabricado, com teto. Ver o bloco de escopo acima. */
  termo: string;
}

/** Corta sem nunca deixar o corte passar por valor inteiro. */
function comTeto(termo: string): string {
  if (termo.length <= MAX_TERMO_CHARS) return termo;
  return `${termo.slice(0, MAX_TERMO_CHARS)}${SUFIXO_CORTE}`;
}

/**
 * Converte uma violacao no que pode sair para log e para o Sentry.
 *
 * Puro e sincrono de proposito: quem chama nao ganha um caminho novo de falha,
 * e o teste anti-vazamento consegue afirmar a saida sem montar o fluxo inteiro.
 */
export function violacaoParaLog(v: Violacao): ViolacaoParaLog {
  return {
    tipo: v.tipo,
    campo: v.campo,
    contextoChars: v.contexto.length,
    termo: comTeto(v.termo),
  };
}
