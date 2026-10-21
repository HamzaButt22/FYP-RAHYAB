# Game Guide: Goals, Controls, and Recorded Data

This guide describes the current browser game in `index.html`. It is an exploratory activity, not a validated RIASEC assessment. The game does not measure ability or determine career suitability.

## How the stations work

You can choose any station, leave it, and replay it. Each mission displays its goal, a live progress counter, and task status. Leaving a mission ends that attempt; its partial progress does not carry into the next play. The session still records that you started it. A completed mission is counted as a completion.

| Station and theme | Goal and controls | What happens in the game | Why this theme is used |
| --- | --- | --- | --- |
| **Forge (R - Realistic)** | Click 12 blue cores. Avoid red cores. | Each wave has exactly 12 blue cores and 4 red hazards. A red click removes one collected core, down to zero. There is no timer. | The task uses direct interaction with visible objects and a practical target. |
| **Signal Lab (I - Investigative)** | Watch seven relays flash, then click the same sequence using A, B, C, and D. | A wrong relay resets the sequence to its beginning. There is no response deadline. | The task involves observing, remembering, and reproducing a pattern. |
| **Studio (A - Artistic)** | Click 15 drifting lights. | Each light changes the mural's color. There is no wrong answer or timer. | The task gives an open-ended visual activity with a changing result. |
| **Guide (S - Social)** | Give nine support boosts by clicking SUPPORT under a crew member. | The crew member with the lowest energy gets the largest boost. Other choices still count, but give a smaller boost. Energy drains slowly and cannot end the mission. | The task centers on noticing other characters' needs and choosing whom to help. |
| **Market (E - Enterprising)** | Click 14 gold orders before they disappear. | Each order stays available for 3.5 seconds. Missing an order resets the streak, but the mission continues. | The task presents brief opportunities and asks the player to act on them. |
| **Queue (C - Conventional)** | Read each parcel label and click FOOD, TOOLS, or BOOKS. Sort nine parcels. | A wrong depot does not advance progress. There is no timer. | The task uses labels, categories, and a repeatable sorting rule. |

These are design choices that associate game activities with broad RIASEC themes. They have not been validated as measures of those themes.

## What the activity records

The browser keeps activity in memory during a session. When the results page opens, it attempts to send a session summary to the local Python server. The server appends eligible event records to `example_session_log.jsonl` and writes a per-session JSON file under `sessions/`. Opening `index.html` directly or using a static file server does not provide the save endpoint.

The session summary includes station starts, completions, error counts, and descriptive per-game features. Eligible event records can include station inputs, mistakes, hint use, and Studio pointer-path summaries. Event telemetry is retained only during the 15%-85% telemetry progress window. Timing values are normalized against the optional controls practice when available; they are exploratory and are not measures of cognitive speed. Studio path data is a computed summary, not a recording of the pointer's full path.

## How the snapshot is calculated

The snapshot assigns each station 1 point for every play started and 1.5 additional points for every completed mission. It converts each station's points into a percentage of the points across all six stations and lists the highest percentages first. The three leading station letters form the displayed exploratory code. Tied percentages retain the station order used by the game. With no plays, all station percentages are zero and the displayed ordering has no meaning.

The snapshot ranking does not use reaction time, input cadence, mistakes, hints, pointer paths, or the feature-extraction output. Those data do not indicate good or bad performance. The report describes choices and completions in this play session; it is not a validated Holland Code, an ability score, a diagnosis, or career advice.
