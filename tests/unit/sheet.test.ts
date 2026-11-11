import { describe, expect, it } from 'vitest';
import { closesOnRelease, project, releaseVelocity, VELOCITY_WINDOW_MS } from '../../src/lib/sheet.ts';

describe('the Filters sheet drag (step 15.5)', () => {
  it('reads the release velocity from the last moves only, in px/s', () => {
    // 40px in the last 40ms: 1,000 px/s, whatever came before.
    expect(releaseVelocity([{ y: 0, t: 0 }, { y: 100, t: 400 }, { y: 120, t: 420 }, { y: 140, t: 440 }], 450)).toBeCloseTo(((140 - 100) / 40) * 1000);
    // Downward is positive, upward negative.
    expect(releaseVelocity([{ y: 120, t: 0 }, { y: 100, t: 20 }], 25)).toBeCloseTo(-1000);
  });

  it('gives 0 when the finger stopped before it lifted, or never moved', () => {
    expect(releaseVelocity([{ y: 0, t: 0 }, { y: 60, t: 50 }], 50 + VELOCITY_WINDOW_MS + 100)).toBe(0);
    expect(releaseVelocity([{ y: 10, t: 0 }], 5)).toBe(0);
    expect(releaseVelocity([], 0)).toBe(0);
    expect(releaseVelocity([{ y: 10, t: 5 }, { y: 30, t: 5 }], 5)).toBe(0);
  });

  it("projects a flick with Apple's deceleration (0.99): 1,000 px/s carries about 99px", () => {
    expect(project(1000)).toBeCloseTo(99);
    expect(project(0)).toBe(0);
    expect(project(-500)).toBeCloseTo(-49.5);
  });

  it('closes on a flick or a pull past 90px, never on a pull that turns back up', () => {
    expect(closesOnRelease(120, 0)).toBe(true); // README:211: a swipe over 90px
    expect(closesOnRelease(20, 1200)).toBe(true); // a short flick
    expect(closesOnRelease(60, 0)).toBe(false); // a pull that stopped short
    expect(closesOnRelease(60, 200)).toBe(false); // a slow pull, released
    expect(closesOnRelease(140, -1500)).toBe(false); // pulled far, then thrown back up
    expect(closesOnRelease(0, 0)).toBe(false); // a tap
  });
});
