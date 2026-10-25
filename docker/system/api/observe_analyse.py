
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

CGROUP = Path("/sys/fs/cgroup")
SYSTEM_CONF = Path("/opt/open-computer/system/system.conf")


def conf_value(key: str) -> str | None:
    try:
        for line in SYSTEM_CONF.read_text().splitlines():
            name, _, value = line.partition("=")
            if name.strip() == key:
                return value.strip()
    except OSError:
        pass
    return None


def cpu_limit_cores() -> float:


    try:
        quota, period = CGROUP.joinpath("cpu.max").read_text().split()
        if quota != "max":
            return max(0.1, int(quota) / int(period))
    except (OSError, ValueError):
        pass
    try:
        return max(1, int(conf_value("CPU_CORES") or "1"))
    except ValueError:
        return 1.0


def cpu_usage_percent(limit_cores: float, window_s: float = 0.3) -> float:

    def usage_usec() -> float:
        try:
            for line in CGROUP.joinpath("cpu.stat").read_text().splitlines():
                if line.startswith("usage_usec"):
                    return float(line.split()[1])
        except (OSError, ValueError, IndexError):
            pass
        return -1.0

    first = usage_usec()
    if first < 0:
        return 0.0
    time.sleep(window_s)
    second = usage_usec()
    if second < first:
        return 0.0

    cores_used = (second - first) / 1e6 / window_s
    return max(0.0, min(100.0, cores_used / max(0.1, limit_cores) * 100.0))


def ram() -> dict:


    limit_bytes = 0
    try:
        limit_bytes = int(CGROUP.joinpath("memory.max").read_text().strip())
    except (OSError, ValueError):
        pass
    if not limit_bytes or limit_bytes > 1 << 50:
        try:
            limit_bytes = int(conf_value("RAM_TOTAL_GB") or "0") * 1024**3
        except ValueError:
            limit_bytes = 0

    used_bytes = 0
    try:
        used_bytes = int(CGROUP.joinpath("memory.current").read_text().strip())
    except (OSError, ValueError):
        pass

    percent = min(100.0, used_bytes / limit_bytes * 100.0) if limit_bytes else 0.0
    return {
        "totalGb": round(limit_bytes / 1024**3, 1),
        "usedGb": round(used_bytes / 1024**3, 1),
        "percent": round(percent, 1),
    }


def storage() -> dict:



    try:
        total_gb = float(conf_value("STORAGE_TOTAL_GB") or "0")
    except ValueError:
        total_gb = 0.0
    if total_gb <= 0:
        total_gb = 8.0

    used_bytes = 0
    try:
        answer = subprocess.run(
            ["du", "-sB1", "/home", "/opt", "/usr", "/var", "/root"],
            capture_output=True, text=True, timeout=20,
        )
        for line in answer.stdout.splitlines():
            used_bytes += int(line.split()[0])
    except (OSError, ValueError, subprocess.SubprocessError):
        pass

    total_bytes = total_gb * 1024**3
    percent = min(100.0, used_bytes / total_bytes * 100.0)
    return {
        "totalGb": round(total_gb, 1),
        "usedGb": round(used_bytes / 1024**3, 1),
        "percent": round(percent, 1),
    }


def gpu() -> dict:



    enabled = (conf_value("GPU_ENABLED") or "false").lower() == "true"
    cores = 0
    try:
        cores = int(conf_value("GPU_CORES") or "0")
    except ValueError:
        pass
    return {"enabled": enabled, "cores": cores, "percent": None}


def main() -> None:
    limit = cpu_limit_cores()
    print(json.dumps({
        "cpu": {
            "cores": round(limit, 1),
            "percent": round(cpu_usage_percent(limit), 1),
        },
        "gpu": gpu(),
        "ram": ram(),
        "storage": storage(),
    }))


if __name__ == "__main__":
    main()
