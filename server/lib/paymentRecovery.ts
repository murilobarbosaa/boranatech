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
// e-mail, e o contador diria "ja tratado". Ver a migration 20260728230000.

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
async function converteu(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .limit(1);
  // Erro de leitura NAO pode virar "nao converteu": mandaria e-mail de recusa
  // para quem ja e assinante. Na duvida, trata como convertido e nao envia.
  if (error) {
    console.error(
      "[paymentRecovery] falha ao checar assinatura; tratando como convertido:",
      error,
    );
    return true;
  }
  return (data?.length ?? 0) > 0;
}

async function estaSuprimido(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("email_suppressions")
    .select("email")
    .eq("email", email)
    .limit(1);
  if (error) {
    // Mesma logica: na duvida NAO manda. Enviar para endereco suprimido queima
    // reputacao de dominio, que e dano compartilhado com todo e-mail do produto.
    console.error(
      "[paymentRecovery] falha ao checar supressao; tratando como suprimido:",
      error,
    );
    return true;
  }
  return (data?.length ?? 0) > 0;
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
      ignorados.erro_leitura = (ignorados.erro_leitura ?? 0) + 1;
      continue;
    }

    const userId = doEmail.find((l) => l.supabase_user_id)?.supabase_user_id ?? null;
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
      converteu: await converteu(userId),
      suprimido: await estaSuprimido(email),
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
