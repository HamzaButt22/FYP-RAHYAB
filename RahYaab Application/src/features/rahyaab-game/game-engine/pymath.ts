/**
 * Python numeric semantics needed for bit-identical telemetry.
 *
 * * `round(x)` / `round(x, n)` in CPython round the *exact binary value* of the float, ties to even.
 *   JavaScript's Math.round (ties up) and toFixed (ties away, exact) differ on ties such as round(2.5) == 2.
 * * `//` and `%` floor toward -infinity in Python.
 * * `f"{x:g}"` and `f"{x:.Nf}"` are only used for on-screen text, but we keep them faithful too.
 */

const F64 = new Float64Array(1);
const U32 = new Uint32Array(F64.buffer);
// Detect endianness once (all React Native targets are little endian, but stay correct regardless).
const LITTLE = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

/** Decompose a finite, non-zero double into an exact (mantissa, exponent) pair: |x| = mant * 2^exp. */
function decompose(x: number): { mant: bigint; exp: number } {
  F64[0] = Math.abs(x);
  const hi = U32[LITTLE ? 1 : 0];
  const lo = U32[LITTLE ? 0 : 1];
  const biased = (hi >>> 20) & 0x7ff;
  const fracHi = hi & 0xfffff;
  let mant = (BigInt(fracHi) << 32n) | BigInt(lo);
  let exp: number;
  if (biased === 0) {
    exp = -1074; // subnormal
  } else {
    mant |= 1n << 52n;
    exp = biased - 1075;
  }
  return { mant, exp };
}

const POW10: bigint[] = [];
function pow10(n: number): bigint {
  if (POW10[n] === undefined) POW10[n] = 10n ** BigInt(n);
  return POW10[n];
}

/** Python `round(x, ndigits)` for ndigits >= 0, returning a float. */
export function pyRound(x: number, ndigits: number): number {
  if (!Number.isFinite(x) || x === 0) return x;
  if (!Number.isInteger(ndigits) || ndigits < 0) throw new RangeError('pyRound supports ndigits >= 0');
  const { mant, exp } = decompose(x);
  const neg = x < 0;
  const scale = pow10(ndigits);
  let q: bigint;
  if (exp >= 0) {
    return x; // already an integer, nothing to round
  } else {
    const num = mant * scale;
    const den = 1n << BigInt(-exp);
    q = num / den;
    const r = num - q * den;
    const twice = r * 2n;
    if (twice > den || (twice === den && (q & 1n) === 1n)) q += 1n;
  }
  // correctly rounded decimal -> double conversion (same as CPython's float(repr))
  const s = q.toString();
  let res = parseFloat(ndigits === 0 ? s : `${s}e-${ndigits}`);
  if (neg) res = -res;
  if (res === 0) res = neg ? -0 : 0;
  return res;
}

/** Python `round(x)` (no ndigits): returns an int, ties to even. Never returns -0. */
export function pyRoundInt(x: number): number {
  if (!Number.isFinite(x)) throw new RangeError('cannot round non-finite value to int');
  const f = Math.floor(x);
  const diff = x - f; // exact for |x| < 2^52
  let r: number;
  if (diff > 0.5) r = f + 1;
  else if (diff < 0.5) r = f;
  else r = f % 2 === 0 ? f : f + 1;
  return r === 0 ? 0 : r;
}

/** Python `int(x)` for floats: truncation toward zero. */
export function pyInt(x: number): number {
  const t = Math.trunc(x);
  return t === 0 ? 0 : t;
}

export function pyFloorDiv(a: number, b: number): number {
  if (b === 0) throw new RangeError('integer division by zero');
  return Math.floor(a / b);
}

export function pyMod(a: number, b: number): number {
  if (b === 0) throw new RangeError('integer modulo by zero');
  const m = a % b;
  return m !== 0 && (m < 0) !== (b < 0) ? m + b : m;
}

/** Python `f"{x:.Nf}"` (ties to even on the exact binary value). */
export function fmtFixed(x: number, digits: number): string {
  const r = digits === 0 ? pyRoundInt(x) : pyRound(x, digits);
  return r.toFixed(digits) === '-0' ? '0' : r.toFixed(digits);
}

