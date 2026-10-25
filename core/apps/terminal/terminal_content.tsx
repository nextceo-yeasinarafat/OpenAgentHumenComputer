import { useCallback, useEffect, useRef } from "react";

import {
  createTerminalContent,
  type TerminalContentConnection,
} from "./terminal_content.ts";
import type { TerminalTab } from "./terminal_tabs.ts";



type TerminalContentProps = {
  tabs: TerminalTab[];
  activeTabId: string;
  
  onTabCwd?: (tabId: string, path: string) => void;
};

export default function TerminalContent({
  tabs,
  activeTabId,
  onTabCwd,
}: TerminalContentProps) {
  const paneElementsRef = useRef(new Map<string, HTMLDivElement>());
  const connectionsRef = useRef(new Map<string, TerminalContentConnection>());
  
  
  const onTabCwdRef = useRef(onTabCwd);

  useEffect(() => {
    onTabCwdRef.current = onTabCwd;
  });

  const registerPane = useCallback(
    (id: string, element: HTMLDivElement | null) => {
      if (element) {
        paneElementsRef.current.set(id, element);
      } else {
        paneElementsRef.current.delete(id);
      }
    },
    [],
  );

  
  useEffect(() => {
    const element = paneElementsRef.current.get(activeTabId);
    if (!element) return;
    if (connectionsRef.current.has(activeTabId)) return;

    connectionsRef.current.set(
      activeTabId,
      createTerminalContent(element, {
        initialCommand: tabs.find((tab) => tab.id === activeTabId)
          ?.startCommand,
        onCwdChange: (path) => onTabCwdRef.current?.(activeTabId, path),
      }),
    );
  }, [activeTabId, tabs]);

  
  
  useEffect(() => {
    const connection = connectionsRef.current.get(activeTabId);
    if (!connection) return;

    const frame = window.requestAnimationFrame(() => {
      connection.fit();
      connection.refresh();
      connection.terminal.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTabId, tabs]);

  
  useEffect(() => {
    const liveTabs = new Set(tabs.map((tab) => tab.id));

    connectionsRef.current.forEach((connection, id) => {
      if (liveTabs.has(id)) return;

      connection.dispose();
      connectionsRef.current.delete(id);
    });
  }, [tabs]);

  
  useEffect(() => {
    const connections = connectionsRef.current;

    return () => {
      connections.forEach((connection) => connection.dispose());
      connections.clear();
    };
  }, []);

  return (
    <>
      <div className="oc-terminal__content">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={(element) => registerPane(tab.id, element)}
            className={`oc-terminal__pane${
              tab.id === activeTabId ? " is-active" : ""
            }`}
          />
        ))}
      </div>

      <style>{`
        .oc-terminal__content {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: #000000;
        }

        .oc-terminal__pane {
          position: absolute;
          inset: 0;
          display: none;
          box-sizing: border-box;
          padding: 8px 10px;
          background: #000000;
        }

        .oc-terminal__pane.is-active {
          display: block;
        }

        .oc-terminal__pane .xterm {
          height: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .oc-terminal__pane .xterm-viewport {
          background: #000000;
          scrollbar-width: thin;
        }
      `}</style>
    </>
  );
}