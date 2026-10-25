---
status: approved
project: OpenHumenComputer
repo: OpenAgentHumenComputer
---

# Scope — OpenHumenComputer

## The idea

A real Linux computer that a human and an AI share — one command makes it, a browser opens it, and it never touches the machine you already love.

The human keeps their own laptop. The AI gets a real computer of its own: root, a terminal, a browser, files, an editor, the ability to install `.deb` apps — and a door (API + MCP) through which another agent can work. The two meet on the same desktop, at the same time, without fighting over a keyboard and without risking the host.

## The problem

1. **An AI with shell access is dangerous on a personal machine.** It can read private files, run destructive commands, and leave the machine in a state nobody can explain. Most people either refuse to give that access or give it and hope.
2. **A cloud VM is only a terminal.** Agents need a desktop: a browser to test a page, an editor to change code, a file manager to see what was produced, `.deb` packages that only a real Linux accepts. A bare SSH box is not a computer an agent can own.
3. **A locked-down machine gives you nothing.** On a work laptop without admin rights, a student machine, or a rented server where you cannot get `sudo`, there is no place to build, test, or break things safely.

## Who it is for

- People who want an AI to **do work** — build, test, run, browse, install — without handing it their own computer.
- Agent builders who need a **real target** behind an API or MCP, not a mock.
- Security learners and testers who need a **sandbox** where a mistake costs nothing.
- Developers on machines where they cannot (or should not) install anything.

## The kernel

**One command → a full Linux computer with a desktop, root, apps, and an agent door — isolated from the host, owned by the person who ran the command.**

## What "done" means

- [x] A single command installs the host side and opens the UI.
- [x] The UI asks for a name, a password, cores, RAM and storage, and builds a real Ubuntu computer from them.
- [x] The computer starts with its own screen, VNC, browser, terminal, file manager and VS Code Server.
- [x] Bridge, computer and screen start by themselves; a dead screen is brought back without hand-holding.
- [x] An API token and an MCP server let an agent run commands, read and write files, open pages and take screenshots — inside that computer only.
- [x] Nothing of the user's own machine is mounted, copied, or required by the image.

## Deliberately out of scope

- Multi-tenant hosting or billing.
- Windows or macOS guests.
- GPU passthrough and remote GPU scheduling.
- Snapshots, cloning and team sharing (next, not now).

## Kept proof-of-concept sized

One host, one computer at a time, one browser tab, standard Docker. The first build is long (it compiles curl and Python from source and installs a real browser), and the document says so instead of hiding it. Everything after the first build is a matter of seconds.
