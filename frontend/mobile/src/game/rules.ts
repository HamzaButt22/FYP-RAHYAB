// Checks for the game–app contract (contract.ts). Each returns a list of problems in plain English, empty
// when all is well, so a module author sees every mistake at once. Pure functions: tested with `pnpm test`.

import {
  CONSTRUCTS,
  CONTRACT_VERSION,
  EVENT_TYPES,
  HOST_ONLY_EVENTS,
  MAX_DATA_BYTES,
  MAX_DATA_STRING,
  MAX_ITEM_ID,
  MAX_SAVED_BYTES,
  type ExperimentalEvent,
  type GameEvent,
  type GameModule,
  type JsonValue,
} from './contract.ts';

const MODULE_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const ITEM_ID = /^[A-Za-z0-9_.:-]+$/;
const NAME = /^[a-z][a-z0-9_]*$/;

export function jsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/** A module can be added to the app (registry.ts) only when this is empty. */
export function moduleProblems(m: Partial<GameModule>): string[] {
  const out: string[] = [];
  if (!m.id || !MODULE_ID.test(m.id) || m.id.length > 40) {
    out.push('id: lowercase words joined by dashes, up to 40 characters (e.g. planning-week)');
  }
  if (!m.version || !SEMVER.test(m.version)) out.push('version: like 1.0.0');
  if (!m.kind || !['task', 'scene', 'activity', 'other'].includes(m.kind)) {
    out.push('kind: task, scene, activity or other');
  }
  if (!m.measures || m.measures.length === 0) {
    out.push("measures: list what it gives evidence for, or ['none']");
  } else {
    for (const c of m.measures) {
      if (!CONSTRUCTS.includes(c)) out.push(`measures: '${c}' is not one of ${CONSTRUCTS.join(', ')}`);
    }
    if (m.measures.includes('none') && m.measures.length > 1) out.push("measures: 'none' goes alone");
  }
  if (typeof m.title !== 'string' || !m.title.trim()) out.push('title: needs a name');
  if (!m.contract || m.contract.split('.')[0] !== CONTRACT_VERSION.split('.')[0]) {
    out.push(`contract: written for ${m.contract ?? 'no version'}, the app speaks ${CONTRACT_VERSION}`);
  }
  if (typeof m.Screen !== 'function' && typeof m.Screen !== 'object') out.push('Screen: a React component');
  return out;
}

/** Ids must be unique across the registry. */
export function registryProblems(modules: Partial<GameModule>[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of modules) {
    for (const p of moduleProblems(m)) out.push(`${m.id ?? '(no id)'}: ${p}`);
    if (m.id && seen.has(m.id)) out.push(`${m.id}: two modules have this id`);
    if (m.id) seen.add(m.id);
  }
  return out;
}

function dataProblems(data: unknown, where: string): string[] {
  const out: string[] = [];
  const walk = (value: unknown, path: string, depth: number) => {
    if (depth > 4) {
      out.push(`${path}: nested too deeply (4 levels at most)`);
      return;
    }
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) out.push(`${path}: numbers must be finite`);
      return;
    }
    if (typeof value === 'string') {
      if (value.length > MAX_DATA_STRING) {
        out.push(`${path}: text over ${MAX_DATA_STRING} characters (no free text: use ids and codes)`);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`, depth + 1));
      return;
    }
    if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
      for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, depth + 1);
      return;
    }
    out.push(`${path}: only text, numbers, true/false, null, lists and plain objects`);
  };
  if (data === undefined) return out;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return [`${where}: an object like { picked: 'R' }`];
  }
  walk(data, where, 0);
  if (out.length === 0 && jsonBytes(data) > MAX_DATA_BYTES) {
    out.push(`${where}: ${jsonBytes(data)} bytes, over ${MAX_DATA_BYTES} (the whole event must stay under 1 KB)`);
  }
  return out;
}

/** An event a module wants to send. */
export function eventProblems(e: GameEvent): string[] {
  const out: string[] = [];
  if (!(EVENT_TYPES as readonly string[]).includes(e.type)) {
    out.push(
      `type: '${e.type}' is not an agreed event type. To try a new measurement, use host.experiment(); ` +
        'to make it real, propose it (RFC-0005)'
    );
  } else if (HOST_ONLY_EVENTS.includes(e.type)) {
    out.push(`type: '${e.type}' is sent by the app itself; call host.finish() instead`);
  }
  if (e.itemId !== undefined && (!ITEM_ID.test(e.itemId) || e.itemId.length > MAX_ITEM_ID)) {
    out.push(`itemId: up to ${MAX_ITEM_ID} letters, digits and _ - . :`);
  }
  out.push(...dataProblems(e.data, 'data'));
  return out;
}

export function experimentProblems(e: ExperimentalEvent): string[] {
  const out: string[] = [];
  if (!NAME.test(e.name ?? '') || e.name.length > 40) out.push('name: lowercase_with_underscores, ≤ 40');
  out.push(...dataProblems(e.data, 'data'));
  return out;
}

export function savedProblems(state: JsonValue): string[] {
  let size: number;
  try {
    size = jsonBytes(state);
  } catch {
    return ['saved state: must be plain JSON'];
  }
  return size > MAX_SAVED_BYTES ? [`saved state: ${size} bytes, over ${MAX_SAVED_BYTES}`] : [];
}
