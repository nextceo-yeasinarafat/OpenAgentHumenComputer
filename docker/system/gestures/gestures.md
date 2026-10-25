# Gestures (docker/system/gestures)

The hands of the person at the computer, as far as the browser is concerned.

The window of the browser is the whole screen and nothing of the system
stands around it, so the only hands that matter are the ones on the page —
and one of them must be taken away: the sideways swipe that walks the
history (back and forward) of the browser. On a screen that is the computer,
a swipe that was not meant must never take the page somewhere else.

## What each file does

- `gestures.conf` — the word the browser is told, in one place.
- `control.sh` — `apply` writes the word into the settings of the browser
  (only once; asking twice changes nothing), `status` says whether it is
  there. The settings file of the browser
  (`/opt/open-computer/chromium/chromium.conf`) carries the word as
  `OPEN_COMPUTER_CHROMIUM_EXTRA_ARGS`, which the start of the browser reads
  after every argument of its own.
- `install.sh` — puts the folder into the computer
  (`/opt/open-computer/gestures`) and applies the word at once. Safe to run
  again: nothing is written twice.

## How it is linked

The browser is started by `docker/system/chromium/run.sh`, whose arguments
end with `${OPEN_COMPUTER_CHROMIUM_EXTRA_ARGS:-}` — empty until this package
fills it, so a computer without this folder behaves exactly as before.
