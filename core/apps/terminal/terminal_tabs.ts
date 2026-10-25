import { useCallback, useRef, useState } from "react";






export function terminalTabTitleForPath(
  path: string,
  home?: string | null,
): string {
  const cleaned = path.replace(/\/+$/, "") || "/";
  if (home) {
    const cleanHome = home.replace(/\/+$/, "");
    if (cleaned === cleanHome) return "~";
    if (cleaned.startsWith(`${cleanHome}/`)) {
      return `~${cleaned.slice(cleanHome.length)}`;
    }
  }

  return cleaned;
}

export type TerminalTab = {
  id: string;
  title: string;
  
  path?: string;
  
  startCommand?: string;
};

const createTerminalTab = (
  id: string,
  title: string,
  startCommand?: string,
): TerminalTab => ({ id, title, startCommand });

export function useTerminalTabs() {
  const nextId = useRef(2);
  
  
  
  
  
  const homeRef = useRef<string | null>(null);
  const [tabs, setTabs] = useState<TerminalTab[]>(() => [
    createTerminalTab("terminal-tab-1", "~"),
  ]);
  const [activeTabId, setActiveTabId] = useState("terminal-tab-1");

  const addTab = useCallback((title?: string, startCommand?: string) => {
    const tab = createTerminalTab(
      `terminal-tab-${nextId.current++}`,
      title ?? "~",
      startCommand,
    );
    setTabs((current) => [...current, tab]);
    setActiveTabId(tab.id);
  }, []);

  
  
  
  const updateTabCwd = useCallback((id: string, path: string) => {
    if (homeRef.current === null) {
      homeRef.current = path;
    }
    const home = homeRef.current;
    setTabs((current) =>
      current.map((tab) =>
        tab.id === id
          ? { ...tab, path, title: terminalTabTitleForPath(path, home) }
          : tab,
      ),
    );
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      if (tabs.length <= 1) return;

      const index = tabs.findIndex((tab) => tab.id === id);
      if (index === -1) return;

      const next = tabs.filter((tab) => tab.id !== id);
      setTabs(next);
      setActiveTabId((current) =>
        current === id ? next[Math.max(0, index - 1)].id : current,
      );
    },
    [tabs],
  );

  const selectTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const resetTabs = useCallback(() => {
    
    
    const tab = createTerminalTab(`terminal-tab-${nextId.current++}`, "~");
    setTabs([tab]);
    setActiveTabId(tab.id);
  }, []);

  const activeTab =
    tabs.find((tab) => tab.id === activeTabId) ?? tabs[0] ?? null;

  return {
    tabs,
    activeTabId,
    activeTab,
    
    home: homeRef,
    addTab,
    closeTab,
    selectTab,
    resetTabs,
    updateTabCwd,
  };
}

export type TerminalTabsController = ReturnType<typeof useTerminalTabs>;