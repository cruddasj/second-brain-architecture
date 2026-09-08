"use client";
import { type FormEvent, useEffect, useState } from "react";
import { setup, tokenSetupURL } from "repository-adapter";
import ApplicationShell from "../application-shell";
import { localMode, useBrain } from "../brain-provider";
import InstallApp from "../install-app";

export default function ConnectionPage() {
  const { connection, snapshot, loading, busy, message, sync, disconnect } = useBrain();
  const [repository, setRepository] = useState("");
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);
  useEffect(() => { setRepository(connection?.repository || ""); setToken(connection?.token || ""); setRemember(Boolean(connection?.token)); }, [connection]);
  async function submit(event: FormEvent) { event.preventDefault(); await sync(repository, token, remember); }
  return <ApplicationShell><section className="reader-workspace connection-page" aria-labelledby="connection-title">
    <header className="reader-header"><p className="eyebrow">Connect your notes</p><h2 id="connection-title">Set up your second brain</h2>
      <p>Follow these three short steps to bring your notes into the explorer. Once they're here, you can read them even when you're offline.</p>
    </header>
    <div className="connection-content">
      {localMode ? <section className="connection-notice" role="status"><h3>Development mode - using your local content</h3><p>You started this app with <code>npm run dev</code>. The graph and reader use this checkout, including local edits, from when the development server started. No token is needed and repository sync is disabled.</p><p>Restart the development server to rebuild local content. To test token setup and installation, run <code>npm run build</code>, then <code>npm run preview</code> and open the address it prints.</p></section> : <>
        {snapshot && <section className="connection-notice"><h3>Connected to {snapshot.repository}</h3><p>{snapshot.files.length} files · {snapshot.branch} · revision {snapshot.commit.slice(0, 7)}</p><p>Last checked: {new Date(snapshot.checkedAt).toLocaleString()}</p><p>Your saved content remains available if a refresh fails.</p></section>}
        <form className="connection-form" onSubmit={submit}>
          <section className="setup-step" aria-labelledby="repository-step"><div className="setup-step-heading"><span aria-hidden="true">1</span><div><p>First</p><h3 id="repository-step">Tell us your second brain repository details</h3></div></div><p>Enter the name of your repository, or paste its web address.</p>
          <label>{setup.label}<input value={repository} onChange={event => setRepository(event.target.value)} placeholder="owner/repository" required disabled={loading || busy || Boolean(snapshot)} autoCapitalize="none" spellCheck={false} /></label>
          </section>
          <section className="setup-step" aria-labelledby="token-step"><div className="setup-step-heading"><span aria-hidden="true">2</span><div><p>Next</p><h3 id="token-step">Give the explorer read-only access</h3></div></div><p>Your repository service uses a special key, called a personal access token, to let the explorer download your notes. Read-only access means the explorer cannot change them.</p>
          <div className="connection-token-help"><a href={tokenSetupURL(repository)} target="_blank" rel="noreferrer"><span>Create a read-only access token</span><i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a><p>{setup.instructions}</p></div>
          <label>{setup.tokenLabel}<input type="password" value={token} onChange={event => setToken(event.target.value)} required disabled={loading || busy} autoComplete="off" spellCheck={false} /></label>
          </section>
          <section className="setup-step" aria-labelledby="remember-step"><div className="setup-step-heading"><span aria-hidden="true">3</span><div><p>Finally</p><h3 id="remember-step">Choose whether to remember the token</h3></div></div><p>Save the token on this device if you want quicker updates later. Leave this off on a shared or public device.</p>
          <div><button className="connection-token-toggle" type="button" aria-pressed={remember} aria-describedby="token-device-guidance" onClick={() => setRemember(value => !value)} disabled={busy}>Remember token on this device</button><p id="token-device-guidance" className="connection-token-guidance">Only on a trusted, private device.</p></div>
          <p>You won't need the token just to read notes you've already downloaded.</p></section>
          <div className="connection-actions"><button type="submit" disabled={loading || busy}>{busy ? "Syncing…" : snapshot ? "Refresh content" : "Connect and sync"}</button>
            {snapshot && <button type="button" disabled={busy} onClick={() => { if (window.confirm("Remove the saved connection, token and downloaded Markdown from this browser?")) void disconnect(); }}>Disconnect and clear device copy</button>}
          </div>
        </form>
        <details className="setup-privacy"><summary>How your information is used</summary><p>{setup.privacy}</p></details>
      </>}
      {message && <p role="status" aria-live="polite">{message}</p>}
      <InstallApp />
    </div>
  </section></ApplicationShell>;
}
