import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { TIPOS_DE_VIOLACAO, type TipoViolacao } from "@shared/linkedin/lastro";

// TODO(Ana): revisar TODA a copy visivel deste bloco (titulo, subtitulo,
// rotulos dos tipos, estado vazio, nota de analises sem medicao e aviso de
// corte).

/**
 * VIOLACOES DE LASTRO DO ANALISADOR, na janela do endpoint.
 *
 * Ate este lote as violacoes so viviam no Sentry, por um caminho AMOSTRADO (um
 * evento por tipo por minuto). Servia para alertar, nao para contar, e a
 * pergunta que decide calibracao de prompt ("qual invento o modelo mais tenta
 * nesta semana?") nao tinha resposta.
 *
 * SO CONTAGEM chega aqui: `contexto` e `termo` da violacao sao texto derivado da
 * resposta do modelo e nunca sao persistidos no resumo, e o endpoint pede
 * apenas a coluna do resumo. Nao ha texto de usuario para renderizar, e um teste
 * de render com marcadores trava isso.
 *
 * SEM SELETOR DE PERIODO: a janela e fixa e vem declarada do servidor
 * (`janelaDias`). Seletor ficou no backlog de proposito.
 */
type LinkedinLastroData = {
  analises: number;
  comResumo: number;
  semResumo: number;
  total: number;
  porTipo: Partial<Record<TipoViolacao, number>>;
  janelaDias: number;
  truncado: boolean;
};

// TODO(Ana): rotulos dos tipos de violacao de lastro.
//
// `Record<TipoViolacao, string>` e deliberado: tipo novo na uniao sem rotulo
// aqui NAO compila. E a mesma disciplina de totalidade do resto do lote, e ela
// importa mais neste arquivo do que na maioria, porque um tipo sem rotulo
// apareceria no painel como uma chave crua de banco.
const TIPO_LABEL: Record<TipoViolacao, string> = {
  numeral_fabricado: "Número inventado",
  numeral_tipo_trocado: "Número com unidade trocada",
  tecnologia_sem_lastro: "Tecnologia sem lastro na headline",
  bullet_sem_origem: "Bullet sem experiência de origem",
  bloco_experiencia_invalida: "Bloco apontando experiência inexistente",
  skill_estudo_sem_lastro: "Competência de estudo fora da lista",
  prosa_tecnologia_sem_lastro: "Tecnologia sem lastro na prosa",
  prosa_numeral_sem_lastro: "Número sem lastro na prosa",
  colar_tecnologia_sem_lastro: "Tecnologia sem lastro no texto para colar",
  colar_numeral_sem_lastro: "Número sem lastro no texto para colar",
  idioma_incorreto: "Campo no idioma errado",
  vazamento_delimitador: "Tag de delimitação vazada",
};

function LinhaDeTipo({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div data-testid="lastro-linha">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-slate-800">{label}</span>
        <span className="text-sm font-bold text-slate-600">
          {count}
          <span className="ml-2 font-black text-violet-700">{percent}%</span>
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full border-2 border-slate-900 bg-white">
        <div
          className="h-full bg-violet-600"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

export function LinkedinLastroDashboard() {
  const [data, setData] = useState<LinkedinLastroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminFetch("/linkedin-lastro")
      .then((json) => {
        if (cancelled) return;
        setData(json.data as LinkedinLastroData);
      })
      .catch((err) => {
        if (cancelled) return;
        // TODO(Ana): copy do erro ao carregar as violacoes de lastro.
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar as violações de lastro.",
        );
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // TODO(Ana): copy do estado de carregamento das violacoes de lastro.
  if (loading)
    return <LoadingBlock label="Carregando violações de lastro..." />;
  if (error) return <ErrorBlock message={error} />;
  // Sem dado e DIFERENTE de sem violacao, e os dois nao podem compartilhar tela.
  // TODO(Ana): copy do estado de dados indisponiveis das violacoes de lastro.
  if (!data) {
    return (
      <ErrorBlock message="Não foi possível carregar as violações de lastro." />
    );
  }

  const linhas = TIPOS_DE_VIOLACAO.filter(
    (tipo) => (data.porTipo[tipo] ?? 0) > 0,
  );

  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[5px_5px_0_#0f172a]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-black text-slate-950">
          {/* TODO(Ana): titulo do bloco de violacoes de lastro. */}
          Lastro do analisador de LinkedIn
        </h3>
        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {/* TODO(Ana): rotulo da janela do bloco. */}
          Últimos {data.janelaDias} dias
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        {/* TODO(Ana): subtitulo explicando o que o bloco conta. */}
        Quantas vezes a plataforma barrou algo que a IA tentou afirmar sem base
        no perfil. Número alto em um tipo indica prompt a recalibrar.
      </p>

      <div className="mt-4 flex flex-wrap gap-6">
        <div>
          <p className="font-display text-3xl font-black text-slate-950">
            {data.total}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            {/* TODO(Ana): rotulo do total de violacoes. */}
            Violações no período
          </p>
        </div>
        <div>
          <p className="font-display text-3xl font-black text-slate-950">
            {data.comResumo}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            {/* TODO(Ana): rotulo do denominador de analises medidas. */}
            Análises com medição
          </p>
        </div>
      </div>

      {data.semResumo > 0 ? (
        // O DENOMINADOR HONESTO. Analise gravada antes do resumo existir nao
        // tem o dado, e some-la como zero afirmaria que ela rodou limpa.
        <p
          className="mt-3 text-xs font-bold italic text-slate-500"
          data-testid="lastro-sem-medicao"
        >
          {/* TODO(Ana): nota das analises sem medicao de lastro. */}
          {data.semResumo} de {data.analises} análises do período são anteriores
          a esta medição e ficam fora das contagens acima.
        </p>
      ) : null}

      {data.truncado ? (
        <p className="mt-2 text-xs font-bold italic text-amber-700">
          {/* TODO(Ana): aviso de corte por volume. */}O período tem mais
          análises do que o painel lê de uma vez. Os números acima cobrem apenas
          as mais recentes.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {linhas.length === 0 ? (
          // ESTADO VAZIO HONESTO, e ele so aparece quando houve medicao. Sem
          // `comResumo` nao da para dizer "nenhuma violacao": daria para dizer
          // apenas "nao medimos", que e a mensagem do outro ramo.
          <p
            className="text-sm font-bold text-slate-600"
            data-testid="lastro-vazio"
          >
            {data.comResumo > 0 ? (
              /* TODO(Ana): copy do periodo sem nenhuma violacao. */
              <>
                Nenhuma violação de lastro no período. A IA não tentou afirmar
                nada fora do perfil nas análises medidas.
              </>
            ) : (
              /* TODO(Ana): copy do periodo sem nenhuma analise medida. */
              <>
                Nenhuma análise do período tem medição de lastro, então não há o
                que contar ainda.
              </>
            )}
          </p>
        ) : (
          linhas.map((tipo) => (
            <LinhaDeTipo
              key={tipo}
              label={TIPO_LABEL[tipo]}
              count={data.porTipo[tipo] ?? 0}
              total={data.total}
            />
          ))
        )}
      </div>
    </div>
  );
}
