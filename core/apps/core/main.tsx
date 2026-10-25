import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import CoreLayout from "../layout/core_layout.tsx";
import { createLogSink, followCreateLogs } from "../../tools/config/config_logs";
import { submitCreate, type ComputerIdentity } from "../../tools/config/core_config";
import type { ComputerHardware } from "../../tools/config/config_hardware";
import CoreConfig from "../../tools/config/core_config.tsx";
import { useCoreLoading } from "../../tools/loading/core_loading.ts";
import CoreLoading from "../../tools/loading/core_loading.tsx";
import "./app.css";



type View = "asking" | "form" | "logs" | "layout";

const screen: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  background: "#0E0E0E",
  overflow: "hidden",
  boxSizing: "border-box",
};


const dotted = (direction: "to bottom" | "to right"): CSSProperties => ({
  position: "absolute",
  backgroundImage: `repeating-linear-gradient(${direction}, #2f3136 0 3px, transparent 3px 10px)`,
  ...(direction === "to bottom"
    ? { top: 0, bottom: 0, width: "1.5px" }
    : { left: 0, right: 0, height: "1.5px" }),
  pointerEvents: "none",
});

const vertical = (left: string): CSSProperties => ({ ...dotted("to bottom"), left });
const horizontal = (top: string): CSSProperties => ({ ...dotted("to right"), top });


const cell: CSSProperties = {
  position: "absolute",
  left: "18%",
  top: "18%",
  width: "64%",
  height: "64%",
  boxSizing: "border-box",
  zIndex: 1,
  padding: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function Ground() {
  return (
    <>
      <div style={vertical("18%")} aria-hidden="true" />
      <div style={vertical("82%")} aria-hidden="true" />
      <div style={horizontal("18%")} aria-hidden="true" />
      <div style={horizontal("82%")} aria-hidden="true" />
    </>
  );
}

function Desktop() {
  const [view, setView] = useState<View>("asking");
  const [log] = useState(() => createLogSink());
  const stream = useRef<(() => void) | null>(null);
  const loading = useCoreLoading();

  
  
  useEffect(() => {
    let live = true;
    fetch("/api/computer/status")
      .then((answer) => (answer.ok ? answer.json() : Promise.reject(new Error("no bridge"))))
      .then((status: { exists?: boolean; making?: boolean; lines?: number }) => {
        if (!live) return;
        setView(
          status.exists
            ? "layout"
            : status.making || (status.lines ?? 0) > 0
              ? "logs"
              : "form",
        );
      })
      .catch(() => {
        if (live) setView("form");
      });
    return () => {
      live = false;
    };
  }, []);

  
  
  useEffect(
    () =>
      log.subscribe(() => {
        const last = log.lines()[log.lines().length - 1];
        if (last !== undefined && last.text.startsWith("=== COMPLETE")) {
          setView("layout");
        }
      }),
    [log],
  );

  
  
  useEffect(() => {
    if (view !== "logs" || stream.current) return;
    stream.current = followCreateLogs(log);
  }, [view, log]);

  
  
  
  const create = (identity: ComputerIdentity, hardware: ComputerHardware) => {
    setView("logs");
    void submitCreate(identity, hardware).then((accepted) => {
      if (!accepted)
        log.push({
          kind: "error",
          text: "The bridge did not take the design: is it running on port 7071?",
        });
    });
  };

  
  
  
  const page =
    view === "layout" ? (
      <CoreLayout />
    ) : (
      <div style={screen}>
        <Ground />
        <div style={cell}>
          {view === "logs" ? (
            <CoreConfig stage="logs" log={log} onCreate={create} />
          ) : (
            <CoreConfig stage="form" log={log} onCreate={create} />
          )}
        </div>
      </div>
    );

  
  
  return (
    <>
      {page}
      {loading.visible ? <CoreLoading leaving={loading.leaving} /> : null}
    </>
  );
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("the page has no #root element");
}

createRoot(container).render(
  <StrictMode>
    <Desktop />
  </StrictMode>,
);
