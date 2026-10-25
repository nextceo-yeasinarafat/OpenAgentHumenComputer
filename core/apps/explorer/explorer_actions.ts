import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  explorerApiUrl,
  explorerHome,
  type ExplorerEntry,
} from "./explorer_folders.ts";



export type ExplorerActionId =
  | "new-folder"
  | "new-file"
  | "paste"
  | "open-terminal"
  | "rename"
  | "cut"
  | "copy"
  | "move-to"
  | "copy-to"
  | "delete";

export type ExplorerMenuTone = "normal" | "danger";

export type ExplorerMenuItem = {
  id: ExplorerActionId;
  label: string;
  tone: ExplorerMenuTone;
};

export type ExplorerMenuSection = {
  id: string;
  items: ExplorerMenuItem[];
};


export function explorerMenuSections(
  target: ExplorerEntry | null,
  hasClipboard: boolean,
): ExplorerMenuSection[] {
  if (!target) {
    const sections: ExplorerMenuSection[] = [
      {
        id: "new",
        items: [
          { id: "new-folder", label: "New Folder", tone: "normal" },
          { id: "new-file", label: "New File", tone: "normal" },
        ],
      },
    ];

    if (hasClipboard) {
      sections.push({
        id: "clipboard",
        items: [{ id: "paste", label: "Paste Item", tone: "normal" }],
      });
    }

    sections.push({
      id: "terminal",
      items: [
        { id: "open-terminal", label: "Open in Terminal", tone: "normal" },
      ],
    });

    return sections;
  }

  const sections: ExplorerMenuSection[] = [
    {
      id: "edit",
      items: [
        { id: "rename", label: "Rename", tone: "normal" },
        { id: "cut", label: "Cut", tone: "normal" },
        { id: "copy", label: "Copy", tone: "normal" },
      ],
    },
    {
      id: "transfer",
      items: [
        { id: "move-to", label: "Move to…", tone: "normal" },
        { id: "copy-to", label: "Copy to…", tone: "normal" },
      ],
    },
  ];

  if (target.isDirectory) {
    sections.push({
      id: "terminal",
      items: [
        { id: "open-terminal", label: "Open in Terminal", tone: "normal" },
      ],
    });
  }

  sections.push({
    id: "remove",
    items: [{ id: "delete", label: "Delete Permanently", tone: "danger" }],
  });

  return sections;
}


export type ExplorerClipboard = {
  entry: ExplorerEntry;
  mode: "cut" | "copy";
};


export type ExplorerPrompt = {
  id: number;
  title: string;
  detail: string;
  label: string | null;
  value: string;
  confirm: string;
  cancel: string;
  tone: ExplorerMenuTone;
  error: string | null;
};

export type ExplorerMenu = {
  x: number;
  y: number;
  entry: ExplorerEntry | null;
};




export function explorerChildPath(parent: string, name: string): string {
  const base = parent === "/" ? "" : parent.replace(/\/+$/, "");

  return `${base}/${name}`;
}


export function explorerParentPath(path: string): string {
  const trimmed = path === "/" ? path : path.replace(/\/+$/, "");
  const index = trimmed.lastIndexOf("/");

  if (index <= 0) return "/";

  return trimmed.slice(0, index);
}


export function explorerFolderFromInput(value: string): string {
  const typed = value.trim();
  const home = explorerHome();

  if (typed === "~") return home || typed;
  if (typed.startsWith("~/")) {
    return home ? `${home}/${typed.slice(2)}` : typed;
  }

  return typed.length > 1 ? typed.replace(/\/+$/, "") : typed;
}


export function explorerNameProblem(name: string): string | null {
  if (!name) return "A name is needed.";
  if (name.includes("/")) return "A name cannot contain a slash.";
  if (name === "." || name === "..") return "That name is not allowed.";

  return null;
}


export function explorerFolderProblem(value: string): string | null {
  const folder = explorerFolderFromInput(value);

  if (!folder) return "A folder is needed.";
  if (!folder.startsWith("/")) {
    return "A whole path is needed, starting at the home of the computer.";
  }

  return null;
}


