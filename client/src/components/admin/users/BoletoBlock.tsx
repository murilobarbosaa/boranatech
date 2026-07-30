import { fmtBrl, fmtDate } from "./userFormat";
import type { BoletoEstado } from "./types";

/**
 * Estado do boleto pendente, no detalhe do usuario.
 *
 * Tres situacoes, e a diferenca entre elas e o ponto do bloco:
 *
 *   em aberto        boleto emitido, prazo correndo. Situacao NORMAL, cor de
 *                    aviso leve. O admin so precisa saber ate quando esperar.
 *   PAGO sem acesso  a Stripe diz `paid` e a linha continua `pending`. Isso e
 *                    dinheiro recebido sem contrapartida entregue, e ate agora
 *                    so existia como log do Railway. Cor e peso proprios.
 *   nao verificavel  a leitura da Stripe falhou. NAO afirma vivo nem morto:
 *                    afirmar qualquer um dos dois seria inventar.
 */

const CARTAO = "rounded-2xl border-2 p-3";

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p className="mt-1 text-sm font-semibold">
      <span className="font-black uppercase tracking-wide">{rotulo}</span>{" "}
      {valor}
    </p>
  );
}

export function BoletoBlock({ boleto }: { boleto: BoletoEstado | null }) {
  if (!boleto) return null;

  if (boleto.estado === "indisponivel") {
    return (
      <div className={`${CARTAO} border-slate-300 bg-slate-50`}>
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-600">
          Boleto aguardando pagamento
        </p>
        {/* Sem alarme e sem alivio: a tela diz exatamente o que sabe, que e
            nada. Um "vencido" ou um "em dia" aqui seria invencao. */}
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Não foi possível verificar o estado na Stripe. O que aparece acima vem
          do banco.
        </p>
      </div>
    );
  }

  if (boleto.estado !== "ok") return null;

  const valor =
    boleto.amount_cents !== null ? fmtBrl(boleto.amount_cents) : null;

  if (boleto.pago) {
    return (
      <div
        data-testid="boleto-pago-sem-acesso"
        className={`${CARTAO} border-rose-600 bg-rose-50`}
      >
        <p className="text-[11px] font-black uppercase tracking-wide text-rose-700">
          Boleto pago e acesso não liberado
        </p>
        <p className="mt-1 text-sm font-semibold text-rose-900">
          A Stripe confirma o pagamento, mas a assinatura continua pendente. O
          dinheiro entrou e o Pro não saiu.
        </p>
        {valor ? <Linha rotulo="Valor recebido" valor={valor} /> : null}
        {/* O QUE FAZER, nao so o que aconteceu: a ativacao acontece pelo
            handler de webhook, entao reenviar o evento e o caminho, e nao
            mexer na linha na mao. */}
        <p className="mt-2 text-sm font-semibold text-rose-900">
          Reenvie o evento async_payment_succeeded desta sessão pelo painel da
          Stripe. É o handler dele que ativa a assinatura e libera o acesso;
          alterar a linha no banco não dispara e-mail nem invalida o cache.
        </p>
      </div>
    );
  }

  return (
    <div className={`${CARTAO} border-amber-500 bg-amber-50`}>
      <p className="text-[11px] font-black uppercase tracking-wide text-amber-800">
        Boleto aguardando pagamento
      </p>
      <div className="text-amber-900">
        {valor ? <Linha rotulo="Valor" valor={valor} /> : null}
        {boleto.expires_at ? (
          <Linha rotulo="Vence em" valor={fmtDate(boleto.expires_at)} />
        ) : null}
        {boleto.payment_status ? (
          <Linha rotulo="Cobrança" valor={boleto.payment_status} />
        ) : null}
      </div>
    </div>
  );
}
