"use client";

import { useEffect, useState } from "react";
import type { Snapshot } from "../offline/types";
import { readSearchCache, saveSearchCache } from "../offline/storage.mjs";
import { markdownToSearchText, matchesSearchText } from "../offline/search-text.mjs";

export type ContentSearch = {
  snapshot: Snapshot | null;
  status: "indexing" | "ready" | "fallback";
  search: (query: string) => Promise<string[]>;
};

const emptySearch: ContentSearch = { snapshot: null, status: "ready", search: async () => [] };
const emptyPaths = new Set<string>();

export function useContentSearchIndex(snapshot: Snapshot | null, persist: boolean): ContentSearch {
  const [service, setService] = useState<ContentSearch | null>(null);
  useEffect(() => {
    if (!snapshot) return;
    let active = true;
    let worker: Worker | undefined;
    let nextId = 0;
    const requests = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
    function stop() {
      worker?.terminate();
      for (const request of requests.values()) request.reject(new Error("Search index replaced."));
      requests.clear();
    }
    function fallback() {
      stop();
      if (!active) return;
      // Workers may be disabled by browser policy. Keep content search usable.
      const text = new Map<string, string>();
      setService({ snapshot, status: "fallback", search: async (query) => {
        const matches = [];
        for (const file of snapshot!.files) {
          if (!text.has(file.path)) text.set(file.path, markdownToSearchText(file.content));
          if (matchesSearchText(text.get(file.path)!, query)) matches.push(file.path);
        }
        return matches;
      } });
    }
    function request(type: string, payload: Record<string, unknown>) {
      return new Promise<unknown>((resolve, reject) => {
        const id = ++nextId;
        requests.set(id, { resolve, reject });
        try { worker!.postMessage({ id, type, ...payload }); }
        catch (error) { requests.delete(id); reject(error); }
      });
    }
    async function start() {
      try {
        worker = new Worker(new URL("../offline/search.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (event) => {
          const pending = requests.get(event.data.id);
          if (!pending) return;
          requests.delete(event.data.id);
          if (event.data.error) pending.reject(new Error(event.data.error));
          else pending.resolve(event.data.result);
        };
        worker.onerror = fallback;
        worker.onmessageerror = fallback;
        const cache = persist ? await readSearchCache(snapshot).catch(() => null) : null;
        if (!active) return;
        const index = await request("build", { files: snapshot!.files, cache, persist });
        if (!active) return;
        setService({ snapshot, status: "ready", search: async (query) => {
          try { return await request("search", { query }) as string[]; }
          catch (error) { fallback(); throw error; }
        } });
        if (persist) void saveSearchCache(snapshot, index).catch(() => { /* Cache storage is optional. */ });
      } catch {
        fallback();
      }
    }
    void start();
    return () => { active = false; stop(); };
  }, [snapshot, persist]);
  // Stable identity keeps consumers from restarting a query on every render.
  if (!snapshot) return emptySearch;
  if (service?.snapshot === snapshot) return service;
  return { snapshot, status: "indexing", search: emptySearch.search };
}

export function useContentMatches(query: string, service: ContentSearch) {
  const term = query.trim();
  const [result, setResult] = useState<{ term: string; service: ContentSearch; paths: Set<string> } | null>(null);
  useEffect(() => {
    if (!term || service.status === "indexing") return;
    let active = true;
    const timer = setTimeout(() => {
      void service.search(term).then((paths) => {
        if (active) setResult({ term, service, paths: new Set(paths) });
      }).catch(() => { /* A replacement index will restart this query. */ });
    }, 150);
    return () => { active = false; clearTimeout(timer); };
  }, [term, service]);
  return {
    paths: result?.term === term && result.service === service ? result.paths : emptyPaths,
    pending: Boolean(term && (result?.term !== term || result?.service !== service)),
  };
}
