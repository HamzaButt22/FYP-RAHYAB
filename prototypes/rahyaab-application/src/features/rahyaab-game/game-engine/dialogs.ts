/**
 * Modal dialogs and panels (port of game/ui/dialog.py and game/ui/panels.py) - logic only; rendering lives in the UI.
 *
 * ChoiceDialog is the main behavioural instrument: decision latency (DECISION -> DECISION_RESPONSE) and how often the
 * player changed the highlighted option before confirming ("second-guessing").
 *
 * Touch adaptation (documented in MOBILE_CONVERSION_MAP.md): on a phone nothing is highlighted when a dialog opens
 * (index -1). The first tap only highlights; every later tap on a *different* option counts as a selection change; the
 * "Choose" button (or tapping the highlighted option again) confirms. Desktop traces still start at index 0 and use
 * up/down/number keys, so desktop behaviour is unchanged.
 */
import { accept, InputState } from './input';
import { DecisionOption, Meta, TelemetryLogger } from './logger';

export interface Modal {
  readonly kind: 'choice' | 'message' | 'count' | 'planner' | 'activity';
  done: boolean;
  update(inp: InputState): void;
}

export interface ChoiceExtras {
  onCheck?: (option: DecisionOption, dlg: ChoiceDialog) => void;
  context?: Meta;
  speaker?: string | null;
  footer?: string;
}

export class ChoiceDialog implements Modal {
  readonly kind = 'choice' as const;
  index: number;
  done = false;
  result: DecisionOption | null = null;
  flash = '';
  readonly onCheck?: (option: DecisionOption, dlg: ChoiceDialog) => void;
  readonly speaker: string | null;
  readonly footer: string;

  constructor(
    private readonly logger: TelemetryLogger,
    readonly decisionId: string,
    readonly category: string,
    readonly title: string,
    public body: string,
    readonly options: DecisionOption[],
    private readonly onChoice: (option: DecisionOption) => void,
    extras: ChoiceExtras = {},
    touchMode = false,
  ) {
    this.onCheck = extras.onCheck;
    this.speaker = extras.speaker ?? null;
    this.footer = extras.footer ?? '';
    this.index = touchMode ? -1 : 0;
    logger.beginDecision(decisionId, category, options, extras.context ?? {});
  }

  setBody(body: string): void {
    this.body = body;
  }

  update(inp: InputState): void {
    if (this.done) return;
    if (inp.selectIndex !== null && inp.selectIndex >= 0 && inp.selectIndex < this.options.length) {
      if (inp.selectIndex !== this.index) {
        if (this.index !== -1) this.logger.noteSelectionChange(this.decisionId);
        this.index = inp.selectIndex;
      }
    }
    if (inp.up && this.index > 0) {
      this.index -= 1;
      this.logger.noteSelectionChange(this.decisionId);
    } else if (inp.down && this.index < this.options.length - 1) {
      this.index += 1;
      this.logger.noteSelectionChange(this.decisionId);
    }
    let pick: number | null = null;
    if (inp.number !== null && inp.number >= 1 && inp.number <= this.options.length) {
      pick = inp.number - 1;
    } else if (accept(inp) && this.index >= 0) {
      pick = this.index;
    }
    if (pick !== null) this.choose(this.options[pick]);
  }

  private choose(option: DecisionOption): void {
    if (option.kind === 'check' && this.onCheck) {
      this.onCheck(option, this);
      return;
    }
    this.logger.endDecision(this.decisionId, option.key);
    this.done = true;
    this.result = option;
    this.onChoice(option);
  }
}

export class MessageBox implements Modal {
  readonly kind = 'message' as const;
  done = false;
  age = 0;
  onClose: (() => void) | null;

  constructor(
    readonly title: string,
    readonly body: string,
    readonly speaker: string | null = null,
    onClose: (() => void) | null = null,
    readonly lines: string[] = [],
  ) {
    this.onClose = onClose;
  }

  /** The desktop ignores the key that opened the box (8 frames); the UI uses this to enable "Continue". */
  get ready(): boolean {
    return this.age > 8;
  }

  update(inp: InputState): void {
    this.age += 1;
    if (this.age > 8 && (accept(inp) || inp.back)) {
      this.done = true;
      if (this.onClose) this.onClose();
    }
  }
}

export interface CountItem {
  key: string;
  label: string;
  weight: number;
  max?: number;
  note?: string;
}

/** Pick how many of each item to take (pack / loadout). Port of game/ui/panels.py CountPanel. */
export class CountPanel implements Modal {
  readonly kind = 'count' as const;
  counts: Record<string, number>;
  done = false;
  age = 0;
  flash = '';

  constructor(
    readonly title: string,
    readonly hint: string,
    readonly items: CountItem[],
    readonly capacity: number,
    private readonly onEvent: (kind: string, key: string, counts: Record<string, number>) => void,
    private readonly onClose: (counts: Record<string, number>) => void,
    counts: Record<string, number> | null = null,
    readonly capacityLabel = 'weight',
  ) {
    const base: Record<string, number> = {};
    for (const i of items) base[i.key] = 0;
    this.counts = { ...base, ...(counts ?? {}) };
  }

  used(): number {
    let s = 0;
    for (const i of this.items) s += i.weight * this.counts[i.key];
    return s;
  }

  get ready(): boolean {
    return this.age > 8;
  }

  update(inp: InputState): void {
    this.age += 1;
    if (inp.number !== null && inp.number >= 1 && inp.number <= this.items.length) {
      const it = this.items[inp.number - 1];
      const k = it.key;
      if (this.counts[k] >= (it.max ?? 1)) {
        this.counts[k] = 0;
        this.flash = '';
        this.onEvent('remove', k, { ...this.counts });
      } else if (this.used() + it.weight > this.capacity) {
        this.flash = `Too heavy - the pack holds ${this.capacity} ${this.capacityLabel}.`;
        this.onEvent('rejected', k, { ...this.counts });
      } else {
        this.counts[k] += 1;
        this.flash = '';
        this.onEvent('add', k, { ...this.counts });
      }
    } else if (this.age > 8 && (accept(inp) || inp.back)) {
      this.done = true;
      this.onClose({ ...this.counts });
    }
  }
}
