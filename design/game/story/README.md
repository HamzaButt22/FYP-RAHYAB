# Writing story scenes for the app (Ink)

The app plays story scenes written in [Ink](https://www.inklestudios.com/ink/) (ADR-0009). Write `.ink` files in this folder; the app compiles and bundles them. `sample.ink` is a working example (the practice prologue); it is **not game content**.

## Tags the app reads

| Tag | Where | What it does |
|---|---|---|
| `#speaker:Hudhud` | On a line (or alone on the line above it) | Shows the speaker's name above the line. No tag: the narrator. |
| `#item:w1_radio` | On the line just before a choice | The item id the choice is recorded under. Letters, digits and `_ - . :`, up to 64 characters. |
| `#type:R` | Inside each option of a two-way interest choice: `* [Fix the radio #type:R]` | The RIASEC type (R, I, A, S, E, C) that option stands for. |

**A choice is measured only when it has exactly two options, each with a different `#type`.** It is then recorded as `choice_made` with the pair (for example `R-S`), the type picked, which option it was (first or second) and the time taken. Every measured choice needs an `#item` tag. Choices without `#type` tags just move the story on and are not recorded.

```ink
=== week1_saturday ===
#speaker:Hudhud
It's Saturday. Your cousin and your best friend both need you.
Which would you rather do? #item:w1_saturday
* [Fix the radio at home #type:R]
    You open the back of the radio. Click. Music!
* [Help a friend study #type:S]
    You explain fractions with slices of roti.
-
-> DONE
```

## Rules

- **One scene = one knot** (`=== name ===`), ending in `-> DONE`. A week-plan step plays one knot: `{ module: 'ink-story', params: { story: 'sample', knot: 'prologue' } }`.
- **Plain English** at about Grade 6 (ADR-0016). Every line can be read aloud, so write it as it should sound.
- **No right or wrong options.** Both sides of a measured choice should be equally attractive and equally respectable.
- **Pairs follow `design/game/frameworks/pairs.json`**: across the four weeks each pair appears at least twice and each type at least 10 times.
- The student's place inside a scene is saved after every choice, so a scene can be left and resumed. Variables do not yet carry over between scenes; tell Hamza when a callback needs them.

## Compile and check

In `frontend/mobile`:

```bash
pnpm ink
```

```bash
pnpm test
```

`pnpm ink` compiles every story here to `frontend/mobile/src/game/stories/<name>.ink.json`. `pnpm test` fails if:
- a story has Ink errors, or its compiled file is out of date;
- a `#type` choice cannot be measured (not exactly two options with different types);
- a measured choice has no `#item`;
- an item is missing from the development content pack (`database/seed/dev_seed.sql`). Add new items there until real content packs exist (RFC-0001).

To try a scene on a phone, open Home → **Game lab** (development builds) and play **Story scene (Ink)**. The lab shows exactly what each choice records.
