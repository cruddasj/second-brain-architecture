import { appPath } from "./paths.mjs";

const timeoutMs = 60_000;

function installed(worker: ServiceWorker) {
  return new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", changed);
      if (error) reject(error); else resolve();
    };
    const changed = () => {
      if (worker.state === "redundant") finish(new Error("The new app could not be downloaded."));
      else if (worker.state !== "installing") finish();
    };
    const timer = setTimeout(() => finish(new Error("The app download timed out.")), timeoutMs);
    worker.addEventListener("statechange", changed);
    changed();
  });
}

function activate(worker: ServiceWorker) {
  return new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      worker.removeEventListener("statechange", changed);
      if (error) reject(error); else resolve();
    };
    const changed = () => {
      if (worker.state === "redundant") finish(new Error("The new app could not be activated."));
      else if (navigator.serviceWorker.controller === worker) finish();
    };
    const timer = setTimeout(() => finish(new Error("The app update timed out. Close and reopen the app to try again.")), timeoutMs);
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    worker.addEventListener("statechange", changed);
    try { worker.postMessage({ type: "ACTIVATE_APP_UPDATE" }); changed(); }
    catch { finish(new Error("The new app could not be activated.")); }
  });
}

function refresh(worker: ServiceWorker) {
  return new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const finish = (error?: Error) => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      if (error) reject(error); else resolve();
    };
    const timer = setTimeout(() => finish(new Error("The app download timed out.")), timeoutMs);
    channel.port1.onmessage = event => {
      if (event.data?.ok) finish();
      else finish(new Error("The app could not be downloaded. Check your connection and available storage, then try again."));
    };
    try { worker.postMessage({ type: "REFRESH_APP_SHELL" }, [channel.port2]); }
    catch { finish(new Error("The app could not be updated. Close and reopen it, then try again.")); }
  });
}

// Only service-worker shell caches are touched. Device data lives separately.
export async function updateApp() {
  if (!("serviceWorker" in navigator)) throw new Error("App updates are not supported in this browser.");
  if (!navigator.onLine) throw new Error("You're offline. Connect to the internet and try again. Your saved notes are unchanged.");
  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.register(appPath("/sw.js"), { scope: appPath("/"), updateViaCache: "none" });
    await registration.update();
  } catch {
    throw new Error("Could not check for app updates. Check your connection and try again. Your saved notes are unchanged.");
  }
  if (registration.installing) await installed(registration.installing);
  if (registration.waiting) {
    await activate(registration.waiting);
  } else {
    const worker = registration.active;
    if (!worker) throw new Error("The app is not ready to update. Please try again.");
    await refresh(worker);
    if (navigator.serviceWorker.controller !== worker) await activate(worker);
  }
}
