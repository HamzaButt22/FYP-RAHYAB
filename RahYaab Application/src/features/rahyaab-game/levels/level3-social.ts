/**
 * Level 3 - Harbor Village (social interaction). Port of game/levels/level3_social.py.
 *
 * Six villagers: three walk up and ask for something (and can be ignored); three wait quietly and only talk if the
 * player starts the conversation. Nothing is required: the ferry can be reached without speaking to anyone.
 */
import {
  CAT_COOPERATION,
  CAT_HELP,
  CAT_REWARD,
  CAT_SHARE,
  CAT_SOCIAL,
  EventType as E,
  KIND_EXIT,
  KIND_IGNORE,
  KIND_NOVEL,
  KIND_PROSOCIAL,
  KIND_SAFE,
  KIND_SELFISH,
  KIND_SOCIAL,
} from '../game-engine/events';
import { InputState } from '../game-engine/input';
import { HudItem, Level } from '../game-engine/level-base';
import { DecisionOption, Kw } from '../game-engine/logger';
import { pyFloorDiv, pyRoundInt } from '../game-engine/pymath';
import { R, Rect } from '../game-engine/rect';

export const FERRY = R(1030, 240, 60, 120);
export const HOUSES = [R(110, 90, 160, 100), R(640, 80, 170, 100), R(880, 90, 100, 100), R(400, 470, 150, 100), R(640, 450, 110, 100), R(900, 450, 90, 110)];
export const MAX_FOLLOWUPS = 3;
export const START_COINS = 12;

export interface Villager {
  id: string;
  name: string;
  pos: [number, number];
  mode: 'npc' | 'player';
  cat: string;
  color: [number, number, number];
  text: string;
  options: [string, string, string][];
  chat: string[];
}

export const NPCS: Villager[] = [
  {
    id: 'marta', name: 'Baker Marta', pos: [300, 245], mode: 'npc', cat: CAT_HELP, color: [244, 164, 96],
    text: 'Oh, thank goodness! My bread cart is stuck in the mud and the loaves will spoil. Could you help me push it out?',
    options: [['Of course - let me push!', KIND_PROSOCIAL, 'help'], ["Sorry, I'm in a hurry.", KIND_IGNORE, 'ignore']],
    chat: ["Marta smiles: 'I bake for the whole harbor, you know.'", "'The secret is rye flour and patience.'", "'Come back anytime for warm bread!'"],
  },
  {
    id: 'lena', name: 'Captain Lena', pos: [620, 365], mode: 'npc', cat: CAT_COOPERATION, color: [96, 165, 250],
    text: 'Two heavy crates must reach the dock. The harbor master pays 20 coins if we carry them together, or a 14-coin bonus to whoever is faster.',
    options: [
      ["Let's carry them together.", KIND_PROSOCIAL, 'cooperate'],
      ['How about we split the load by strength?', KIND_PROSOCIAL, 'negotiate'],
      ["I'll race you for the bonus!", KIND_SELFISH, 'compete'],
      ['Not interested, thanks.', KIND_IGNORE, 'ignore'],
    ],
    chat: ["Lena grins: 'Twenty years at sea and still no sea legs on land.'", "'The ferry runs on the hour, don't miss it.'", "'Keep your eyes open on the road ahead.'"],
  },
  {
    id: 'bashir', name: 'Old Sailor Bashir', pos: [860, 252], mode: 'npc', cat: CAT_SHARE, color: [160, 140, 200],
    text: 'Excuse me, traveller. I have not eaten since dawn. Could you spare a few coins for some soup?',
    options: [
      ['Give him half of your coins.', KIND_PROSOCIAL, 'share_half'],
      ['Give him a few coins.', KIND_PROSOCIAL, 'share_few'],
      ['Keep your coins.', KIND_SELFISH, 'keep'],
      ['Walk on without answering.', KIND_IGNORE, 'ignore'],
    ],
    chat: ["Bashir nods slowly: 'The sea gives and the sea takes.'", "'I once sailed past the edge of the map.'", "'Kindness comes back around, they say.'"],
  },
  {
    id: 'omar', name: 'Fisherman Omar', pos: [230, 505], mode: 'player', cat: CAT_SHARE, color: [120, 200, 160],
    text: "Omar is mending torn nets with tired hands. He hasn't noticed you. New twine would cost about 4 coins.",
    options: [['Offer to pay for new twine (4 coins).', KIND_PROSOCIAL, 'share_few'], ['Just greet him and go.', KIND_EXIT, 'leave']],
    chat: ["Omar looks up: 'Tide's been poor this week.'", "'My father taught me these knots.'", "'Good luck on your journey.'"],
  },
  {
    id: 'zayn', name: 'Zayn the Boy', pos: [500, 105], mode: 'player', cat: CAT_HELP, color: [250, 204, 21],
    text: "A boy stares sadly at a roof where his kite is stuck. He doesn't ask for anything.",
    options: [['Climb up and fetch the kite.', KIND_PROSOCIAL, 'help'], ['Wave hello and go.', KIND_EXIT, 'leave']],
    chat: ["Zayn: 'It's a dragon kite. I made it myself!'", "'I want to fly it over the harbor.'", "'You're nice. Most people are in a rush.'"],
  },
  {
    id: 'rina', name: 'Merchant Rina', pos: [845, 525], mode: 'player', cat: CAT_COOPERATION, color: [244, 114, 182],
    text: 'Rina runs her market stall alone and the lunch rush is about to start. Customers are already queuing.',
    options: [
      ['Offer to run the stall together.', KIND_PROSOCIAL, 'cooperate'],
      ['Propose: you help, she shares the profit.', KIND_PROSOCIAL, 'negotiate'],
      ['Haggle hard for her best prices.', KIND_SELFISH, 'compete'],
      ['Just browse and leave.', KIND_EXIT, 'leave'],
    ],
    chat: ["Rina laughs: 'Business is a game of patience.'", "'I started with a single basket of figs.'", "'Come back when the sun sets - best deals.'"],
  },
];

