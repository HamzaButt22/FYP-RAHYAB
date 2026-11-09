/**
 * Device-independent input for one frame (port of game/input_state.py).
 *
 * The desktop loop fills it from the keyboard; the mobile loop fills it from the joystick, the action button and
 * tapped on-screen controls; parity tests fill it from recorded desktop traces. The engine cannot tell them apart.
 *
 * `selectIndex` is the only mobile addition: tapping an option in a choice dialog highlights it (desktop: arrow keys).
 * It never appears in desktop traces.
 */
export interface InputState {
  dx: number;
  dy: number;
  interact: boolean;
  confirm: boolean;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  back: boolean;
  pause: boolean;
  number: number | null;
  text: string;
  backspace: boolean;
  tab: boolean;
  save: boolean;
  menu: boolean;
  selectIndex: number | null;
}

export const emptyInput = (): InputState => ({
  dx: 0,
  dy: 0,
  interact: false,
  confirm: false,
  up: false,
  down: false,
  left: false,
  right: false,
  back: false,
  pause: false,
  number: null,
  text: '',
  backspace: false,
  tab: false,
  save: false,
  menu: false,
  selectIndex: null,
});

export const makeInput = (partial: Partial<InputState> = {}): InputState => ({ ...emptyInput(), ...partial });

export const anyPress = (i: InputState): boolean =>
  !!(
    i.interact ||
    i.confirm ||
    i.up ||
    i.down ||
    i.left ||
    i.right ||
    i.back ||
    i.number !== null ||
    i.text ||
    i.tab ||
    i.menu ||
    i.save ||
    i.selectIndex !== null
  );

export const anyInput = (i: InputState): boolean => anyPress(i) || i.dx !== 0 || i.dy !== 0;

/** Enter or interact - "press the main button". */
export const accept = (i: InputState): boolean => i.confirm || i.interact;

/** Stable compact encoding (used by the replay journal and parity fixtures). */
export function encodeInput(i: InputState): Partial<InputState> {
  const e = emptyInput();
  const out: Partial<InputState> = {};
  (Object.keys(e) as (keyof InputState)[]).forEach((k) => {
    if (i[k] !== e[k]) (out as Record<string, unknown>)[k] = i[k];
  });
  return out;
}

export function decodeInput(enc: Partial<InputState> | Record<string, unknown>): InputState {
  return makeInput(enc as Partial<InputState>);
}
