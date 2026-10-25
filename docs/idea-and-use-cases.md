# The idea, and where it can be used

This document explains what OpenHumenComputer is for, why it exists, and a
complete list of the places it can be put to work. It is written to be read on
its own, without the rest of the repository.

## 1. The idea in one page

Every capable AI agent eventually needs a computer: a shell to run commands, a
filesystem to read and write, a browser to test what it built, an editor to
change code, and the freedom to install what the task needs. Giving it your own
laptop is risky. Renting a separate cloud VPS for every agent is expensive, and
watching a terminal for each one is exhausting.

OpenHumenComputer changes the unit of work: **one real Linux computer, shared by
a human and many agents, isolated from everything else.**

- Once: run one command. A small UI appears on port `1010`.
- Once: choose a name, an account, a password, the cores, the RAM and the
  storage, then press CREATE.
- Once: wait for the build. The computer starts with a desktop, Chrome, a
  terminal, a file manager, a text editor, a media viewer, VS Code Server and an
  MCP server.
- From then on: you watch the same desktop the agents work on, step in when you
  want, and hand the agents a token so they can work through the API or MCP.

The human keeps their own machine. The agents get a machine they can use fully:
root inside, `sudo`, `apt`, `.deb` packages, a browser they can drive, files they
can break. A mistake costs a container, not a laptop.

The name is **OpenHumenComputer**. The repository is **OpenAgentHumenComputer**.
The computer container is `openagentcomputer`; the UI container is
`openagenthumencomputer`.

## 2. What makes it different

| The usual answer | OpenHumenComputer |
| --- | --- |
| A terminal-only VM behind SSH | A real desktop in the browser, with a browser, an editor and files |
| A VPS per agent | One computer, many agents attached through a token and MCP |
| "Hosted" tools where your code leaves your machine | Everything runs on hardware you own; nothing of your disk is mounted into the computer |
| A sandbox that cannot install anything | Full Ubuntu: `sudo apt install`, `dpkg -i`, any `.deb` |
| A demo that hides its build | Live logs and a progress bar; a failed step says why and the making ends with `INCOMPLETE` |

## 3. Who it is for

- Developers running several CLI harnesses (Claude Code, Codex, Cline, Kilo, a
  custom one) who are tired of one VPS per harness.
- People whose work machine has no `sudo`, or where installing a compiler, a
  browser or a desktop application is forbidden.
- Security learners and testers who need a machine that is allowed to be broken.
- Teams that want a reproducible Linux desktop for a demo, a workshop or a
  class without asking everyone to install anything.
- Anyone who wants to watch an AI work on a real screen instead of reading logs.

## 4. A complete list of where it can be used

### 4.1 AI agents and harnesses

1. **A safe target for a coding agent.** Give Claude Code, Codex, Cline, Kilo or
   a custom harness an API token or MCP endpoint; it edits files, runs tests and
   installs dependencies inside the computer.
2. **Several agents on one job.** One agent writes, another reviews, a third runs
   the tests and a fourth takes screenshots; all of them share the same
   filesystem and the same screen, and you watch from one page.
3. **Agent evaluation.** Ask two harnesses to solve the same task in the same
   environment and compare the results, the commands and the artifacts they left
   behind.
4. **Long-running agent work.** The computer keeps running while your browser is
   closed; reopen the page and the same desktop is there.
5. **Teaching an agent your tools.** A skills folder in the computer's home is
   readable by the agent; the skills stay with the computer, not with a vendor.
6. **MCP development.** Test an MCP server against a real machine with a real
   terminal, files and browser, instead of mocks.

### 4.2 Software development

7. **A disposable development machine.** A clean Ubuntu for a project that needs
   a specific compiler, library or desktop package, without touching the host.
8. **Build and packaging.** Build `.deb` packages, test the install, run the
   application, and throw the container away.
9. **Desktop GUI testing.** Install the application and open it on the real
   X display; watch it through noVNC and drive it with the browser or the desktop
   API.
10. **Browser testing with a real Chrome.** Drive Chrome over the DevTools
    protocol: open pages, click, type, take screenshots, read the console.
11. **Reproducing a bug report.** Recreate the reported environment in a computer
    sized to the report, then inspect the screen and the terminal yourself.
12. **Teaching a workshop.** Every participant clones the same repository and
    gets the same Linux desktop from one command.
13. **A demo machine.** A reviewer can build their own computer from the page and
    see the whole provisioning process instead of trusting a video.

### 4.3 Security and networking

14. **A pentest sandbox.** Install scanners, fuzzers and custom tools inside a
    machine that is isolated from your own devices; keep notes and captures in
    the same place.
