// Aviso de consentimento implícito (item 4.2). O "sign-in wrap": não há caixa a
// marcar, o clique no botão de auth ao lado deste texto É a manifestação do
// consentimento, e o consent_method gravado é `signup_wrap_implicit`.
//
// Componente único, e não a mesma marcação copiada nas duas telas, porque a
// redação é aprovada e juridicamente relevante: duplicada, ela sobrevive até
// alguém editar uma cópia só, e a divergência entre o que /cadastro diz e o que o
// modal diz é invisível em code review e indefensável depois.
//
// CONSPICUIDADE É REQUISITO, não estilo. A validade do consentimento implícito
// depende de o aviso ser percebível: por isso `text-sm` e `text-slate-700` (o
// mesmo peso do texto do formulário, não um cinza-claro menor que o resto), e por
// isso os links são sublinhados e coloridos, identificáveis como links sem
// depender de hover. Não reduzir tamanho nem contraste daqui sem revisar a
// decisão inteira.
//
// Renderizar ABAIXO do último controle de auth da tela e acima da dobra: o texto
// que aparece só depois de rolar não foi apresentado a ninguém.
export default function SignInWrapNotice({
  className,
}: {
  className?: string;
}) {
  return (
    <p className={className ?? "mt-4 text-sm text-slate-700"}>
      {/* Redação exata aprovada. Não parafrasear. */}
      Ao continuar, você concorda com os{" "}
      <a
        href="/termos-de-uso"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-violet-700 underline"
      >
        Termos de Uso
      </a>{" "}
      e a{" "}
      <a
        href="/privacidade"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-violet-700 underline"
      >
        Política de Privacidade
      </a>
      .
    </p>
  );
}
