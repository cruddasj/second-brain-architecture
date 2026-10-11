"use client";

import { useEffect, useRef, useState } from "react";
import type { Heading } from "./markdown-content";

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id || "");
  const panel = useRef<HTMLElement>(null);
  const navigation = useRef<{ id: string; scrollTop: number | null } | null>(null);
  const frame = useRef<number | null>(null);

  function selectHeading(id: string) {
    const reader = panel.current?.closest(".record-shell");
    if (!reader) return;
    setActiveId(id);
    navigation.current = { id, scrollTop: null };
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    // Native fragment scrolling is clamped at the end of a short document.
    // Keep the requested heading active at that landing position.
    frame.current = requestAnimationFrame(() => {
      navigation.current = { id, scrollTop: reader.scrollTop };
      frame.current = null;
    });
  }

  useEffect(() => {
    const reader = panel.current?.closest(".record-shell");
    if (!reader) return;
    const elements = headings.map(({ id }) => document.getElementById(id)).filter((heading): heading is HTMLElement => heading !== null);
    const update = () => {
      const selected = navigation.current;
      if (selected && (selected.scrollTop === null || Math.abs(reader.scrollTop - selected.scrollTop) < 1)) return;
      navigation.current = null;
      const toolbar = reader.querySelector(".record-search-bar");
      const top = Math.max(reader.getBoundingClientRect().top, toolbar?.getBoundingClientRect().bottom || 0) + 1;
      let active: HTMLElement | undefined = elements[0];
      for (const heading of elements) {
        if (heading.getBoundingClientRect().top <= top) active = heading;
      }
      if (reader.scrollTop > 0 && reader.scrollTop + reader.clientHeight >= reader.scrollHeight - 1) active = elements.at(-1);
      if (active) setActiveId(active.id);
    };
    const selectFragment = () => {
      try {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (headings.some((heading) => heading.id === id)) selectHeading(id);
        else { navigation.current = null; update(); }
      } catch { update(); }
    };
    reader.addEventListener("scroll", update, { passive: true });
    window.addEventListener("hashchange", selectFragment);
    const observer = new ResizeObserver(update);
    observer.observe(reader);
    const toolbar = reader.querySelector(".record-search-bar");
    if (toolbar) observer.observe(toolbar);
    selectFragment();
    return () => {
      reader.removeEventListener("scroll", update);
      window.removeEventListener("hashchange", selectFragment);
      observer.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [headings]);

  return <aside ref={panel} className="record-toc" aria-labelledby="record-toc-title">
    <h2 id="record-toc-title">On this page</h2>
    <nav aria-label="Table of contents"><ol>{headings.map((heading) =>
      <li key={heading.id} style={{ "--heading-level": heading.level } as React.CSSProperties}>
        <a href={`#${heading.id}`} onClick={(event) => {
          if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) selectHeading(heading.id);
        }} aria-current={activeId === heading.id ? "location" : undefined}>{heading.text}</a>
      </li>
    )}</ol></nav>
  </aside>;
}
