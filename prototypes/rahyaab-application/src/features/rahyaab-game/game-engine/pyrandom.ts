/**
 * CPython-compatible `random.Random`.
 *
 * The desktop game draws its in-game uncertainty (bridge collapse, mystery chest, gate scanner noise, lock outcomes)
 * from `random.Random(seed)`. To produce identical telemetry for an identical seed and identical player input, the
 * mobile engine re-implements the exact same generator: MT19937 seeded with `init_by_array` over the 32-bit words of
 * |seed|, `random()` built from two 32-bit outputs (53-bit precision), and CPython's rejection-sampling `_randbelow`.
 *
 * Only the methods the game uses are implemented. Verified against CPython 3.13 in __tests__/engine/pycompat.test.ts.
 */

const N = 624;
const M = 397;
const MATRIX_A = 0x9908b0df;
const UPPER_MASK = 0x80000000;
const LOWER_MASK = 0x7fffffff;

export interface PyRandomState {
  mt: number[];
  mti: number;
}

export class PyRandom {
  private mt = new Uint32Array(N);
  private mti = N + 1;

  constructor(seed: number) {
    this.seed(seed);
  }

  seed(seed: number): void {
    if (!Number.isSafeInteger(seed)) {
      throw new TypeError(`PyRandom seed must be a safe integer, got ${seed}`);
    }
    let n = Math.abs(seed);
    const key: number[] = [];
    if (n === 0) key.push(0);
    while (n > 0) {
      key.push(n % 0x100000000);
      n = Math.floor(n / 0x100000000);
    }
    this.initByArray(key);
  }

  private initGenrand(s: number): void {
    const mt = this.mt;
    mt[0] = s >>> 0;
    for (let i = 1; i < N; i++) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      // 1812433253 * prev + i, computed modulo 2^32 without losing precision
      mt[i] = (Math.imul(1812433253, prev) + i) >>> 0;
    }
    this.mti = N;
  }

  private initByArray(key: number[]): void {
    this.initGenrand(19650218);
    const mt = this.mt;
    let i = 1;
    let j = 0;
    const keyLength = key.length;
    let k = N > keyLength ? N : keyLength;
    for (; k; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1664525)) + key[j] + j) >>> 0;
      i++;
      j++;
      if (i >= N) {
        mt[0] = mt[N - 1];
        i = 1;
      }
      if (j >= keyLength) j = 0;
    }
    for (k = N - 1; k; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1566083941)) - i) >>> 0;
      i++;
      if (i >= N) {
        mt[0] = mt[N - 1];
        i = 1;
      }
    }
    mt[0] = 0x80000000;
  }

  /** genrand_uint32() */
  private next32(): number {
    const mt = this.mt;
    let y: number;
    if (this.mti >= N) {
      let kk = 0;
      for (; kk < N - M; kk++) {
        y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
        mt[kk] = mt[kk + M] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0);
      }
      for (; kk < N - 1; kk++) {
        y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
        mt[kk] = mt[kk + (M - N)] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0);
      }
      y = (mt[N - 1] & UPPER_MASK) | (mt[0] & LOWER_MASK);
      mt[N - 1] = mt[M - 1] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0);
      this.mti = 0;
    }
    y = mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  /** random(): float in [0, 1) with 53-bit resolution, exactly as CPython's random_random(). */
  random(): number {
    const a = this.next32() >>> 5;
    const b = this.next32() >>> 6;
    return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
  }

  /** getrandbits(k) for 1 <= k <= 32 (all the game ever needs). */
  getrandbits(k: number): number {
    if (k <= 0 || k > 32 || !Number.isInteger(k)) {
      throw new RangeError(`getrandbits supports 1..32 bits, got ${k}`);
    }
    return this.next32() >>> (32 - k);
  }

  private randbelow(n: number): number {
    if (!Number.isInteger(n) || n <= 0) throw new RangeError('empty range for randrange()');
    if (n > 0xffffffff) throw new RangeError('randbelow beyond 32 bits is not needed by the game');
    const k = 32 - Math.clz32(n); // n.bit_length()
    let r = this.getrandbits(k);
    while (r >= n) r = this.getrandbits(k);
    return r;
  }

  randrange(start: number, stop?: number): number {
    if (stop === undefined) return this.randbelow(start);
    const width = stop - start;
    if (width <= 0) throw new RangeError(`empty range for randrange(${start}, ${stop})`);
    return start + this.randbelow(width);
  }

  randint(a: number, b: number): number {
    return this.randrange(a, b + 1);
  }

  choice<T>(seq: readonly T[]): T {
    if (seq.length === 0) throw new RangeError('Cannot choose from an empty sequence');
    return seq[this.randbelow(seq.length)];
  }

  uniform(a: number, b: number): number {
    return a + (b - a) * this.random();
  }

  shuffle<T>(x: T[]): void {
    for (let i = x.length - 1; i > 0; i--) {
      const j = this.randbelow(i + 1);
      const t = x[i];
      x[i] = x[j];
      x[j] = t;
    }
  }

  getState(): PyRandomState {
    return { mt: Array.from(this.mt), mti: this.mti };
  }

  setState(state: PyRandomState): void {
    if (!state || !Array.isArray(state.mt) || state.mt.length !== N) throw new TypeError('invalid PyRandom state');
    this.mt = Uint32Array.from(state.mt);
    this.mti = state.mti;
  }
}
