

export type McpState = {
  running: boolean;
};

export async function fetchMcpState(): Promise<McpState> {
  const answer = await fetch("/api/mcp/status", { headers: { Accept: "application/json" } });
  if (!answer.ok) throw new Error(`the bridge answered ${answer.status}`);
  return (await answer.json()) as McpState;
}

export async function setMcpRunning(wanted: boolean): Promise<McpState> {
  const answer = await fetch(`/api/mcp/${wanted ? "start" : "stop"}`, { method: "POST" });
  if (!answer.ok) throw new Error(`the bridge answered ${answer.status}`);
  return (await answer.json()) as McpState;
}

export async function fetchMcpConfig(): Promise<string> {
  const answer = await fetch("/api/mcp/config", { headers: { Accept: "application/json" } });
  if (!answer.ok) throw new Error(`the bridge answered ${answer.status}`);
  return (await answer.json()).config as string;
}
