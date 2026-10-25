# font

Fonts module for the OpenAgentHumenComputer stack. Installs the system fonts used across the desktop, browser, and apps.

## Files

| File | Purpose |
|---|---|
| `font.conf` | Module configuration (paths). |
| `install.sh` | Copies fonts to system dirs, installs fontconfig override, rebuilds cache. |
| `run.sh` | Ensures fonts are installed (foreground helper). |
| `control.sh` | Controller: `start\|stop\|restart\|status\|logs\|version`. |
| `fonts.conf` | Fontconfig XML mapping system families to Anthropic Serif Text with Noto Serif Bengali fallback. |
| `AnthropicSerif-Text-Light-Static.otf` | Primary UI typeface. |
| `NotoSerifBengali-Regular.ttf` | Bengali fallback typeface. |
| `font.md` | This documentation. |

## Ports
None.

## Installation
At build time (via `docker/ubuntu/Dockerfile`) or inside container:
```bash
/opt/open-computer/font/install.sh
# or
open-computer-font
```

## Version
Version recorded in `version` file after install (lists font filenames).

## Notes
- Installs to `/usr/share/fonts/truetype/open-computer/`
- Installs fontconfig to `/etc/fonts/local.conf`
- Runs `fc-cache -f` after install
- Works without network
