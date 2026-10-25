

export type ServiceName =
  | "bridge"
  | "computer"
  | "screen"
  | "browser"
  | "mcp"
  | "vscode";

export type ServicesState = Record<string, string>;

export async function fetchServices(): Promise<ServicesState> {
  const answer = await fetch("/api/services", { headers: { Accept: "application/json" } });
  if (!answer.ok) throw new Error(`the bridge answered ${answer.status}`);
  return (await answer.json()).services as ServicesState;
}

export async function serviceAction(
  action: "start" | "stop" | "restart",
  service: ServiceName | "all",
): Promise<void> {
  const answer = await fetch(`/api/services/${action}/${service}`, { method: "POST" });
  if (!answer.ok) {
    const detail = await answer.text();
    throw new Error(detail.trim().slice(0, 200) || `the bridge answered ${answer.status}`);
  }
}


export const SERVICE_NOTES: Record<ServiceName, string> = {
  bridge: "the voice between this page and the machine",
  computer: "the Linux machine itself",
  screen: "the display, the VNC and the picture of it",
  browser: "Chrome and its DevTools forwarder",
  mcp: "the protocol server the agents speak",
  vscode: "the editor server of the computer",
};
