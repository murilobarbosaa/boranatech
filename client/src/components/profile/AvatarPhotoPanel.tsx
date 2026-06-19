import { useRef, useState } from "react";
import { AlertTriangle, Loader2, Trash2, Upload } from "lucide-react";

import { showErrorToast } from "@/lib/notify";
import type { PendingPhoto } from "@/services/avatarService";
import type { Profile } from "@/services/contracts";

// Crop quadrado em canvas puro (sem dependencia externa): arrastar pra posicionar
// + slider de zoom. A imagem reduzida (512x512 WebP) NAO sobe na hora: fica pendente
// (onStage) e so e enviada/moderada quando o usuario clica em Salvar no editor.
const VIEW = 256;
const OUTPUT = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar a imagem."));
    img.src = src;
  });
}

interface AvatarPhotoPanelProps {
  profile: Profile | null;
  hasGoogleIdentity: boolean;
  pending: PendingPhoto | null;
  onStage: (intent: PendingPhoto | null) => void;
}

export default function AvatarPhotoPanel({
  profile,
  hasGoogleIdentity,
  pending,
  onStage,
}: AvatarPhotoPanelProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const dragRef = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = profile?.avatar_moderation_status ?? "clean";
  const hasPhoto = profile?.avatar_mode === "photo" && !!profile?.avatar_url;
  const uploadDisabled = profile?.avatar_upload_disabled === true;
  const inReview = status === "pending_review";
  const removed = status === "removed";
  // Bloqueia trocar de foto (enviar/Google); remover continua permitido.
  const blockChange = processing || inReview || removed || uploadDisabled;

  const base = imgDims ? Math.max(VIEW / imgDims.w, VIEW / imgDims.h) : 1;
  const displayScale = base * zoom;
  const dispW = imgDims ? imgDims.w * displayScale : 0;
  const dispH = imgDims ? imgDims.h * displayScale : 0;

  function clamp(o: { x: number; y: number }, dW: number, dH: number) {
    return {
      x: Math.min(0, Math.max(VIEW - dW, o.x)),
      y: Math.min(0, Math.max(VIEW - dH, o.y)),
    };
  }

  function resetCrop() {
    setImageSrc(null);
    setImgDims(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite re-selecionar o mesmo arquivo
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      showErrorToast("Use uma imagem PNG, JPEG ou WEBP.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      void loadImage(src)
        .then((img) => {
          const dims = { w: img.naturalWidth, h: img.naturalHeight };
          const b = Math.max(VIEW / dims.w, VIEW / dims.h);
          const dW = dims.w * b;
          const dH = dims.h * b;
          setImgDims(dims);
          setZoom(1);
          setOffset({ x: (VIEW - dW) / 2, y: (VIEW - dH) / 2 });
          setImageSrc(src);
        })
        .catch(() => showErrorToast("Não foi possível abrir essa imagem."));
    };
    reader.readAsDataURL(file);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!imgDims) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      sx: event.clientX,
      sy: event.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || !imgDims) return;
    const next = {
      x: drag.ox + (event.clientX - drag.sx),
      y: drag.oy + (event.clientY - drag.sy),
    };
    setOffset(clamp(next, dispW, dispH));
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function handleZoom(event: React.ChangeEvent<HTMLInputElement>) {
    const z1 = Number(event.target.value);
    if (!imgDims) {
      setZoom(z1);
      return;
    }
    // Zoom ancorado no centro do viewport.
    const ds0 = base * zoom;
    const ds1 = base * z1;
    const imgCx = (VIEW / 2 - offset.x) / ds0;
    const imgCy = (VIEW / 2 - offset.y) / ds0;
    const nx = VIEW / 2 - imgCx * ds1;
    const ny = VIEW / 2 - imgCy * ds1;
    setZoom(z1);
    setOffset(clamp({ x: nx, y: ny }, imgDims.w * ds1, imgDims.h * ds1));
  }

  // Recorta no canvas e DEIXA PENDENTE (nao sobe agora). O envio acontece no Salvar.
  async function onConfirmCrop() {
    if (!imageSrc || !imgDims) return;
    setProcessing(true);
    try {
      const ds = base * zoom;
      const srcSize = VIEW / ds;
      const srcX = -offset.x / ds;
      const srcY = -offset.y / ds;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível.");

      const img = await loadImage(imageSrc);
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);

      let dataUrl = canvas.toDataURL("image/webp", 0.9);
      if (!dataUrl.startsWith("data:image/webp")) {
        dataUrl = canvas.toDataURL("image/png"); // navegador sem WebP
      }

      onStage({ type: "upload", dataUrl });
      resetCrop();
    } catch {
      showErrorToast("Não foi possível preparar a imagem.");
    } finally {
      setProcessing(false);
    }
  }

  const pendingLabel =
    pending?.type === "upload"
      ? "Nova foto pronta."
      : pending?.type === "google"
        ? "Foto do Google selecionada."
        : pending?.type === "remove"
          ? "A foto será removida."
          : null;

  return (
    <div className="mt-4 space-y-4">
      {inReview ? (
        <div className="flex items-start gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Sua foto está em análise pela moderação e fica oculta até a revisão.
            Você pode removê-la, mas não trocar enquanto isso.
          </span>
        </div>
      ) : null}

      {removed || uploadDisabled ? (
        <div className="flex items-start gap-2 rounded-2xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Sua foto foi removida pela moderação e o upload está desabilitado
            nesta conta.
          </span>
        </div>
      ) : null}

      {pendingLabel ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl border-2 border-[#1a1a1a] bg-[#FFF7DB] px-3 py-2 text-xs font-bold text-[#1a1a1a]">
          <span>{pendingLabel} Clique em Salvar para aplicar.</span>
          <button
            type="button"
            onClick={() => onStage(null)}
            className="shrink-0 rounded-full border-2 border-[#1a1a1a] bg-white px-3 py-1 font-black"
          >
            Desfazer
          </button>
        </div>
      ) : null}

      {imageSrc ? (
        <div className="space-y-3">
          <div
            className="mx-auto touch-none overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-slate-100"
            style={{
              width: VIEW,
              height: VIEW,
              position: "relative",
              cursor: "grab",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              className="pointer-events-none max-w-none select-none"
              style={{
                position: "absolute",
                left: offset.x,
                top: offset.y,
                width: dispW,
                height: dispH,
              }}
            />
          </div>

          <label className="block text-xs font-black text-[#1a1a1a]">
            Zoom
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={handleZoom}
              disabled={processing}
              className="mt-1 w-full"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetCrop}
              disabled={processing}
              className="rounded-full border-2 border-[#1a1a1a] bg-white px-4 py-2 text-sm font-black disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void onConfirmCrop()}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a] disabled:opacity-60"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {processing ? "Preparando..." : "Usar esta foto"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-500">
            Envie uma foto quadrada. Ela passa por uma checagem automática ao
            salvar. A foto substitui ícone e fundo; a borda continua valendo.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onFile}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={blockChange}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {hasPhoto ? "Trocar foto" : "Enviar foto"}
            </button>

            {hasGoogleIdentity ? (
              <button
                type="button"
                onClick={() => onStage({ type: "google" })}
                disabled={blockChange}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-white px-4 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Usar foto do Google
              </button>
            ) : null}

            {hasPhoto ? (
              <button
                type="button"
                onClick={() => onStage({ type: "remove" })}
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-white px-4 py-2 text-sm font-black text-rose-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Remover foto
              </button>
            ) : null}
          </div>

          <p className="text-xs font-semibold text-slate-400">
            PNG, JPEG ou WEBP, até 5MB. A foto é aplicada ao salvar.
          </p>
        </div>
      )}
    </div>
  );
}
