/*
 * Seeded pseudo-random numbers for property-style tests: many generated
 * cases, the same ones on every run, so a failure can always be replayed.
 */

export function createRandom(seed: number) {
  // mulberry32
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /** Integer in [min, max]. */
  const int = (min: number, max: number) =>
    min + Math.floor(next() * (max - min + 1));

  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      return items[int(0, items.length - 1)];
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    /** A price modifier like the admin form saves: whole percent, -99%..+300%. */
    modifier() {
      return int(-99, 300) / 100;
    },
  };
}
