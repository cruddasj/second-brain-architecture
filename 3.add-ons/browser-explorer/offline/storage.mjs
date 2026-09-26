import { storageScope } from "./paths.mjs";
const databaseName = `second-brain-offline-v1:${storageScope}`;
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Device storage is unavailable. Allow site storage to use the offline reader."));
  });
}
export async function readState() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readonly");
    const request = tx.objectStore("state").get("current");
    tx.oncomplete = () => { db.close(); resolve(request.result || { snapshot: null, connection: null }); };
    tx.onabort = () => { db.close(); reject(new Error("Could not read the saved connection.")); };
  });
}
// One transaction replaces the entire snapshot and its connection together.
export async function saveState(value) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    try {
      tx.objectStore("state").put(value, "current");
      if (!value.snapshot) tx.objectStore("state").delete("search");
    }
    catch (error) { tx.abort(); db.close(); reject(error); return; }
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(new Error("Could not save to this device. Check available storage. The previous saved snapshot is unchanged.")); };
  });
}

export function snapshotIdentity(snapshot) {
  return snapshot ? JSON.stringify([snapshot.repositoryId, snapshot.repository, snapshot.branch, snapshot.commit]) : null;
}

export async function readSearchCache(snapshot) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readonly");
    const request = tx.objectStore("state").get("search");
    tx.oncomplete = () => {
      db.close();
      const cache = request.result;
      resolve(cache?.repository === snapshot.repository && cache?.repositoryId === snapshot.repositoryId && cache?.branch === snapshot.branch ? cache.index : null);
    };
    tx.onabort = () => { db.close(); reject(new Error("Could not read the search cache.")); };
  });
}

export async function saveSearchCache(snapshot, index) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    const store = tx.objectStore("state");
    const request = store.get("current");
    request.onsuccess = () => {
      // A late worker response must not restore data after disconnect or sync.
      if (snapshotIdentity(request.result?.snapshot) === snapshotIdentity(snapshot)) {
        store.put({ repository: snapshot.repository, repositoryId: snapshot.repositoryId, branch: snapshot.branch, index }, "search");
      }
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(new Error("Could not save the search cache.")); };
  });
}
