

import type { ChromiumCdpClient } from "./chromium_cdp.ts";

const BRIDGE_URL = (import.meta.env.VITE_BRIDGE_URL ?? "").trim();
const BRIDGE_TOKEN = (import.meta.env.VITE_OPEN_COMPUTER_TOKEN ?? "").trim();


const ASLEEP_MARK = "/tmp/open-computer-browser-asleep";


function bridgeUrl(endpoint: string): string {
  const base = BRIDGE_URL || window.location.origin;
  const url = new URL(endpoint, base);

  if (BRIDGE_TOKEN) {
    url.searchParams.set("token", BRIDGE_TOKEN);
  }

  return url.toString();
}


async function runInComputer(command: string): Promise<boolean> {
  try {
    const response = await fetch(bridgeUrl("/api/exec"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    });

    return response.ok;
  } catch {
    return false;
  }
}


async function setBrowserRunning(running: boolean): Promise<boolean> {
  try {
    const response = await fetch(
      bridgeUrl(`/api/services/${running ? "start" : "stop"}/browser`),
      { method: "POST", headers: { Accept: "application/json" } },
    );

    return response.ok;
  } catch {
    return false;
  }
}


export async function wakeComputerBrowser(): Promise<void> {
  if (await setBrowserRunning(true)) return;

  await runInComputer(`rm -f ${ASLEEP_MARK}`);
}


export async function sleepComputerBrowser(
  client: ChromiumCdpClient,
): Promise<void> {
  if (await setBrowserRunning(false)) return;

  await runInComputer(`touch ${ASLEEP_MARK}`);

  await client.command("Browser.close");
}
