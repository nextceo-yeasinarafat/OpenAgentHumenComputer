

export type LogLine = {
  
  at: number;
  
  kind: "step" | "output" | "error";
  
  text: string;
};

export type LogSink = {
  
  push(line: Omit<LogLine, "at">): void;
  
  lines(): readonly LogLine[];
  
  subscribe(listener: () => void): () => void;
};


export function createLogSink(): LogSink {
  const lines: LogLine[] = [];
  const listeners = new Set<() => void>();
  return {
    push(line) {
      lines.push({ ...line, at: Date.now() });
      for (const listener of listeners) listener();
    },
    lines: () => lines,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}


export function followCreateLogs(sink: LogSink): () => void {
  const stream = new EventSource("/api/create/logs");
  stream.onmessage = (event) => {
    try {
      const body: unknown = JSON.parse(event.data);
      const fields = (body ?? {}) as Record<string, unknown>;
      const kind =
        fields.kind === "error" || fields.kind === "step" ? fields.kind : "output";
      const text = typeof fields.text === "string" ? fields.text : "";
      if (text.length === 0) return;
      sink.push({ kind, text });
      
      
      if (kind === "step" && text.startsWith("the computer is up")) {
        sink.push({
          kind: "step",
          text: "=== COMPLETE — the computer has been created and is running ===",
        });
      } else if (kind === "step" && text.startsWith("the making stopped")) {
        sink.push({
          kind: "error",
          text: "=== INCOMPLETE — the making stopped before the computer was up ===",
        });
      }
    } catch {
      
    }
  };
  return () => stream.close();
}