export class SocialLevel extends Level {
  readonly levelId = 3;
  readonly name = 'Harbor Village';
  readonly scenario = 'social';
  readonly objective = 'Take your letter to the Ferry Dock. Villagers may talk to you - or you can talk to them.';
  readonly taskName = 'deliver_letter_to_ferry';
  readonly startPos: [number, number] = [60, 300];

  coins!: number;
  trust!: number;
  met!: Set<string>;
  merchantDone!: boolean;
  engaged!: Set<string>;

  build(): void {
    this.coins = START_COINS;
    this.trust = 0;
    this.met = new Set();
    this.merchantDone = false;
    this.engaged = new Set();
  }

  levelStartMetadata(): Kw {
    const idle = NPCS.filter((n) => n.mode === 'player').length;
    return { npc_encounters_total: NPCS.length, idle_encounters_total: idle, start_coins: START_COINS };
  }

  solids(): Rect[] {
    return [...HOUSES];
  }

  onUpdate(_dt: number, _inp: InputState): void {
    for (const n of NPCS) {
      if (n.mode === 'npc' && !this.met.has(n.id) && this.distTo(n.pos) < 125) {
        this.startEncounter(n, 'initiated_by_npc');
        return;
      }
    }
    if (FERRY.collidepoint(this.player.x, this.player.y) && this.modal === null) this.merchantOrFinish();
  }

  private idleNpcInReach(): Villager | null {
    for (const n of NPCS) if (n.mode === 'player' && !this.met.has(n.id) && this.distTo(n.pos) < 70) return n;
    return null;
  }

  interactHint(): string | null {
    const n = this.idleNpcInReach();
    return n ? `Talk to ${n.name}` : null;
  }

  onInteract(): void {
    const n = this.idleNpcInReach();
    if (n) this.startEncounter(n, 'initiated_by_player');
  }

  private startEncounter(n: Villager, how: string): void {
    this.met.add(n.id);
    this.bump();
    this.log.log(E.NPC_INTERACTION, {
      action: how,
      encounter_id: n.id,
      npc: n.name,
      npc_mode: n.mode,
      distance: pyRoundInt(this.distTo(n.pos)),
    });
    const opts: DecisionOption[] = n.options.map(([label, kind, effect]) => ({
      key: `${n.id}_${effect}`,
      label,
      kind,
      effect,
      risk_level: 0.0,
    }));
    this.openChoice(`l3_${n.id}`, n.cat, n.name, n.text, opts, (o) => this.applyEffect(n, o), {
      context: { encounter_id: n.id, npc_mode: n.mode, initiated: how },
      speaker: 'Villager',
    });
  }