export function suggestExplorerName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;

  for (let index = 2; index <= 9999; index += 1) {
    const candidate = `${base} ${index}`;
    if (!taken.has(candidate)) return candidate;
  }

  return base;
}




const EXIT_TARGET_TAKEN = 41;


const EXIT_NOT_A_FOLDER = 42;


export function shellArgument(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

async function answerDetail(response: Response): Promise<string> {
  const body = await response.text();

  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail.trim();
    }
  } catch {
    
  }

  return body.trim() || `the computer answered ${response.status}`;
}

async function runShell(
  command: string,
): Promise<{ code: number; output: string }> {
  const response = await fetch(explorerApiUrl("/api/exec"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ command }),
  });

  if (!response.ok) throw new Error(await answerDetail(response));

  const payload = (await response.json()) as {
    exit_code?: number;
    stdout?: string;
    stderr?: string;
  };

  return {
    code: typeof payload.exit_code === "number" ? payload.exit_code : 0,
    output: `${payload.stdout ?? ""}${payload.stderr ?? ""}`.trim(),
  };
}


export async function createExplorerFolder(
  parent: string,
  name: string,
): Promise<string> {
  const path = explorerChildPath(parent, name);
  const response = await fetch(explorerApiUrl("/api/mkdir"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) throw new Error(await answerDetail(response));

  return path;
}


export async function createExplorerFile(
  parent: string,
  name: string,
): Promise<string> {
  const path = explorerChildPath(parent, name);
  const response = await fetch(explorerApiUrl("/api/file"), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path, content: "" }),
  });

  if (!response.ok) throw new Error(await answerDetail(response));

  return path;
}


export async function deleteExplorerEntry(
  entry: ExplorerEntry,
): Promise<void> {
  const response = await fetch(explorerApiUrl("/api/delete"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: entry.path }),
  });

  if (!response.ok) throw new Error(await answerDetail(response));
}


async function transferExplorerEntry(
  source: string,
  destination: string,
  program: "mv" | "cp",
): Promise<void> {
  if (source === destination) return;

  const command = [
    `if [ ! -d ${shellArgument(explorerParentPath(destination))} ]; then exit ${EXIT_NOT_A_FOLDER}; fi`,
    `if [ -e ${shellArgument(destination)} ]; then exit ${EXIT_TARGET_TAKEN}; fi`,
    `${program === "cp" ? "cp -R" : "mv"} -- ${shellArgument(source)} ${shellArgument(destination)}`,
  ].join("; ");

  const { code, output } = await runShell(command);

  if (code === EXIT_NOT_A_FOLDER) {
    throw new Error("That folder does not exist.");
  }

  if (code === EXIT_TARGET_TAKEN) {
    throw new Error("Something with that name is already there.");
  }

  if (code !== 0) {
    throw new Error(output || `the computer answered ${code}`);
  }
}


export async function renameExplorerEntry(
  entry: ExplorerEntry,
  name: string,
): Promise<void> {
  await transferExplorerEntry(
    entry.path,
    explorerChildPath(explorerParentPath(entry.path), name),
    "mv",
  );
}


export async function moveExplorerEntry(
  entry: ExplorerEntry,
  folder: string,
): Promise<void> {
  await transferExplorerEntry(
    entry.path,
    explorerChildPath(folder, entry.name),
    "mv",
  );
}


export async function copyExplorerEntry(
  entry: ExplorerEntry,
  folder: string,
): Promise<void> {
  await transferExplorerEntry(
    entry.path,
    explorerChildPath(folder, entry.name),
    "cp",
  );
}



type ExplorerPromptIntent =
  | { kind: "create-folder"; parent: string }
  | { kind: "create-file"; parent: string }
  | { kind: "rename"; entry: ExplorerEntry }
  | { kind: "move"; entry: ExplorerEntry }
  | { kind: "copy"; entry: ExplorerEntry }
  | { kind: "delete"; entry: ExplorerEntry }
  | { kind: "message"; message: string };

