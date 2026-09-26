import { Index } from "flexsearch";
import { markdownToSearchText, searchTokens } from "./search-text.mjs";

// Bump when extraction, tokenisation, or the library's export format changes.
export const searchIndexVersion = "1:flexsearch-0.8.212";

function newIndex() {
  return new Index({ tokenize: "forward", encoder: searchTokens, cache: 100 });
}

async function fileVersion(file) {
  if (file.sha) return file.sha;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(file.content));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class ContentSearchIndex {
  index = newIndex();
  files = new Map();

  async update(files, cache) {
    this.index = newIndex();
    this.files = new Map();
    if (cache?.version === searchIndexVersion) {
      try {
        if (!Array.isArray(cache.files) || !Array.isArray(cache.chunks) ||
          !cache.files.every((file) => typeof file.path === "string" && typeof file.sha === "string") ||
          !cache.chunks.every((chunk) => Array.isArray(chunk) && chunk.length === 2 && chunk.every((value) => typeof value === "string")) ||
          !cache.chunks.some(([key]) => key.endsWith(".reg")) || !cache.chunks.some(([key]) => key.endsWith(".map"))) {
          throw new Error("Invalid search cache.");
        }
        for (const [key, value] of cache.chunks) await this.index.import(key, value);
        this.files = new Map(cache.files.map((file) => [file.path, file.sha]));
      } catch {
        // A corrupt or incompatible cache never prevents rebuilding from notes.
        this.index = newIndex();
        this.files = new Map();
      }
    }
    const current = new Set(files.map((file) => file.path));
    for (const path of this.files.keys()) {
      if (!current.has(path)) {
        this.index.remove(path);
        this.files.delete(path);
      }
    }
    let indexed = 0;
    for (const file of files) {
      const sha = await fileVersion(file);
      if (this.files.get(file.path) === sha) continue;
      this.index.update(file.path, markdownToSearchText(file.content));
      this.files.set(file.path, sha);
      indexed++;
    }
    return { indexed, count: this.files.size };
  }

  search(query) {
    if (!searchTokens(query).length || !this.files.size) return [];
    // These are filters, so return every match rather than a ranked top 20/100.
    return this.index.search(query, { limit: this.files.size });
  }

  async export() {
    const chunks = [];
    await this.index.export((key, value) => { chunks.push([key, value]); });
    return {
      version: searchIndexVersion,
      files: [...this.files].map(([path, sha]) => ({ path, sha })),
      chunks,
    };
  }
}
