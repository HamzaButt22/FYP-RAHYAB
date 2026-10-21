# RahYaab - Game-Based Big Five Assessment (FYP prototype)

```
Player plays a game -> game records telemetry -> telemetry becomes behavioral features -> Big Five (OCEAN) estimate
```

A complete, runnable pipeline: a Pygame game with four behavioral scenarios, a persistent SQLite telemetry store, an automatic
cleaning -> feature-extraction -> OCEAN-scoring pipeline, an in-game results report and a Flask dashboard.

> **Psychometric status - read this first.** The scoring engine is a *transparent weighted prototype*. Its weights and
> feature ranges (`analytics/scoring_config.json`) are design assumptions, **not** fitted to validated data. Results are
> behavioral indicators from one short session, not a validated Big Five measurement or a diagnosis. The code is built so
> a statistical model trained on gameplay + a validated questionnaire can replace it (see *Calibrating* below).

## Quick start (Windows)

```bat
git clone <your-repo-url>
cd RahYaab-BigFive-Game
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

`python run.py` starts the **dashboard** (http://localhost:5000, opens in your browser) **and** the **game window**.
Needs Python 3.10+ (tested on 3.13). macOS/Linux: `source venv/bin/activate`.

| Command | What it does |
|---|---|
| `python run.py` | dashboard (background) + game |
| `python run.py game` (or `python game/main.py`) | game only |
| `python run.py dashboard` (or `python backend/app.py`) | dashboard only, http://localhost:5000 |
| `python run.py demo 12` | 12 scripted bots play the **real game** headlessly to fill the database (good for the supervisor demo) |
| `python run.py test` (or `pytest`) | automated tests |
| `docker compose up` | dashboard in Docker (the game window runs on the host) |

Data lives in `data/rahyaab.db` (SQLite, created automatically). Override with the `RAHYAAB_DB` environment variable.

## Demo script for the supervisor

1. `python run.py` -> **New Assessment**, enter a name, play the four levels (about 8-12 minutes). Press `P` to pause.
2. After level 4 the game *automatically* processes the telemetry and shows **Your Personality Profile** (arrows to switch
   traits and read the behavioral evidence), then `Enter` -> **Telemetry Analytics** (play time, decisions, average decision time,
   exploration / risk / helping / retry rates, strategy changes, errors). `X` saves a JSON report to `data/reports/`.
3. In the browser dashboard: Dashboard -> your player -> *Details* (OCEAN scores, all features, evidence, charts) and
   *Raw events* (every stored telemetry row with its JSON metadata).
4. Optional: `python run.py demo 12` first, so the dashboard also shows a population.

Controls: move `WASD`/arrows, interact `E`/Space, choices `Up/Down + Enter` or number keys, pause `P`.

## The four scenarios

| # | Level | Scenario | What the player can do | Main telemetry (examples) | Construct (indicator only) |
|---|---|---|---|---|---|
| 1 | Whispering Valley | Exploration | follow the marked road, or visit 6 optional areas, try 8 unusual objects, cross a rickety bridge, open a mystery chest | `EXPLORATION`, `PLAYER_MOVE` (grid cells), `PLAYER_INTERACTION(novel)`, `RISK_ACTION`, `REWARD_SELECTED` | Openness |
| 2 | Workshop | Planning, limited resources | build immediately, or inspect board/shelf and use the planning table; make mistakes, reset, retry, gamble the bonus | `RESOURCE_USED`, `ERROR`, `RETRY`, `STRATEGY_CHANGE`, `LEVEL_FAILED`; planning time | Conscientiousness |
| 3 | Harbor Village | Social | 3 villagers approach (ignore / help / share / cooperate / negotiate / compete), 3 wait until *you* start talking; chat | `NPC_INTERACTION`, `HELP_ACTION`, `SHARE_ACTION`, `COOPERATION_ACTION`, `COMPETITION_ACTION` | Extraversion, Agreeableness |
| 4 | Crumbling Vault | Pressure and uncertainty | countdown; scan / re-scan locks, safe bypass vs forcing a lock, laser corridor, surprise tremor, fail on timeout and retry | decision latency, option changes, `PLAYER_INTERACTION(recheck)`, `FAILURE`, `ENV_EVENT`, tremor reaction | Neuroticism-related stress indicators |

No question ever asks about personality. The evidence is behavior; no single action is treated as proof of a trait.

## Architecture

```
game/            Pygame client: app.py (state machine), levels/, ui/, telemetry/ (logger + game clock), session.py
backend/         Flask: app.py (factory), routes/ (api, pages), services/, database/ (db.py, repository.py = ALL SQL)
analytics/       event_schema -> cleaning -> feature_engineering -> personality_scoring (+ report, summary, pipeline, train_model)
database/        schema.sql (tables created automatically at start-up)
dashboard/       templates + static (dependency-free SVG charts; works offline)
tools/           bots.py (scripted players), generate_demo_data.py, make_fixture.py
tests/           pytest suite + fixtures/dummy_telemetry.json (real telemetry from bot playthroughs)
```

Pipeline (`analytics/pipeline.py`, run automatically when the assessment ends): raw events -> `clean_events` (validation,
dedupe, cap AFK decision times) -> `extract_features` -> `PersonalityModel.predict` -> evidence text -> stored in
`behavioral_features` / `personality_results`.

**Tables:** `players`, `sessions`, `levels`, `game_events` (typed columns + JSON `metadata`), `behavioral_features`,
`personality_results` (all with foreign keys). Event timing uses a pause-safe *game clock*, so paused time never counts as thinking time.
Events are also mirrored to `data/telemetry_backup/<session>.jsonl`.

PostgreSQL later: only `backend/database/db.py` (connection) and `repository.py` (SQL) touch the database.

### Features (all formulas, no randomness)

exploration: `exploration_rate` = optional areas visited / 6, `route_diversity` = map cells covered / 77, `novel_action_rate` = unusual objects tried / 8,
`strategy_diversity`, `novel_choice_rate` - planning: `planning_time` (s before first build), `resource_efficiency` = best reward / brute-forced optimum,
`strategy_consistency`, `completion_rate`, `error_rate` = errors / actions, `retry_rate`, `task_persistence`, `persistence_rate`, `failure_recovery_rate`,
`strategy_change_rate` - social: `social_interaction_rate`, `interaction_initiation_rate`, `social_engagement_depth`, `helping_rate`, `sharing_rate`,
`cooperation_rate`, `competition_rate` - risk/pressure: `risk_taking_rate`, `risk_avoidance_rate`, `pressure_latency_ratio`, `decision_change_rate`,
`repeated_checking_rate`, `mean_recovery_time_s`, `erratic_movement_rate`, `post_event_reaction_s` - decisions: `average_decision_time`,
`decision_time_variance`, `decision_time_cv`. A feature is omitted when the player never had the opportunity; scoring re-normalises over the evidence
present and reports **coverage** (traits with coverage < 40% are flagged "not enough data").

### Scoring (prototype)

`score(trait) = 100 * sum(w_i * u_i) / sum(|w_i|)` over available features, `u_i` in [0,1] (min-max ranges from the config, inverted for negative weights).
Bands: 0-39 Low, 40-69 Moderate, 70-100 High. Weights per trait are in `analytics/scoring_config.json`.

### Calibrating / replacing the model later

1. Collect gameplay (features are stored in `behavioral_features`) **plus** a validated questionnaire (e.g. BFI-2) per participant.
2. Build a CSV: one row per participant, feature columns + `openness ... neuroticism` (0-100), then
   `python -m analytics.train_model --csv data/training.csv --questionnaire-validated`
3. `set RAHYAAB_MODEL=ml` (Windows) - `get_model()` now returns `MLPersonalityModel`; the game, dashboard and API are unchanged.
   A model is only marked `validated` with >= 100 participants and cross-validated R^2 >= 0.10 (prints per-trait R^2).

## Verified in this build

Automated tests (61) cover the telemetry logger, DB inserts/foreign keys, feature formulas on hand-built event streams, normalization,
OCEAN calculation, the ML drop-in model, session completion, every API endpoint and dashboard page, and full headless playthroughs of the
**real game code** by five scripted personas (state transitions, pause/resume, retry flow, report export). The scripted personas also confirm
that different behavior gives different features and profiles (e.g. the "explorer" scores higher Openness than the "planner").

Not verified here: this build was developed in a headless Linux container, so the pygame window was exercised with SDL's dummy video driver
(rendered frames inspected as screenshots, key events injected through the real input code) rather than on a physical Windows display.
Please do one manual playthrough on your laptop.

## Known limitations (be upfront about these in the report)

* Weights are assumptions; the scenarios have not been validated against questionnaire scores. Treat results as a *prototype*.
* Neuroticism is the weakest inference (a short timed game is a weak proxy for emotional reactivity) and is marked low-confidence.
* Scripted bots are behavioral *tendencies*, not people; they demonstrate that the pipeline discriminates behavior, not that the model is accurate.
* Conscientiousness separates least between players in the prototype (completion/efficiency are high for most) - a good first thing to calibrate.
* Single session, single language, keyboard only.
