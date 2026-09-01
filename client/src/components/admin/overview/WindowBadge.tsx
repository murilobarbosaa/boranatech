/**
 * Badge de intervalo dos cards e gráficos da Visão.
 *
 * POR QUE ELE EXISTE. Até 2026-08-14 a aba tinha três definições diferentes de
 * "últimos N dias" convivendo: os cards usavam uma janela deslizante por
 * instante em UTC, o gráfico "Cadastros por dia" usava dias civis de Brasília, e
 * o histórico de assinaturas ancorava no último snapshot. Medido às 04:53 UTC,
 * card e gráfico diferiam em 182 cadastros com o MESMO rótulo na tela. A Fase 2
 * unificou a semântica; este badge é o que torna a unificação VISÍVEL, dizendo o
 * intervalo exato em vez de "últimos 30 dias".
 *
 * O TEXTO VEM PRONTO DO SERVIDOR (`windowLabel` e `tz` do `/overview` e do
 * `/signup-history`). Este componente NÃO formata data e NÃO sabe o que é
 * Brasília, de propósito: são seis cards e dois gráficos, e cada um resolvendo
 * fuso por conta própria seria uma chance nova de o mesmo intervalo aparecer com
 * dois nomes. O `Intl` do navegador não tem obrigação de concordar com o do
 * servidor sobre o que é "hoje".
 *
 * ARQUIVO NOVO de propósito: `client/src/pages/Admin.tsx` está na zona de
 * colisão da frente paralela desde o começo desta frente, então tudo que dá para
 * nascer fora dele nasce fora dele, e a integração vira uma edição só.
 */

export function WindowBadge({
  label,
  tz,
  partial,
  className = "",
}: {
  /** Ex.: "16 jul - 14 ago". Vem do servidor; ausente = não renderiza nada. */
  label?: string | null;
  /** Ex.: "Brasília". Também do servidor. */
  tz?: string | null;
  /**
   * O último dia do intervalo ainda está acontecendo. Sem esta marca, quem lê um
   * número menor hoje de manhã conclui que caiu, quando ele só não terminou.
   */
  partial?: boolean;
  className?: string;
}) {
  // Ausência é ausência: um badge vazio ou com "-" pareceria defeito de layout,
  // e um badge com data inventada seria pior. Some.
  if (!label) return null;

  return (
    <span
      data-testid="window-badge"
      className={`inline-flex items-center gap-1 rounded-full border-2 border-slate-300 bg-white/70 px-2 py-0.5 text-[11px] font-bold text-slate-600 ${className}`}
    >
      <span>{label}</span>
      {tz ? <span className="text-slate-400">({tz})</span> : null}
      {partial ? (
        <span
          data-testid="window-badge-parcial"
          className="text-amber-700"
          title="O último dia ainda está acontecendo"
        >
          parcial
        </span>
      ) : null}
    </span>
  );
}
