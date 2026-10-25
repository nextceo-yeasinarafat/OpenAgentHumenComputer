

import { explorerApiUrl } from "../../explorer/explorer_folders.ts";


export type MediaKind = "image" | "pdf" | "video" | "sound";

const IMAGES = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".bmp",
  ".ico",
  ".svg",
];

const VIDEOS = [".mp4", ".webm", ".ogv", ".mov", ".mkv"];
const SOUNDS = [".mp3", ".wav", ".ogg", ".m4a", ".flac"];
const PDFS = [".pdf"];


function suffixOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot).toLowerCase() : "";
}


export function mediaKindOf(name: string): MediaKind | null {
  const suffix = suffixOf(name);

  if (IMAGES.includes(suffix)) return "image";
  if (PDFS.includes(suffix)) return "pdf";
  if (VIDEOS.includes(suffix)) return "video";
  if (SOUNDS.includes(suffix)) return "sound";

  return null;
}


export function isMediaFile(name: string): boolean {
  return mediaKindOf(name) !== null;
}


export function mediaUrl(path: string): string {
  return explorerApiUrl("/api/media", { path });
}


export const MEDIA_LABEL: Record<MediaKind, string> = {
  image: "picture",
  pdf: "PDF",
  video: "video",
  sound: "sound",
};
