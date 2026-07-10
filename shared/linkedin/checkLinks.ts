// Deep links DETERMINISTAS de "Resolver agora" por check do analisador de
// LinkedIn. Regra dura de honestidade: a analise NAO conhece a URL publica
// nem o vanity name do perfil do usuario (o parse do PDF nao extrai isso e o
// formulario nao pede), e o LinkedIn nao documenta URLs estaveis de edicao
// por secao. A UNICA URL que existe por construcao sem nenhum dado do usuario
// e https://www.linkedin.com/in/me, o redirect oficial do LinkedIn para o
// proprio perfil logado. Por isso:
//  - checks cuja correcao acontece DENTRO do proprio perfil (headline, Sobre,
//    experiencias, competencias, foto, banner, Open to Work) resolvem para
//    /in/me, onde toda a edicao comeca;
//  - checks cuja acao NAO e edicao do perfil (crescer a rede de conexoes,
//    postar e comentar no feed) devolvem null e a UI mostra so a instrucao;
//  - id fora do catalogo devolve null, nunca adivinhacao.

const PROFILE_URL = "https://www.linkedin.com/in/me";

// Ids do LINKEDIN_CHECK_CATALOG cuja correcao e edicao do proprio perfil.
// Fora desta lista ficam, de proposito: "conexoes" (acao e conectar com
// pessoas, nao editar o perfil) e "atividade" (acao e postar/comentar no
// feed).
const PROFILE_EDIT_CHECK_IDS = new Set([
  // headline
  "headline-existe",
  "headline-cargo-alvo",
  "headline-stack",
  "headline-tamanho",
  "headline-sem-cliche",
  "headline-em-ingles",
  // sobre
  "sobre-existe",
  "sobre-gancho",
  "sobre-stack",
  "sobre-cta",
  "sobre-tamanho",
  "sobre-em-ingles",
  // experiencias
  "exp-existe",
  "exp-descricoes",
  "exp-verbos-acao",
  "exp-tecnologias",
  "exp-resultados",
  // encontrabilidade (a correcao e reescrever campos do proprio perfil)
  "cargo-em-experiencia",
  "cobertura-keywords-area",
  "cobertura-keywords-otima",
  "termos-bilingues",
  // skills
  "skills-quantidade",
  "skills-cobertura",
  "skills-quantidade-otima",
  // sinais editaveis no perfil
  "foto-profissional",
  "banner-personalizado",
  "open-to-work",
]);

export function resolveCheckActionUrl(checkId: string): string | null {
  return PROFILE_EDIT_CHECK_IDS.has(checkId) ? PROFILE_URL : null;
}
