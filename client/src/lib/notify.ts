import { toast } from "sonner";

interface ActionToastAction {
  label: string;
  onClick: () => void;
}

// Confirmacao de acao no visual padrao do "Salvo em Favoritos": toast.success do
// sonner (card com icone de check + mensagem) com botao de acao opcional. Centraliza
// o padrao pra todas as confirmacoes ficarem iguais e faceis de restilizar depois.
export function showActionToast(options: {
  message: string;
  action?: ActionToastAction;
}) {
  toast.success(
    options.message,
    options.action ? { action: options.action } : undefined,
  );
}

export function showErrorToast(message: string) {
  toast.error(message);
}
