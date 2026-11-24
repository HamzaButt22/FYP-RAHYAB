import { IMAGES } from '../assets/registry';

/** Look up a bundled image by its desktop-style path ("ui/heart_full", "stalls/icon_jugnu.png", ...). */
export function img(path: string): number {
  const key = path.replace(/\.(png|webp|jpg)$/, '');
  const v = IMAGES[key];
  if (v === undefined) {
    if (__DEV__) console.warn('missing image', key);
    return IMAGES['ui/icon_star'];
  }
  return v;
}

const KID_POSES = ['idle', 'wave', 'point', 'think'];
const EXPRS = ['smile', 'happy', 'talk', 'wow', 'think', 'worried'];

/** Same sprite-name rules as the desktop scene.char_path(). */
export function charKey(kind: string, pose = 'idle', expr = 'smile'): string {
  let p = pose;
  let e = expr;
  if (kind.startsWith('av')) {
    p = p === 'point' ? 'wave' : p;
    if (!['idle', 'wave', 'think'].includes(p)) p = 'idle';
    e = ({ talk: 'smile', worried: 'think' } as Record<string, string>)[e] ?? e;
    if (!['smile', 'happy', 'wow', 'think'].includes(e)) e = 'smile';
  } else if (kind === 'karim') {
    p = ['idle', 'point', 'wave'].includes(p) ? p : 'idle';
  } else if (kind === 'hudhud') {
    p = ['idle', 'fly'].includes(p) ? p : 'idle';
  } else {
    p = KID_POSES.includes(p) ? p : 'idle';
  }
  if (!EXPRS.includes(e)) e = 'smile';
  return `characters/${kind}_${p}_${e}`;
}

export function portraitKey(kind: string, expr = 'happy'): string {
  if (kind.startsWith('av')) return `characters/portrait_${kind}_${expr === 'happy' ? 'happy' : 'smile'}`;
  return `characters/portrait_${kind}_${EXPRS.includes(expr) ? expr : 'smile'}`;
}

/** Width/height of each character's sprites (kids 660x996, Ustad Karim 660x1080, Hudhud 660x690). */
export function charAspect(kind: string): number {
  if (kind === 'karim') return 660 / 1080;
  if (kind === 'hudhud') return 660 / 690;
  return 660 / 996;
}
