import { appPath } from "./paths.mjs";
import { resolveRecordLink } from "./snapshot.mjs";

export function recordHref(path, heading = "") {
  return appPath(`/record/?file=${encodeURIComponent(path)}${heading ? "#" + encodeURIComponent(heading) : ""}`);
}

export function readerLink(current, href) {
  if (/[\u0000-\u001f\\]/.test(href) || href.startsWith("//")) return undefined;
  if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return undefined;
  const path = resolveRecordLink(current, href);
  if (!path?.endsWith(".md")) return undefined;
  let heading = href.includes("#") ? href.slice(href.indexOf("#") + 1) : "";
  try { heading = decodeURIComponent(heading); } catch { return undefined; }
  return recordHref(path, heading);
}
