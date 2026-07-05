// Jagged polygon generator for the "torn paper" frame style.
// Pure module (no canvas) so the geometry is unit-testable.

/** Jitter amplitude as a fraction of the frame's shorter side. */
export const TORN_AMPLITUDE_RATIO = 0.025;

// Deterministic PRNG: the same frame must tear the same way on every render,
// otherwise the edge shimmers during interactive drags.
const mulberry32 = (seed: number) => {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

export interface TornPoint {
    x: number;
    y: number;
}

/**
 * Returns a clockwise jagged polygon around the rect (0,0)-(width,height),
 * in local coordinates. Points stay within TORN_AMPLITUDE_RATIO * min side
 * of the nominal edge.
 */
export const generateTornEdgePoints = (
    width: number,
    height: number,
    seed: number
): TornPoint[] => {
    const minSide = Math.min(width, height);
    const amp = minSide * TORN_AMPLITUDE_RATIO;
    const step = minSide / 8;
    const rand = mulberry32(Math.trunc(seed) + 1);
    const jitter = () => (rand() * 2 - 1) * amp;

    const points: TornPoint[] = [];
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

    const walkEdge = (
        fromX: number, fromY: number,
        toX: number, toY: number,
        horizontal: boolean
    ) => {
        const len = Math.abs(horizontal ? toX - fromX : toY - fromY);
        const segments = Math.max(4, Math.round(len / step));
        for (let i = 0; i < segments; i++) {
            const tRatio = i / segments;
            const bx = fromX + (toX - fromX) * tRatio;
            const by = fromY + (toY - fromY) * tRatio;
            // Jitter perpendicular to the edge; corners (i === 0) jitter too,
            // but along both axes stay inside the amplitude band.
            points.push({
                x: clamp(bx + (horizontal ? jitter() * 0.4 : jitter()), -amp, width + amp),
                y: clamp(by + (horizontal ? jitter() : jitter() * 0.4), -amp, height + amp),
            });
        }
    };

    walkEdge(0, 0, width, 0, true);        // top: left -> right
    walkEdge(width, 0, width, height, false); // right: top -> bottom
    walkEdge(width, height, 0, height, true); // bottom: right -> left
    walkEdge(0, height, 0, 0, false);       // left: bottom -> top

    return points;
};
