import { buildBrainData } from "./snapshot.mjs";
self.onmessage = (event) => {
  try { self.postMessage({ data: buildBrainData(event.data) }); }
  catch { self.postMessage({ error: "Could not index this repository snapshot." }); }
};
