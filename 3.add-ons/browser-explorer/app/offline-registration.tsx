"use client";
import { appPath } from "../offline/paths.mjs";
import { useEffect } from "react";
export default function OfflineRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") {
      void navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.filter(item => item.active?.scriptURL === new URL(appPath("/sw.js"), location.origin).href).map(item => item.unregister())));
    } else {
      void navigator.serviceWorker.register(appPath("/sw.js"), { scope: appPath("/") }).catch(() => { /* Installation UI retains browser-menu guidance. */ });
    }
  }, []);
  return null;
}