15. **Capture-the-flag practice.** A disposable Linux with root for binaries,
    scripts and network tools.
16. **Malware-adjacent analysis.** Open suspicious files and run suspicious
    commands inside a container that can be deleted, never on the host.
17. **Network diagnostics.** `tcpdump`, `iperf`, DNS and routing experiments in a
    controlled boundary.
18. **Exploit development practice.** Compile, run and debug test targets with
    the toolchain you install yourself.
19. **Incident-response rehearsal.** Practise containment and recovery on a
    machine that is allowed to be destroyed.
20. **Hardening experiments.** Compare a default Ubuntu with a hardened one
    inside the same host, without risking the host.

### 4.4 AI and models

21. **Local model experiments.** Install `llama.cpp` or Ollama inside the
    computer and run a model with the resources you allocated.
22. **Model and prompt evaluation.** Run the same prompts against several
    harnesses in one environment and keep the outputs together.
23. **Data preparation.** Clean, convert and inspect datasets with the tools of a
    real Linux instead of a limited sandbox.
24. **Agent tool development.** Build and test tools that need a browser, a
    terminal and files at the same time.
25. **Screenshot and media pipelines.** Use the built-in screenshot, media and
    file endpoints to collect visual evidence of what an agent did.

### 4.5 Work and learning

26. **A portable workspace.** Open the same computer from a desktop, a tablet or
    a phone browser on your network.
27. **A Linux machine on a locked-down host.** On a machine where you cannot get
    `sudo`, the computer still has its own root inside.
28. **Learning Linux.** A safe place to learn `apt`, `systemd`-less services,
    permissions, networking and shell scripting.
29. **Learning Docker.** Inspect a container from the inside, break it, rebuild
    it; the host stays untouched.
30. **Teaching AI safely.** A classroom where students can let an agent act
    without giving it their own laptops.
31. **Freelance and agency work.** Keep a client's project in its own computer
    with its own credentials, separate from everything else.
32. **Testing installers and scripts.** Run an install script in a fresh Ubuntu
    before running it on a real machine.

### 4.6 Personal and home-lab

33. **A private desktop in the browser.** A Linux desktop reachable from any
    device on your network, without a remote-desktop client.
34. **A self-hosted sandbox for experiments.** A place for the things you do not
    want to install on your main system.
35. **A demo machine for a home lab.** Show a full Linux desktop and a browser
    from a small server or a mini PC.
36. **File conversion and media work.** Use the computer's tools and the media
    viewer for images, PDFs, audio and video.
37. **A second opinion on a browser.** Open the same page in the computer's
    Chrome while you keep using your own browser.

## 5. What it is not

Said plainly, so nobody is surprised:

- **Not a cloud provider.** It runs on Docker on a machine you control; cloud
  VPS integration with stronger isolation is planned, not shipped.
- **Not a hardened boundary against hostile code.** The UI container is given the
  Docker socket so it can create the computer; that is a powerful capability.
  Treat the host as trusted and the agents as semi-trusted.
- **Not multi-tenant.** One computer per host, one human at the desktop.
- **Not GPU passthrough.** The GPU share in the form is recorded, not scheduled.
- **Not instant on the first run.** The first image build takes 15–25 minutes
  (source builds and downloads); later computers start in seconds.
- **Not a replacement for CI at scale.** It is a real computer for a person and
  a few agents, not a fleet.

## 6. Choosing resources for a use case

| Use case | Cores | RAM | Storage | Notes |
| --- | --- | --- | --- | --- |
| One coding agent, small project | 2 | 2–4 GB | 8 GB | Enough for Node/Python work |
| Browser testing and screenshots | 2–4 | 4 GB | 8–16 GB | Chrome is the heaviest process |
| Local model, small | 4 | 8 GB | 16 GB | Model size decides the rest |
| Security tooling | 4 | 4–8 GB | 16–20 GB | Install tools inside the computer |
| Workshop demo | 2 | 2–4 GB | 8 GB | Rebuild per participant |

## 7. How a session looks

1. `curl -fsSL …/setup.sh | bash` — the UI is up on `1010`.
2. Name, account, password, country, language, then cores, RAM and storage.
3. CREATE: the image is built, the container starts, the screen comes up.
4. The desktop appears: Chrome, Terminal, Files, VS Code, editor, viewer,
   Settings (token, MCP, details, analysis, control).
5. Give an agent the token or the MCP configuration; it works inside the
   computer while you watch.
6. Stop, restart or remove the computer from System Control; the host is
   unchanged.

## 8. The short version

One command. One real Linux computer. As many agents as your hardware can carry.
Your machine stays yours.
