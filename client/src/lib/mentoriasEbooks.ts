export type RecursoTipo = "Grátis" | "Paga";

export interface Mentoria {
  id: string;
  titulo: string;
  mentor: string;
  descricao: string;
  tipo: RecursoTipo;
  link: string;
}

export interface Ebook {
  id: string;
  titulo: string;
  autor: string;
  descricao: string;
  tipo: RecursoTipo;
  link: string;
}

// Parcerias reais de mentorias entram aqui, no shape da interface Mentoria.
// Mantido vazio ate fechar parcerias. Nao inventar mentor, descricao nem link.
export const mentorias: Mentoria[] = [];

// Ebooks de parceiros entram aqui, no shape da interface Ebook.
// Mantido vazio ate fechar parcerias. Nao inventar autor, descricao nem link.
export const ebooks: Ebook[] = [];
