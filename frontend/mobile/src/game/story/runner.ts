// The Ink story bridge (ADR-0009): runs a compiled Ink story with inkjs and turns its tags into what the app
// needs. Pure logic (no React), tested with `pnpm test` (runner.test.ts).
//
// Tags the writers use (design/game/story/README.md):
//   #speaker:Hudhud   on a line: who says it (no tag: the narrator)
//   #item:w1_radio    on the line just before a choice: the item id that choice is recorded under
//   #type:R           on each option of a two-way interest choice: the RIASEC type that option stands for
// A choice point counts as a measurement only when it has exactly two options, each with a different #type.
// Any other choice just moves the story on and is not recorded.

import { Story } from 'inkjs';

export const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
export type InterestType = (typeof RIASEC)[number];

export interface StoryLine {
  text: string;
  speaker: string | null;
}

export interface StoryChoice {
  index: number;
  text: string;
  type: InterestType | null;
}

export interface StoryStep {
  lines: StoryLine[];
  choices: StoryChoice[];
  /** No choices left and nothing more to read: the scene is over. */
  ended: boolean;
}

/** What a measured choice records (the data of a `choice_made` event). */
export interface Measured {
  /** The two types in the order they were shown, e.g. "R-S". */
  pair: string;
  picked: InterestType;
  /** Where the picked option was shown: the first (top) or the second one. */
  side: 'first' | 'second';
  itemId: string | null;
}

/** What the module saves between sessions (well under the 16 KB limit: a scene is about 0.5 KB). */
export interface Snapshot {
  ink: string;
  item: string | null;
}

/** The value of a tag such as "speaker:Hudhud", or null. */
export function tagValue(tags: readonly string[] | null | undefined, name: string): string | null {
  for (const tag of tags ?? []) {
    const [key, ...rest] = tag.split(':');
    if (key.trim() === name) return rest.join(':').trim() || null;
  }
  return null;
}

function asType(value: string | null): InterestType | null {
  const v = value?.toUpperCase() ?? '';
  return (RIASEC as readonly string[]).includes(v) ? (v as InterestType) : null;
}

export class StoryRunner {
  private readonly story: Story;
  private item: string | null = null;
  private choices: StoryChoice[] = [];

  /** Starts `knot`, or continues from a snapshot saved earlier in the same scene. */
  constructor(json: string | object, knot: string, saved?: Snapshot | null) {
    this.story = new Story(typeof json === 'string' ? json : JSON.stringify(json));
    if (saved) {
      this.story.state.LoadJson(saved.ink);
      this.item = saved.item;
    } else {
      this.story.ChoosePathString(knot);
    }
  }

  /** Reads on until the next choice or the end. */
  next(): StoryStep {
    const lines: StoryLine[] = [];
    while (this.story.canContinue) {
      const text = (this.story.Continue() ?? '').trim();
      const tags = this.story.currentTags;
      const item = tagValue(tags, 'item');
      if (item) this.item = item;
      if (text) lines.push({ text, speaker: tagValue(tags, 'speaker') });
    }
    this.choices = this.story.currentChoices.map((c) => ({
      index: c.index,
      text: c.text,
      type: asType(tagValue(c.tags, 'type')),
    }));
    return { lines, choices: this.choices, ended: this.choices.length === 0 };
  }

  /** What choosing `index` would record, or null when this choice point is not a measurement. */
  measure(index: number): Measured | null {
    const [a, b] = this.choices;
    if (this.choices.length !== 2 || !a.type || !b.type || a.type === b.type) return null;
    const chosen = this.choices.find((c) => c.index === index);
    if (!chosen?.type) return null;
    return {
      pair: `${a.type}-${b.type}`,
      picked: chosen.type,
      side: chosen.index === a.index ? 'first' : 'second',
      itemId: this.item,
    };
  }

  /** Takes a choice; returns what to record (null for a story-only choice). */
  choose(index: number): Measured | null {
    const measured = this.measure(index);
    this.story.ChooseChoiceIndex(index);
    this.item = null; // an item tag belongs to one choice point
    return measured;
  }

  snapshot(): Snapshot {
    return { ink: this.story.state.toJson(), item: this.item };
  }
}

export interface ChoicePointInfo {
  knot: string;
  options: StoryChoice[];
  item: string | null;
  measured: boolean;
}

/** Walks every path of a scene (each choice tried), listing its choice points. For tests and content checks. */
export function exploreScene(json: string | object, knot: string, maxPoints = 500): ChoicePointInfo[] {
  const found: ChoicePointInfo[] = [];
  const queue: (Snapshot | null)[] = [null];
  const seen = new Set<string>();
  while (queue.length > 0 && found.length < maxPoints) {
    const start = queue.shift() ?? null;
    const runner = new StoryRunner(json, knot, start);
    const step = runner.next();
    if (step.ended) continue;
    const before = runner.snapshot();
    if (seen.has(before.ink)) continue;
    seen.add(before.ink);
    found.push({
      knot,
      options: step.choices,
      item: before.item,
      measured: runner.measure(step.choices[0].index) !== null,
    });
    for (const choice of step.choices) {
      const branch = new StoryRunner(json, knot, before);
      branch.next();
      branch.choose(choice.index);
      queue.push(branch.snapshot());
    }
  }
  return found;
}

/** Story mistakes a writer can fix: tagged choices that cannot be measured, and measured ones without an item. */
export function sceneProblems(points: readonly ChoicePointInfo[]): string[] {
  const out: string[] = [];
  for (const p of points) {
    const typed = p.options.filter((o) => o.type);
    const where = `${p.knot}: "${p.options.map((o) => o.text).join('" / "')}"`;
    if (typed.length > 0 && !p.measured) {
      out.push(`${where}: a #type choice needs exactly two options with different #type tags`);
    }
    if (p.measured && !p.item) out.push(`${where}: add an #item tag on the line before the choice`);
  }
  return out;
}
