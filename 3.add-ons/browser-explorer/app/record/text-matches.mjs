// Keep offsets into the original text when case, accents or whitespace change.
function normalise(text) {
  let value = "";
  const offsets = [];
  let position = 0;
  for (const character of text) {
    const start = position;
    position += character.length;
    const folded = character.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
    if (!folded) {
      if (offsets.length) offsets[offsets.length - 1].end = position;
      continue;
    }
    for (const letter of folded) {
      if (/\s/u.test(letter)) {
        if (value.endsWith(" ")) offsets[offsets.length - 1].end = position;
        else { value += " "; offsets.push({ start, end: position }); }
      } else {
        value += letter;
        // String.indexOf and DOM Range offsets both use UTF-16 code units.
        for (let i = 0; i < letter.length; i++) offsets.push({ start, end: position });
      }
    }
  }
  return { value, offsets };
}

export function findTextMatches(text, query) {
  const needle = normalise(query).value.trim();
  if (!needle) return [];
  const { value, offsets } = normalise(text);
  const matches = [];
  for (let start = value.indexOf(needle); start !== -1; start = value.indexOf(needle, start + needle.length)) {
    matches.push({ start: offsets[start].start, end: offsets[start + needle.length - 1].end });
  }
  return matches;
}

const textBlock = "p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, th, td";

export function findRenderedMatches(root, query) {
  if (!query.trim()) return [];
  const groups = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent || node.parentElement.closest('.heading-permalink, [aria-hidden="true"], [hidden], script, style')) continue;
    const block = node.parentElement.closest(textBlock) || root;
    let group = groups[groups.length - 1];
    // Join inline formatting, but do not invent phrases across separate blocks.
    if (group?.block !== block) { group = { block, text: "", nodes: [] }; groups.push(group); }
    group.nodes.push({ node, start: group.text.length, end: group.text.length + node.textContent.length });
    group.text += node.textContent;
  }
  return groups.flatMap(({ text, nodes }) => findTextMatches(text, query).map(({ start, end }) => {
    const first = nodes.find((part) => start < part.end);
    const last = nodes.find((part) => end <= part.end);
    const range = root.ownerDocument.createRange();
    range.setStart(first.node, start - first.start);
    range.setEnd(last.node, end - last.start);
    return range;
  }));
}

export function clearMatchHighlights(root) {
  globalThis.CSS?.highlights?.delete("record-search-matches");
  globalThis.CSS?.highlights?.delete("record-search-active");
  root.querySelectorAll("[data-record-match], [data-record-match-active]").forEach((element) => {
    element.removeAttribute("data-record-match");
    element.removeAttribute("data-record-match-active");
  });
}

export function showMatchHighlights(root, ranges, active) {
  clearMatchHighlights(root);
  if (globalThis.CSS?.highlights && typeof globalThis.Highlight === "function") {
    const all = new Highlight();
    ranges.forEach((range) => all.add(range));
    CSS.highlights.set("record-search-matches", all);
    const selected = new Highlight();
    if (ranges[active]) selected.add(ranges[active]);
    selected.priority = 1;
    CSS.highlights.set("record-search-active", selected);
  } else {
    // Older browsers can still navigate matches and highlight matching blocks.
    ranges.forEach((range, index) => {
      const element = range.startContainer.parentElement.closest(textBlock) || root;
      element.setAttribute("data-record-match", "");
      if (index === active) element.setAttribute("data-record-match-active", "");
    });
  }
}

export function scrollToMatch(root, toolbar, range) {
  const scroller = root.closest(".record-shell");
  if (!scroller || !range) return;
  // Reveal matches in horizontally scrolling code/table containers as well.
  let element = range.startContainer.parentElement;
  while (element && element !== scroller) {
    if (element.scrollWidth > element.clientWidth && /auto|scroll/.test(getComputedStyle(element).overflowX)) {
      const target = range.getClientRects()[0];
      const bounds = element.getBoundingClientRect();
      if (target && (target.left < bounds.left || target.right > bounds.right)) {
        element.scrollLeft += target.left - bounds.left - element.clientWidth / 2;
      }
    }
    element = element.parentElement;
  }
  const target = range.getClientRects()[0];
  if (!target) return;
  const bounds = scroller.getBoundingClientRect();
  const toolbarHeight = toolbar.getBoundingClientRect().height;
  const centre = bounds.top + toolbarHeight + (scroller.clientHeight - toolbarHeight) / 2;
  scroller.scrollBy({ top: target.top - centre, behavior: "instant" });
}
