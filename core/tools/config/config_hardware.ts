



export type Hardware = {
  
  cpuCores: number | null;
  
  ramGb: number | null;
  
  storageGb: number | null;
  
  gpu: string | null;
  
  source: "system" | "browser";
};


export const EMPTY_MACHINE: Hardware = {
  cpuCores: null,
  ramGb: null,
  storageGb: null,
  gpu: null,
  source: "browser",
};



export type ComputerHardware = {
  
  storageGb: number | null;
  
  ramGb: number | null;
  
  cpuCores: number | null;
  
  gpuPercent: number;
};

export const EMPTY_HARDWARE: ComputerHardware = {
  storageGb: null,
  ramGb: null,
  cpuCores: null,
  gpuPercent: 0,
};




function oneNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}


function oneText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}


async function readSystemHardware(): Promise<Hardware | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const answer = await fetch("/api/system/hardware", { signal: controller.signal });
    clearTimeout(timer);
    if (!answer.ok) return null;
    const body: unknown = await answer.json();
    const fields = (body ?? {}) as Record<string, unknown>;
    const hardware: Hardware = {
      cpuCores: oneNumber(fields.cpuCores),
      ramGb: oneNumber(fields.ramGb),
      storageGb: oneNumber(fields.storageGb),
      gpu: oneText(fields.gpu),
      source: "system",
    };
    return hardware.cpuCores !== null ||
      hardware.ramGb !== null ||
      hardware.storageGb !== null ||
      hardware.gpu !== null
      ? hardware
      : null;
  } catch {
    return null;
  }
}


function readBrowserGpu(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (!gl) return null;
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug
      ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return oneText(renderer);
  } catch {
    return null;
  }
}


function readBrowserHardware(): Hardware {
  const cores =
    typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency > 0
      ? navigator.hardwareConcurrency
      : null;
  return {
    cpuCores: cores,
    
    
    ramGb: null,
    storageGb: null,
    gpu: readBrowserGpu(),
    source: "browser",
  };
}


export async function readHardware(): Promise<Hardware> {
  return (await readSystemHardware()) ?? readBrowserHardware();
}


export function printHardware(hardware: Hardware): string {
  const one = (value: number | null, unit: string) =>
    value === null ? "—" : `${value} ${unit}`;
  return [
    one(hardware.cpuCores, "CORES"),
    one(hardware.ramGb, "GB"),
    one(hardware.storageGb, "GB"),
    hardware.gpu ?? "—",
  ].join("  ·  ");
}
