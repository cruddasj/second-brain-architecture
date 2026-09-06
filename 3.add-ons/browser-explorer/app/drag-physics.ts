export type Body = { id: string; x: number; y: number; radius: number; fixed?: boolean };
export type Link = { source: string; target: string };

export function createDragPhysics(nodes: Body[], links: Link[], pinnedId: string) {
  const bodies = nodes.map(node => ({ ...node, anchorX: node.x, anchorY: node.y, vx: 0, vy: 0 }));
  const byId = new Map(bodies.map(node => [node.id, node]));
  const seen = new Set<string>();
  const springs = links.flatMap(link => {
    const a = byId.get(link.source), b = byId.get(link.target);
    const key = JSON.stringify([link.source, link.target].sort());
    if (!a || !b || a === b || seen.has(key)) return [];
    seen.add(key);
    return [{ a, b, rest: Math.hypot(b.x - a.x, b.y - a.y) }];
  });
  const pinned = byId.get(pinnedId);
  return {
    bodies,
    pin(x: number, y: number) { if (pinned) { pinned.x = x; pinned.y = y; } },
    // One fixed 60 Hz step. Rest lengths preserve the user's existing arrangement.
    step() {
      const forces = new Map(bodies.map(body => [body, { x: (body.anchorX - body.x) * .002, y: (body.anchorY - body.y) * .002 }]));
      for (const { a, b, rest } of springs) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (distance < .001) continue;
        const strength = Math.max(-8, Math.min(8, (distance - rest) * .018));
        const fx = dx / distance * strength, fy = dy / distance * strength;
        forces.get(a)!.x += fx; forces.get(a)!.y += fy;
        forces.get(b)!.x -= fx; forces.get(b)!.y -= fy;
      }
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let distance = Math.hypot(dx, dy);
          const clearance = a.radius + b.radius + 34;
          if (distance >= clearance) continue;
          // Deterministic separation also handles exactly overlapping nodes.
          if (distance < .001) { dx = (i + j) % 2 ? 1 : -1; dy = 1; distance = Math.SQRT2; }
          const force = Math.min(8, (clearance - distance) * .1);
          const fx = dx / distance * force, fy = dy / distance * force;
          forces.get(a)!.x -= fx; forces.get(a)!.y -= fy;
          forces.get(b)!.x += fx; forces.get(b)!.y += fy;
        }
      }
      let speed = 0;
      for (const body of bodies) {
        if (body.id === pinnedId || body.fixed) continue;
        const force = forces.get(body)!;
        body.vx = (body.vx + force.x) * .78;
        body.vy = (body.vy + force.y) * .78;
        const magnitude = Math.hypot(body.vx, body.vy);
        if (magnitude > 10) { body.vx *= 10 / magnitude; body.vy *= 10 / magnitude; }
        body.x += body.vx; body.y += body.vy;
        speed = Math.max(speed, Math.hypot(body.vx, body.vy));
      }
      return speed;
    },
  };
}
