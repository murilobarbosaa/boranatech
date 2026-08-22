// Runner da regua de recuperacao de pagamento recusado.
//
// NAO dispara do webhook, de proposito: o webhook tem que responder rapido, e a
// regua depende de TEMPO PASSAR (debounce de 30 min). Quem varre e o cron.
//
// A decisao e pura e vive em shared/paymentRecovery.ts. Aqui so juntamos os fatos
// e obedecemos. A guarda de "ja mandei" e o UNIQUE (email, episodio, stage) do
// banco, nao uma checagem no chamador: o INSERT vem ANTES do envio, entao duas
// execucoes concorrentes nao conseguem mandar dois e-mails nem em corrida.
//
// O `episodio` na chave NAO e enfeite. Com a UNIQUE original (email, stage), a
// reabertura de episodio era INALCANCAVEL: passados os 30 dias a decisao devolvia
// stage 1, o upsert conflitava com a linha de stage 1 do episodio anterior,
// ignoreDuplicates transformava em DO NOTHING, e o runner contava como
// `ja_registrado`. Quem falhasse em agosto e voltasse em outubro nunca receberia
// e-mail, e o contador diria "ja tratado". Ver a migration 20260822100400.

import * as Sentry from "@sentry/node";

import {
  classificarMotivo,
  decidirRecuperacao,
  DEBOUNCE_MS,
  type ReasonBucket,
} from "../../shared/paymentRecovery";
import { validateEmailForSending } from "./emailValidation";
import { enqueueEmail } from "./queue";
import { supabaseAdmin } from "./supabaseAdmin";

/** Janela de varredura: recusas mais antigas que isto nao interessam mais. */
const JANELA_DIAS = 45;

type LinhaRecusa = {
  id: string;
  email: string | null;
  supabase_user_id: string | null;
  outcome_type: string | null;
  outcome_reason: string | null;
  advice_code: string | null;
  failure_code: string | null;
  attempted_at: string;
};

export type ResultadoRecuperacao = {
  pessoasNaJanela: number;
  enviados: number;
  ignorados: Record<string, number>;
};

/**
 * Leitura com DOIS desfechos distintos, e a distincao e o ponto desta funcao.
 *
 * `{ ok: false }` NAO e um `valor` qualquer: e a ausencia de resposta. Colapsar
 * "nao consegui ler" em `valor: true` faria a falha desaparecer dentro de um
 * numero legitimo, que e a familia de defeito que esta base ja pagou caro (o
 * `contarLinhas` devolvendo -1, o endpoint que respondia 200 com lista vazia, e
 * o all-accounts-Pro). O COMPORTAMENTO na duvida continua o mesmo, pular sem
 * enviar; o que muda e o nome com que a duvida e contada.
 */
type Checagem = { ok: true; valor: boolean } | { ok: false };

/**
 * Converteu = tem assinatura que da acesso (active/trialing).
 *
 * ESTA CHECAGEM SO FUNCIONA COM user_id, e isso e um limite declarado, nao um
 * descuido. `subscriptions` e chaveada por user_id e nao guarda e-mail;
 * `finance_transactions` guarda valor e taxa, tambem sem e-mail. Entao para uma
 * recusa que chegou SEM supabase_user_id no metadata nao existe, no nosso banco,
 * caminho de "esta pessoa pagou depois".
 *
 * Consequencia aceita: alguem que falhou sem metadata e depois pagou por outro
 * caminho pode receber um e-mail de recuperacao a mais. O erro oposto (nao mandar
 * para quem precisa) e pior, e o teto de 2 por episodio limita o dano.
 *
 * Uma versao anterior desta funcao consultava finance_transactions e DESCARTAVA o
 * resultado. Parecia uma segunda verificacao e nao verificava nada. Removida: e
 * melhor um limite escrito que uma consulta decorativa.
 */
