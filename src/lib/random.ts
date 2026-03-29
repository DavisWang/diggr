export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;

  return () => {
    t += 0x6d2b79f5;
    let value = Math.imul(t ^ (t >>> 15), t | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(base: number, salt: number): number {
  let x = base ^ salt;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return x ^ (x >>> 16);
}

export function randomInt(random: () => number, minInclusive: number, maxInclusive: number): number {
  return Math.floor(random() * (maxInclusive - minInclusive + 1)) + minInclusive;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
