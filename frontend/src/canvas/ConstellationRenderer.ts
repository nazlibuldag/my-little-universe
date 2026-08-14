import { CelestialObject } from '../types/galaxy';

export class ConstellationRenderer {
  renderLifeWeb(
    ctx: CanvasRenderingContext2D,
    celestials: CelestialObject[],
    positions: Record<string, { px: number; py: number }>,
    hoveredId: string | null
  ) {
    if (celestials.length < 2) return;

    ctx.save();
    
    // Render constellation lines between related objects
    for (let i = 0; i < celestials.length; i++) {
      for (let j = i + 1; j < celestials.length; j++) {
        const objA = celestials[i];
        const objB = celestials[j];

        // Connect if in same orbit, same constellation group, or same category
        const isRelated =
          objA.constellationGroup && objA.constellationGroup === objB.constellationGroup ||
          (objA.category === 'Hobby' && objB.category === 'Hobby') ||
          (objA.orbit === objB.orbit && Math.abs(objA.angle - objB.angle) < 1.2);

        if (!isRelated) continue;

        const posA = positions[objA.id];
        const posB = positions[objB.id];
        if (!posA || !posB) continue;

        const isHighlighted = hoveredId === objA.id || hoveredId === objB.id;

        ctx.strokeStyle = isHighlighted ? 'rgba(255, 133, 161, 0.85)' : 'rgba(216, 180, 254, 0.25)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1;
        ctx.setLineDash(isHighlighted ? [] : [4, 8]);

        ctx.beginPath();
        ctx.moveTo(posA.px, posA.py);
        ctx.lineTo(posB.px, posB.py);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
