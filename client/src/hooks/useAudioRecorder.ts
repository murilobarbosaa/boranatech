import { useEffect, useRef, useState } from "react";

import { showErrorToast } from "@/lib/notify";

// Gravacao de audio no navegador para a resposta por voz da entrevista.
// O hook cuida SO da captura (permissao, mimetype, timer com auto-stop,
// cleanup); a transcricao e responsabilidade da pagina, que recebe o blob
// via onRecorded e move a maquina de estados com markTranscribing/markError/
// reset. O blob fica retido em erro para reenvio sem regravar. Nenhum audio
// sai do hook alem do blob em memoria.

export const MAX_RECORDING_SECONDS = 120;

// Ordem de preferencia; Safari nao grava webm (cai no mp4).
const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

export type AudioRecorderStatus =
  | "idle"
  | "recording"
  | "transcribing"
  | "error";

function pickSupportedMime(): string | null {
  if (typeof window === "undefined") return null;
  if (typeof window.MediaRecorder === "undefined") return null;
  for (const candidate of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return null;
}

function detectSupport(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    pickSupportedMime() !== null
  );
}

export function useAudioRecorder({
  onRecorded,
}: {
  onRecorded: (blob: Blob) => void;
}) {
  // Feature detect uma vez: sem suporte o botao nem renderiza (sem placebo).
  const [supported] = useState(detectSupport);
  const [status, setStatus] = useState<AudioRecorderStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);

  const statusRef = useRef(status);
  statusRef.current = status;
  const onRecordedRef = useRef(onRecorded);
  onRecordedRef.current = onRecorded;

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  // Contador do timer fora do estado: o updater de setElapsedSeconds precisa
  // ser PURO (em dev o StrictMode roda updaters duas vezes; um stop() dentro
  // dele dispararia dobrado). O ref conta, o estado so exibe.
  const elapsedTicksRef = useRef(0);
  const discardedRef = useRef(false);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stop() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    clearTimer();
    recorder.stop(); // o onstop fecha o blob e dispara onRecorded
  }

  async function start() {
    if (!supported || statusRef.current !== "idle") return;
    const mime = pickSupportedMime();
    if (!mime) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError") {
        // TODO(Ana): mensagem de permissao de microfone negada.
        showErrorToast(
          "Sem acesso ao microfone. Tudo bem, voce pode digitar a resposta normalmente.",
        );
      } else if (name === "NotFoundError") {
        // TODO(Ana): mensagem de microfone nao encontrado.
        showErrorToast(
          "Nenhum microfone encontrado. Voce pode digitar a resposta normalmente.",
        );
      } else {
        // TODO(Ana): mensagem generica de falha ao acessar o microfone.
        showErrorToast(
          "Nao deu pra acessar o microfone agora. Voce pode digitar a resposta.",
        );
      }
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    discardedRef.current = false;

    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stopTracks();
      clearTimer();
      const chunks = chunksRef.current;
      chunksRef.current = [];
      elapsedTicksRef.current = 0;
      setElapsedSeconds(0);
      if (discardedRef.current) {
        setStatus("idle");
        return;
      }
      const blob = new Blob(chunks, { type: recorder.mimeType || mime });
      setPendingBlob(blob);
      setStatus("transcribing");
      onRecordedRef.current(blob);
    };

    elapsedTicksRef.current = 0;
    setElapsedSeconds(0);
    setStatus("recording");
    recorder.start();

    timerRef.current = window.setInterval(() => {
      elapsedTicksRef.current += 1;
      setElapsedSeconds(elapsedTicksRef.current);
      if (elapsedTicksRef.current >= MAX_RECORDING_SECONDS) {
        // Auto-stop pelo MESMO caminho do stop manual.
        stop();
      }
    }, 1000);
  }

  function discard() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      // Gravando: para sem transcrever (o onstop ve a flag e volta a idle).
      discardedRef.current = true;
      clearTimer();
      recorder.stop();
      return;
    }
    // Pos-erro (ou pos-stop): descarta o blob retido.
    setPendingBlob(null);
    elapsedTicksRef.current = 0;
    setElapsedSeconds(0);
    setStatus("idle");
  }

  // Transicoes movidas pela pagina durante a transcricao.
  function markTranscribing() {
    setStatus("transcribing");
  }

  function markError() {
    // O blob segue retido para "Tentar de novo" sem regravar.
    setStatus("error");
  }

  function reset() {
    setPendingBlob(null);
    elapsedTicksRef.current = 0;
    setElapsedSeconds(0);
    setStatus("idle");
  }

  // Cleanup rigoroso no unmount: nada continua gravando se a pessoa navegar.
  useEffect(() => {
    return () => {
      discardedRef.current = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // recorder ja parado; o que importa e soltar os tracks abaixo.
        }
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  return {
    supported,
    status,
    elapsedSeconds,
    pendingBlob,
    start,
    stop,
    discard,
    markTranscribing,
    markError,
    reset,
  };
}
