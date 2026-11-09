/**
 * Bridges the mutable engine to React: a stable identity per modal (input targets) and a cheap "what is visible"
 * signature, so React re-renders only when something on screen actually changed (not 60 times a second).
 */
import { ChoiceDialog, CountPanel, MessageBox } from '../game-engine/dialogs';
import { GameRunner } from '../game-engine/runner';
import { ActivityPanel } from '../levels/level7-workshop';
import { PlannerPanel } from '../levels/level2-planning';

const ids = new WeakMap<object, number>();
let nextId = 1;

export function objId(o: object): number {
  let id = ids.get(o);
  if (id === undefined) {
    id = nextId++;
    ids.set(o, id);
  }
  return id;
}

/** The UI element a tap is aimed at right now (see InputController). */
export function inputTarget(runner: GameRunner): string {
  const st = runner.state;
  if (st === 'play') {
    const m = runner.level?.modal;
    return m ? `play:modal#${objId(m)}` : 'play:world';
  }
  if (st === 'outcome' && runner.level) return `outcome#${objId(runner.level)}`;
  if (st === 'intro') return `intro#${runner.levelIdx}:${runner.attempt}`;
  return st;
}

/** Everything that, if changed, requires a React re-render (player position is animated separately). */
export function uiSignature(runner: GameRunner): string {
  const lvl = runner.level;
  const parts: (string | number)[] = [runner.state, runner.levelIdx, runner.attempt, runner.pauseIndex, runner.outcomeIndex];
  if (lvl) {
    parts.push(lvl.levelId, lvl.status, lvl.visualVersion, lvl.toastMs > 0 ? lvl.toast : '');
    parts.push(lvl.hudExtra().map((h) => h.value).join(','));
    parts.push(lvl.modal === null ? (lvl.interactHint() ?? '') : '');
    const m = lvl.modal;
    if (m) {
      parts.push(objId(m), m.kind);
      if (m instanceof ChoiceDialog) parts.push(m.index, m.body.length, m.body.slice(-24));
      else if (m instanceof MessageBox) parts.push(m.ready ? 1 : 0);
      else if (m instanceof CountPanel) parts.push(JSON.stringify(m.counts), m.flash, m.ready ? 1 : 0);
      else if (m instanceof PlannerPanel) parts.push([...m.selected].sort().join(','), m.ready ? 1 : 0);
      else if (m instanceof ActivityPanel) parts.push(m.version, m.stage, m.flash, m.age > 3 ? 1 : 0);
    }
  }
  return parts.join('|');
}