/** Python `f"{x:g}"` (6 significant digits, no trailing zeros). Good for the magnitudes the game prints. */
export function fmtG(x: number): string {
  if (Number.isInteger(x) && Math.abs(x) < 1e6) return String(x);
  const exp = x === 0 ? 0 : Math.floor(Math.log10(Math.abs(x)));
  if (exp < -4 || exp >= 6) {
    const s = x.toExponential(5).replace(/\.?0+e/, 'e');
    return s.replace(/e([+-])(\d)$/, 'e$10$2');
  }
  const s = x.toPrecision(6);
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}

/**
 * CPython 3.13 `math.hypot(x, y)` (Modules/mathmodule.c: vector_norm with error-free squaring and a
 * differential correction). Ported operation by operation so the result is bit-identical on every JS engine
 * (V8 in tests, Hermes on devices), instead of relying on the engine's own Math.hypot.
 */
function frexpExponent(v: number): number {
  F64[0] = v;
  const hi = U32[LITTLE ? 1 : 0];
  const biased = (hi >>> 20) & 0x7ff;
  return biased - 1022; // v = m * 2^e with 0.5 <= m < 1 (normal numbers only)
}

function dlSplit(x: number): [number, number] {
  const t = x * 134217729.0;
  const hi = t - (t - x);
  return [hi, x - hi];
}

function dlMul(x: number, y: number): [number, number] {
  const [xh, xl] = dlSplit(x);
  const [yh, yl] = dlSplit(y);
  const p = xh * yh;
  const q = xh * yl + xl * yh;
  const z = p + q;
  const zz = p - z + q + xl * yl;
  return [z, zz];
}

function dlFastSum(a: number, b: number): [number, number] {
  const x = a + b;
  const z = x - a;
  return [x, b - z];
}

export function pyHypot(a: number, b: number): number {
  const ax = Math.abs(a);
  const bx = Math.abs(b);
  if (ax === Infinity || bx === Infinity) return Infinity;
  if (Number.isNaN(ax) || Number.isNaN(bx)) return NaN;
  const max = Math.max(ax, bx);
  if (max === 0) return 0;
  if (max < 2.2250738585072014e-308) {
    // subnormal: rescale like CPython (never happens for game coordinates)
    const DBL_MIN = 2.2250738585072014e-308;
    return DBL_MIN * pyHypot(a / DBL_MIN, b / DBL_MIN);
  }
  const maxE = frexpExponent(max);
  const scale = Math.pow(2, -maxE);
  let csum = 1.0;
  let frac1 = 0.0;
  let frac2 = 0.0;
  for (const v of [ax, bx]) {
    const x = v * scale;
    const [prHi, prLo] = dlMul(x, x);
    const [smHi, smLo] = dlFastSum(csum, prHi);
    csum = smHi;
    frac1 += prLo;
    frac2 += smLo;
  }
  let h = Math.sqrt(csum - 1.0 + (frac1 + frac2));
  const [prHi, prLo] = dlMul(-h, h);
  const [smHi, smLo] = dlFastSum(csum, prHi);
  csum = smHi;
  frac1 += prLo;
  frac2 += smLo;
  const x = csum - 1.0 + (frac1 + frac2);
  h += x / (2.0 * h);
  return h / scale;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Python's `str.capitalize()` */
export function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

/** CPython float floor division `vx // wx` (Objects/floatobject.c: _float_div_mod), e.g. map-cell indices. */
export function pyFloatFloorDiv(vx: number, wx: number): number {
  if (wx === 0) throw new RangeError('float floor division by zero');
  let mod = vx % wx; // JS % is C fmod
  let div = (vx - mod) / wx;
  if (mod) {
    if (wx < 0 !== mod < 0) {
      mod += wx;
      div -= 1.0;
    }
  }
  let floordiv: number;
  if (div) {
    floordiv = Math.floor(div);
    if (div - floordiv > 0.5) floordiv += 1.0;
  } else {
    floordiv = 0;
  }
  return floordiv === 0 ? 0 : floordiv;
}
