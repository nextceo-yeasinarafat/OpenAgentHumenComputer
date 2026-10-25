# core app (`openagenthumencomputer/core/apps/core`)

The entry of the web UI. `index.html` loads `main.tsx`, which is the one
orchestrator of the whole page.

## Files

| File | What it does |
| --- | --- |
| `main.tsx` | the orchestrator: the loading cover, the question to the bridge (`/api/computer/status`), and the page the truth puts the screen on |
| `app.css` | Tailwind and the colours of the computer (dark ground, terminal text) |
| `core.md` | this document |

## The flow

```
loading (3s, smooth fade)  →  the truth is asked under the cover
    ├─ a making in progress  →  the terminal of the making
    ├─ a made computer       →  core_layout (the desktop)
    └─ neither               →  the box of the making (core_config)
```

The page itself draws nothing more: the desktop lives in
`core/apps/layout/core_layout.tsx`, the making box in
`core/tools/config/core_config.tsx`, the loading in
`core/tools/loading/core_loading.tsx`. The orchestrator only decides where
the screen belongs — and a refresh can never lose that place, because the
truth is asked again on every load.

## Ports

| Where | Port |
| --- | --- |
| `bun run dev` (Vite) | `1010` on `0.0.0.0` |
| `bun run preview` | `1011` on `0.0.0.0` |
| the bridge the UI proxies to | `7071` |
