"use client";
import { useEffect, useRef, useState } from "react";
import { localMode } from "./brain-provider";
import { updateApp } from "../offline/update-app";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export default function InstallApp({ disabled = false, onUpdatingChange }: { disabled?: boolean; onUpdatingChange?: (updating: boolean) => void }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const updateLock = useRef(false);
  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const complete = () => { setInstalled(true); setPrompt(null); setStatus(""); };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    return () => { window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", complete); };
  }, []);
  async function update() {
    if (disabled || updateLock.current) return;
    updateLock.current = true;
    setUpdating(true);
    onUpdatingChange?.(true);
    setStatus("Downloading the latest app…");
    try {
      await updateApp();
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof TypeError ? "Could not reach the app server. Check your connection and try again. Your saved notes are unchanged." : error instanceof Error ? error.message : "The app could not be updated. Please try again.");
    } finally {
      updateLock.current = false;
      setUpdating(false);
      onUpdatingChange?.(false);
    }
  }
  if (installed === null) return null;
  if (installed) return <section className="install-section" aria-labelledby="update-title" aria-busy={updating}>
    <p className="install-eyebrow">App updates</p><h3 id="update-title">Update Second Brain Explorer</h3>
    <p>Download the latest app and reload. Your saved notes, connection and graph layout stay on this device.</p>
    {localMode ? <p>App updates are available in the installed production app.</p> : <button type="button" onClick={update} disabled={disabled || updating}>{updating ? "Updating app…" : "Update app"}</button>}
    {status && <p role="status" aria-live="polite">{status}</p>}
  </section>;
  return <section className="install-section" aria-labelledby="install-title"><p className="install-eyebrow">Optional</p><h3 id="install-title">Install Second Brain Explorer</h3>
    {localMode ? <p>Installation is available in the production preview, so development changes are not cached.</p> : <>
      <p>Add the app to your device so you can open your second brain from your home screen or app launcher.</p>
      <button type="button" onClick={async () => { if (prompt) { await prompt.prompt(); await prompt.userChoice; setPrompt(null); } else setStatus("If no installation prompt appears, open your browser's menu and look for Install app or Add to Home Screen. On an iPhone or iPad, use Safari and follow the instructions below."); }}>Install app</button>
      <div className="mobile-install-help" aria-label="Mobile installation instructions">
        <p><strong>Android</strong><span>Tap the Install app button above. If it doesn't appear, open your browser menu and choose Install app.</span></p>
        <p><strong>iPhone or iPad</strong><span>Open this page in Safari. Tap the Share button, then choose Add to Home Screen.</span></p>
      </div>
      {status && <p role="status">{status}</p>}
    </>}
  </section>;
}
