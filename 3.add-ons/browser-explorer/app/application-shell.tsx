"use client";

import { appPath } from "../offline/paths.mjs";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

export default function ApplicationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const [navigationOpen, setNavigationOpen] = useState(false);
  const destinations = [
    { href: "/", label: "Knowledge graph", icon: "fa-diagram-project", active: pathname === "/" },
    { href: "/markdown", label: "Markdown reader", icon: "fa-book-open", active: pathname === "/markdown" || pathname === "/record" },
    { href: "/connection", label: "Repository sync", icon: "fa-up-down", active: pathname === "/connection" },
  ];
  return <main className={`brain-shell ${navigationOpen ? "navigation-expanded" : "navigation-collapsed"}`}>
    <aside className="navigation-panel" aria-label="Application navigation">
      <div className="navigation-header">
        <button className="panel-toggle navigation-toggle" type="button" onClick={() => setNavigationOpen((open) => !open)} aria-label={navigationOpen ? "Collapse navigation panel" : "Expand navigation panel"} aria-expanded={navigationOpen}>
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button><h1>Second Brain Explorer</h1>
      </div>
      <div className="navigation-content">
        <nav className="application-menu" aria-label="Explorer destinations">
          {destinations.map((item) => <a key={item.href} href={appPath(item.href === "/" ? "/" : item.href + "/")} aria-current={item.active ? "page" : undefined} title={item.label}>
            <i className={`fa-solid ${item.icon}`} aria-hidden="true" /><span>{item.label}</span>
          </a>)}
        </nav>
      </div>
    </aside>
    <div className="workspace-pane">{children}</div>
  </main>;
}
