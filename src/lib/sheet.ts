// The Filters sheet's drag (step 15.5, the apple-motion skill: "Designing Fluid Interfaces",
// WWDC 2018). Pure, so the release rule is unit-tested; BottomSheet (src/ui/controls.tsx) owns
// the touches and the element.

/** A finger's position on the sheet's axis, with its event's timeStamp (ms). */
export interface Sample {
  y: number;
  t: number;
}

/** How far back the release velocity looks: the last moves, not the whole drag. */
export const VELOCITY_WINDOW_MS = 100;

/**
 * The finger's speed at release, in px/s (positive: down), from the samples in the last
 * VELOCITY_WINDOW_MS before `now`. A finger that stopped before lifting has none: 0.
 */
export function releaseVelocity(samples: readonly Sample[], now: number): number {
  const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const dt = last.t - first.t;
  return dt > 0 ? ((last.y - first.y) / dt) * 1000 : 0;
}

/**
 * How much further a release at `velocity` (px/s) carries: Apple's projection, with the
 * skill's "snappier" deceleration rate (0.99) rather than a scroll's 0.998.
 */
export function project(velocity: number, rate = 0.99): number {
  return ((velocity / 1000) * rate) / (1 - rate);
}

/**
 * Whether a release closes the sheet: where the drag would come to rest is past the 90px
 * of README:211's swipe. A flick closes from a short drag; a pull that turns back up doesn't,
 * however far it went.
 */
export function closesOnRelease(drag: number, velocity: number, threshold = 90): boolean {
  return drag + project(velocity) > threshold;
}
