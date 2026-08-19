import { enquadramentoDeTermo } from "../../shared/linkedin/molduraAspiracional";
import { numeraisSemLastro } from "../../shared/linkedin/numeralLastro";
import { ALL_TECHNOLOGIES, matchTechnologies } from "./skillNormalize";

/**
 * Detecção de invento em PROSA, o material do lote 5 da Fase 2.
 *
 * A prova c2 da investigação mediu campos de prosa passando sem verificação
 * nenhuma: `resumo` afirmando "seu perfil comprova Kubernetes e uma redução de
 * custos de 40%", `pontosFortes` listando "Domínio de Kubernetes" e
 * `sobreReescrito` dizendo "opero clusters em Kubernetes e Docker todos os
 * dias", tudo num perfil que não comprova nada disso.
 *
 * Este módulo só DETECTA, e é puro: quem decide o que fazer com o achado é
 * `aplicarLastro`, e a decisão muda por classe de campo (sinalizar na prosa de
 * conversa, substituir o campo inteiro no texto para colar). A política está
 * escrita em `shared/linkedin/lastro.ts`.
 *
 * As duas detecções REUSAM o que já existe, sem caminho próprio:
 *   - tecnologia: `matchTechnologies` contra o mesmo catálogo das headlines, e
 *     o veredito é contra `keywordsEncontradas`, calculado pelo determinístico;
 *   - numeral: `numeraisSemLastro`, o mesmo dos bullets, com as tolerâncias
 *     estruturais dele (ano, duração, versão).
 */

/**
 * O texto do usuário que serve de lastro, na forma que o MODELO VIU.
 *
 * É a mesma decisão do lote 1 (`origemDoLastro`): o que ficou fora do prompt
 * por corte de orçamento não pode lastrear nada, porque o modelo não teve como
 * ler. Aqui a montagem vem de `conteudoDoUsuario`, a mesma função que preenche
 * os blocos delimitados do prompt, então não existe uma segunda derivação.
 *
 * O OBJETIVO do usuário fica de fora de propósito: ele diz o que a pessoa
 * QUER, não o que ela fez. "Quero chegar a 40% de cobertura" não é evidência
 * de ter chegado, e aceitá-lo como lastro abriria a porta exata que este lote
 * fecha.
 */
export interface EvidenciaDoPerfil {
  /** Concatenação do que o modelo recebeu como dado do usuário. */
  texto: string;
  /** `keywordsEncontradas` do determinístico, em minúsculas. */
  comprovadas: ReadonlySet<string>;
}

export interface AchadoDeProsa {
  /** O termo ou o numeral que não tem lastro. */
  termo: string;
}

/** O predicado de vocabulário que `numeraisSemLastro` usa para ver versão. */
function ehTecnologia(palavra: string): boolean {
  return matchTechnologies(palavra, ALL_TECHNOLOGIES).encontradas.length > 0;
}

/**
 * Tecnologias AFIRMADAS no texto que o perfil não comprova.
 *
 * `enquadramentoDeTermo` roda ANTES do veredito, e é ele que separa os dois
 * casos que pareciam um só: "domino Kubernetes" num perfil sem Kubernetes é
 * invento, e "estou estudando Kubernetes" é o conselho honesto que a plataforma
 * dá a quem está em transição. Punir o segundo foi o que fez o placar da régua
 * antiga não convergir (docs/tecnologia-aspiracional-sobre.md).
 */
export function tecnologiasSemLastroEmProsa(
  texto: string,
  evidencia: EvidenciaDoPerfil,
): AchadoDeProsa[] {
  const achados: AchadoDeProsa[] = [];
  for (const tech of matchTechnologies(texto, ALL_TECHNOLOGIES).encontradas) {
    if (evidencia.comprovadas.has(tech.toLowerCase())) continue;
    if (enquadramentoDeTermo(texto, tech) !== "afirmacao") continue;
    achados.push({ termo: tech });
  }
  return achados;
}

/**
 * Numerais do texto sem correspondente no que o modelo viu do perfil.
 *
 * `numeraisSemLastro` recebe uma lista de trechos, então a prosa entra como um
 * trecho só. Os dois motivos que ele distingue (`ausente` e `tipo_trocado`)
 * viram o mesmo tipo de violação aqui: em prosa a ação é a mesma nos dois
 * casos, e separar os tipos só teria valor se a ação mudasse.
 */
export function numeraisSemLastroEmProsa(
  texto: string,
  evidencia: EvidenciaDoPerfil,
): AchadoDeProsa[] {
  return numeraisSemLastro([texto], evidencia.texto, {
    ehTecnologia,
    ignorarPorExtenso: true,
  }).map((n) => ({ termo: n.numeral }));
}
