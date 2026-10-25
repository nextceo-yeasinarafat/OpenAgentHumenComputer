


export type Metric = {
  percent: number | null;
  given: string;
};

export type MachineAnalyse = {
  cpu: Metric & { cores: number };
  gpu: Metric & { enabled: boolean };
  ram: Metric & { totalGb: number; usedGb: number };
  storage: Metric & { totalGb: number; usedGb: number };
};

export async function fetchMachineAnalyse(): Promise<MachineAnalyse> {
  const answer = await fetch("/api/analyse", { headers: { Accept: "application/json" } });
  if (!answer.ok) throw new Error(`the bridge answered ${answer.status}`);
  const raw = (await answer.json()) as {
    cpu?: { cores?: number; percent?: number };
    gpu?: { enabled?: boolean; cores?: number; percent?: number | null };
    ram?: { totalGb?: number; usedGb?: number; percent?: number };
    storage?: { totalGb?: number; usedGb?: number; percent?: number };
  };

  return {
    cpu: {
      cores: raw.cpu?.cores ?? 0,
      percent: raw.cpu?.percent ?? 0,
      given: `${raw.cpu?.cores ?? 0} cores`,
    },
    gpu: {
      enabled: raw.gpu?.enabled ?? false,
      percent: raw.gpu?.percent ?? null,
      given: raw.gpu?.enabled ? `${raw.gpu?.cores ?? 0} cores` : "not fitted",
    },
    ram: {
      totalGb: raw.ram?.totalGb ?? 0,
      usedGb: raw.ram?.usedGb ?? 0,
      percent: raw.ram?.percent ?? 0,
      given: `${raw.ram?.totalGb ?? 0} GB`,
    },
    storage: {
      totalGb: raw.storage?.totalGb ?? 0,
      usedGb: raw.storage?.usedGb ?? 0,
      percent: raw.storage?.percent ?? 0,
      given: `${raw.storage?.totalGb ?? 0} GB`,
    },
  };
}


export class MetricHistory {
  private readonly samples: number[] = [];

  constructor(
    readonly capacity: number,
    seed: number | null = null,
  ) {
    if (seed !== null) this.samples = Array(capacity).fill(seed);
  }

  push(percent: number | null): void {
    if (percent === null) percent = 0;
    this.samples.push(percent);
    if (this.samples.length > this.capacity) {
      this.samples.splice(0, this.samples.length - this.capacity);
    }
  }

  column(index: number): number {
    return this.samples[index] ?? 0;
  }

  get length(): number {
    return this.samples.length;
  }
}
