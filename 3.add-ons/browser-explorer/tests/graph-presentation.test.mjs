import assert from "node:assert/strict";
import test from "node:test";
import {
  graphElements,
  graphStyles,
  themePalette,
} from "../app/graph-presentation.ts";
import { loadPositions, savePositions } from "../app/graph-positions.ts";
import { storageScope } from "../offline/paths.mjs";

function node(id, overrides = {}) {
  return {
    id,
    title: id,
    kind: "record",
    collection: "knowledge",
    path: `${id}.md`,
    excerpt: "",
    details: {},
    headings: [],
    stateCount: 0,
    eventCount: 0,
    themeIds: [],
    ...overrides,
  };
}

test("graph elements retain labels, theme pies, edge identity and directional colours", () => {
  const graph = {
    nodes: [
      node("collection", { kind: "collection", themeIds: ["first"] }),
      node("record", {
        title: "A title longer than twenty-four characters",
        themeIds: ["first", "second"],
      }),
      node("unthemed"),
      node("unknown-theme", { themeIds: ["missing"] }),
    ],
    edges: [
      { source: "collection", target: "record", kind: "collection" },
      { source: "unthemed", target: "record", kind: "reference" },
      { source: "unthemed", target: "record", kind: "reference" },
      { source: "record", target: "unthemed", kind: "reference" },
    ],
    themes: [
      { id: "first", title: "First" },
      { id: "second", title: "Second" },
    ],
  };
  const before = structuredClone(graph);
  const elements = graphElements(
    graph,
    new Map([
      ["first", "red"],
      ["second", "blue"],
    ]),
    {},
    {},
  );
  const record = elements[1];
  assert.equal(record.data.shortLabel, "A title longer than tw…");
  assert.equal(record.classes, "record themed multi-theme");
  assert.equal(record.data.themeColour, "red");
  assert.deepEqual(
    [
      record.data.pie1,
      record.data.pieSize1,
      record.data.pie2,
      record.data.pieSize2,
    ],
    ["red", 50, "blue", 50],
  );
  assert.deepEqual(
    [record.data.pie7, record.data.pieSize7],
    ["transparent", 0],
  );
  assert.equal(elements[2].data.themeColour, "#f4f1ef");
  assert.equal(elements[3].data.themeColour, themePalette[0]);
  assert.deepEqual(
    elements.slice(4).map((edge) => [edge.data.id, edge.data.edgeColour]),
    [
      ["collection:collection:record:0", "red"],
      ["reference:unthemed:record:1", "red"],
      ["reference:unthemed:record:2", "red"],
      ["reference:record:unthemed:3", "#9da4a7"],
    ],
  );
  assert.deepEqual(graph, before);
});

test("current graph positions take precedence over saved positions and new-node defaults", () => {
  const graph = {
    nodes: [node("current"), node("saved"), node("new")],
    edges: [],
    themes: [],
  };
  const existing = { current: { x: 0, y: 0 } };
  const saved = { current: { x: 10, y: 20 }, saved: { x: 30, y: 40 } };
  assert.deepEqual(
    graphElements(graph, new Map(), existing, saved).map(
      (item) => item.position,
    ),
    [
      { x: 0, y: 0 },
      { x: 30, y: 40 },
      { x: 500, y: 360 },
    ],
  );
  assert.deepEqual(saved, {
    current: { x: 10, y: 20 },
    saved: { x: 30, y: 40 },
  });
});

test("graph styles preserve the cascade and provide independent renderer configuration", () => {
  const styles = graphStyles();
  assert.deepEqual(
    styles.map((rule) => rule.selector),
    [
      "node",
      "node.collection",
      "node.theme",
      "node.themed",
      "node",
      "node.multi-theme",
      "edge",
      "edge.reference",
      "edge.connected",
      ".selected, .keyboard-focus",
      ".focus-hidden",
    ],
  );
  assert.equal(styles[0].style["background-opacity"], 0.76);
  assert.equal(styles[4].style["background-opacity"], 1);
  assert.equal(styles[5].style["pie-7-background-size"], "data(pieSize7)");
  assert.deepEqual(styles[10].style, { opacity: 0, events: "no" });
  styles[0].style.width = 999;
  assert.equal(graphStyles()[0].style.width, 28);
});

test("graph position storage keeps the existing scope, fallback and round-trip format", (t) => {
  const entries = new Map();
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
    },
  });
  const key = `second-brain-graph-positions-v1:${storageScope}`;
  assert.deepEqual(loadPositions(), {});
  entries.set(key, "invalid JSON");
  assert.deepEqual(loadPositions(), {});
  const positions = { record: { x: 12.5, y: -20 } };
  savePositions(positions);
  assert.equal(entries.get(key), JSON.stringify(positions));
  assert.deepEqual(loadPositions(), positions);
});
