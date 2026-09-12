import type { ElementDefinition, StylesheetJson } from "cytoscape";
import type { GraphData, Point } from "./graph-types";

export const themePalette = [
  "#2f7fc1",
  "#20a7c9",
  "#35b8b4",
  "#66b99a",
  "#91bd78",
  "#c4c966",
  "#e1c84f",
];
const unthemedColour = "#f4f1ef";

// Return fresh styles for each renderer, preserving the selector cascade.
export function graphStyles(): StylesheetJson {
  return [
    {
      selector: "node",
      style: {
        width: 28,
        height: 28,
        shape: "ellipse",
        "background-color": unthemedColour,
        "background-opacity": 0.76,
        "border-color": "rgba(255,255,255,.7)",
        "border-width": 1.25,
        label: "data(shortLabel)",
        color: "rgba(255,255,255,.82)",
        "font-family": 'Roboto, "Segoe UI", Arial, sans-serif',
        "font-size": 11,
        "font-weight": 600,
        "text-valign": "bottom",
        "text-margin-y": 10,
        "text-outline-color": "#111416",
        "text-outline-width": 3,
        "text-wrap": "none",
        "overlay-opacity": 0,
        "transition-property":
          "opacity, border-color, border-width, underlay-opacity",
        "transition-duration": 450,
      },
    },
    {
      selector: "node.collection",
      style: {
        width: 58,
        height: 58,
        "background-color": unthemedColour,
        "border-color": "rgba(255,255,255,.72)",
        "border-width": 2,
        "font-size": 12,
      },
    },
    {
      selector: "node.theme",
      style: {
        width: 36,
        height: 36,
        shape: "diamond",
        "background-color": "#35b8b4",
        "border-color": "rgba(255,255,255,.8)",
        "border-width": 2,
      },
    },
    {
      selector: "node.themed",
      style: { "background-color": "data(themeColour)" },
    },
    {
      selector: "node",
      style: {
        "background-opacity": 1,
        "border-width": 0.75,
        "border-color": "#ffffff",
        "border-opacity": 0.24,
        "text-outline-width": 2,
        "font-weight": 400,
      },
    },
    {
      selector: "node.multi-theme",
      style: {
        "pie-size": "100%",
        "pie-1-background-color": "data(pie1)",
        "pie-1-background-size": "data(pieSize1)",
        "pie-2-background-color": "data(pie2)",
        "pie-2-background-size": "data(pieSize2)",
        "pie-3-background-color": "data(pie3)",
        "pie-3-background-size": "data(pieSize3)",
        "pie-4-background-color": "data(pie4)",
        "pie-4-background-size": "data(pieSize4)",
        "pie-5-background-color": "data(pie5)",
        "pie-5-background-size": "data(pieSize5)",
        "pie-6-background-color": "data(pie6)",
        "pie-6-background-size": "data(pieSize6)",
        "pie-7-background-color": "data(pie7)",
        "pie-7-background-size": "data(pieSize7)",
      },
    },
    {
      selector: "edge",
      style: {
        width: 1,
        "curve-style": "straight",
        "line-color": "data(edgeColour)",
        opacity: 0.32,
        "transition-property": "opacity",
        "transition-duration": 250,
      },
    },
    {
      selector: "edge.reference",
      style: { width: 1.1, opacity: 0.5, "line-style": "dashed" },
    },
    { selector: "edge.connected", style: { opacity: 0.8, width: 1.5 } },
    {
      selector: ".selected, .keyboard-focus",
      style: {
        "border-color": "#d9dde0",
        "border-opacity": 0.9,
        "border-width": 2,
        "underlay-color": "#d9dde0",
        "underlay-opacity": 0.12,
        "underlay-padding": 7,
        "underlay-shape": "ellipse",
      },
    },
    { selector: ".focus-hidden", style: { opacity: 0, events: "no" } },
  ] as unknown as StylesheetJson;
}

export function graphElements(
  graph: GraphData,
  themeColours: Map<string, string>,
  existing: Record<string, Point>,
  saved: Record<string, Point>,
): ElementDefinition[] {
  const elements: ElementDefinition[] = graph.nodes.map((node) => {
    const colours = node.themeIds.map(
      (id) => themeColours.get(id) || themePalette[0],
    );
    const pieSize = colours.length ? 100 / colours.length : 0;
    return {
      group: "nodes",
      data: {
        ...node,
        shortLabel:
          node.title.length > 24 ? `${node.title.slice(0, 22)}…` : node.title,
        themeColour: colours[0] || unthemedColour,
        ...Object.fromEntries(
          themePalette.map((_, index) => [
            `pie${index + 1}`,
            colours[index] || "transparent",
          ]),
        ),
        ...Object.fromEntries(
          themePalette.map((_, index) => [
            `pieSize${index + 1}`,
            colours[index] ? pieSize : 0,
          ]),
        ),
      },
      classes: `${node.kind} ${colours.length ? "themed" : ""} ${colours.length > 1 ? "multi-theme" : ""}`,
      position: existing[node.id] || saved[node.id] || { x: 500, y: 360 },
    };
  });
  elements.push(
    ...graph.edges.map((edge, index) => ({
      group: "edges" as const,
      data: {
        id: `${edge.kind}:${edge.source}:${edge.target}:${index}`,
        ...edge,
        edgeColour:
          themeColours.get(
            graph.nodes.find(
              (node) =>
                node.id ===
                (edge.kind === "reference" ? edge.target : edge.source),
            )?.themeIds[0] || "",
          ) || "#9da4a7",
      },
      classes: edge.kind,
    })),
  );

  return elements;
}
