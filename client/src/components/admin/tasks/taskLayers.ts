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
// RESOLVIDO. O texto anterior dizia que `DialogContent` e `AlertDialogContent`
// renderizavam o overlay sem repassar props, entao daqui so daria para subir o
// CONTEUDO e o overlay ficaria preso em z-50. Os dois primitivos passaram a
// aceitar `overlayClassName` (`components/ui/dialog.tsx`, `alert-dialog.tsx`) e
// todos os dialogos desta aba ja o passam, entao o overlay sobe junto.
//
// O QUE CONTINUA VALENDO: o antigo `BugsDashboard.tsx` (removido na Fase 5) ainda monta `DialogContent` sem
// `overlayClassName`, com o mesmo defeito pre-existente. Nao e escopo daqui, e
// fica registrado para nao ser redescoberto.

/** Conteudo de modal: acima do header. */
export const LAYER_DIALOG = "z-[2000]";

/** Popup (popover, dropdown, select) aberto DENTRO de um modal. */
export const LAYER_IN_DIALOG = "z-[2100]";

/** Popup aberto na pagina, fora de modal: acima do header, abaixo de modal. */
export const LAYER_ON_PAGE = "z-[1100]";
