# system

System hardware configuration module for OpenAgentHumenComputer. All values are defined in `system.conf` and applied by the individual scripts.

## Files

| File | Purpose |
|---|---|
| `system.conf` | Main editable config - storage, CPU, GPU, RAM, identity. |
| `storage.sh` | Applies storage settings. |
| `cpu_core.sh` | Applies CPU core settings. |
| `gpu.sh` | Applies GPU settings. |
| `ram.sh` | Applies RAM settings. |
| `install.sh` | Runs all four scripts in order. |
| `control.sh` | Controller. |
| `computer_setup.sh` | First boot inside the container: creates the chosen account with its password, sets the time zone and the locale — run by the bridge with the values the UI chose. |
| `*.resolved` | Generated resolved configuration after apply. |
| `system.md` | This documentation. |
| `auth/` | the door of the account: PBKDF2 in SQLite, JWT sessions (`auth_service.py` on 8988). |
| `api/` | reserved: the API of the computer inside the container. |
| `dependency/` | latest stable curl and Python. |
| `terminal/` | xterm and the real bash terminal. |
| `explorer/` | PCManFM, the real file manager. |
| `vscode/` | the latest stable VS Code Server (web build). |
| `chromium/` | Google Chrome stable, DevTools, forwarder. |
| `font/` | the system fonts and the fontconfig override. |

## Editable values (system.conf)
- Storage: STORAGE_TOTAL_GB, STORAGE_TYPE, STORAGE_MOUNT_ROOT, STORAGE_AUTO_RESIZE
- CPU: CPU_CORES, CPU_THREADS_PER_CORE, CPU_MODEL, CPU_GOVERNOR
- GPU: GPU_ENABLED, GPU_COUNT, GPU_CORES, GPU_MODEL, GPU_MEMORY_GB, GPU_SHARED
- RAM: RAM_TOTAL_GB, RAM_SHARED, RAM_SWAP_GB, RAM_TYPE
