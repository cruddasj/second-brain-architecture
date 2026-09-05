export type Point = { x: number; y: number };

/** Lift the flat layout onto a shallow globe, then rotate it around its centre. */
export function projectGlobe(point: Point, centre: Point, radius: number, drag: Point) {
  const x = point.x - centre.x;
  const y = point.y - centre.y;
  const z = Math.sqrt(Math.max(radius * radius * .12, radius * radius - x * x - y * y));
  const yaw = Math.max(-.65, Math.min(.65, drag.x / radius));
  const pitch = Math.max(-.65, Math.min(.65, -drag.y / radius));
  const rx = x * Math.cos(yaw) + z * Math.sin(yaw);
  const rz = z * Math.cos(yaw) - x * Math.sin(yaw);
  const ry = y * Math.cos(pitch) - rz * Math.sin(pitch);
  const depth = y * Math.sin(pitch) + rz * Math.cos(pitch);
  // Normalise perspective so beginning a drag never makes the layout jump.
  const perspective = (3 * radius - z) / (3 * radius - depth);
  return {
    position: { x: centre.x + rx * perspective, y: centre.y + ry * perspective },
    scale: Math.max(.6, Math.min(1.25, perspective)),
  };
}
