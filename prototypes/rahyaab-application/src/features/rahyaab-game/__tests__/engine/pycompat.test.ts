/**
 * The mobile engine must make *exactly* the same random draws and roundings as CPython, otherwise telemetry
 * (gate outcomes, mystery rewards, rounded metadata) would drift from the desktop game. Reference values were
 * produced by CPython 3.13 (see tools/record_parity_traces.py / fixtures/python_reference.json).
 */
import ref from '../fixtures/python_reference.json';
import { PyRandom } from '../../game-engine/pyrandom';
import { pyRound, pyRoundInt, pyFloorDiv, pyMod, fmtG, fmtFixed, pad2, pyHypot, pyFloatFloorDiv } from '../../game-engine/pymath';

type RngRef = (typeof ref.rng)[number];

describe('PyRandom (MT19937, CPython-compatible)', () => {
  it.each(ref.rng.map((r: RngRef) => [r.seed, r]))('seed %s reproduces CPython draws', (_seed, r) => {
    const rec = r as RngRef;
    const rng = new PyRandom(rec.seed);
    expect(Array.from({ length: 5 }, () => rng.random())).toEqual(rec.random);
    expect(Array.from({ length: 5 }, () => rng.randint(10, 1090))).toEqual(rec.randint);
    expect(Array.from({ length: 6 }, () => rng.choice([0, 5, 15, 30]))).toEqual(rec.choice4);
    expect(Array.from({ length: 4 }, () => rng.uniform(-0.15, 0.15))).toEqual(rec.uniform);
    const l = Array.from({ length: 10 }, (_, i) => i);
    rng.shuffle(l);
    expect(l).toEqual(rec.shuffle10);
    expect(Array.from({ length: 3 }, () => rng.getrandbits(32))).toEqual(rec.getrandbits32);
    expect(Array.from({ length: 2 }, () => rng.randrange(1))).toEqual(rec.randrange1);
    expect(Array.from({ length: 5 }, () => rng.randint(14, 24))).toEqual(rec.randint14_24);
    expect(rng.random()).toEqual(rec.after);
  });

  it('state can be saved and restored mid-stream', () => {
    const a = new PyRandom(42);
    a.random();
    a.randint(1, 6);
    const snap = a.getState();
    const expected = [a.random(), a.randint(0, 99), a.uniform(-1, 1)];
    const b = new PyRandom(0);
    b.setState(snap);
    expect([b.random(), b.randint(0, 99), b.uniform(-1, 1)]).toEqual(expected);
  });

  it('rejects invalid arguments the way CPython does', () => {
    const r = new PyRandom(1);
    expect(() => r.choice([])).toThrow();
    expect(() => r.randrange(0)).toThrow();
  });
});

describe('pyRound (CPython round semantics: exact binary value, ties to even)', () => {
  it.each(ref.rounds.map((r) => [r.v, r]))('round(%s)', (_v, r) => {
    const rec = r as (typeof ref.rounds)[number];
    if (rec.r0 !== null) expect(pyRoundInt(rec.v)).toBe(rec.r0);
    expect(pyRound(rec.v, 1)).toBe(rec.r1);
    expect(pyRound(rec.v, 2)).toBe(rec.r2);
    expect(pyRound(rec.v, 3)).toBe(rec.r3);
  });

  it('never returns -0 where CPython prints 0', () => {
    expect(Object.is(pyRoundInt(-0.4), 0)).toBe(true);
  });
});

describe('integer helpers and string formatting', () => {
  it('floor division and modulo follow Python signs', () => {
    expect(pyFloorDiv(7, 2)).toBe(3);
    expect(pyFloorDiv(-7, 2)).toBe(-4);
    expect(pyMod(-1, 5)).toBe(4);
    expect(pyMod(7, 3)).toBe(1);
  });

  it('formats like Python :g and :.Nf', () => {
    expect(fmtG(1.5)).toBe('1.5');
    expect(fmtG(2.0)).toBe('2');
    expect(fmtG(0.5)).toBe('0.5');
    expect(fmtG(36)).toBe('36');
    expect(fmtG(15)).toBe('15');
    expect(fmtFixed(2.5, 0)).toBe('2');
    expect(fmtFixed(3.5, 0)).toBe('4');
    expect(fmtFixed(1.25, 1)).toBe('1.2');
    expect(pad2(7)).toBe('07');
  });
});

describe('pyHypot (CPython vector_norm port)', () => {
  it('is bit-identical to CPython math.hypot on 2005 reference pairs', () => {
    const bad = (ref as unknown as { hypot: [number, number, number][] }).hypot.filter(
      ([a, b, h]) => pyHypot(a, b) !== h,
    );
    expect(bad).toEqual([]);
  });
});

describe('pyFloatFloorDiv', () => {
  it('matches CPython int(x // 100) on 3000 values incl. near-integer quotients', () => {
    const bad = (ref as unknown as { floordiv100: [number, number][] }).floordiv100.filter(
      ([x, q]) => Math.trunc(pyFloatFloorDiv(x, 100)) !== q,
    );
    expect(bad).toEqual([]);
  });
});
