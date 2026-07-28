// Camadas de empilhamento da aba Tarefas.
//
// NAO SAO NUMEROS NOVOS. A escala ja existe no admin e esta documentada no
// proprio Admin.tsx; aqui ela so ganha nome para nao ser reinventada a cada
// dialogo:
//
//   z-[1000]  header do admin, fixo    (Admin.tsx, `sticky top-0 z-[1000]`)
//   z-[1100]  popup de select na PAGINA (BntSelect ja usa este, com o comentario
//             "z acima do header fixo (z-[1000])")
//   z-[2000]  modal do admin            (Admin.tsx, `fixed inset-0 z-[2000]`)
//   z-[2100]  popup ABERTO DENTRO de um modal (Admin.tsx: "z acima do modal
//             (z-[2000]) pra nunca ficar atras dele")
//
// O bug que motivou este arquivo: os primitivos shadcn (dialog, alert-dialog,
// popover, dropdown-menu) vem com `z-50`, que perde para o header `z-[1000]`.
// O modal da tarefa montava em portal no body e ficava ATRAS do header, com o
// topo inalcancavel.
//
// LIMITE CONHECIDO: `DialogContent` e `AlertDialogContent` renderizam o overlay
// internamente, sem repassar props, entao daqui so da para subir o CONTEUDO. O
// overlay continua em z-50 e o header aparece por cima do escurecido (cosmetico:
// o Radix poe `pointer-events: none` no body enquanto o modal esta aberto, entao
// o header nao fica clicavel). Consertar de vez e uma linha em
// `components/ui/dialog.tsx` e `alert-dialog.tsx`, o que tambem corrigiria
// BugsDashboard e NotificationsManager, que tem o MESMO defeito pre-existente.
// Ficou fora desta rodada de propósito.

/** Conteudo de modal: acima do header. */
export const LAYER_DIALOG = "z-[2000]";

/** Popup (popover, dropdown, select) aberto DENTRO de um modal. */
export const LAYER_IN_DIALOG = "z-[2100]";

/** Popup aberto na pagina, fora de modal: acima do header, abaixo de modal. */
export const LAYER_ON_PAGE = "z-[1100]";
