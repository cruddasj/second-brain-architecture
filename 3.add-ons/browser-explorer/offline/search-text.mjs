// Search visible Markdown text, retaining code, link labels and image alt text.
export function markdownToSearchText(markdown) {
  const code = [];
  const protect = (value) => `\u0000${code.push(value) - 1}\u0000`;
  return markdown
    .replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^[ \t]*\1[ \t]*\r?$/gm, (_, fence, body) => protect(body))
    .replace(/(`+)([^`]*?)\1/g, (_, ticks, body) => protect(body))
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!??\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/!??\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/^\s*\[[^\]]+\]:.*$/gm, " ")
    .replace(/<([^<>\s]+@[^<>\s]+|https?:\/\/[^<>\s]+)>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^[ \t]*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+)/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/\u0000(\d+)\u0000/g, (_, id) => code[Number(id)])
    .replace(/\s+/g, " ")
    .trim();
}

export function searchTokens(value) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

// Used only when a browser cannot start the worker.
export function matchesSearchText(text, query) {
  const terms = searchTokens(query);
  const words = searchTokens(text);
  return terms.length > 0 && terms.every((term) => words.some((word) => word.startsWith(term)));
}
