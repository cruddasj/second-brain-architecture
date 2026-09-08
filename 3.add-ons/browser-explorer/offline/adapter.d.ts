declare module "repository-adapter" {
  export const setup: { label: string; tokenLabel: string; instructions: string; privacy: string };
  export function tokenSetupURL(repository: string): string;
  export function downloadSnapshot(options: { repository: string; token: string; previous?: import("./types").Snapshot | null; signal?: AbortSignal; onProgress?: (message: string) => void }): Promise<import("./types").Snapshot>;
}