  private applyEffect(n: Villager, o: DecisionOption): void {
    const eff = o.effect as string;
    const nid = n.id;
    let cont = true;
    if (eff === 'ignore') {
      this.log.log(E.NPC_INTERACTION, { action: 'ignored', encounter_id: nid, npc: n.name });
      this.say(`You walk past ${n.name}.`);
      cont = false;
    } else if (eff === 'leave') {
      this.log.log(E.NPC_INTERACTION, { action: 'left_conversation', encounter_id: nid, npc: n.name });
      this.engaged.add(nid);
      cont = false;
    } else {
      this.engaged.add(nid);
      if (eff === 'help') {
        this.log.log(E.HELP_ACTION, { action: 'help', encounter_id: nid, npc: n.name, cost_ms: 3000 });
        this.player.freeze(3000);
        this.trust += 10;
        this.say(`You help ${n.name}. (+10 trust)`, 3200);
      } else if (eff === 'share_half' || eff === 'share_few') {
        let amount = eff === 'share_half' ? Math.max(1, pyFloorDiv(this.coins, 2)) : Math.min(4, this.coins);
        amount = Math.min(amount, this.coins);
        this.coins -= amount;
        this.trust += 8;
        this.log.log(E.SHARE_ACTION, { action: eff, encounter_id: nid, npc: n.name, amount });
        this.say(`You share ${amount} coins. (+8 trust)`, 3200);
      } else if (eff === 'keep') {
        this.log.log(E.PLAYER_INTERACTION, { action: 'keep_coins', object_id: nid, novel: false });
        this.say('You keep your coins.');
      } else if (eff === 'cooperate' || eff === 'negotiate') {
        const gain = eff === 'cooperate' ? 10 : 8;
        this.coins += gain;
        this.trust += 6;
        this.log.log(E.COOPERATION_ACTION, { action: eff, encounter_id: nid, npc: n.name, coins_gained: gain });
        this.player.freeze(1500);
        this.say(`You ${eff === 'cooperate' ? 'team up' : 'strike a fair deal'}: +${gain} coins, +6 trust.`, 3200);
      } else if (eff === 'compete') {
        const gain = 12;
        this.coins += gain;
        this.trust -= 3;
        this.log.log(E.COMPETITION_ACTION, { action: 'compete', encounter_id: nid, npc: n.name, coins_gained: gain });
        this.say(`You win the race: +${gain} coins.`, 3200);
      }
    }
    if (cont) this.followup(n, 1);
  }

  private followup(n: Villager, turn: number): void {
    if (turn > MAX_FOLLOWUPS) return;
    const opts: DecisionOption[] = [
      { key: `${n.id}_chat${turn}`, label: 'Keep chatting', kind: KIND_SOCIAL, effect: 'chat' },
      { key: `${n.id}_bye${turn}`, label: 'Say goodbye', kind: KIND_EXIT, effect: 'bye' },
    ];
    const chosen = (o: DecisionOption) => {
      if (o.effect === 'chat') {
        this.log.log(E.NPC_INTERACTION, { action: 'dialogue_turn', encounter_id: n.id, npc: n.name, turn });
        this.say(n.chat[turn - 1], 3600);
        this.followup(n, turn + 1);
      } else {
        this.log.log(E.NPC_INTERACTION, { action: 'said_goodbye', encounter_id: n.id, npc: n.name, turns: turn - 1 });
      }
    };
    const body = turn > 1 ? n.chat[turn - 2] : `${n.name} looks at you, still smiling.`;
    this.openChoice(`l3_${n.id}_chat${turn}`, CAT_SOCIAL, n.name, body, opts, chosen, {
      context: { encounter_id: n.id, turn },
      speaker: 'Conversation',
    });
  }

  private merchantOrFinish(): void {
    if (this.merchantDone) return;
    this.merchantDone = true;
    const opts: DecisionOption[] = [
      { key: 'plain_bread', label: 'Take the plain loaf of bread (a sure thing)', kind: KIND_SAFE, risk_level: 0.0 },
      { key: 'sealed_jar', label: "Take the odd sealed jar (no idea what's inside)", kind: KIND_NOVEL, risk_level: 0.4 },
    ];
    const chosen = (o: DecisionOption) => {
      const gain = o.key === 'plain_bread' ? 5 : this.rng.choice([0, 3, 9, 15]);
      this.log.log(E.REWARD_SELECTED, { action: o.key, chosen_kind: o.kind, reward_value: gain, risk_level: o.risk_level });
      this.coins += gain;
      this.session.coins += this.coins;
      this.session.trust += this.trust;
      this.complete({ coins: this.coins, trust: this.trust, villagers_engaged: this.engaged.size, villagers_met: this.met.size });
    };
    this.openChoice('l3_merchant', CAT_REWARD, 'Traveling Merchant', 'A merchant at the dock offers you a parting gift for your trip.', opts, chosen);
  }

  hudExtra(): HudItem[] {
    return [
      { label: 'trust', value: String(this.trust) },
      { label: 'coins', value: String(this.coins) },
    ];
  }
}
