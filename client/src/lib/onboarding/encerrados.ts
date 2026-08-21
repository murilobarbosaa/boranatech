// routeKeys ENCERRADOS (concluidos ou pulados) nesta carga de pagina.
//
// Por que isto existe: no logado a decisao vai para `profiles.preferences` por
// um PATCH, e o AuthContext nao atualiza o perfil em memoria depois dele. Ou
// seja, entre a decisao e o proximo carregamento inteiro da pagina, o perfil em
// maos continua sem a chave, e `hasSeenOnboarding` responde "nao viu" sobre uma
// rota que a pessoa acabou de fechar.
//
// Por que MODULO e nao `useRef` no host: o escopo tem de ser a CARGA DA PAGINA,
// e um ref e escopo de MONTAGEM. O host remonta dentro da mesma carga (o
// ConsentGate volta para "checking" e desmonta os children a cada re-checagem,
// por exemplo ao voltar de /privacidade ou /termos-de-uso), e o registro em ref
// nascia vazio na remontagem. Era esse o bug do "cliquei em Pular e ele voltou".
//
// A guarda de dono mora DENTRO das funcoes, nunca no chamador: sair de uma
// conta e entrar em outra sem recarregar a pagina nao pode herdar o que a
// primeira decidiu, e a checagem escrita aqui cobre todo mundo que chamar.

/** `null` = anonimo. */
type Dono = string | null;

let dono: Dono = null;
let encerrados = new Set<string>();

function trocarDeDono(proximo: Dono): void {
  if (proximo === dono) return;
  dono = proximo;
  encerrados = new Set();
}

/** Marca a rota como decidida nesta carga, para o dono informado. */
export function marcarEncerrado(routeKey: string, proximoDono: Dono): void {
  trocarDeDono(proximoDono);
  encerrados.add(routeKey);
}

/** Foi decidida nesta carga, por este mesmo dono? */
export function foiEncerrado(routeKey: string, proximoDono: Dono): boolean {
  trocarDeDono(proximoDono);
  return encerrados.has(routeKey);
}

/**
 * Zera o registro. Serve aos testes, que compartilham o modulo entre casos: em
 * producao quem zera e o recarregamento da pagina ou a troca de dono.
 */
export function limparEncerrados(): void {
  dono = null;
  encerrados = new Set();
}
