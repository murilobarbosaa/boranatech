// Como resolver cada check do analisador de LinkedIn, em passos.
//
// HISTÓRIA E DECISÃO (Fase 2A). Antes existia aqui um "Resolver agora" que
// devolvia uma URL. A URL era a MESMA para os 28 checks editáveis:
// https://www.linkedin.com/in/me, o redirect do LinkedIn para o próprio perfil.
// Ou seja, o botão prometia levar ao lugar do problema e largava a pessoa na
// porta de entrada, igual para "sua headline não tem o cargo" e para "você tem
// poucas competências cadastradas". Um botão que sempre leva ao mesmo lugar não
// é um deep link, é um link.
//
// Por que não trocamos por deep links de verdade: o LinkedIn não documenta URLs
// estáveis de edição por seção, e as que circulam (/in/me/edit/intro/,
// /in/me/details/skills/) só podem ser verificadas dentro de uma sessão
// autenticada do usuário. Publicar URL não verificada num botão chamado
// "Resolver agora" é a mesma classe de erro que esta auditoria inteira combate:
// afirmar sem lastro. Enquanto ninguém verificar com a conta na mão, elas não
// entram.
//
// O que ficou: o caminho em passos, dentro do card, que funciona no app e no
// site e não depende de URL nenhuma. Cobre os 30 checks, inclusive os dois que
// antes não tinham nada (conexões e atividade, cuja correção não é editar o
// perfil).

/** Onde, dentro do LinkedIn, a correção acontece. */
type Destino =
  | "apresentacao"
  | "sobre"
  | "experiencias"
  | "competencias"
  | "foto"
  | "banner"
  | "opentowork"
  | "rede"
  | "feed";

const PASSOS: Record<Destino, string[]> = {
  apresentacao: [
    "Abra o seu perfil no LinkedIn.",
    "Toque no lápis ao lado do seu nome, em Editar apresentação.",
    "Reescreva o campo Título e salve.",
  ],
  sobre: [
    "Abra o seu perfil e role até a seção Sobre.",
    "Toque no lápis da seção (se ela não existir, use Adicionar seção do perfil e escolha Sobre).",
    "Cole o novo texto e salve.",
  ],
  experiencias: [
    "Abra o seu perfil e role até a seção Experiência.",
    "Toque no lápis da experiência que você quer mudar.",
    "Edite o campo de descrição e salve. Repita para cada experiência.",
  ],
  competencias: [
    "Abra o seu perfil e role até a seção Competências.",
    "Toque em Adicionar competências e digite uma por vez.",
    "Salve. Você pode adicionar até 50, e as 3 fixadas aparecem primeiro.",
  ],
  foto: [
    "Abra o seu perfil e toque na sua foto.",
    "Escolha Adicionar foto ou Editar foto.",
    "Use uma foto de rosto, com boa luz e fundo simples, e salve.",
  ],
  banner: [
    "Abra o seu perfil e toque na faixa de capa, atrás da sua foto.",
    "Escolha Alterar foto e envie uma imagem de 1584 por 396 pixels.",
    "Salve.",
  ],
  opentowork: [
    "Abra o seu perfil e toque no botão Abrir para, logo abaixo do seu nome.",
    "Escolha Encontrar um novo emprego.",
    "Preencha cargos e locais e escolha quem vê: só recrutadores ou todo mundo.",
  ],
  rede: [
    "Abra Minha rede, no menu principal.",
    "Conecte com quem trabalha na sua área e com recrutadores das empresas que te interessam.",
    "Mande convite com nota curta dizendo por que está conectando. Aceitam mais.",
  ],
  feed: [
    "Abra a página inicial do LinkedIn.",
    "Comente em uma publicação da sua área, ou publique algo que você aprendeu esta semana.",
    "Repita uma ou duas vezes por semana. Frequência importa mais que tamanho.",
  ],
};

const DESTINO_POR_CHECK: Record<string, Destino> = {
  // headline
  "headline-existe": "apresentacao",
  "headline-cargo-alvo": "apresentacao",
  "headline-stack": "apresentacao",
  "headline-tamanho": "apresentacao",
  "headline-sem-cliche": "apresentacao",
  "headline-em-ingles": "apresentacao",
  // sobre
  "sobre-existe": "sobre",
  "sobre-gancho": "sobre",
  "sobre-stack": "sobre",
  "sobre-cta": "sobre",
  "sobre-tamanho": "sobre",
  "sobre-em-ingles": "sobre",
  // experiencias
  "exp-existe": "experiencias",
  "exp-descricoes": "experiencias",
  "exp-verbos-acao": "experiencias",
  "exp-tecnologias": "experiencias",
  "exp-resultados": "experiencias",
  // encontrabilidade: a correcao e reescrever campos do proprio perfil
  "cargo-em-experiencia": "experiencias",
  "cobertura-keywords-area": "competencias",
  "cobertura-keywords-otima": "competencias",
  "termos-bilingues": "apresentacao",
  // skills
  "skills-quantidade": "competencias",
  "skills-cobertura": "competencias",
  "skills-quantidade-otima": "competencias",
  // sinais
  "foto-profissional": "foto",
  "banner-personalizado": "banner",
  "open-to-work": "opentowork",
  conexoes: "rede",
  atividade: "feed",
};

/**
 * Passos para resolver um check, ou null se o id não estiver no catálogo.
 *
 * Nunca adivinha: id desconhecido devolve null e a UI mostra só o hint.
 */
export function resolveCheckPassos(checkId: string): string[] | null {
  const destino = DESTINO_POR_CHECK[checkId];
  return destino ? PASSOS[destino] : null;
}
