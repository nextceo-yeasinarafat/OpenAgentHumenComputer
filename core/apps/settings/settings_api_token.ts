

export type ApiTokenState = {
  token: string;
  is_loading: boolean;
  error: string | null;
};

export async function fetchApiToken(): Promise<string> {
  const answer = await fetch("/api/token", { headers: { Accept: "application/json" } });
  if (!answer.ok) throw new Error(`the bridge answered ${answer.status}`);
  return (await answer.json()).token as string;
}

export async function resetApiToken(): Promise<string> {
  const answer = await fetch("/api/token/reset", { method: "POST" });
  if (!answer.ok) throw new Error(`the bridge answered ${answer.status}`);
  return (await answer.json()).token as string;
}
