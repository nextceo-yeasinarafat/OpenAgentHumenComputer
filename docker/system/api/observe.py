
from __future__ import annotations

import base64
import json
import subprocess
import sys


def run(args: list[str]) -> str:
    return subprocess.run(args, capture_output=True, text=True).stdout.strip()


def xdotool(*args: str) -> str:
    return run(["xdotool", *args])


def picture() -> bytes:
    return subprocess.run(
        ["import", "-window", "root", "png:-"], capture_output=True
    ).stdout


def main() -> None:
    if "--png" in sys.argv:
        sys.stdout.buffer.write(picture())
        return

    image = picture()
    geometry = xdotool("getdisplaygeometry").split()
    location = xdotool("getmouselocation", "--shell")
    cursor = {}
    for line in location.splitlines():
        key, _, value = line.partition("=")
        if key in ("X", "Y", "SCREEN", "WINDOW"):
            cursor[key.lower()] = int(value) if value.isdigit() else 0
    active_id = xdotool("getactivewindow")
    active_window = xdotool("getwindowname", active_id) if active_id else ""

    print(json.dumps({
        "image": base64.b64encode(image).decode("ascii"),
        "mimeType": "image/png",
        "width": int(geometry[0]) if len(geometry) > 0 else 0,
        "height": int(geometry[1]) if len(geometry) > 1 else 0,
        "cursor": {"x": cursor.get("x", 0), "y": cursor.get("y", 0)},
        "activeWindow": active_window,
    }))


if __name__ == "__main__":
    main()
