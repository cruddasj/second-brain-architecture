import { matchesSearchWord } from "./search-text.mjs";

// Single-deletion keys narrow candidate words without scanning the corpus.
// Verification rejects candidates that share a key but need more than one edit.
function keys(word) {
  const letters = Array.from(word);
  if (letters.length < 3) return [];
  return new Set([word, ...letters.map((_, i) => letters.slice(0, i).concat(letters.slice(i + 1)).join(""))]);
}

export class FuzzyTokenIndex {
  files = new Map();
  words = new Map();
  candidates = new Map();

  remove(path) {
    for (const word of this.files.get(path) || []) {
      const paths = this.words.get(word);
      paths.delete(path);
      if (paths.size) continue;
      this.words.delete(word);
      for (const key of keys(word)) {
        const words = this.candidates.get(key);
        words.delete(word);
        if (!words.size) this.candidates.delete(key);
      }
    }
    this.files.delete(path);
  }

  update(path, tokens) {
    this.remove(path);
    const unique = new Set(tokens);
    this.files.set(path, [...unique]);
    for (const word of unique) {
      let paths = this.words.get(word);
      if (!paths) {
        paths = new Set();
        this.words.set(word, paths);
        for (const key of keys(word)) {
          if (!this.candidates.has(key)) this.candidates.set(key, new Set());
          this.candidates.get(key).add(word);
        }
      }
      paths.add(path);
    }
  }

  search(term) {
    const words = new Set();
    for (const key of keys(term)) {
      for (const word of this.candidates.get(key) || []) words.add(word);
    }
    const paths = new Set();
    for (const word of words) {
      if (matchesSearchWord(word, term)) {
        for (const path of this.words.get(word)) paths.add(path);
      }
    }
    return paths;
  }
}
