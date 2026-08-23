import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const addonRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(addonRoot, "node_modules", "next", "dist", "bin", "next");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: addonRoot, stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) return reject(new Error(`Process exited after signal ${signal}.`));
      if (code !== 0) return reject(new Error(`Process exited with code ${code}.`));
      resolve();
    });
  });
}

await run(process.execPath, [path.join(addonRoot, "scripts", "build-demo-data.mjs")]);
await run(process.execPath, [nextBin, "dev"], {
  env: { ...process.env, NEXT_PUBLIC_BRAIN_DATA_PATH: "/demo-brain-data.json" },
});
