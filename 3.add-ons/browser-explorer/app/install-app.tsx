"use client";
import { useEffect, useState } from "react";
import { localMode } from "./brain-provider";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export default function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const complete = () => { setInstalled(true); setPrompt(null); };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    return () => { window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", complete); };
  }, []);
  if (installed !== false) return null;
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
