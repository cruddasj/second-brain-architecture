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
    try { tx.objectStore("state").put(value, "current"); }
    catch (error) { tx.abort(); db.close(); reject(error); return; }
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(new Error("Could not save to this device. Check available storage. The previous saved snapshot is unchanged.")); };
  });
}
