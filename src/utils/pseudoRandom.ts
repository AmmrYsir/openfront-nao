import seedrandom from "seedrandom";

export class PseudoRandom {
  private static readonly POW36_8 = Math.pow(36, 8);
  private readonly rng: seedrandom.PRNG;

  constructor(seed: number) {
    this.rng = seedrandom(String(seed));
  }

  next(): number {
    return this.rng();
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.rng() * (max - min)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.rng() * (max - min) + min;
  }

  nextID(): string {
    return Math.floor(this.rng() * PseudoRandom.POW36_8)
      .toString(36)
      .padStart(8, "0");
  }

  randElement<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("items must not be empty");
    }
    return items[this.nextInt(0, items.length)];
  }

  randFromSet<T>(set: ReadonlySet<T>): T {
    if (set.size === 0) {
      throw new Error("set must not be empty");
    }

    const index = this.nextInt(0, set.size);
    let currentIndex = 0;
    for (const item of set) {
      if (currentIndex === index) {
        return item;
      }
      currentIndex += 1;
    }

    throw new Error("Unexpected set iteration state");
  }

  chance(odds: number): boolean {
    return this.nextInt(0, odds) === 0;
  }

  shuffleArray<T>(items: readonly T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
