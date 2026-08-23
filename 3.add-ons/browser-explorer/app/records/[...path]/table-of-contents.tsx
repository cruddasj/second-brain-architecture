"use client";

import { useEffect, useState } from "react";
import type { Heading } from "./markdown-content";

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id || "");

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActiveId(visible.target.id);
    }, { rootMargin: "-15% 0px -70%", threshold: 0 });
    headings.forEach(({ id }) => { const heading = document.getElementById(id); if (heading) observer.observe(heading); });
    return () => observer.disconnect();
  }, [headings]);

  return <aside className="record-toc" aria-labelledby="record-toc-title">
    <h2 id="record-toc-title">On this page</h2>
    <nav aria-label="Table of contents"><ol>{headings.map((heading) =>
      <li key={heading.id} style={{ "--heading-level": heading.level } as React.CSSProperties}>
        <a href={`#${heading.id}`} aria-current={activeId === heading.id ? "location" : undefined}>{heading.text}</a>
      </li>
    )}</ol></nav>
  </aside>;
}
