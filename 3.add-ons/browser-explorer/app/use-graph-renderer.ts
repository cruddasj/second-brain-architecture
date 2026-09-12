"use client";

import cytoscape, { type Core, type NodeSingular } from "cytoscape";
import { useCallback, useEffect, useRef } from "react";
import { createDragPhysics } from "./drag-physics";
import type { GraphData, Point } from "./graph-types";
import { graphElements, graphStyles } from "./graph-presentation";
import { loadPositions, savePositions } from "./graph-positions";

const minZoom = 0.025;
const maxZoom = 1.6;
const fitPadding = 72;

type GraphRendererOptions = {
  graph: GraphData;
  themeColours: Map<string, string>;
  visibleIds: Set<string>;
  interactiveIds: Set<string>;
  selectedId: string | null;
  keyboardFocusId: string | null;
  selectNode: (id: string) => void;
};

// Own the Cytoscape instance, its effects, and saved layout for one graph mount.
export function useGraphRenderer({
  graph,
  themeColours,
  visibleIds,
  interactiveIds,
  selectedId,
  keyboardFocusId,
  selectNode,
}: GraphRendererOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const cyRef = useRef<Core | null>(null);
  const stopDragRef = useRef<() => void>(() => {});
  const hasInitialFitRef = useRef(false);

  const arrangeGraph = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    stopDragRef.current();
    const visibleNodes = cy.nodes(":visible");
    if (!visibleNodes.length) return;
    const visibleElements = visibleNodes.union(cy.edges(":visible"));
    const layout = visibleElements.layout({
      name: "cose",
      nodeDimensionsIncludeLabels: true,
      nodeRepulsion: 24000,
      idealEdgeLength: 240,
      nodeOverlap: 80,
      componentSpacing: 100,
      gravity: 0.08,
      padding: fitPadding,
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      animationDuration: 650,
      fit: true,
      randomize: true,
    });
    layout.one("layoutstop", () => {
      const saved = loadPositions();
      visibleNodes.forEach((node) => {
        saved[node.id()] = node.position();
      });
      savePositions(saved);
      cy.fit(visibleNodes, fitPadding);
    });
    layout.run();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      layout: { name: "preset" },
      minZoom,
      maxZoom,
      panningEnabled: true,
      userPanningEnabled: true,
      zoomingEnabled: true,
      userZoomingEnabled: true,
      boxSelectionEnabled: false,
      style: graphStyles(),
    });
    cy.on("tap", "node", (event) => selectNode(event.target.id()));
    cy.on("mouseover", "node", (event) => {
      hoveredIdRef.current = event.target.id();
      containerRef.current?.classList.add("node-hover");
    });
    cy.on("mouseout", "node", () => {
      hoveredIdRef.current = null;
      containerRef.current?.classList.remove("node-hover");
    });
    let simulation: ReturnType<typeof createDragPhysics> | null = null;
    let draggedId: string | null = null;
    let frame = 0,
      previousTime = 0,
      accumulator = 0,
      releasedSteps = 0;
    let released = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveSimulation = () => {
      if (!simulation) return;
      const positions = loadPositions();
      simulation.bodies.forEach((body) => {
        positions[body.id] = { x: body.x, y: body.y };
      });
      savePositions(positions);
    };
    const stopDrag = () => {
      cancelAnimationFrame(frame);
      saveSimulation();
      simulation = null;
      draggedId = null;
      frame = 0;
    };
    stopDragRef.current = stopDrag;
    const tick = (now: number) => {
      if (!simulation || !draggedId) return;
      const pinned = cy.getElementById(draggedId);
      if (!pinned.length) {
        stopDrag();
        return;
      }
      simulation.pin(pinned.position("x"), pinned.position("y"));
      accumulator += Math.min(50, now - previousTime);
      previousTime = now;
      let speed = Infinity;
      while (accumulator >= 1000 / 60) {
        speed = simulation.step();
        accumulator -= 1000 / 60;
        if (released) releasedSteps++;
      }
      cy.batch(() =>
        simulation?.bodies.forEach((body) => {
          if (body.id !== draggedId && !body.fixed)
            cy.getElementById(body.id).position({ x: body.x, y: body.y });
        }),
      );
      if (
        released &&
        ((releasedSteps >= 12 && speed < 0.08) || releasedSteps >= 90)
      ) {
        stopDrag();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    cy.on("grab", "node", (event) => {
      stopDrag();
      if (motion.matches) return;
      const nodes = cy
        .nodes(":visible")
        .filter((node) => !node.hasClass("focus-hidden"))
        .nodes();
      simulation = createDragPhysics(
        nodes.map((node) => ({
          id: node.id(),
          x: node.position("x"),
          y: node.position("y"),
          radius: Math.max(node.width(), node.height()) / 2,
          fixed: node.locked(),
        })),
        cy
          .edges(":visible")
          .map((edge) => ({
            source: edge.source().id(),
            target: edge.target().id(),
          })),
        event.target.id(),
      );
      draggedId = event.target.id();
      released = false;
      releasedSteps = 0;
      accumulator = 0;
    });
    cy.on("drag", "node", () => {
      if (!simulation || frame) return;
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    });
    cy.on("free", "node", (event) => {
      const positions = loadPositions();
      positions[event.target.id()] = event.target.position();
      savePositions(positions);
      if (simulation) {
        simulation.pin(event.target.position("x"), event.target.position("y"));
        released = true;
        saveSimulation();
        if (!frame) stopDrag();
      }
    });
    // Mobile browsers can discard canvas textures while backgrounded. Recreate
    // the renderer, rather than redrawing from potentially empty texture caches.
    const container = containerRef.current;
    let restoreFrame = 0;
    let needsRestore = document.hidden;
    const restoreRenderer = () => {
      if (document.hidden || !needsRestore || restoreFrame) return;
      restoreFrame = requestAnimationFrame(() => {
        restoreFrame = 0;
        if (document.hidden || cy.destroyed()) return;
        needsRestore = false;
        stopDrag();
        const zoom = cy.zoom(),
          pan = { ...cy.pan() };
        cy.mount(container);
        cy.viewport({ zoom, pan });
        cy.resize();
        cy.forceRender();
      });
    };
    const background = () => {
      needsRestore = true;
      cancelAnimationFrame(restoreFrame);
      restoreFrame = 0;
      stopDrag();
    };
    const visibilityChanged = () => {
      if (document.hidden) background();
      else restoreRenderer();
    };
    const pageShown = (event: PageTransitionEvent) => {
      if (event.persisted) needsRestore = true;
      restoreRenderer();
    };
    const contextRestored = () => {
      needsRestore = true;
      restoreRenderer();
    };
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("pagehide", background);
    window.addEventListener("pageshow", pageShown);
    container.addEventListener("contextrestored", contextRestored, true);
    const suspend = () => {
      if (document.hidden || motion.matches) stopDrag();
    };
    document.addEventListener("visibilitychange", suspend);
    motion.addEventListener("change", suspend);
    const resizeObserver = new ResizeObserver(() => cy.resize());
    resizeObserver.observe(containerRef.current);
    cyRef.current = cy;
    return () => {
      cancelAnimationFrame(restoreFrame);
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("pagehide", background);
      window.removeEventListener("pageshow", pageShown);
      container.removeEventListener("contextrestored", contextRestored, true);
      stopDrag();
      stopDragRef.current = () => {};
      document.removeEventListener("visibilitychange", suspend);
      motion.removeEventListener("change", suspend);
      resizeObserver.disconnect();
      cyRef.current = null;
      cy.destroy();
    };
  }, [selectNode]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    stopDragRef.current();
    const existing = Object.fromEntries(
      cy.nodes().map((node) => [node.id(), node.position()]),
    );
    const saved = loadPositions();
    const hasSavedPositions = Object.keys(saved).length > 0;
    const elements = graphElements(graph, themeColours, existing, saved);
    cy.resize();
    cy.elements().remove();
    cy.add(elements);
    cy.layout({ name: "preset", fit: false }).run();
    if (!hasInitialFitRef.current && cy.nodes().length) {
      hasInitialFitRef.current = true;
      if (hasSavedPositions) cy.fit(cy.nodes(":visible"), fitPadding);
      else arrangeGraph();
    }
  }, [arrangeGraph, graph.edges, graph.nodes, themeColours]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    stopDragRef.current();
    cy.batch(() => {
      if (!interactiveIds.has(hoveredIdRef.current ?? "")) {
        hoveredIdRef.current = null;
        containerRef.current?.classList.remove("node-hover");
      }
      cy.nodes().forEach((node) => {
        node.style("display", visibleIds.has(node.id()) ? "element" : "none");
        node.toggleClass("selected", node.id() === selectedId);
        node.toggleClass("keyboard-focus", node.id() === keyboardFocusId);
        node.toggleClass("focus-hidden", !interactiveIds.has(node.id()));
      });
      cy.edges().forEach((edge) => {
        const visible =
          visibleIds.has(edge.source().id()) &&
          visibleIds.has(edge.target().id());
        edge.style("display", visible ? "element" : "none");
        edge.toggleClass(
          "connected",
          edge.source().id() === selectedId ||
            edge.target().id() === selectedId ||
            edge.source().id() === keyboardFocusId ||
            edge.target().id() === keyboardFocusId,
        );
        edge.toggleClass(
          "focus-hidden",
          !interactiveIds.has(edge.source().id()) ||
            !interactiveIds.has(edge.target().id()),
        );
      });
    });
  }, [interactiveIds, keyboardFocusId, selectedId, visibleIds]);

  useEffect(() => {
    const cy = cyRef.current;
    if (
      !cy ||
      !selectedId ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let frame = 0;
    const startedAt = performance.now();
    const pulse = (now: number) => {
      const selectedNode = cy.getElementById(selectedId);
      if (selectedNode.length) {
        const progress = (Math.sin((now - startedAt) / 900) + 1) / 2;
        selectedNode.style({
          "underlay-opacity": 0.09 + progress * 0.05,
          "underlay-padding": 6 + progress * 2,
        });
      }
      frame = requestAnimationFrame(pulse);
    };
    frame = requestAnimationFrame(pulse);
    return () => {
      cancelAnimationFrame(frame);
      const selectedNode = cy.getElementById(selectedId);
      if (selectedNode.length)
        selectedNode.removeStyle("underlay-opacity underlay-padding");
    };
  }, [selectedId]);

  const persistPosition = useCallback((id: string, point: Point) => {
    stopDragRef.current();
    const node = cyRef.current?.getElementById(id);
    if (!node?.length) return;
    const bounded = {
      x: Math.max(35, Math.min(965, point.x)),
      y: Math.max(35, Math.min(685, point.y)),
    };
    node.position(bounded);
    const saved = loadPositions();
    saved[id] = bounded;
    savePositions(saved);
  }, []);

  function zoomBy(delta: number) {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: Math.max(minZoom, Math.min(maxZoom, cy.zoom() * Math.exp(delta))),
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  }
  function fitGraph() {
    const cy = cyRef.current;
    if (cy?.nodes(":visible").length) cy.fit(cy.nodes(":visible"), fitPadding);
  }
  function keyboardMove(node: NodeSingular, key: string, large: boolean) {
    const delta = large ? 20 : 5;
    const point = node.position();
    persistPosition(node.id(), {
      x:
        point.x +
        (key === "ArrowLeft" ? -delta : key === "ArrowRight" ? delta : 0),
      y:
        point.y +
        (key === "ArrowUp" ? -delta : key === "ArrowDown" ? delta : 0),
    });
  }

  return { containerRef, cyRef, arrangeGraph, zoomBy, fitGraph, keyboardMove };
}
