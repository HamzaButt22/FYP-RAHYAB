# "Your Year" — Game Design Research (Design round 2)

Research date: 2026-10-31. Sources are inline. Items marked **[DK]** are designer knowledge of well-known games that I did not re-verify with a source in this session. Items marked **[REC]** are recommendations for Rahyaab.

---

## 0. The three reference games the team liked

### Shouldermen
- An FCF Studios game on Windows. Tiny angel and devil "doppelgangers" sit on your shoulder. In the story, an evil genius has locked everyone's Shouldermen in VR prisons, so you hack in and talk them into saying a password. You control it with your voice, and the dialogue is real-time generative AI. The store page says 2,000 credits buy about 20 interactions because the AI is expensive. ([RAWG](https://rawg.io/games/shouldermen), [Nodal](https://nodal.gg/game/shouldermen-2671050))
- **What to take:** two named, personified inner voices with distinct personalities that argue with each other, not with you.
- **What to avoid:** live LLM dialogue. It costs a lot per interaction, it's unpredictable, and it breaks measurement (the choices can't be standardised) and safety for minors. **[REC]** Write the voices in advance. "AI" can show up only in the meter and the Blueprint (section 4).

### AI Learns To Drive
- An early-access Steam sandbox. You build a small feed-forward neural net and watch it train with evolutionary algorithms. ([VGDB](https://www.vgdb.co/games/ai-learns-to-drive), [Steam](https://store.steampowered.com/app/3312030/_/)) It comes from a big genre of YouTube and open-source "car learns the track" projects (NEAT, genetic algorithms, cars that sense walls with 5 rays). ([NEAT/Pygame write-up](https://app.readytensor.ai/publications/teaching-ai-to-drive-evolving-smarter-cars-with-neat-and-pygame-KQ6Wm8TwDTMY), [Unity project](https://github.com/JohnDavidAnthony/Self_Driving_Car), [Driven to Evolve](https://necrashter.itch.io/driven-to-evolve), which shows the ray-cast inputs on screen.)
- **Why it hooks people:** you can see improvement across generations, the model's inputs are visible, early failures are funny, and you feel like you're watching something come alive. See section 4.

### "StickARoundGame" = *Stick A Round*
- An unreleased indie game ("Coming soon") by a 2-person team in the Netherlands, started February 2025, with no publisher. You go on adventures, collect sticks and duel friends. Its signature mechanic is a workbench that reads how your stick bends, curves and branches and turns it into a weapon that matches that shape. It has a Patreon, and a Discord listing tagged Adventure/Open-World/Sandbox. ([Notion site](https://stickaroundgame.notion.site/), [press kit](https://stickaroundgame.notion.site/sar-press-kit), [Patreon](https://www.patreon.com/stickaroundgame), [Discord](https://discord.com/game/stick-a-round-1517741253557489777), [Playtester](https://playtester.io/stick-a-round)). The Notion page wouldn't render for me, so these details come from search snippets.
- **What to take [REC]:** "your raw, messy input becomes a unique artefact shaped exactly like you." That's the right fantasy for the **Blueprint**. It should feel like something crafted from *your* week choices (a personal object or card you'd screenshot), not a test result page. I'm assuming this is the game the team meant. Check with them.

---

## 1. Mechanics from narrative and life-sim games

| Game | Mechanic | Lesson for "Your Year" |
|---|---|---|
| **Reigns** (Nerial) | Binary swipe on a card. Four bars (church, people, army, wealth). The reign ends if any bar empties *or maxes out*. Kings can die in 2-3 swipes. ([Inverse interview with F. Alliot](https://inverse.com/gaming/23117-reigns-francois-alliot-nerial-developer-interview), [PC Gamer](https://www.pcgamer.com/au/how-reigns-and-its-forthcoming-sequel-make-their-tinderocracy-work), [AV Club](https://www.avclub.com/reigns-offers-grand-strategy-by-way-of-tinder)) Critics found some outcomes "nonsensical" and hard to read. ([AppSpy](https://www.appspy.com/features/tinder-disasterpeace-and-epic-binary-choices-why-reigns-should-be-your-next-ios-game/)) | Binary choices with one gesture work very well on mobile. **Failing at both ends** means no bar is simply "good to max", so there's no single right answer. Copy that for energy and wellbeing bars. Keep the bars *off* RIASEC so players can't game them. |
| **BitLife** [DK] | Text life-sim, one tap per year, lots of comedic random events, sharing your weird lives. | Short comic text works for Gen-Z. Random "life happens" events give variety for little writing cost. Avoid its crude content and its ad-heavy business model. |
| **Episode / Choices** | Premium choices cost diamonds. One playthrough found 7 choices where only the "worst" option was free. Paid choices often buy attractiveness or popularity. ([Emily Short](https://emshort.blog/2017/03/13/choices-episode/), [Mechanics of Magic critical play](https://mechanicsofmagic.com/?p=44316), [Common Sense Media](https://www.commonsensemedia.org/app-reviews/choices-stories-you-play), [PocketGamer.biz](https://www.pocketgamer.biz/how-does-choices-stories-you-play-monetise)) | **Anti-pattern.** Never gate options or make one option look "premium" or glowing. That is a "right answer" signal and it ruins measurement. The visual-novel layout (character portrait, speech bubble, 2-3 options) is still the format teens know best. |
| **Florence** (Mountains, Ken Wong) | Mechanics as metaphor. In conversation, puzzle pieces get fewer and easier as the couple grows closer. Story told almost without words. ([Game Pilgrim interview](https://gamepilgrim.com/2021/04/19/developer-interview-mountains/), [80.lv](https://80.lv/articles/the-lead-designer-of-monument-valley-discusses-florence), [gamevironments paper](https://journals.suub.uni-bremen.de/index.php/gamevironments/article/download/185/159/367)) | **Main pattern for hidden tasks.** Each task is a small *action that means something in the story* (packing a bag, splitting a bill), not a puzzle box. Florence shows mini-interactions can carry emotion without feeling like a quiz. |
| **Life is Strange** | Some choices are flagged "This action will have consequences". Rewind lets you redo choices. Critics note this implies unflagged choices don't matter, and rewind trains players to "get it right". ([DBK review](https://dbknews.com/0999/12/31/arc-oyf5o4rbcnczxaphghkksgwhjy), [Wooster thesis](https://openworks.wooster.edu/independentstudy/8345)) | Use **callbacks** ("Ayesha remembers you skipped her match"), not warnings. **No rewind** on measured choices. Measure the first, honest choice. |
| **Kind Words** (Popcannibal) | Anonymous letters of support, heavily moderated, lo-fi cosy mood. ([Inverse interview](https://www.inverse.com/gaming/kind-words-2-ziba-scott-interview), [Games for Change](https://www.gamesforchange.org/?p=655)) | Cosy, non-judgemental tone works for stressed teens. **Don't** add user-to-user messaging (moderation cost, safety for minors). Borrow the mood: a lo-fi bedroom as the hub, a "write in your diary" end-of-week ritual. |
| **Unpacking** (Witch Beam) | Story told through ~1,000 objects. No fail states, no scores. ([Game Developer GDC 2022](https://www.gamedeveloper.com/gdc2022/gdc-2022-unpacking-a-narrative-through-1-000-household-items), [design pillars](https://www.gamedeveloper.com/design/unpacking-the-design-pillars-of-a-chill-puzzle-game), [GDC 2023 "Zen" talk](https://gonintendo.com/comments/9269)) | **Spatial task template:** arranging things in a room or bag reads as play, not a test. "No fail states, no score" is exactly the framing the hidden tasks need. The player never sees "wrong". |
| **Spiritfarer** [DK] | Cosy management. Each character has their own wants, and saying goodbye is the emotional payoff. | Give every cast member one want that a player choice can meet. Week 4 (Blueprint) should feel like a warm send-off, not an exam result. |
| **Citizen Sleeper** (Jump Over the Age) | Each cycle (day) you roll up to 5 dice and assign them to actions. When you run out, the cycle ends and clocks and plot advance. Failures are treated as canon, so there's no game over. Gareth Damian Martin says tabletop RPGs (Blades in the Dark) inspired it. ([Inverse](https://inverse.com/gaming/citizen-sleeper-gareth-martin-interview), [Rascal](https://www.rascal.news/tracing-citizen-sleepers-circuitous-vector-from-tabletop-to-hit-video-game/), [Epic interview on CS2 stress/broken dice](https://store.epicgames.com/news/citizen-sleeper-2-starward-vector-interview-gareth-damian-martin-stress)) | **Main model for the weekly planner.** A small visible budget, clear slots, and *progress clocks* on goals ("Science fair project 2/4"). Failure becomes story ("you were exhausted, the presentation went sideways") with no game over. |
| **Persona 3/4/5** | A school year as a calendar. Each day you spend a time slot on a confidant (social link) or a stat. Some confidants are only available at certain times of day. There's opportunity cost between links. ([Worthplaying P5 review](https://www.worthplaying.com/article/2017/4/14/reviews/103209-ps4-review-persona-5/), [P5R confidant guide](https://jeu.video/en/guide/persona-5-royal-confidants-best-order-guide)) | **Biggest structural match.** "A school year, scarce time, people who need you" is basically the brief. Take the calendar UI, time-gated availability ("Bilal only plays cricket on Fridays") and relationship ranks that unlock scenes. Skip the stat grinding and dungeons. |
| **Stardew Valley** [DK] | Seasons and festivals, NPC schedules, an energy bar, the day ends at 2am. | Exam season, Eid and cousin weddings work as "seasons" and "festivals" that break routine. An energy bar gives an obvious limit. |
| **Papers, Please** [DK] | A few simple rules. Consequences pile up quietly (family needs vs. job). | A small ruleset with emotional stakes is enough. The weekly *consequence summary* (family, friends, school, self) is the "end of day" screen. |
| **Doki Doki Literature Club** [DK] | A cute visual novel that turns into psychological horror, fourth-wall breaks, self-harm content. | **Avoid.** No meta-horror, no fake glitches, no "the game is watching you" creepiness. That's especially important because the game *does* model the player, so honesty matters (section 4). |

### Mechanics to extract
1. **Time and energy budget** (Citizen Sleeper, Persona, Stardew). The week has 6 activities, pick 3, energy 10. Each activity costs 2-5 and has a visible effect on 3 meters. **[REC]** Keep this exact structure. Make sure at least 2 combinations of 3 fit the budget for *every* RIASEC leaning, so energy never forces a type.
2. **Calendar and time-gated availability** (Persona). A friend or event is only on certain days. That creates real trade-offs (cricket final vs. tuition test).
3. **Relationship meters as hearts or ranks**, not numbers (Persona, Stardew). 5 ranks per character. Ranks unlock personal scenes.
4. **Two-sided meters** (Reigns). Wellbeing and Family-expectations bars that are bad at *both* ends (burnout vs. coasting, rebellion vs. people-pleasing). This kills "max the bar" thinking.
5. **Progress clocks** (Citizen Sleeper / Blades in the Dark). Multi-week goals shown as segmented circles.
6. **Consequence callbacks** (Life is Strange, but without warnings). Later scenes reference earlier choices. Use ink variables.
7. **Branch and bottleneck / foldback.** Branches rejoin at fixed weekly beats (see section 5 for the pattern list).
8. **Storylets** (Failbetter quality-based narrative). Scenes have prerequisites, content and effects, and get drawn from a pool. ([Emily Short, "Beyond Branching"](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/), [Storylets: You Want Them](https://emshort.blog/tag/quality-based-narrative/))
9. **Choice framing without right answers.** Both options have a cost and a gain. No option glows, is gated or is "premium". No warnings. No rewind on measured choices.
10. **Mechanics as metaphor** for hidden tasks (Florence, Unpacking).

---

## 2. Story design for Pakistani teens (14-18, grades 9-12)

### Setting
- **Context:** Pakistani streams are chosen around Matric (grade 9-10). FSc Pre-Medical, FSc Pre-Engineering, ICS, I.Com and FA/Humanities are the main tracks, with DAE as a vocational route **[DK]**. Family expectations heavily favour doctor/engineer. That makes the "what's expected" voice culturally accurate. It's also a measurement risk (section 3).
- **Two settings:** a big city (Rawalpindi/Islamabad, Lahore or Karachi) and a smaller city (e.g. Sahiwal, Mardan, Sukkur). At most one setting variable should change minor details (tuition centre vs. academy, bus vs. rickshaw, mall vs. bazaar). **[REC]** Pick one city-agnostic "mid-size city" to cut writing, with a small list of local flavour lines.
- **Recognisable touchpoints:** tuition/academy culture, chai dhaba, gully cricket, load-shedding, a family WhatsApp group, cousin weddings (mehndi), Eid, board exams, the school science fair or debate, a small family business, a phone with a cracked screen, Instagram/TikTok/PUBG. PUBG Mobile adding an Urdu setting and a voice pack with the Pakistani band AUR (2024) shows Urdu and local culture *can* feel cool. ([ProPakistani](https://propakistani.pk/2024/08/21/pubg-mobile-announces-version-3-3-with-urdu-language-setting/amp/))
- **Representation:** Pakistani gamers report stigma around gaming and want games that show their culture. In one 2023 study only 8% preferred Urdu as a gaming language vs. 32% English (n=25, a small sample). ([Faraz & Shahzad 2023, Erevna](https://journals.au.edu.pk/ojserevna/index.php/erevna/article/view/284)) **[REC]** Default to **English UI plus Roman Urdu / code-switched dialogue** ("Yaar, kal ka test cancel ho gaya?"). That's how teens actually text. Offer English-only as an option. Avoid Nastaliq script UI for v1 because of rendering cost.
- **Existing local example:** *Ek Zindagi Teen Rastey*, an itch.io story about a Pakistani father making life hard for his college-going daughter. ([itch.io](https://pixelart-games-academy.itch.io/ek-zindagi-teen-rastey-one-life-three-paths)) It shows the family-pressure theme is relatable. **[REC]** Rahyaab should *not* make parents villains. The parents should be loving but anxious.

### Cast **[REC]**
6-8 named characters plus 2 inner voices. That's Persona-style but much smaller.
- **Ammi / Abbu.** Loving, anxious, "log kya kahenge". The parent's gender can match the player's choice of a closer parent.
- **Older sibling or cousin.** Already in FSc or university. They show the stream reality, good and bad.
- **Best friend (same gender as player)** and **friend (other gender, in school or academy context, kept platonic).**
- **A teacher or mentor** who notices you.
- **A neighbour, uncle or khala** with a small business or workshop. That gives Realistic/Enterprising options outside school.
- **A "new kid" or rival.**
- **The two inner voices,** e.g. *"Dil"* (what I'd enjoy) and *"Dimaagh/Duniya"* (what's expected). Give them personalities: Dil is impulsive and funny, Duniya is dry and practical, and they banter. Keep them *non-moral*: neither is the angel.

### Tone and avoiding cringe
- Mostly light humour with real but low stakes: a test, a friendship, a family dinner. Gen-Z responds to dry, self-aware humour, short lines and texting UI. Avoid adults writing slang. **[REC]** Have 3-5 real teens (a younger sibling's class) do a "cringe pass" on the dialogue.
- No moralising after choices. The game never says "good choice".
- **Equal girl/boy representation:** the player picks a name, pronoun (he/she) and avatar. Every activity is available to every gender (girls doing robotics or cricket, boys doing art or cooking). Only light flavour lines change by gender. Don't tie measured content to gender. **[REC]** Run a DIF check (does the item behave the same for boys and girls) on pilot data.

### Topics to avoid or handle carefully (minors, school deployment)
Avoid: romance or dating arcs, self-harm, suicide, abuse, drugs, religion/sect conflict, politics, ethnic stereotypes, explicit poverty-shaming, and parental violence. Handle gently or keep off-screen: exam stress, family financial pressure, load-shedding, gendered restrictions (show them only as something characters push back on in small ways). Add a "need to talk to someone?" resource screen in settings with Pakistani helplines, never triggered by gameplay data.

---

## 3. Measuring inside the story without breaking flow

### Stealth assessment and ECD
- Shute's stealth assessment extends Evidence-Centred Design (Mislevy, Steinberg & Almond 2003) with 4 models. The **competency model** is what you claim (RIASEC 6 plus 5 abilities). The **evidence model** says which in-game observables update which competencies, usually with Bayesian nets. The **task model** is a template you can create many tasks from. The **assembly model** sets how many tasks, which types, in what order. ([ACER](https://people.acer.org/en/publications/creating-stealth-assessments/), [Shute TICL 2010](https://myweb.fsu.edu/vshute/pdf/TICL2010.pdf), [Michigan Assessment Consortium primer](https://www.michiganassessmentconsortium.org/wp-content/uploads/LP_STEALTH_ASSESSMENT_IN_GAMES.pdf), [Shute lit review](https://myweb.fsu.edu/vshute/pdf/salitrev.pdf)) A 2021 review of 93 studies found most are still at the validation stage, so a validation study (correlation against a standard RIASEC inventory) adds real research value.
- **[REC]** Write a one-page ECD table for the FYP report: each observable (planner pick, voice pick, task metric) mapped to the construct, the scoring rule and the weight. That's what makes this a "Complex Computing Problem".

### Gutierrez et al.: RIASEC in an interactive narrative
- "The Use of Interactive Narratives in Educational Games to Assess Vocational Interests," Rommel Gutierrez et al., Universidad Internacional del Ecuador. An AI-driven interactive narrative where **each choice maps to one RIASEC dimension**. They ran a pre/post RIASEC test, a 12-item satisfaction questionnaire and interviews, with **n=30**. **Pearson r > 0.75 against the standard RIASEC test for all six types**. Five of six dimensions shifted significantly pre to post. Narrative (β=0.40) and vocational impact (β=0.38) predicted satisfaction most. ([PDF, UA doctoral conference 2026](https://web.ua.es/va/phdinf/documentos/jdi-2026/rommeljairgutierrezyepez.pdf)). I couldn't extract the PDF text, so these figures come from the search abstract. I also couldn't confirm the 2025 publication date; the hosting file is from 2026, so verify the venue before citing.
- **Implications:** (a) one choice to one type works as a baseline and is a direct precedent to cite; (b) n=30 is small, so Rahyaab can improve on it with forced-choice balancing and more items; (c) the pre/post *shift* suggests the game itself influences interests. Report that as both a benefit and a validity confound (measure early weeks separately).
- Related: *like2be*, a career-choice serious game tested with 809 adolescents in a quasi-experimental study ([Univ. Basel PDF](https://bildungswissenschaften.unibas.ch/fileadmin/user_upload/bildungswissenschaften/04_Forschung/Dokumente/Career-Choice-With-the-Serious-Game-Like2be.pdf)). Also a 2026 Brazilian game where players explore six RIASEC islands ([Univali](https://periodicos.univali.br/index.php/acotb/article/view/22308)), and an existing patent on inferring abilities and interests from gaming data ([USPTO 10315118](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10315118)), worth noting in related work.

### Forced choice to reduce faking
- Quasi-ipsative forced-choice is strong against faking on **personality** tests (Salgado & Lado 2018; Martínez, Salgado & Lado 2022). ([JWOP PDF](https://journals.copmadrid.org/jwop/archivos/articulo20181128161435.pdf), [DOAJ](https://doaj.org/article/f472fe79318f4ab78ad3a7168a566601)) For **interests** the evidence is mixed. In Cao's dissertation (n=1,559), people still inflated the interest domain that matched a target job under forced-choice, which lowered validity. ([Illinois IDEALS](https://www.ideals.illinois.edu/items/95487)) Graded forced-choice ("much more / slightly more") is more reliable and feels easier than dichotomous choice. ([Illinois blog](https://blogs.illinois.edu/view/6367/583462727))
- **Why this matters:** teens will try to fake toward "doctor/engineer". The fix is that **no option should visibly map to a stream**. Choices are about *activities and feelings*, never "Do you want to be an engineer?".

### Design rules for Rahyaab **[REC]**
1. **Two-voice choices are forced-choice pairs.** Each pair sets type X against type Y, both attractive and both with a cost. 6 types give 15 unordered pairs. Over 4 weeks, show each pair at least twice (30+ paired choices), so each type appears 10+ times. That's a balanced incomplete block design. Counterbalance which voice argues for which type.
2. **Don't fix "expected" = Investigative/STEM.** Otherwise "expected vs. enjoy" turns into "family pressure vs. own interest", not RIASEC. Rotate: sometimes Duniya pushes the art class ("it looks good on your CV"), sometimes Dil wants the physics experiment. Record *which voice* was picked as a **separate construct** (autonomy vs. conformity). That's a nice extra insight for the Blueprint ("You often follow Dil").
3. **Planner (pick 3 of 6)** is a ranking choice that's naturally ipsative. Each activity carries one dominant RIASEC type. Rotate the 6 options weekly so each type appears every week, and randomise screen position. Add a quick normative reaction after scenes (a 3-point "meh / okay / loved it" emoji), so scores aren't purely ipsative. Ipsative-only scores can't compare a person across types in absolute terms.
4. **Equal exposure:** log exposure count per type per player. The assembly model (scene selector) prefers storylets for under-sampled types and pairs whose posterior is still uncertain. That's adaptive testing in a story wrapper, and it's also what drives the meter.
5. **Hidden ability tasks (untimed):** one per week per ability is fine (5 abilities × 4 weeks = 20 instances from 5 task templates with different parameters). Story examples:
   - *Spatial:* pack the car boot for the trip to Nani's, or arrange chairs and stage for the cousin's mehndi (Unpacking-style). Measure moves to solution and rotations.
   - *Numerical:* split the chai/biryani bill with discounts, or work out phone package deals. Measure correctness and attempts.
   - *Logic:* who borrowed the cricket bat? Deduce from 4 chat messages. Measure correctness and clues opened.
   - *Planning:* schedule the class trip or iftar dawat cooking order. Measure optimality vs. the best solution.
   - *Verbal:* pick or edit the message that calms a group-chat fight, or choose the right word for the debate. Measure correctness.
   Wrap each task in in-world UI (phone screen, notebook, the car boot), with no score and no "correct!" screen. Outcomes play out in the story only ("Nani is impressed everything fit"). Always offer **"ask a friend to help"**. Score that as missing data, not as a failure. Difficulty can adapt across weeks.
6. **No rewind, no retries** on measured choices. Allow "change your mind" only on unmeasured cosmetic choices.
7. **Faking detection:** check consistency across repeated pairs, and flag answer patterns that are always left or always one voice.

---

## 4. Showing the model learning ("Rahyaab knows you" meter)

### Why "watching AI learn" works (AI Learns to Drive, NEAT videos)
Improvement is visible over generations. The inputs are shown (ray sensors). Early failures are funny and endearing. You see it's *learning*, not just that it's *done*. Sources: section 0.

### Research on showing uncertainty to non-experts
- Lay users often don't realise a graphic shows uncertainty at all ("deterministic construal error"). Including uncertainty *increases* trust. ([Joslyn & Savelli 2021, Frontiers](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2020.590232/full))
- Low-precision displays are enough for lay users. Categorical labels can be misread if the thresholds aren't explained. ([Bhatt et al., "Uncertainty as a Form of Transparency"](https://arxiv.org/pdf/2011.07586))
- Frequency framing ("in 10 versions of you...") and sample-based displays (hypothetical outcome plots) work well for general audiences. ([Hullman seminar](https://planitpurple.northwestern.edu/event/561860), [Tableau research summary](https://www.tableau.com/fr-ca/blog/exploring-data-uncertainty-through-speech-text-and-visualization))

### [REC] Meter design
1. **Tie the meter to the real posterior.** For example, use 1 − normalised entropy over the top-3 stream ranking, or the average SD reduction across the 6 RIASEC types. The meter can *go down* when a choice contradicts earlier ones. Say so: "Hmm, that surprised me." Honesty is the hook. A meter that only goes up is a fake progress bar.
2. **Show *why* it moved** (the "visible sensors" from AI Learns to Drive): a small toast after a choice, e.g. "Rahyaab noticed: you picked building over performing again." Keep it vague enough to avoid teaching players to game it. Name the activity, not the RIASEC letter.
3. **A constellation that sharpens.** A 6-point star or blob (RIASEC hexagon) starts as a fuzzy cloud and gets sharper with evidence. That's the "watching it learn" visual, like generations of cars. Optional weekly replay: "Week 1 me vs. Week 3 me".
4. **Personified, humble model voice.** Rahyaab speaks as a curious friend: "I'm still torn between ICS and Pre-Eng for you. Week 3 should tell me." Never claim certainty it doesn't have.
5. **Blueprint uses frequency framing.** "In 10 versions of you that I simulated, 6 fit ICS best, 3 Pre-Eng, 1 Humanities." Show the top 3 with *reasons* tied to remembered scenes. Make it a shareable card (Stick A Round "artefact shaped like you"). Add the disclaimer "a starting point to talk with your family and teachers, not a verdict".
6. **Never use the meter as a reward or an engagement lever.** Don't make "play more to fill it" a demand. Each week has natural closure.

---

## 5. Content scope and tools for a 3-person student team

### Structure patterns (Sam Kabo Ashwell)
Time cave (many endings, wasteful), gauntlet (easiest to write), **branch and bottleneck** (branches rejoin, needs state tracking), quest, open map, sorting hat (most expensive), **floating modules / storylets** (flexible, needs lots of content), **loop and grow** (reuses a repeating structure, needs a story reason to repeat). ([Standard Patterns in Choice-Based Games](https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/))
**[REC]** Use **loop and grow + branch and bottleneck + a small storylet pool**. The week loop repeats (plan, then 3 activity scenes, then 1 story beat, then recap). Inside it, scenes come from a pool by prerequisite. Every week rejoins at a fixed story beat. Story variation comes from variables and callbacks, not separate branches.

### Lessons from inkle's *80 Days* postmortem
Core team of 3 plus contributors. The plan was 3 months and it took 9. Keep a **small set of global state variables** and everything else local. **Episodic/modular content** so writers can work out of order. Prototype risky mechanics early (their conversation system was late and costly). Ship a feedback button that attaches the save. Test with more than 7-8 friends. ([Game Developer postmortem](https://www.gamedeveloper.com/business/postmortem-inkle-s-i-80-days-i-))

### [REC] Content budget (MVP = 4 weeks to Blueprint; stretch = 6-8 weeks)
| Item | MVP | Notes |
|---|---|---|
| Weeks | **4** (plus a 1-minute prologue to build your character) | Stretch: up to 8 more for "refine your Blueprint" |
| Activities | 6 per week from a pool of **~12** activities (2 per RIASEC type) | Each activity has a scene per week = 12 × 2 variants ≈ **24 activity scenes** (variant chosen by relationship rank or week) |
| Story-beat scenes (bottlenecks) | **4** (one per week) + prologue + Blueprint reveal = **6** | Fixed beats: first day back, the cousin's wedding, the science fair or debate, results day / Blueprint |
| Hidden task templates | **5** (one per ability), with 4 parameter sets each | Code, not writing. Each needs a short scene wrapper (~10 lines) |
| Paired inner-voice choices | **~32** (15 pairs × 2, plus spare) | Placed inside the scenes above. About 2 per scene |
| Characters | **6-8** + 2 voices | ~4 portrait expressions each (neutral, happy, annoyed, worried) |
| Lines | Scenes average ~30 lines: (24 + 6 + 20 × 0.3) × 30 ≈ **1,100-1,300 lines, ~12-18k words** | 80 Days is far bigger (it added 200k words *after launch*), so this is realistic for 1 writer over ~2 months |
| Languages | English UI + Roman Urdu/code-switched dialogue in **one script** for MVP | A full English-only version doubles dialogue, so treat it as stretch |

Team split: 1 writer/narrative designer (ink scripts, cast), 1 RN/front-end developer (planner UI, scene player, tasks), 1 ML/assessment developer (ECD scoring, posterior, meter, Blueprint, validation study). Everyone writes some scenes.

### Narrative tool: **Ink (inkle) + inkjs**. Recommended.
- inkjs is a pure-JavaScript port of the ink runtime, community-maintained (y-lohse, ephread), usually one version behind ink. You load the compiled JSON, call `Continue()`, and read `currentChoices`. `inkjs/full` also includes the compiler. ([inkjs docs via context7](https://context7.com/y-lohse/inkjs/llms.txt?tokens=10000), [Videlais: JavaScript + Ink Story API](https://videlais.com/2019/05/27/javascript-ink-part-2-story-api/)) JS API docs are thin, so use the C# API docs as reference.
- Why it fits React Native: no DOM dependency. Bundle the `.json` and render text and choices with your own RN components. ink was used to build 80 Days and Heaven's Vault, is open source and widely used. ([GDC Vault: Ink talk](https://gdcvault.com/play/1022944/Ink-The-Narrative-Scripting-Language), [inkle press](https://www.inklestudios.com/press/))
- **How it works for Rahyaab:**
  - **Tags** carry measurement metadata on choices or lines, e.g. `* [Help Chachu fix the motorbike] #riasec:R #pair:R-A #voice:dil`. The app logs tags to the assessment engine, so the writer never touches scoring code.
  - **Variables** handle relationship ranks, energy, callbacks. **External functions** trigger hidden tasks (`~ startTask("spatial", 2)`) and the meter.
  - **Save/resume:** `story.state.toJson()` and `loadJson()`, stored in AsyncStorage/MMKV after each choice. Inky state isn't immutable-store friendly, so wrap it like the ink-processor project does ([frontispiece ink-processor](https://gitfront.io/r/user-6815634/CHTgEJdEMj3G/frontispiece/tree/packages/ink-processor/)). Keep Redux/Zustand for *game* state and ink JSON as an opaque blob.
  - **Inky** is the free editor for writers (live preview). Compile in CI with inklecate or the `inkjs/full` compiler, and fail the build on ink errors.
  - **Localisation:** ink has no built-in string tables. Options: (a) one `.ink` file per language with the same knot/choice structure (simple, MVP); (b) a line-ID tag (`#id:w2_cricket_014`) with an external lookup. Use (a) for MVP.
- **Alternatives:** Yarn Spinner's official runtime is Unity/C#. The JS ports (bondage.js, yarn-bound) are community projects, not fully Yarn 2 compliant, and yarn-bound was last updated Oct 2023. ([bondage.js](https://github.com/4ian/bondage.js), [yarn-bound npm](https://npmjs.com/package/yarn-bound)) **Twine** is fine for paper prototypes and playtests in week 1, but it isn't built to embed in an RN app. **Use Twine or paper to prototype, ink for production.**
- **Branching management:** one `.ink` file per week plus `characters.ink` and `globals.ink`. Name knots `w2_cricket_v1`. Keep a spreadsheet (or a generated script) that lists every choice tag, so you can check RIASEC pair coverage automatically. Add a CI check that each type appears at least N times per week.

---

## 6. Session design (5-minute week, return without dark patterns)

### Dark patterns to avoid
Free children's games commonly use temporal, monetary and psychological dark patterns (periodic rewards like gambling, paywalls) with weak parental controls ([Oliveira 2023, ECGBL](https://papers.academic-conferences.org/index.php/ecgbl/article/view/1656)). They're common even in "benign" mobile games ([Niknejad et al., MUM '24](https://www.arxiv.org/abs/2412.05039)). Streaks work through loss aversion and are linked to problematic phone use in teens (Snapchat streaks) ([UOW explainer](https://www.uow.edu.au/media/2024/the-design-tricks-keeping-your-kids-hooked-on-games-and-apps.php)). Catalogue: [deceptive.design on mobile games](https://deceptive.design/articles/level-up-or-game-over-exploring-how-dark-patterns-shape-mobile-games). Spanish youth study on FOMO and play-by-appointment ([Arnedo-Moreno 2026](https://indexcomunicacion.es/index.php/indexcomunicacion/article/download/2387/2397/32781)).

### [REC] Session loop (~5 min per week)
1. **Monday, Plan (45 s):** a bedroom-desk calendar. 6 activity cards, drag 3 into slots, energy bar fills. One tap shows "who'll be there".
2. **Scenes (3 × ~60 s):** visual-novel bubbles with 1-2 inner-voice choices each. One scene per week may contain a hidden task (~60-90 s, untimed).
3. **Friday, story beat (~45 s):** the bottleneck scene, with callbacks to earlier choices.
4. **Sunday, Diary recap (20 s):** meters changed, a relationship rank-up, the Rahyaab meter with one "what I learned" line, and a short **preview hook** for next week ("Next week: Fatima's cousin's mehndi, and the robotics club is recruiting").
- **Save:** autosave after *every* choice (ink state + game state). Resume puts you mid-scene with a one-line "Previously...". Real-life interruptions (calls, load-shedding) are normal, so this is essential.
- **Session boundary:** one week = one chapter, with a natural stopping point and a "come back whenever" message. Allow playing several weeks in a row, but suggest a break after 2 weeks ("Rahyaab learns better when you've lived a little. See you tomorrow?"). Optional, not enforced.
- **Return hooks that are fine:** cliffhanger previews, relationship scenes about to unlock, the Blueprint payoff in week 4, a shareable Blueprint card, and optional local notifications (opt-in, at most 1 per day, story-flavoured: "Bilal: match kal hai, aa rahe ho?").
- **Not allowed:** streaks, real-time energy timers (in-game energy is diegetic only), daily login rewards, loot boxes, ads, paid choices, FOMO events, guilt messages, any monetisation (it's a school/FYP tool anyway).
- **Pacing across 4 weeks:** week 1 is onboarding (planner explained in-world by the older sibling, a very easy task). Week 2 adds the energy limit and time-gated friends. Week 3 brings the first consequence callbacks and a clash between voices. Week 4 is the emotional climax (results day or the event) and the Blueprint reveal.
- **Playtesting:** 80 Days found 7-8 friendly testers weren't enough. Plan 2 playtest rounds with 10-15 teens from different schools/cities, and include a feedback button that attaches the save, as 80 Days did.

---

## 7. Top 10 mechanics and techniques (summary)
1. **Persona-style school-year calendar** with time-gated friends, implemented as a Citizen Sleeper-style weekly budget (pick 3 of 6, energy 10).
2. **Two-sided bars** (Reigns): Wellbeing and Family expectations hurt at both extremes, so there's no "max it" answer.
3. **Inner voices as balanced forced-choice pairs** (Shouldermen personalities, but pre-written). Counterbalance RIASEC pairs across voices, and log voice choice as a separate autonomy signal.
4. **Balanced exposure assembly model:** a storylet selector that prefers under-sampled types and uncertain pairs (ECD and adaptive testing).
5. **Mechanics-as-metaphor hidden tasks** (Florence, Unpacking) in in-world UI, untimed, no score, outcomes only in the story, plus an "ask a friend" option.
6. **Callbacks instead of warnings,** no rewind on measured choices (fixing Life is Strange's flaws).
7. **Loop and grow + branch and bottleneck** structure with ink variables. Small global state (80 Days).
8. **Honest learning meter** tied to the real posterior. It can go down, explains *why* it moved, and uses a sharpening constellation (AI Learns to Drive feel).
9. **Blueprint as a crafted artefact** (Stick A Round) with frequency framing ("6 in 10 versions of you...") and reasons from remembered scenes. Shareable.
10. **Cosy, non-monetised 5-minute week** with a diary recap and preview hook. No streaks, timers or paid choices (anti-Episode).
