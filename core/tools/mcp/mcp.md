# OpenAgentHumenComputer MCP (Model Context Protocol)

এই সার্ভারের মাধ্যমে যেকোনো AI Agent (Claude Desktop, Cursor, Claude Code, ZCode, Windsurf) আপনার বানানো **আসল Linux কম্পিউটারের** টার্মিনাল, ফাইলসিস্টেম আর অবস্থা সরাসরি নিয়ন্ত্রণ করতে পারবে — bridge (`core/server/bridge.py`) দিয়ে, agent token সহ।

## ফাইল — প্রতিটা নিয়ন্ত্রণ আলাদা ফাইলে

| ফাইল | কাজ |
| --- | --- |
| `config.py` | `.env` + `.env.token` পড়ে — `AGENT_HUMEN_COMPUTER_BASE_URL`, `AGENT_HUMEN_COMPUTER_TOKEN` |
| `client.py` | bridge-এর stdlib HTTP ক্লায়েন্ট (Bearer header) — শুধু বিদ্যমান endpoint |
| `tools/terminal.py` | `terminal_exec` → `POST /api/exec` |
| `tools/files.py` | `file_read`, `file_write`, `list_directory` → `/api/file`, `/api/fs` |
| `tools/computer.py` | `computer_state` → `/api/computer/status`, `computer_disk` → `/api/disk` |
| `tools/browser.py` | `browser_open`, `browser_search` — bridge-এর browser endpoint না হওয়া পর্যন্ত সৎ বার্তা |
| `tools/desktop.py` | `computer_observe`, `computer_act` — desktop endpoint না হওয়া পর্যন্ত সৎ বার্তা |
| `server.py` | FastMCP সার্ভার — tool রেজিস্ট্রেশন, transport পছন্দ |
| `mcp.md` | এই ডক |

নতুন endpoint এলে শুধু ওই এক ফাইলের ফাংশনের ভেতরটা বদলাবে — tool-এর নাম বা আকৃতি বদলাবে না।

## ১. ক্লায়েন্ট সেটআপ

### ক. Claude Desktop
`~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openagenthumencomputer": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "/home/ceomax/code/open-computer/sandbox/computer/openagenthumencomputer",
        "python",
        "-m",
        "core.tools.mcp.server"
      ],
      "env": {
        "AGENT_HUMEN_COMPUTER_BASE_URL": "http://127.0.0.1:7071",
        "AGENT_HUMEN_COMPUTER_TOKEN": "octk_live_REPLACE_WITH_YOUR_AGENT_TOKEN"
      }
    }
  }
}
```

### খ. Cursor
`.cursor/mcp.json` — একই JSON, শুধু প্রজেক্টের রুটে রাখুন।

### গ. Claude Code CLI — এক লাইনে
```bash
claude mcp add openagenthumencomputer -- uv run --directory /home/ceomax/code/open-computer/sandbox/computer/openagenthumencomputer python -m core.tools.mcp.server
```

## ২. চালানোর আগে একবার

```bash
cd /home/ceomax/code/open-computer/sandbox/computer/openagenthumencomputer
uv sync          # mcp SDK ইনস্টল (প্রথমবার)
uv run python -m core.tools.mcp.server          # stdio (AI ক্লায়েন্ট নিজে চালায়)
uv run python -m core.tools.mcp.server --transport streamable-http --port 7072
```

## ৩. AI যেসব tool পাবে

| Tool | বিবরণ | আজই কাজ করে? |
| :--- | :--- | :--- |
| `terminal_exec` | কম্পিউটারে bash কমান্ড — exit_code/stdout/stderr | ✅ |
| `list_directory` | কম্পিউটারের কোনো ফোল্ডার (না দিলে home) | ✅ |
| `file_read` | কম্পিউটারের একটা ফাইল পড়া | ✅ |
| `file_write` | ফাইল লেখা/যোগ করা | ✅ |
| `computer_state` | কম্পিউটার আছে? চলছে? | ✅ |
| `computer_disk` | কম্পিউটারের নিজের ডিস্কের সংখ্যা | ✅ |
| `browser_open` / `browser_search` | browser API এলে লাইভ | ⏳ সৎ বার্তা |
| `computer_observe` / `computer_act` | desktop API এলে লাইভ | ⏳ সৎ বার্তা |

## ৪. নিরাপত্তা

bridge-এ token auth এখনো যোগ হয়নি, তবু token পাঠানো হয় — auth চালু হলে এই সার্ভার নিজে নিজেই সঠিকভাবে যুক্ত হবে (পুরনো প্রজেক্টের হুবহু মডেল)। বাইরের কাউকে token দেবেন না।
