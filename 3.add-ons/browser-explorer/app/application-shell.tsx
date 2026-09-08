"use client";

import { appPath } from "../offline/paths.mjs";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

export default function ApplicationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const [navigationOpen, setNavigationOpen] = useState(false);
  const destinations = [
    { href: "/", label: "Knowledge graph", icons: ["fa-diagram-project"], active: pathname === "/" },
    { href: "/markdown", label: "Markdown reader", icons: ["fa-book-open"], active: pathname === "/markdown" || pathname === "/record" },
    { href: "/connection", label: "Repository sync", icons: ["fa-arrow-up", "fa-arrow-down"], active: pathname === "/connection" },
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
            <span className={`navigation-icon${item.icons.length > 1 ? " navigation-icon-pair" : ""}`} aria-hidden="true">{item.icons.map((icon) => <i className={`fa-solid ${icon}`} key={icon} />)}</span><span className="navigation-label">{item.label}</span>
          </a>)}
        </nav>
      </div>
    </aside>
    <div className="workspace-pane">{children}</div>
  </main>;
}
