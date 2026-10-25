

from __future__ import annotations

import socket
import sys
import threading

LISTEN_PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9223
BROWSER_PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 9222
BUFFER_SIZE = 65536


def pipe(source: socket.socket, target: socket.socket) -> None:

    try:
        while True:
            data = source.recv(BUFFER_SIZE)
            if not data:
                break
            target.sendall(data)
    except OSError:
        pass
    finally:
        try:
            target.shutdown(socket.SHUT_WR)
        except OSError:
            pass


def handle(client: socket.socket) -> None:
    try:
        browser = socket.create_connection(("127.0.0.1", BROWSER_PORT), timeout=10)
    except OSError:
        client.close()
        return

    browser.settimeout(None)
    client.settimeout(None)

    to_browser = threading.Thread(target=pipe, args=(client, browser), daemon=True)
    to_client = threading.Thread(target=pipe, args=(browser, client), daemon=True)
    to_browser.start()
    to_client.start()
    to_browser.join()
    to_client.join()

    client.close()
    browser.close()


def main() -> None:
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", LISTEN_PORT))
    server.listen(64)

    print(f"cdp forwarder listening on {LISTEN_PORT} -> {BROWSER_PORT}", flush=True)

    while True:
        client, _ = server.accept()
        threading.Thread(target=handle, args=(client,), daemon=True).start()


if __name__ == "__main__":
    main()