async function converteu(userId: string | null): Promise<Checagem> {
  if (!userId) return { ok: true, valor: false };
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .limit(1);
  // Erro de leitura NAO pode virar "nao converteu": mandaria e-mail de recusa
  // para quem ja e assinante. Na duvida NAO se envia, e isso nao mudou.
  //
  // O que mudou e que a duvida deixou de se chamar `converteu`. Contada com
  // aquele nome, uma falha de leitura era indistinguivel de uma conversao real
  // no relatorio do cron, e um banco fora do ar apareceria como um dia de
  // conversoes otimo.
  if (error) {
    console.error(
      "[paymentRecovery] falha ao checar assinatura; pulando esta pessoa:",
      error,
    );
    // Mesma forma do relato em routes/billing.ts (commit 9e60b0b4): o console
    // do Railway e o unico rastro hoje, e server/lib/sentry.ts nao instala
    // integracao de console.
    Sentry.withScope((scope) => {
      scope.setTag("job", "payment-recovery");
      scope.setTag("checagem", "assinatura");
      Sentry.captureException(error);
    });
    return { ok: false };
  }
  return { ok: true, valor: (data?.length ?? 0) > 0 };
}

async function estaSuprimido(email: string): Promise<Checagem> {
  const { data, error } = await supabaseAdmin
    .from("email_suppressions")
    .select("email")
    .eq("email", email)
    .limit(1);
  if (error) {
    // Mesma logica: na duvida NAO manda. Enviar para endereco suprimido queima
    // reputacao de dominio, que e dano compartilhado com todo e-mail do produto.
    // E, como acima, a duvida e contada com o proprio nome em vez de virar
    // `suprimido`, que e um estado legitimo e frequente.
    console.error(
      "[paymentRecovery] falha ao checar supressao; pulando esta pessoa:",
      error,
    );
    Sentry.withScope((scope) => {
      scope.setTag("job", "payment-recovery");
      scope.setTag("checagem", "supressao");
      Sentry.captureException(error);
    });
    return { ok: false };
  }
  return { ok: true, valor: (data?.length ?? 0) > 0 };
}

