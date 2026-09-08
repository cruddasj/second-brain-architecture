// Set once at build time; the same mount path scopes URLs and device storage.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
export function appPath(path) { return `${basePath}${path}`; }
export const storageScope = encodeURIComponent(basePath || "/");
