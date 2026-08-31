import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/contexts/ThemeContext";

// O sonner.tsx de components/ui importa useTheme do next-themes sem provider
// montado, entao resolve "system" sozinho e ignora o tema do app. O spread
// {...props} dele fica por ultimo, logo a prop theme aqui prevalece.
export default function AppToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} />;
}
