import { Index } from "flexsearch";
import { markdownToSearchText, searchTokens } from "./search-text.mjs";
import { FuzzyTokenIndex } from "./fuzzy-index.mjs";

// Bump when extraction, tokenisation, or the library's export format changes.
export const searchIndexVersion = "2:flexsearch-0.8.212";

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
  fuzzy = new FuzzyTokenIndex();
  files = new Map();

  async update(files, cache) {
    this.index = newIndex();
    this.fuzzy = new FuzzyTokenIndex();
    this.files = new Map();
    if (cache?.version === searchIndexVersion) {
      try {
        const cachedPaths = new Set(cache.files.map((file) => file.path));
        if (!Array.isArray(cache.files) || !Array.isArray(cache.chunks) || !Array.isArray(cache.words) ||
          !cache.files.every((file) => typeof file.path === "string" && typeof file.sha === "string") ||
          cache.words.length !== cache.files.length ||
          new Set(cache.words.map((entry) => entry?.[0])).size !== cache.files.length ||
          !cache.words.every((entry) => Array.isArray(entry) && entry.length === 2 &&
            cachedPaths.has(entry[0]) && Array.isArray(entry[1]) &&
            entry[1].every((word) => typeof word === "string" && searchTokens(word).length === 1 && searchTokens(word)[0] === word)) ||
          !cache.chunks.every((chunk) => Array.isArray(chunk) && chunk.length === 2 && chunk.every((value) => typeof value === "string")) ||
          !cache.chunks.some(([key]) => key.endsWith(".reg")) || !cache.chunks.some(([key]) => key.endsWith(".map"))) {
          throw new Error("Invalid search cache.");
        }
        for (const [key, value] of cache.chunks) await this.index.import(key, value);
        for (const [path, words] of cache.words) this.fuzzy.update(path, words);
        this.files = new Map(cache.files.map((file) => [file.path, file.sha]));
      } catch {
        // A corrupt or incompatible cache never prevents rebuilding from notes.
        this.index = newIndex();
        this.fuzzy = new FuzzyTokenIndex();
        this.files = new Map();
      }
    }
    const current = new Set(files.map((file) => file.path));
    for (const path of this.files.keys()) {
      if (!current.has(path)) {
        this.index.remove(path);
        this.fuzzy.remove(path);
        this.files.delete(path);
      }
    }
    let indexed = 0;
    for (const file of files) {
      const sha = await fileVersion(file);
      if (this.files.get(file.path) === sha) continue;
      const text = markdownToSearchText(file.content);
      this.index.update(file.path, text);
      this.fuzzy.update(file.path, searchTokens(text));
      this.files.set(file.path, sha);
      indexed++;
    }
    return { indexed, count: this.files.size };
  }

  search(query) {
    const terms = searchTokens(query);
    if (!terms.length || !this.files.size) return [];
    // These are filters, so return every match rather than a ranked top 20/100.
    let matches;
    for (const term of terms) {
      const paths = new Set([...this.index.search(term, { limit: this.files.size }), ...this.fuzzy.search(term)]);
      matches = matches ? new Set([...matches].filter((path) => paths.has(path))) : paths;
      if (!matches.size) break;
    }
    return [...matches];
  }

  async export() {
    const chunks = [];
    await this.index.export((key, value) => { chunks.push([key, value]); });
    return {
      version: searchIndexVersion,
      files: [...this.files].map(([path, sha]) => ({ path, sha })),
      chunks,
      words: [...this.fuzzy.files],
    };
  }
}
