/**
 * Camada ÚNICA de lastro do texto gerado pela IA.
 *
 * Três rodadas produziram três instâncias do mesmo mecanismo: competências
 * sugeridas sem lastro, numeral fabricado em bullet, e tecnologia sem lastro em
 * headline. A origem é sempre a mesma: a lista de tecnologias faltantes vai no
 * prompt e o modelo a lê como lista de coisas a usar. Em vez de uma verificação
 * por campo, esta é uma só, aplicada a todos os campos de texto gerado.
 *
 * TRÊS POLÍTICAS, e a diferença entre elas é o que o campo É, não onde ele
 * mora. O critério em uma pergunta: se este texto sair errado, o usuário
 * PUBLICA o erro, ou apenas lê um comentário errado sobre o perfil dele?
 *
 * POLÍTICA 1, REMOÇÃO CIRÚRGICA. Campos curtos e estruturados, onde tirar um
 * termo não quebra a leitura:
 *   - `headlines`: lastro de TECNOLOGIA (contra keywordsEncontradas).
 *   - `bulletsReescritos`: lastro de TECNOLOGIA e de NUMERAL, os dois contra o
 *     texto da experiência daquele bloco, nunca contra o perfil inteiro. A
 *     experiência do bloco é identificada pelo `experienciaNumero` que o modelo
 *     devolve, o mesmo que o prompt numerou. Número fora do intervalo real
 *     descarta o bloco inteiro: não existe caminho que devolva bullet sem ter
 *     sido conferido contra uma experiência de verdade.
 *   - `skillsParaEstudar`: origem fechada, só sai da lista de faltantes
 *     entregue no prompt; item fora dela é descartado da lista.
 *     (`skillsParaAdicionarAgora` não é do modelo, é calculado em código.)
 *
 * POLÍTICA 2, DETECTAR E SINALIZAR, JAMAIS EDITAR. Prosa de conversa com o
 * usuário: `resumo`, `pontosFortes`, `pontosFracos`, `melhorias` (título e
 * comoFazer) e `proximoPasso`. Violação vira evento e o texto segue ÍNTEGRO
 * para o usuário. O motivo é o mesmo que antes da Fase 2 mantinha estes campos
 * fora de qualquer verificação: apagar um termo do meio de um parágrafo corrido
 * quebra a frase de um jeito que o leitor percebe, e pode inverter o sentido
 * ("não domina Kubernetes" sem o termo vira outra frase). O que mudou não foi o
 * julgamento sobre editar, foi a constatação de que NÃO VERIFICAR e NÃO EDITAR
 * são coisas diferentes: a telemetria alimenta a calibração do prompt, que é
 * onde este problema se resolve de verdade.
 *
 * POLÍTICA 3, SUBSTITUIÇÃO DO CAMPO INTEIRO. Texto para COLAR no perfil:
 * `sobreReescrito` e `modeloMensagemRecrutador`. Aqui o invento não é um
 * comentário errado, é uma mentira que o usuário publica em nome dele. Também
 * não se edita palavra a palavra (mesmo motivo da política 2): o campo inteiro
 * dá lugar a um texto determinístico montado só com o que o perfil comprova.
 * Enquadramento aspiracional sobre tecnologia faltante ("estou estudando X") é
 * legítimo e NÃO é violação: quem separa os dois é
 * `shared/linkedin/molduraAspiracional.ts`.
 *
 * RECORTE DESTA RODADA, deliberado: nas políticas 2 e 3 o lastro de TECNOLOGIA
 * só roda em `resumo`, `pontosFortes`, `sobreReescrito` e
 * `modeloMensagemRecrutador`, que são os campos que AFIRMAM sobre o perfil.
 * `pontosFracos`, `melhorias` e `proximoPasso` existem para RECOMENDAR o que
 * falta ("estude Kubernetes" é o acerto, não o erro), e a moldura aspiracional
 * não os cobre: os marcadores dela são de primeira pessoa ("estou estudando"),
 * então uma recomendação em segunda pessoa cairia como afirmação e viraria
 * violação. Ligar tecnologia neles exige antes uma moldura de RECOMENDAÇÃO, que
 * não existe hoje. O lastro de NUMERAL roda em todos: recomendação não inventa
 * resultado medido, e "reduziu custos em 40%" é claim em qualquer campo.
 */

