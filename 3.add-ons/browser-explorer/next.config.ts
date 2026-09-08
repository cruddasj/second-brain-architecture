import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const pluginRoot = path.resolve(process.cwd(), "../../1.plugins");
const registry = JSON.parse(fs.readFileSync(path.join(pluginRoot, "plugin-registry.json"), "utf8"));
const plugin = registry.plugins.find((item: { id: string }) => item.id === "befe7498-69c4-4f09-913d-9b36830a9882");
const candidate = plugin && path.join(pluginRoot, plugin.path, "browser-explorer/adapter.mjs");
const adapter = candidate && fs.existsSync(candidate) ? candidate : path.resolve("offline/adapter.mjs");

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
if (basePath && !/^\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(basePath)) throw new Error("Invalid application base path");

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  basePath,
  trailingSlash: true,
  turbopack: { root: path.resolve("../.."), resolveAlias: { "repository-adapter": "./" + path.relative(process.cwd(), adapter).split(path.sep).join("/") } },
  webpack(config) { config.resolve.alias["repository-adapter"] = adapter; return config; },
};

export default nextConfig;
