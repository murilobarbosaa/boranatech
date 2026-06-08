import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { youtubeEmbedUrl } from "@/lib/utils";

interface VideoEmbedDialogProps {
  /** Video id, watch/share URL, playlist id, or playlist URL. */
  source: string;
  /** Shown in the dialog header and used as the iframe title. */
  title: string;
  /** External fallback link. Defaults to `source` when it is already a URL. */
  href?: string;
  /** The element that opens the dialog (a button, link, card, etc.). */
  children: ReactNode;
}

export default function VideoEmbedDialog({
  source,
  title,
  href,
  children,
}: VideoEmbedDialogProps) {
  const embed = youtubeEmbedUrl(source);
  const externalHref = href ?? (source.startsWith("http") ? source : undefined);

  if (!embed) return <>{children}</>;

  const src = embed.includes("?") ? `${embed}&rel=0` : `${embed}?rel=0`;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton
        className="max-h-[92vh] w-[calc(100%-1.25rem)] max-w-4xl gap-4 overflow-y-auto border-2 border-slate-900 p-4 sm:p-6"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-lg font-black sm:text-xl">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="aspect-video overflow-hidden rounded-xl border-2 border-slate-900 bg-black shadow-[4px_4px_0_0_rgb(15_23_42)]">
          <iframe
            title={title}
            src={src}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full"
          />
        </div>
        {externalHref ? (
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="w-full gap-2 font-black sm:w-auto"
          >
            <a href={externalHref} target="_blank" rel="noopener noreferrer">
              Abrir no YouTube
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
