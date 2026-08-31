// Familia visual dos BOTOES-ICONE circulares do header (o sino e o "?").
//
// Existe para o desenho morar em UM lugar so. Antes cada um trazia a sua copia
// das classes, e as copias divergiram: o sino nasceu com 36px e fundo branco, o
// "?" com 40px e fundo transparente, e os dois ficaram lado a lado obviamente
// diferentes. Copia de estilo diverge do mesmo jeito que guarda escrita no
// chamador some: no primeiro que alguem esquecer.
//
// E uma CONSTANTE de classes, e nao um componente <HeaderIconButton>, porque um
// dos consumidores e o `SheetTrigger`/`PopoverTrigger` do Radix, que recebe
// `className` e renderiza o proprio elemento. Componente forcaria `asChild` e um
// nivel de indireção a mais para o mesmo resultado.
//
// O que NAO entra aqui: o que e especifico de um consumidor (o
// `data-[state=open]` do popover do sino, o `disabled:` do "?"). Cada um
// acrescenta o seu depois.
//
// Tokens, todos ja usados pelo header:
//   - 40px (h-10 w-10), a altura dos pills "Entrar", "Sair" e "Admin";
//   - `bg-white`, `border-2 border-slate-900`, `shadow-[2px_2px_0_var(--bnt-shadow)]`
//     crescendo para 3px no hover, iguais aos pills;
//   - press por `bnt-pressable` (a classe global do projeto, que ja traz a
//     transicao de transform e box-shadow, entao nao precisa de transition-all);
//   - foco por outline, e nao por ring: num alvo circular de 40px o anel de 4px
//     encosta no vizinho.
//
// `relative` fica na base porque o sino ancora o badge de contagem nele.
export const HEADER_ICON_BUTTON_CLASS =
  "bnt-pressable relative inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] hover:shadow-[3px_3px_0_var(--bnt-shadow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";