export type TipoViolacao =
  | "numeral_fabricado"
  | "numeral_tipo_trocado"
  | "tecnologia_sem_lastro"
  | "bullet_sem_origem"
  /**
   * O bloco aponta para um `experienciaNumero` que não existe na lista enviada
   * ao modelo. Tipo próprio, e não `bullet_sem_origem`, porque a causa é outra
   * e a leitura do painel muda: aqui o modelo inventou a ÂNCORA, não escreveu
   * bullet para uma experiência vazia. Era este o caso que, sob o casamento por
   * token, devolvia o bloco intacto.
   */
  | "bloco_experiencia_invalida"
  /** Item de `skillsParaEstudar` fora da lista de faltantes entregue no prompt. */
  | "skill_estudo_sem_lastro"
  /**
   * PROSA (política 2): o texto ficou íntegro, isto é só o registro. Tipos
   * próprios, e não os de headline e bullet, porque a AÇÃO é outra: no painel,
   * `tecnologia_sem_lastro` significa "removi" e `prosa_tecnologia_sem_lastro`
   * significa "deixei passar e estou contando". Somar os dois esconderia
   * exatamente a diferença que a calibração de prompt precisa enxergar.
   */
  | "prosa_tecnologia_sem_lastro"
  | "prosa_numeral_sem_lastro"
  /** TEXTO PARA COLAR (política 3): o campo inteiro foi para o fallback. */
  | "colar_tecnologia_sem_lastro"
  | "colar_numeral_sem_lastro"
  /**
   * GATES DE SAÍDA (lote 6). O campo saiu em idioma diferente do que o prompt
   * exige para o mercado escolhido, ou ecoou a tag de delimitação dos blocos de
   * dados. Os dois só são registrados depois de gasto o orçamento de
   * tentativas: com tentativa restante, a reprovação vira retry contextual e
   * não violação, porque ainda pode ser corrigida.
   */
  | "idioma_incorreto"
  | "vazamento_delimitador";

/**
 * Campos que o lastro cobre. União fechada, e não `string`: o campo vai para o
 * log e para o Sentry, e é por ele que se separa "removi da headline" de
 * "troquei o Sobre inteiro".
 */
export type CampoDeViolacao =
  | "headlines"
  | "bulletsReescritos"
  | "skillsParaEstudar"
  | "resumo"
  | "pontosFortes"
  | "pontosFracos"
  | "melhorias"
  | "proximoPasso"
  | "sobreReescrito"
  | "modeloMensagemRecrutador";

/**
 * A UNIAO `TipoViolacao` EM RUNTIME.
 *
 * Uniao de tipo nao existe depois da compilacao, e quem le um mapa indexado por
 * ela precisa poder perguntar "esta chave e conhecida?" sem redigitar a lista.
 * E o mesmo papel de `PDF_ERROR_CODES` no lote da entrada de PDF.
 *
 * Nao esta escrita como `(typeof TIPOS_DE_VIOLACAO)[number]` de proposito: a
 * uniao acima carrega comentarios de bloco por membro, que sao a documentacao
 * de por que cada tipo e proprio em vez de somado a outro, e converte-la em
 * const array perderia isso. O preco e que as duas precisam concordar, e a
 * concordancia e AFIRMADA POR TESTE, que le a uniao da fonte e compara por
 * igualdade de conjunto.
 */
export const TIPOS_DE_VIOLACAO = [
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
] as const satisfies readonly TipoViolacao[];

export interface Violacao {
  tipo: TipoViolacao;
  campo: CampoDeViolacao;
  contexto: string;
  termo: string;
}

/**
 * RESUMO DE VIOLACOES POR ANALISE.
 *
 * Por que existe: as violacoes de lastro so viviam no Sentry, e por um caminho
 * AMOSTRADO (`registrarViolacao` faz throttle de um evento por tipo por minuto).
 * Isso serve para alertar, nao para contar: duas analises seguidas com o mesmo
 * tipo produzem UM evento, e qualquer agregacao sobre esse dado subconta sem
 * dizer que subcontou. Este resumo nasce da lista COMPLETA e deterministica,
 * antes de qualquer amostragem, e e ele que o painel do admin soma.
 *
 * PRIVACIDADE: `Violacao` carrega `contexto` e `termo`, que sao texto derivado
 * da resposta do modelo. Nada disso entra aqui. O resumo e so contagem, e essa
 * e a razao de a agregacao morar nesta funcao em vez de o consumidor receber a
 * lista e somar por conta propria: um unico ponto decide o que sai.
 *
 * `Partial<Record<...>>` e deliberado: tipo que nao ocorreu fica AUSENTE, e nao
 * zero. Zero explicito para doze tipos em toda analise limpa engordaria o jsonb
 * de todas elas para dizer "nada aconteceu", e a chave ausente ja diz isso.
 */
export interface LastroResumo {
  /** Total de violacoes, igual ao tamanho da lista completa. */
  total: number;
  /** Contagem por tipo. Tipo sem ocorrencia nao aparece. */
  porTipo: Partial<Record<TipoViolacao, number>>;
}

/**
 * Agrega a lista completa de violacoes. FONTE UNICA do numero que vai para o
 * jsonb, para a telemetria e para o painel: os tres leem daqui, e nao ha uma
 * segunda contagem em lugar nenhum para divergir desta.
 */
export function resumirViolacoes(violacoes: readonly Violacao[]): LastroResumo {
  const porTipo: Partial<Record<TipoViolacao, number>> = {};
  for (const v of violacoes) {
    porTipo[v.tipo] = (porTipo[v.tipo] ?? 0) + 1;
  }
  return { total: violacoes.length, porTipo };
}
