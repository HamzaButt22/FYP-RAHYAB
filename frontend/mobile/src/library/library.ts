// The stream library (S-12, S-13; FR-60, FR-65): every path in design/game/frameworks/streams.json, readable
// offline. The app bundles a copy of that file (streams.json here; `pnpm streams` refreshes it, and
// library.test.ts fails when it is out of date). Pure functions, tested with `pnpm test`.
//
// Only facts that are in streams.json are shown. Subjects per board, cost and most durations are not in the
// data yet, so the page says they are being checked instead of guessing (FR-60's "each fact has a source").

export type InterestType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
export type Level = '8' | '9-10' | '11-12';
export type DoorState = 'open' | 'extra_step' | 'closed';

export interface LibraryPath {
  id: string;
  name: string;
  riasec: Record<InterestType, number>;
  tests?: string[];
  requires?: string[];
  opens?: string[];
  routes_from?: string[];
  examples?: string[];
  duration?: string;
  availability?: string;
  notes?: string;
  gate_note?: string;
  /** Some facts still need checking per board. */
  verify?: boolean;
  /** Subjects studied, per board code (FBISE, PUNJAB, ...), each list with its source (FR-60). */
  subjects_by_board?: Record<string, { subjects: string[]; source_url: string; last_verified: string }>;
  /** A typical yearly cost range in PKR, always shown as an estimate, with its source (FR-60). */
  cost_estimate?: { min_pkr: number; max_pkr: number; per: 'year' | 'programme'; source_url: string; last_verified: string };
}

export type Fact = 'subjects' | 'duration' | 'cost';

/** The FR-60 facts this path does not have in the data yet (the page says they are being checked). */
export function missingFacts(path: LibraryPath): Fact[] {
  const out: Fact[] = [];
  if (!path.subjects_by_board || Object.keys(path.subjects_by_board).length === 0) out.push('subjects');
  if (!path.duration) out.push('duration');
  if (!path.cost_estimate) out.push('cost');
  return out;
}

export interface StreamsData {
  version: string;
  by_class: Record<Level, { decision: string; paths: LibraryPath[] }>;
  gates: { id: string; verification: 'primary' | 'reported' | 'unverified' }[];
  doors: {
    destinations: Record<string, { label_key: string }>;
    by_path: Record<string, { to: string; state: DoorState; gates: string[]; route?: string }[]>;
  };
}

export const LEVELS: readonly Level[] = ['8', '9-10', '11-12'];
const TYPES: readonly InterestType[] = ['R', 'I', 'A', 'S', 'E', 'C'];

/** The level whose choices a student in this class is making next (class 8 chooses a Matric group). */
export function levelForGrade(grade: number | null | undefined): Level {
  if (grade !== null && grade !== undefined && grade >= 11) return '11-12';
  if (grade === 8) return '8';
  return '9-10';
}

export function pathsAt(data: StreamsData, level: Level): LibraryPath[] {
  return data.by_class[level].paths;
}

export function findPath(data: StreamsData, id: string): { path: LibraryPath; level: Level } | null {
  for (const level of LEVELS) {
    const path = data.by_class[level].paths.find((p) => p.id === id);
    if (path) return { path, level };
  }
  return null;
}

/** A path's one name, from streams.json, as the parent page shows it (TC-SHARE-13); null for an id this
 * copy does not know (a newer server), so the caller can fall back. */
export function pathName(data: StreamsData, id: string): string | null {
  return findPath(data, id)?.path.name ?? null;
}

/** The interest types a path suits most, strongest first. */
export function topTypes(path: LibraryPath, n = 3): InterestType[] {
  return [...TYPES].sort((a, b) => path.riasec[b] - path.riasec[a]).slice(0, n);
}

function pearson(a: Record<InterestType, number>, b: Record<InterestType, number>): number {
  const xs = TYPES.map((t) => a[t]);
  const ys = TYPES.map((t) => b[t]);
  const mx = xs.reduce((s, x) => s + x, 0) / xs.length;
  const my = ys.reduce((s, y) => s + y, 0) / ys.length;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

/** Other paths at the same level with the most similar interest profile: worth comparing. */
export function similarPaths(data: StreamsData, id: string, n = 2): LibraryPath[] {
  const found = findPath(data, id);
  if (!found) return [];
  return pathsAt(data, found.level)
    .filter((p) => p.id !== id)
    .map((p) => ({ p, r: pearson(found.path.riasec, p.riasec) }))
    .sort((a, b) => b.r - a.r)
    .slice(0, n)
    .map((x) => x.p);
}

/** A next step the path leads to: another path (with its name) or a fixed step such as work. */
export type NextStep = { kind: 'path'; id: string; name: string } | { kind: 'step'; key: string };

export function nextSteps(data: StreamsData, path: LibraryPath): NextStep[] {
  return (path.opens ?? []).map((id) => {
    const target = findPath(data, id);
    return target ? { kind: 'path', id, name: target.path.name } : { kind: 'step', key: `library.next.${id}` };
  });
}

/** The doors a class 9-10 path keeps open or closes, with whether the rule still needs checking. A door's
 * destination is a class 11-12 path, so it carries that path's name, as the parent page shows it. */
export function doorsFor(
  data: StreamsData,
  id: string,
): { to: string; name: string; state: DoorState; checkWithSchool: boolean }[] {
  const verification = new Map(data.gates.map((g) => [g.id, g.verification]));
  return (data.doors.by_path[id] ?? []).map((d) => ({
    to: d.to,
    name: pathName(data, d.to) ?? d.to,
    state: d.state,
    // A door resting only on unverified rules is never stated as a rule (streams.json doors description).
    checkWithSchool: d.gates.length > 0 && d.gates.every((g) => verification.get(g) === 'unverified'),
  }));
}
