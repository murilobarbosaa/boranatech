import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a youtube-nocookie embed URL from a video id, a playlist id/url, or
 * common watch/share URLs. Playlists become a videoseries embed. Returns null
 * when no video or playlist can be resolved (e.g. channel or search links).
 */
export function youtubeEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  // Playlist URL or query (only when it is not a single watch link with v=).
  const listMatch = trimmed.match(/[?&]list=([\w-]+)/);
  if (listMatch?.[1] && !/[?&]v=/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${listMatch[1]}`;
  }
  // Bare playlist id (PL, UU, FL, OL prefixes).
  if (/^(?:PL|UU|FL|OL|RD)[\w-]{10,}$/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${trimmed}`;
  }
  // Bare 11-char video id.
  if (/^[\w-]{11}$/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/${trimmed}`;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/watch\?(?:[^#]*&)?v=)([\w-]{11})/
  );
  return match?.[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}
