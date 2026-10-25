

export type MachineDetails = {
  name: string;
  user: string;
  status: string;
  host: string;
  cpuCores: number;
  ramGb: number;
  diskName: string;
  diskTotal: string;
  diskAvailable: string;
};

function gigabytes(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  return gb >= 1024 ? `${(gb / 1024).toFixed(1)} TB` : `${Math.round(gb)} GB`;
}

export async function fetchMachineDetails(): Promise<MachineDetails> {
  const [status, state, disk, analyse] = await Promise.all([
    fetch("/api/computer/status").then((r) => r.json()),
    fetch("/api/state").then((r) => r.json()),
    fetch("/api/disk").then((r) => r.json()),
    
    
    fetch("/api/analyse").then((r) => r.json()),
  ]);

  return {
    name: status.name ?? "—",
    user: (state.user_home ?? "/home/?").split("/").pop() ?? "—",
    status: status.running ? "running" : "stopped",
    host: state.host ?? "—",
    cpuCores: analyse.cpu?.cores ?? 0,
    ramGb: analyse.ram?.totalGb ?? 0,
    diskName: disk.name ?? "Storage",
    diskTotal: gigabytes(Number(disk.total ?? 0)),
    diskAvailable: gigabytes(Number(disk.available ?? 0)),
  };
}


export function identityRows(details: MachineDetails): Array<[string, string]> {
  return [
    ["Computer", details.name],
    ["Account", details.user],
    ["Status", details.status],
    ["Address", details.host],
  ];
}


export function hardwareRows(details: MachineDetails): Array<[string, string]> {
  return [
    ["CPU", `${details.cpuCores} cores`],
    ["Memory", `${details.ramGb} GB`],
    ["Disk", `${details.diskName} · ${details.diskTotal}`],
    ["Available", details.diskAvailable],
  ];
}
