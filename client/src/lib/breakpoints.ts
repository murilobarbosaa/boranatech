// Breakpoint do desktop, em px. Corresponde ao `2xl` do Tailwind (valor default,
// 1536px), usado nos `2xl:hidden` / `2xl:flex` do Header pra alternar entre as
// instâncias mobile e desktop do sino. Fica aqui pra o matchMedia do
// NotificationBell não carregar o literal 1536 solto: os dois lados (este JS e a
// config do Tailwind) precisam bater, e uma constante evita que saiam de
// sincronia silenciosamente.
export const DESKTOP_BREAKPOINT_PX = 1536;
