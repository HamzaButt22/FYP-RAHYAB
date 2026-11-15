// Every game module in the app. Adding a module is one import and one line here: the week loop, the
// outbox and the results never change for it (NFR-52). The game lab lists exactly these.

import type { GameModule } from './contract.ts';
import { samplePickOne } from './modules/samplePickOne.tsx';

export const GAME_MODULES: GameModule[] = [samplePickOne];

export function findModule(id: string): GameModule | undefined {
  return GAME_MODULES.find((m) => m.id === id);
}
