

import { explorerApiUrl } from "../explorer/explorer_folders.ts";


export const UPLOAD_LIMIT_BYTES = 32 * 1024 * 1024;

export type UploadedFile = {
  
  path: string;
  
  name: string;
};


export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}


export function fileName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}


function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("the file could not be read"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : "");
    };

    reader.readAsDataURL(file);
  });
}


async function answerDetail(response: Response): Promise<string> {
  const text = await response.text();

  try {
    const body = JSON.parse(text) as { detail?: string };
    if (body?.detail) return body.detail;
  } catch {
    
  }

  return text.trim() || `the computer answered ${response.status}`;
}


export async function uploadFileToComputer(
  file: File,
  dir: string,
): Promise<UploadedFile> {
  if (file.size > UPLOAD_LIMIT_BYTES) {
    throw new Error(
      `${file.name} is ${formatFileSize(file.size)}: the heaviest file is ${formatFileSize(UPLOAD_LIMIT_BYTES)}`,
    );
  }

  const data = await fileToBase64(file);

  const response = await fetch(explorerApiUrl("/api/upload"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dir, name: file.name, data }),
  });

  if (!response.ok) throw new Error(await answerDetail(response));

  const payload = (await response.json()) as { path?: string; name?: string };

  return {
    path: payload.path ?? "",
    name: payload.name ?? file.name,
  };
}
