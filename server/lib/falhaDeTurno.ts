/**
 * Reduz a mensagem de erro de um turno de chat de IA a um CODIGO de baixa
 * cardinalidade, para o banco nunca receber texto livre vindo do provedor.
 *
 * POR QUE ISTO EXISTE, e nao um `errorMessage: message` direto: a mensagem crua
 * pode carregar o corpo de erro da OpenAI, e o prompt que gerou esse erro
 * carrega a fala da pessoa. Gravar isso em `ai_usage_logs` seria persistir
 * conversa numa tabela de telemetria, que ninguem espera ter que tratar como
 * dado pessoal. No banco vai so o codigo.
 *
 * MORA EM `lib/`, e nao dentro de uma das rotas, porque os dois chats de intake
 * (roadmap com IA e plano de carreira) gravam na MESMA tabela e precisam do
 * mesmo vocabulario de codigos. Enquanto viveu privada em `routes/aiRoadmap.ts`,
 * o irmao `routes/careerPlan.ts` gravou a mensagem crua: guarda que so existe em
 * um dos chamadores nao e guarda, e a copia do outro lado divergiria no primeiro
 * codigo novo.
 */
export function classificarFalhaDeTurno(message: string): string {
  if (message.includes("upstream_timeout")) return "timeout";
  const status = /OpenAI respondeu (\d{3})/.exec(message);
  if (status) return `openai_${status[1]}`;
  // O codigo sozinho nao diz QUAL campo o modelo errou, e sem isso o
  // `schema_mismatch` nao e diagnosticavel (foi o que aconteceu com os 7 de
  // 2026-08-03). `runIntakeChatTurn` ja monta a mensagem com `campos [...]`
  // contendo APENAS caminhos de campo, nunca valores; aqui so extraimos.
  if (message.includes("nao bateu com o schema")) {
    const campos = /campos \[([^\]]*)\]/.exec(message);
    return campos && campos[1]
      ? `schema_mismatch:${campos[1]}`.slice(0, 200)
      : "schema_mismatch";
  }
  if (message.includes("JSON valido")) return "invalid_json";
  if (message.includes("nao retornou conteudo")) return "no_content";
  return "upstream_error";
}