export type ExplorerActionsOptions = {
  folderPath: string;
  entries: ExplorerEntry[];
  refresh: () => void;
  onOpenTerminal: (path: string) => void;
};

function messageOf(cause: unknown): string {
  return cause instanceof Error && cause.message
    ? cause.message
    : "The computer did not answer.";
}


export function useExplorerActions({
  folderPath,
  entries,
  refresh,
  onOpenTerminal,
}: ExplorerActionsOptions) {
  const [menu, setMenu] = useState<ExplorerMenu | null>(null);
  const [promptState, setPromptState] = useState<{
    intent: ExplorerPromptIntent;
    prompt: ExplorerPrompt;
  } | null>(null);
  const [clipboard, setClipboard] = useState<ExplorerClipboard | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const nextPromptId = useRef(1);

  const takenNames = useMemo(
    () => new Set(entries.map((entry) => entry.name)),
    [entries],
  );

  
  
  useEffect(() => {
    setMenu(null);
    setPromptState(null);
  }, [folderPath]);

  const openMenu = useCallback(
    (entry: ExplorerEntry | null, x: number, y: number) => {
      setPromptState(null);
      setMenu({ x, y, entry });
    },
    [],
  );

  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);

  const cancelPrompt = useCallback(() => {
    setPromptState(null);
  }, []);

  const openPrompt = useCallback(
    (intent: ExplorerPromptIntent) => {
      const id = nextPromptId.current++;

      const build = (
        prompt: Omit<ExplorerPrompt, "id" | "error">,
      ): ExplorerPrompt => ({ ...prompt, id, error: null });

      let prompt: ExplorerPrompt;

      switch (intent.kind) {
        case "create-folder":
          prompt = build({
            title: "New Folder",
            detail: folderPath,
            label: "Name",
            value: suggestExplorerName("untitled folder", takenNames),
            confirm: "Create",
            cancel: "Cancel",
            tone: "normal",
          });
          break;
        case "create-file":
          prompt = build({
            title: "New File",
            detail: folderPath,
            label: "Name",
            value: suggestExplorerName("untitled.txt", takenNames),
            confirm: "Create",
            cancel: "Cancel",
            tone: "normal",
          });
          break;
        case "rename":
          prompt = build({
            title: "Rename",
            detail: folderPath,
            label: "Name",
            value: intent.entry.name,
            confirm: "Rename",
            cancel: "Cancel",
            tone: "normal",
          });
          break;
        case "move":
          prompt = build({
            title: "Move to…",
            detail: intent.entry.name,
            label: "Folder",
            value: folderPath,
            confirm: "Move",
            cancel: "Cancel",
            tone: "normal",
          });
          break;
        case "copy":
          prompt = build({
            title: "Copy to…",
            detail: intent.entry.name,
            label: "Folder",
            value: folderPath,
            confirm: "Copy",
            cancel: "Cancel",
            tone: "normal",
          });
          break;
        case "delete":
          prompt = build({
            title: "Delete Permanently",
            detail: `${intent.entry.name} — the computer has no trash, so it is gone for good.`,
            label: null,
            value: "",
            confirm: "Delete",
            cancel: "Cancel",
            tone: "danger",
          });
          break;
        case "message":
          prompt = build({
            title: "The computer said",
            detail: intent.message,
            label: null,
            value: "",
            confirm: "OK",
            cancel: "Close",
            tone: "normal",
          });
          break;
      }

      setMenu(null);
      setPromptState({ intent, prompt });
    },
    [folderPath, takenNames],
  );

  const pasteClipboard = useCallback(async () => {
    if (!clipboard) return;

    
    
    if (
      clipboard.mode === "cut" &&
      explorerParentPath(clipboard.entry.path) === folderPath
    ) {
      openPrompt({ kind: "message", message: "It is already in that folder." });
      return;
    }

    setIsWorking(true);

    try {
      if (clipboard.mode === "cut") {
        await moveExplorerEntry(clipboard.entry, folderPath);
        setClipboard(null);
      } else {
        await copyExplorerEntry(clipboard.entry, folderPath);
      }

      refresh();
    } catch (cause) {
      openPrompt({ kind: "message", message: messageOf(cause) });
    } finally {
      setIsWorking(false);
    }
  }, [clipboard, folderPath, openPrompt, refresh]);

  const choose = useCallback(
    (id: ExplorerActionId) => {
      const entry = menu?.entry ?? null;
      setMenu(null);

      switch (id) {
        case "new-folder":
          openPrompt({ kind: "create-folder", parent: folderPath });
          break;
        case "new-file":
          openPrompt({ kind: "create-file", parent: folderPath });
          break;
        case "open-terminal":
          onOpenTerminal(entry?.isDirectory ? entry.path : folderPath);
          break;
        case "paste":
          void pasteClipboard();
          break;
        case "rename":
          if (entry) openPrompt({ kind: "rename", entry });
          break;
        case "move-to":
          if (entry) openPrompt({ kind: "move", entry });
          break;
        case "copy-to":
          if (entry) openPrompt({ kind: "copy", entry });
          break;
        case "delete":
          if (entry) openPrompt({ kind: "delete", entry });
          break;
        case "cut":
          if (entry) setClipboard({ entry, mode: "cut" });
          break;
        case "copy":
          if (entry) setClipboard({ entry, mode: "copy" });
          break;
      }
    },
    [folderPath, menu, onOpenTerminal, openPrompt, pasteClipboard],
  );

  const confirmPrompt = useCallback(
    (value: string) => {
      const current = promptState;
      if (!current || isWorking) return;

      const { intent } = current;
      const typed = value.trim();

      const fail = (message: string) => {
        setPromptState({
          intent,
          prompt: { ...current.prompt, error: message },
        });
      };

      if (intent.kind === "message") {
        setPromptState(null);
        return;
      }

      if (intent.kind === "move" || intent.kind === "copy") {
        const problem = explorerFolderProblem(typed);
        if (problem) {
          fail(problem);
          return;
        }

        if (explorerFolderFromInput(typed) === explorerParentPath(intent.entry.path)) {
          fail("It is already in that folder.");
          return;
        }
      } else if (intent.kind !== "delete") {
        const problem = explorerNameProblem(typed);
        if (problem) {
          fail(problem);
          return;
        }

        const isSameName =
          intent.kind === "rename" && typed === intent.entry.name;
        if (!isSameName && takenNames.has(typed)) {
          fail("Something with that name is already there.");
          return;
        }
      }

      const submit = async () => {
        setIsWorking(true);

        try {
          switch (intent.kind) {
            case "create-folder":
              await createExplorerFolder(intent.parent, typed);
              break;
            case "create-file":
              await createExplorerFile(intent.parent, typed);
              break;
            case "rename":
              await renameExplorerEntry(intent.entry, typed);
              break;
            case "move":
              await moveExplorerEntry(intent.entry, explorerFolderFromInput(typed));
              break;
            case "copy":
              await copyExplorerEntry(intent.entry, explorerFolderFromInput(typed));
              break;
            case "delete":
              await deleteExplorerEntry(intent.entry);
              break;
          }

          setPromptState(null);
          refresh();
        } catch (cause) {
          setPromptState({
            intent,
            prompt: { ...current.prompt, error: messageOf(cause) },
          });
        } finally {
          setIsWorking(false);
        }
      };

      void submit();
    },
    [isWorking, promptState, refresh, takenNames],
  );

  const menuSections = useMemo(
    () => (menu ? explorerMenuSections(menu.entry, clipboard !== null) : []),
    [clipboard, menu],
  );

  return {
    menu,
    menuSections,
    prompt: promptState?.prompt ?? null,
    clipboard,
    isWorking,
    openMenu,
    closeMenu,
    choose,
    cancelPrompt,
    confirmPrompt,
  };
}

export type ExplorerActionsController = ReturnType<typeof useExplorerActions>;
