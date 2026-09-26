import { ContentSearchIndex } from "./search-index.mjs";

const index = new ContentSearchIndex();
// Serialize operations: searches must not overtake an asynchronous cache import.
let pending = Promise.resolve();
self.onmessage = (event) => {
  pending = pending.then(async () => {
    const { id, type, files, cache, query, persist } = event.data;
    try {
      if (type === "build") {
        await index.update(files, cache);
        self.postMessage({ id, result: persist ? await index.export() : null });
      } else if (type === "search") {
        self.postMessage({ id, result: index.search(query) });
      }
    } catch {
      self.postMessage({ id, error: "Content search is unavailable." });
    }
  });
};
