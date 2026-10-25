# settings (`openagenthumencomputer/core/apps/settings`)

The settings window of the computer, built the way the finder is built: a
glass bar of sections, the traffic lights floating over it, and the pane of
the chosen section beside it. The window keeps its own size — it never goes
full screen.

## Files

| File | What it does |
| --- | --- |
| `core_settings.ts` | the window: size, place, traffic lights, drag, resize |
| `core_settings.tsx` | the frame, the floating lights, the bar and the pane of the chosen section |
| `settings_left.ts` | the sections of the settings, and which one is chosen |
| `settings_left.tsx` | the glass bar — one row per section, wearing the Hugeicons of the computer |
| `settings_api_token.ts/tsx` | System API Token: the word and the bridge base URL in the cubix fields, each copied by its own sheet, reset by the red diamond with a confirming second press |
| `settings_mcp.ts/tsx` | System MCP: the server of the machine on and off (a macOS switch), and the client configuration with the live token inside |
| `system_info.ts/tsx` | System Details: About This Mac — only the numbers of the computer itself |
| `settings_analyse.ts/tsx` | System Analyse: four meters of dots — CPU, GPU, RAM, STORAGE — live, in the numbers the machine was given |
| `settings_restart.ts/tsx` | System Control: every service of the machine in one place, on and off from here |
| `settings_clipboard.ts` | the copy hand of the panes: the secure clipboard, and the old selection fallback that works over plain http |
| `settings.md` | this document |

## The sections

| Section | Lives on | State |
| --- | --- | --- |
| System API Token | `GET /api/token`, `POST /api/token/reset` | live |
| System MCP | `/api/mcp/status`, `/api/mcp/start|stop`, `/api/mcp/config` | live |
| System Details | `/api/computer/status`, `/api/state`, `/api/disk`, `/api/analyse` | live |
| System Analyse | `/api/analyse` (the computer's own cgroup numbers) | live |
| System Control | `/api/services`, `/api/services/<action>/<service>` | live |