export async function runPaymentRecovery(
  agora: Date = new Date(),
): Promise<ResultadoRecuperacao> {
  const desde = new Date(agora.getTime() - JANELA_DIAS * 24 * 60 * 60 * 1000);
  const { data, error } = await supabaseAdmin
    .from("billing_failed_payments")
    .select(
      "id, email, supabase_user_id, outcome_type, outcome_reason, advice_code, failure_code, attempted_at",
    )
    .gte("attempted_at", desde.toISOString())
    .order("attempted_at", { ascending: false });
  if (error) throw error;

  const linhas = (data ?? []) as LinhaRecusa[];

  // Agrupa por pessoa. A primeira linha de cada e-mail e a tentativa MAIS RECENTE
  // (a query ja vem ordenada), e e ela que decide o debounce e a variante de texto:
  // se a pessoa errou o cartao e depois estourou o limite, o texto certo e o do
  // ultimo evento.
  const porEmail = new Map<string, LinhaRecusa[]>();
  for (const l of linhas) {
    const email = (l.email ?? "").trim().toLowerCase();
    if (!email) continue;
    const atual = porEmail.get(email);
    if (atual) atual.push(l);
    else porEmail.set(email, [l]);
  }

  const ignorados: Record<string, number> = {};
  let enviados = 0;

  for (const [email, doEmail] of Array.from(porEmail.entries())) {
    const maisRecente = doEmail[0];
    const ultimaTentativaMs = new Date(maisRecente.attempted_at).getTime();

    // Curto-circuito baratissimo antes de qualquer consulta: dentro do debounce
    // nada mais importa, e a maioria das pessoas cai aqui numa varredura de 5 min.
    if (agora.getTime() - ultimaTentativaMs < DEBOUNCE_MS) {
      ignorados.debounce = (ignorados.debounce ?? 0) + 1;
      continue;
    }

    const { data: envios, error: erroEnvios } = await supabaseAdmin
      .from("payment_recovery_emails")
      .select("stage, sent_at, episodio")
      .eq("email", email);
    if (erroEnvios) {
      console.error(
        `[paymentRecovery] falha ao ler envios de ${email}; pulando:`,
        erroEnvios,
      );
      Sentry.withScope((scope) => {
        scope.setTag("job", "payment-recovery");
        scope.setTag("checagem", "leitura_envios");
        Sentry.captureException(erroEnvios);
      });
      ignorados.erro_leitura = (ignorados.erro_leitura ?? 0) + 1;
      continue;
    }

    const userId = doEmail.find((l) => l.supabase_user_id)?.supabase_user_id ?? null;

    // As duas checagens ANTES de decidir, e cada falha com seu proprio nome. Sao
    // avaliadas em sequencia com saida na primeira que falhar: `ignorados` conta
    // PESSOAS PULADAS, uma por iteracao, entao somar dois motivos para a mesma
    // pessoa inflaria o total e faria a soma das chaves deixar de bater com
    // `pessoasNaJanela`.
    const chConverteu = await converteu(userId);
    if (!chConverteu.ok) {
      ignorados.erro_checagem_assinatura =
        (ignorados.erro_checagem_assinatura ?? 0) + 1;
      continue;
    }
    const chSuprimido = await estaSuprimido(email);
    if (!chSuprimido.ok) {
      ignorados.erro_checagem_supressao =
        (ignorados.erro_checagem_supressao ?? 0) + 1;
      continue;
    }

    const decisao = decidirRecuperacao({
      agoraMs: agora.getTime(),
      ultimaTentativaMs,
      enviosAnteriores: (envios ?? []).map(
        (e: { stage: number | string; sent_at: string; episodio: number | string }) => ({
          stage: Number(e.stage),
          sentAtMs: new Date(e.sent_at).getTime(),
          episodio: Number(e.episodio),
        }),
      ),
      converteu: chConverteu.valor,
      suprimido: chSuprimido.valor,
      emailValido: validateEmailForSending(email).ok,
    });

    if (!decisao.enviar) {
      ignorados[decisao.motivo] = (ignorados[decisao.motivo] ?? 0) + 1;
      continue;
    }

    const bucket: ReasonBucket = classificarMotivo({
      outcomeType: maisRecente.outcome_type,
      outcomeReason: maisRecente.outcome_reason,
      adviceCode: maisRecente.advice_code,
      failureCode: maisRecente.failure_code,
    });

    // INSERT ANTES DO ENVIO. Se conflitar (UNIQUE email+episodio+stage), outra
    // execucao ja cuidou e este nao envia. Ordem inversa (enviar e depois gravar)
    // mandaria duas vezes sempre que a gravacao falhasse.
    //
    // So se chega aqui com decisao.enviar === true, e a decisao NUNCA devolve
    // episodio acima de MAX_EPISODIOS (ela para em `teto_de_episodios` antes de
    // somar). Sem isso, o cron tentaria a cada 15 min um INSERT que viola o CHECK
    // do banco e contaria `erro_registro` para sempre, para aquela pessoa.
    const { data: gravado, error: erroInsert } = await supabaseAdmin
      .from("payment_recovery_emails")
      .upsert(
        {
          email,
          supabase_user_id: userId,
          stage: decisao.stage,
          episodio: decisao.episodio,
          failed_payment_id: maisRecente.id,
          reason_bucket: bucket,
          sent_at: agora.toISOString(),
        },
        { onConflict: "email,episodio,stage", ignoreDuplicates: true },
      )
      .select("id");
    if (erroInsert) {
      console.error(
        `[paymentRecovery] falha ao registrar envio para ${email}; NAO enviando:`,
        erroInsert,
      );
      Sentry.withScope((scope) => {
        scope.setTag("job", "payment-recovery");
        scope.setTag("checagem", "registro_envio");
        Sentry.captureException(erroInsert);
      });
      ignorados.erro_registro = (ignorados.erro_registro ?? 0) + 1;
      continue;
    }
    if ((gravado?.length ?? 0) === 0) {
      ignorados.ja_registrado = (ignorados.ja_registrado ?? 0) + 1;
      continue;
    }

    const nome = email.split("@")[0];
    await enqueueEmail({
      type: "payment_recovery",
      to: email,
      name: nome,
      bucket,
    });
    enviados += 1;
  }

  return { pessoasNaJanela: porEmail.size, enviados, ignorados };
}

/**
 * Houve algo que merece status 'partial' em vez de 'success'?
 *
 * Por PREFIXO e nao por lista: as chaves de erro sao `erro_leitura`,
 * `erro_registro`, `erro_checagem_assinatura` e `erro_checagem_supressao`, e uma
 * lista escrita a mao aqui envelheceria na quinta, silenciosamente e no sentido
 * ruim (deixando de acusar). Toda chave de `ignorados` que comece com `erro_` e
 * degradacao por construcao.
 *
 * Funcao exportada, no lugar de um ternario no call site, pelo mesmo motivo de
 * `runDegradada` em lib/sentryTaskIntake.ts: o predicado fica exercitavel sem
 * subir o router de cron.
 */
export function recuperacaoDegradada(r: ResultadoRecuperacao): boolean {
  return Object.entries(r.ignorados).some(
    ([chave, n]) => chave.startsWith("erro_") && n > 0,
  );
}
