import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns a youtube-nocookie embed URL from an 11-char id or common watch/share URLs; otherwise null. */
export function youtubeEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/${trimmed}`;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/watch\?(?:[^#]*&)?v=)([\w-]{11})/
  );
  return match?.[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}
