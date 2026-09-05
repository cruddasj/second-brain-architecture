import assert from "node:assert/strict";
import test from "node:test";
import { projectGlobe } from "../app/graph-depth.ts";

test("starting a globe drag preserves every screen coordinate", () => {
  for (const point of [{ x: 10, y: 20 }, { x: -180, y: 140 }, { x: 220, y: -50 }]) {
    const result = projectGlobe(point, { x: 10, y: 20 }, 300, { x: 0, y: 0 });
    assert.deepEqual(result.position, point);
    assert.equal(result.scale, 1);
  }
});

test("turning the globe moves opposite sides into different depths", () => {
  const centre = { x: 0, y: 0 };
  const drag = { x: 80, y: 0 };
  const left = projectGlobe({ x: -150, y: 0 }, centre, 300, drag);
  const right = projectGlobe({ x: 150, y: 0 }, centre, 300, drag);
  assert.ok(left.scale > 1);
  assert.ok(right.scale < 1);
  assert.ok(left.position.x > -150);
  assert.ok(right.position.x > 150);
});

test("long drags remain finite and do not invert or collapse nodes", () => {
  const result = projectGlobe({ x: 150, y: -100 }, { x: 0, y: 0 }, 300, { x: 1e6, y: -1e6 });
  assert.ok(Number.isFinite(result.position.x) && Number.isFinite(result.position.y));
  assert.ok(result.scale >= .6 && result.scale <= 1.25);
});
