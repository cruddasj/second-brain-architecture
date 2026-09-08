"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { storageScope } from "../offline/paths.mjs";
import { downloadSnapshot } from "repository-adapter";
import { buildBrainData } from "../offline/snapshot.mjs";
import { readState, saveState } from "../offline/storage.mjs";
import type { Snapshot, Connection } from "../offline/types";
import type { BrainData } from "./brain-data";
import { brainDataPath } from "./data-source";

const empty = { schemaVersion: 5, source: "device", graph: { nodes: [], edges: [], themes: [] }, markdown: { files: [] } } as BrainData;
export const localMode = process.env.NODE_ENV === "development";
type State = { snapshot: Snapshot | null; connection: Connection | null };
type Value = State & { data: BrainData; loading: boolean; busy: boolean; message: string; sync: (repository: string, token: string, remember: boolean) => Promise<void>; disconnect: () => Promise<void> };
const Context = createContext<Value | null>(null);
export function useBrain() { const value = useContext(Context); if (!value) throw new Error("Missing reader provider"); return value; }

export default function BrainProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ snapshot: null, connection: null });
  const [data, setData] = useState<BrainData>(empty);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        if (localMode) {
          const response = await fetch(brainDataPath, { cache: "no-store" });
          if (!response.ok) throw new Error("Local content unavailable. Restart npm run dev.");
          const local = await response.json();
          if (active) { setData(local); setState({ snapshot: local.snapshot, connection: null }); }
        } else {
          const saved = await readState() as State;
          const indexed = saved.snapshot ? buildBrainData(saved.snapshot.files) as BrainData : empty;
          if (active) { setState(saved); setData(indexed); }
        }
      } catch (error) { if (active) setMessage((error as Error).message); }
      finally { if (active) setLoading(false); }
    }
    void restore();
    return () => { active = false; };
  }, []);
  async function sync(repository: string, token: string, remember: boolean) {
    if (lock.current || localMode || loading) return;
    lock.current = true; setBusy(true);
    try {
      const snapshot = await downloadSnapshot({ repository, token, previous: state.snapshot, onProgress: setMessage, signal: AbortSignal.timeout(5 * 60 * 1000) });
      const indexed = buildBrainData(snapshot.files) as BrainData;
      const next = { snapshot, connection: { repository: snapshot.repository, ...(remember ? { token: token.trim() } : {}) } };
      await saveState(next);
      setState(next); setData(indexed);
      setMessage(`Synced ${snapshot.files.length} Markdown files. Last checked ${new Date(snapshot.checkedAt).toLocaleString()}.`);
    } catch (error) { setMessage(error instanceof TypeError ? "Could not reach the repository. Your saved content is unchanged." : (error as Error).message); }
    finally { lock.current = false; setBusy(false); }
  }
  async function disconnect() {
    if (lock.current || localMode) return;
    lock.current = true; setBusy(true);
    try {
      await saveState({ snapshot: null, connection: null });
      try { localStorage.removeItem(`second-brain-graph-positions-v1:${storageScope}`); } catch { /* Layout storage may be independently disabled. */ }
      setState({ snapshot: null, connection: null }); setData(empty); setMessage("Connection and downloaded content removed from this browser.");
    }
    catch (error) { setMessage((error as Error).message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Context.Provider value={{ ...state, data, loading, busy, message, sync, disconnect }}>{children}</Context.Provider>;
}
