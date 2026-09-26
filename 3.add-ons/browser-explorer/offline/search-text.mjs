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

// Prefixes retain their existing meaning. Fuzzy matching is limited to one
// edit of a whole word, with short words excluded to avoid noisy results.
export function matchesSearchWord(word, term) {
  if (word.startsWith(term)) return true;
  const source = Array.from(word);
  const query = Array.from(term);
  if (query.length < 3 || source.length < 3 || Math.abs(source.length - query.length) > 1) return false;
  let i = 0;
  while (i < Math.min(source.length, query.length) && source[i] === query[i]) i++;
  const tailEquals = (sourceStart, queryStart) => source.slice(sourceStart).join("") === query.slice(queryStart).join("");
  if (source.length > query.length) return tailEquals(i + 1, i); // Missing letter.
  if (query.length > source.length) return tailEquals(i, i + 1); // Extra letter.
  return tailEquals(i + 1, i + 1) || // Substitution.
    (source[i] === query[i + 1] && source[i + 1] === query[i] && tailEquals(i + 2, i + 2));
}

// Used only when a browser cannot start the worker.
export function matchesSearchText(text, query) {
  const terms = searchTokens(query);
  const words = searchTokens(text);
  return terms.length > 0 && terms.every((term) => words.some((word) => matchesSearchWord(word, term)));
}
