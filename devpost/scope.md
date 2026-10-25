---
status: approved
project: OpenHumenComputer
repo: OpenAgentHumenComputer
---

# Scope — OpenHumenComputer

## The idea

One platform for many AI agents — and one real Linux computer for all of them.

Instead of buying a separate cloud VPS for every agent and watching each terminal, the user installs OpenHumenComputer once. From one page they make a real Ubuntu computer, then connect the harnesses they already use (Claude, Codex, Cline, Kilo, their own) through an API token or MCP. The agents work inside that computer; the human watches the same desktop, steps in when needed, and keeps their own machine untouched.

## The problem

1. **A VPS per agent is expensive and tiring.** Each agent needs a machine; each machine needs a terminal to watch; the cost and the attention both multiply with the number of agents.
2. **A terminal is not a computer.** Agents need a browser, an editor, files and the ability to install `.deb` packages. A bare SSH box cannot show what the agent did or let a human take over.
3. **Giving an agent the real laptop is dangerous.** Shell access to a personal machine means private files and destructive commands. On locked-down hosts there is no `sudo` to build a safe place either.

## Who it is for

- People running several AI agents who are tired of buying and babysitting a VPS for each one.
- Agent builders who need a real target behind an API or MCP, not a mock.
- Developers on machines where they cannot (or should not) install anything.
- Security learners and testers who need a separate machine for experiments.

## The kernel

**One command → one real Linux computer → many AI agents attached through API and MCP → a human watching and controlling the same desktop, on hardware they already own.**

## What "done" means

- [x] One command installs the platform and opens the page.
- [x] The page asks for identity and hardware and builds a real Ubuntu computer from them.
- [x] The computer starts with a desktop, Chrome, a terminal, a file manager, VS Code Server and a screen the human can watch.
- [x] An API token and an MCP server let one or more agents run commands, read and write files, drive the browser and take screenshots — inside that computer only.
- [x] A skills folder lives in the computer, so an agent can read the skills the user brought and keep them across sessions.
- [x] `sudo`, `apt` and `.deb` packages work inside; the host stays untouched.
- [x] The desktop is reachable over noVNC from another device.

## Deliberately out of scope

- Multi-tenant hosting, billing and team accounts.
- Windows or macOS guests.
- GPU passthrough and remote GPU scheduling.
- Snapshot and clone of a computer (next, not now).
- Cloud VPS integration with advanced isolation is in progress; this version is built for the local Docker engine and private servers.

## Kept proof-of-concept sized

One host, one computer at a time, one desktop, standard Docker. The first image build is long and the document says so; later computers start in seconds. The point is not to rent more machines, but to need fewer.
