# Arcade Career Explorer

Arcade Career Explorer is a small browser game with six short activities inspired by the RIASEC themes. Its result is an exploratory summary of station choices and completions, not a validated assessment or career recommendation.

## Run locally

1. From this folder, run `python riasec_career_game.py`.
2. Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser.

To use another port, run `python riasec_career_game.py --port 8080` and open `http://127.0.0.1:8080/`. The Python server is needed to save a session. Opening the HTML file directly or serving it with a static server does not provide the save endpoint.

## The six stations

| Station | Theme | Mission |
| --- | --- | --- |
| Forge | Realistic (R) | Collect 12 blue cores and avoid red hazards. |
| Signal Lab | Investigative (I) | Watch and repeat a seven-relay sequence. |
| Studio | Artistic (A) | Collect 15 drifting lights to change a mural. |
| Guide | Social (S) | Give nine support boosts to a crew. |
| Market | Enterprising (E) | Collect 14 gold orders before they disappear. |
| Queue | Conventional (C) | Sort nine labeled parcels into three depots. |

The results page gives each station 1 point per play and 1.5 additional points per completion, then displays within-session percentages. Timing and error data do not affect this ranking. The game does not score ability, diagnose a condition, or recommend a career. See [GAMEPLAY_AND_RESULT_GUIDE.md](GAMEPLAY_AND_RESULT_GUIDE.md) for the exact rules, what the game records, and how the result is calculated.

## Local data

When the results page opens, the browser sends a session summary to the local server. The server appends eligible event records to `example_session_log.jsonl` and writes a session snapshot under `sessions/`. The game does not ask for names or contact details; avoid entering personal information in the project or browser.

## Project files

- `index.html` - game, stations, and results page
- `riasec_career_game.py` - local web server and telemetry receiver
- `GAMEPLAY_AND_RESULT_GUIDE.md` - station rules, recorded data, and result calculation
- `feature_engineering.py` - descriptive feature extraction for event logs; its output does not calculate the browser snapshot ranking
- `telemetry_schema.json` - accepted event fields
