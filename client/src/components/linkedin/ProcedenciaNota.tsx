import { Info } from "lucide-react";
import type {
  ContagemLida,
  OrigemLida,
} from "@shared/linkedin/readQualitative";

/**
 * Notas de PROCEDENCIA da entrega (Fase 3, lote 2).
 *
 * O servidor do lote 1 passou a dizer, campo a campo, de onde veio o texto
 * entregue. Ate aqui o cliente ignorava isso: um Sobre escrito pela plataforma
 * porque a versao da IA reprovou nas checagens aparecia exatamente igual a um
 * escrito pela IA, com o mesmo botao de copiar ao lado. Estes componentes
 * fecham essa distancia, e so isso; eles nao decidem nada, so leem o fato.
 *
 * FONTE UNICA. Tudo aqui vem de `readQualitative`, o reader compartilhado.
 * Nao existe heuristica local, comparacao do texto entregue com o texto do
 * fallback nem segunda leitura do payload cru: dois textos iguais por
 * coincidencia dariam o mesmo veredito que uma substituicao de verdade, e essa
 * e exatamente a inferencia que o lote 1 existiu para eliminar.
 *
 * ACESSIBILIDADE. A nota e TEXTO REAL no DOM, nunca tooltip ou title: quem usa
 * leitor de tela precisa da mesma informacao que quem le a tela. O icone e
 * `aria-hidden` porque ele repete o que a frase ja diz, e a distincao nunca
 * depende de cor (a frase sozinha carrega o sentido).
 */

/**
 * Por que `desconhecida` renderiza NADA, e essa e uma decisao, nao um esquecimento.
 *
 * `desconhecida` e o estado das analises gravadas ANTES do lote 1, que nao
 * carregam procedencia nenhuma. Nao sabemos se aquele texto veio do modelo ou
 * do fallback, e as duas notas possiveis afirmariam um fato que ninguem mediu:
 * dizer "este texto e conservador" seria mentira em quase todas elas, e dizer
 * "nao sabemos de onde veio este texto" e ruido sobre um histórico que a pessoa
 * nao pode mudar. Silencio nao afirma nada, e e a unica saida honesta aqui.
 *
 * Isto e diferente de `modelo`, que tambem renderiza nada: la o silencio e o
 * comportamento normal, porque a pagina inteira ja se apresenta como analise
 * com IA. Os dois caminhos coincidem na saida e divergem no motivo.
 */

// TODO(Ana): revisar a nota de texto conservador (origem fallback).
const TEXTO_FALLBACK =
  "Este texto foi escrito pela plataforma a partir do que o seu perfil comprova. A versão que a IA gerou não passou nas nossas checagens de qualidade, então preferimos não entregar aquela.";

// TODO(Ana): revisar a nota de texto sem IA (origem sem_modelo).
const TEXTO_SEM_MODELO =
  "Este texto não foi escrito pela IA. Seu perfil tinha pouco conteúdo para analisar, então montamos uma base a partir da área e do nível que você informou. Complete o perfil e faça uma nova análise para receber um texto feito sob medida.";

const NOTA_CLASS =
  "mt-3 flex items-start gap-2 rounded-xl border-2 border-slate-300 bg-slate-50 p-3 text-xs font-medium leading-relaxed text-slate-700";

/**
 * Nota de um campo para colar (`sobreReescrito`, `modeloMensagemRecrutador`).
 *
 * O fato e POR CAMPO, entao dois campos da mesma analise podem ter notas
 * diferentes, ou um ter nota e o outro nao. `campo` entra so no `data-testid`,
 * para o teste conseguir afirmar essa independencia.
 */
export function ProcedenciaNota({
  origem,
  campo,
}: {
  origem: OrigemLida;
  campo: string;
}) {
  if (origem !== "fallback" && origem !== "sem_modelo") return null;
  const texto = origem === "fallback" ? TEXTO_FALLBACK : TEXTO_SEM_MODELO;
  return (
    <p
      role="note"
      data-testid={`procedencia-${campo}`}
      data-origem={origem}
      className={NOTA_CLASS}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <span className="min-w-0 break-words">{texto}</span>
    </p>
  );
}

// TODO(Ana): revisar a linha de sugestões removidas (uma).
const removidasUma =
  "1 sugestão foi removida por não passar nas nossas checagens de qualidade.";

// TODO(Ana): revisar a linha de sugestões removidas (várias).
const removidasVarias = (n: number) =>
  `${n} sugestões foram removidas por não passarem nas nossas checagens de qualidade.`;

// TODO(Ana): revisar o estado de nenhuma sugestão entregue por remoção.
const nenhumaEntregue = (n: number) =>
  n === 1
    ? "Nenhuma sugestão de headline sobrou: a única que a IA escreveu não passou nas nossas checagens de qualidade. Faça uma nova análise para tentar de novo."
    : `Nenhuma sugestão de headline sobrou: as ${n} que a IA escreveu não passaram nas nossas checagens de qualidade. Faça uma nova análise para tentar de novo.`;

/**
 * Sugestoes de headline que sairam da lista por reprova de gate.
 *
 * TRES saidas, e a do meio e a que justifica o componente existir:
 *   - `removidas` indisponivel ou zero: nada. Indisponivel e o payload antigo,
 *     e zero e a entrega normal;
 *   - `entregues` zero com `removidas` acima de zero: a lista sumiu INTEIRA, e
 *     a pessoa precisa saber que isso e diferente de a IA nao ter sugerido
 *     nada. Sem esta frase, o bloco aparecia vazio sem explicacao;
 *   - `entregues` acima de zero: linha discreta com a contagem, para a lista
 *     mais curta nao parecer a lista completa.
 */
export function SugestoesRemovidas({
  entregues,
  removidas,
}: {
  entregues: ContagemLida;
  removidas: ContagemLida;
}) {
  if (typeof removidas !== "number" || removidas <= 0) return null;
  const listaVazia = entregues === 0;
  return (
    <p
      role="note"
      data-testid="procedencia-sugestoes-headline"
      data-removidas={removidas}
      className={NOTA_CLASS}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <span className="min-w-0 break-words">
        {listaVazia
          ? nenhumaEntregue(removidas)
          : removidas === 1
            ? removidasUma
            : removidasVarias(removidas)}
      </span>
    </p>
  );
}
