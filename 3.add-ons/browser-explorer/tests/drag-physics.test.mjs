import assert from "node:assert/strict";
import test from "node:test";
import { createDragPhysics } from "../app/drag-physics.ts";

const node = (id, x, y = 0) => ({ id, x, y, radius: 14 });
const settle = simulation => { for (let i = 0; i < 90; i++) simulation.step(); };

test("dragging gently pulls linked nodes but leaves distant unrelated nodes still", () => {
  const sim = createDragPhysics([node("a", 0), node("b", 200), node("c", 1000)], [{ source: "a", target: "b" }], "a");
  sim.pin(-100, 0);
  sim.step();
  assert.ok(sim.bodies[1].x < 200 && sim.bodies[1].x > 190);
  settle(sim);
  assert.equal(sim.bodies[0].x, -100);
  assert.ok(sim.bodies[1].x < 150 && sim.bodies[1].x > 80);
  assert.equal(sim.bodies[2].x, 1000);
});

test("a dragged node pushes unconnected neighbours apart", () => {
  const sim = createDragPhysics([node("a", 0, -200), node("b", -24), node("c", 24)], [], "a");
  sim.pin(0, 0);
  settle(sim);
  assert.ok(sim.bodies[1].x < -45);
  assert.ok(sim.bodies[2].x > 45);
  assert.equal(sim.bodies[0].x, 0);
});

test("idle spring rest lengths preserve the existing arrangement", () => {
  const sim = createDragPhysics([node("a", 0), node("b", 200)], [{ source: "a", target: "b" }], "a");
  settle(sim);
  assert.equal(sim.bodies[1].x, 200);
});

test("coincident nodes separate without non-finite positions or moving a fixed node", () => {
  const sim = createDragPhysics([node("a", 0), node("b", 0), { ...node("locked", 100), fixed: true }], [], "a");
  settle(sim);
  assert.ok(Math.hypot(sim.bodies[1].x, sim.bodies[1].y) > 40);
  assert.equal(sim.bodies[2].x, 100);
  assert.ok(sim.bodies.every(body => Number.isFinite(body.x) && Number.isFinite(body.y)));
});

test("filtered endpoints and duplicate links do not add spurious forces", () => {
  const links = [{ source: "a", target: "b" }];
  const first = createDragPhysics([node("a", 0), node("b", 200)], links, "a");
  const second = createDragPhysics([node("a", 0), node("b", 200)], [...links, ...links, { source: "b", target: "a" }, { source: "a", target: "hidden" }], "a");
  first.pin(-100, 0); second.pin(-100, 0);
  settle(first); settle(second);
  assert.deepEqual(first.bodies, second.bodies);
});
