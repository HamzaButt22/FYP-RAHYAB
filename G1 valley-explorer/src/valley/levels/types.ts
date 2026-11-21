import type { AvatarLook } from '../game/engine/Avatar';
import type { GameSession } from '../services/session';

export interface LevelProps {
  session: GameSession;
  /** called once the level's LEVEL_COMPLETE event is durably saved */
  onComplete: () => void;
  /** back to the valley; progress inside the level is already saved */
  onBack: () => void;
  look: AvatarLook;
  coins: number;
}
