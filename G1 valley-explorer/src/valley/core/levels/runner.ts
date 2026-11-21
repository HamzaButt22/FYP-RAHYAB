/**
 * Bridges a pure level machine and the GameSession. Used by the React hook and by headless bots,
 * so the phone and the tests run exactly the same code path.
 */
import type { GameSession } from '../../services/session';
import type { LevelMachine } from './machine';
import { caravan, careerWorkshop, parkMission, valleyGate } from './interestLevels';
import { mapRoom, patternGate, vaultLocks, workshopOrders } from './abilityLevel';
import type { PlayableLevelId } from '../progress';

export const MACHINES: Record<PlayableLevelId, LevelMachine<any, any>> = {
  valley_gate: valleyGate,
  crossroads_caravan: caravan,
  workshop_orders: workshopOrders,
  career_workshop: careerWorkshop,
  map_room: mapRoom,
  pattern_gate: patternGate,
  park_mission: parkMission,
  vault_locks: vaultLocks,
};

export class LevelRunner<S, A> {
  state!: S;
  completed = false;

  constructor(private session: GameSession, private machine: LevelMachine<S, A>) {}

  private ctx() { return { seed: this.session.seed, t: this.session.activeMs() }; }

  /** Opens the level, restoring saved mid-level state if the app was closed during it. */
  async open(): Promise<{ state: S; resumed: boolean }> {
    const id = this.machine.id;
    const saved = this.session.journey.levelStates[id] as S | undefined;
    if (saved !== undefined) {
      await this.session.commit({ actions: [{ type: 'OPEN_LEVEL', level: id }] });
      this.state = saved;
      return { state: saved, resumed: true };
    }
    const r = this.machine.init(this.ctx());
    this.state = r.state;
    await this.session.commit({ events: r.events, actions: [{ type: 'OPEN_LEVEL', level: id }, { type: 'SAVE_LEVEL_STATE', level: id, state: r.state }] });
    return { state: r.state, resumed: false };
  }

  /** Applies an action. Disallowed actions (e.g. a double tap) change nothing and record nothing. */
  dispatch(action: A): { state: S; changed: boolean; complete: boolean; done: Promise<void> } {
    if (this.completed) return { state: this.state, changed: false, complete: true, done: Promise.resolve() };
    const r = this.machine.reduce(this.state, action, this.ctx());
    const changed = r.state !== this.state || r.events.length > 0 || !!r.complete;
    if (!changed) return { state: this.state, changed: false, complete: false, done: Promise.resolve() };
    this.state = r.state;
    const id = this.machine.id;
    const actions = r.complete
      ? [{ type: 'COMPLETE_LEVEL' as const, level: id }]
      : [{ type: 'SAVE_LEVEL_STATE' as const, level: id, state: r.state }];
    if (r.complete) this.completed = true;
    const done = this.session.commit({ events: r.events, actions });
    return { state: r.state, changed: true, complete: !!r.complete, done };
  }
}
