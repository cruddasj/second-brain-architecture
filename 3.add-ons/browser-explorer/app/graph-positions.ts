import { storageScope } from "../offline/paths.mjs";
import type { Point } from "./graph-types";

const storageKey = `second-brain-graph-positions-v1:${storageScope}`;

export function loadPositions(): Record<string, Point> {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

export function savePositions(positions: Record<string, Point>) {
  localStorage.setItem(storageKey, JSON.stringify(positions));
}
