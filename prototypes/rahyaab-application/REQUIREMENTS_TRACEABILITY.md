# RahYaab - requirements traceability

Status of every requirement from the requirements document, where it is implemented and how it was verified.
**Server** = RahYaab Flask server (`rahyaab` repo). **App** = this React Native app. All tests listed were run and pass:
server 231 (pytest), app 167 (Jest), browser end-to-end `e2e/requirements.e2e.js` against the real server.

Legend: ✅ done · 🟡 partly / by configuration · ❌ not done

## Actors

| Actor | Implementation |
|---|---|
| Student (grades 9-12) | `STUDENT`: **school students** (created by their school admin) and **individual students** (register themselves, subscription activated by RahYaab) |
| Administrator | `SCHOOL_ADMIN` (own school only) and `PLATFORM_ADMIN` (RahYaab team: content, subscriptions, statistics, export). The platform admin is created only from the command line: `python -m tools.create_admin` |
| Counselor / parent | out of scope (as the document recommends) |

## Functional requirements

| ID | Requirement | Status | Where | Verified by |
|---|---|---|---|---|
| FR-1.1 | Register (name, email/username, password) | ✅ | Server `POST /api/app/auth/register`; school students added by school admin (username or email). App `Auth.js` | `test_individual_registration…`, `test_registration_validates_input`, E2E |
| FR-1.2 | Login, logout, password reset | ✅ | Tokens (hashed, 30 days), logout revokes. Reset: **school students** - code from school admin; **individual students** - emailed code + reset web page. App `Auth.js` | `test_login_logout_and_me`, `test_school_admin_reset_code_flow`, `test_email_reset…`, `test_web_reset_page`, E2E (both resets) |
| FR-1.3 | Grade 9-12, age, gender (opt.), school (opt.) | ✅ | `users` table; register + profile screens | `test_registration_validates_input`, E2E |
| FR-1.4 | Consent/information screen; school or guardian consent | ✅ | App `Assessment.js > Consent` (what is collected and why); server requires it and stores version + time; individual students under 18 also need guardian agreement; school students covered by school consent | `test_start_needs…consent`, `test_school_students_rely_on_school_consent…`, Jest consent tests, E2E |
| FR-1.5 | View and edit profile | ✅ | `GET/PATCH /api/app/me`; App `Profile.js`; role, school, subscription cannot be self-edited | `test_profile_view_and_edit`, E2E |
| FR-2.1 | Introduction and tutorial before each game | ✅ | App Part 1 intro card; the Adventure shows a briefing (goal + controls) before every level and has Instructions | game module UI tests, E2E |
| FR-2.2 | Small set of games eliciting Big Five indicators | ✅ | Adventure levels 1-6 (official). The 5 mini-games remain as practice only | module parity tests (identical to the desktop game) |
| FR-2.3 | Pause, resume, save progress | ✅ | Game: pause button, autosave every 2 s, resume after the app is killed. Questionnaire: every answer saved on the server, resume at first unanswered. One open assessment per student | module tests, `test_answers_are_saved_as_you_go…`, Jest questionnaire tests, E2E (resumed at question 13) |
| FR-2.4 | Record gameplay events with timestamps | ✅ | Every action (decisions, response times, retries, errors, exploration, completion) uploaded to `game_events` | module + server tests |
| FR-2.5 | Detect invalid / low-effort sessions | ✅ | Flags: `fast_decisions`, `too_short` (game), `same_answers`, `too_fast` (questions); abandoned sessions marked. Shown kindly to the student, counted for admins, in the export | `test_quality_checks`, `test_low_effort_answers_are_flagged…`; seen live in the E2E (robot answered too fast) |
| FR-2.6 | Retake; attempts stored separately | ✅ | New row per attempt in `app_assessments` | `test_retakes_are_stored_separately…` |
| FR-3.1 | Store raw gameplay logs | ✅ | `game_events` (server) | server tests |
| FR-3.2 | Extract behavioural features | ✅ | `analytics/feature_engineering.py` -> `behavioral_features` | existing server tests (126) |
| FR-3.3 | Map features to Big Five with a defined method | ✅ | `analytics/scoring_config.json` (transparent weighted prototype, see `docs/SCORING_METHOD.md`); score computed on the server from stored telemetry, never from the phone | scoring tests, `test_game_session_links_once…` |
| FR-3.4 | Normalise, show Low/Moderate/High | ✅ | Levels + descriptions per trait; unmeasured traits shown as "Not enough data" | `test_full_flow…`, Jest results tests |
| FR-3.5 | Store scoring/mapping versions | ✅ | Each result stores Big Five model version, recommendation rules version, RIASEC item version, career field version, consent version; results are snapshots and never change later | `test_old_results_keep_the_content…` |
| FR-4.1 | RIASEC questionnaire, grade-appropriate wording | ✅ | 24 items (your app's wording), editable by the platform admin | `test_items_do_not_reveal…` |
| FR-4.2 | Rating scale | ✅ | 5 points: Not at all … Very much | same |
| FR-4.3 | Save progress, no submission with gaps | ✅ | Saved per answer; submit refused while any item is missing (server and app) | `test_submit_needs_the_game_and_every_answer`, Jest |
| FR-4.4 | Six scores + top-three Holland code | ✅ | `app_assessment.riasec_profile` (identical to the app's formula) | `test_riasec_scoring_and_holland_code_match_the_app` |
| FR-5.1 | Keep Big Five and RIASEC separate until recommendations | ✅ | Stored and shown separately; combined only in `recommend()` | `test_full_flow…` |
| FR-5.2 | Weighted mapping, RIASEC primary | ✅ | 70 % RIASEC, 30 % Big Five (`analytics/recommendation_config.json`); identical to the app's original engine | `test_recommendations_match_the_apps_engine_exactly` (3 reference cases from your `scoring.js`) |
| FR-5.3 | Explanation per field | ✅ | Plain-language "why" + "How was this worked out?" (exact numbers, weights, formula) | `test_explanations_are_traceable…`, E2E |
| FR-5.4 | Skills and pathways per field | ✅ | 11 fields with skills and pathways, editable | same |
| FR-5.5 | Pathways tailored to grade | ✅ | Grades 9-10: Matric subject groups; 11-12: Intermediate / A-Levels, degrees, entry tests | `test_explanations…pathways_follow_the_grade` |
| FR-5.6 | Guidance wording, never definitive | ✅ | "Fields that may suit you", "may suit you; explore it before deciding" | text checked in tests |
| FR-6.1 | Personality profile chart + short descriptions | ✅ | Radar chart + bars + level + description per trait | Jest results test, E2E screenshot |
| FR-6.2 | RIASEC profile | ✅ | Bars, code, description per type | same |
| FR-6.3 | Fields, skills, pathways | ✅ | Result screen | same |
| FR-6.4 | Disclaimer | ✅ | On every result (server-provided text) | same |
| FR-6.5 | Previous results | ✅ | History tab (server) | `test_retakes…history`, E2E |
| FR-6.6 | Rate usefulness / accuracy | ✅ | Two 5-star ratings + optional comment; averages for admins; ratings (not comments) in the export | `test_feedback…`, E2E |
| FR-6.7 | (Optional) PDF download | ❌ | Not built (Could). Possible next step with `expo-print` | - |
| FR-7.1 | Admin manages RIASEC questions | ✅ | Platform admin: add, edit, hide; each type keeps at least 2 active questions | `test_manage_riasec_questions`, E2E |
| FR-7.2 | Admin manages fields/skills database | ✅ | Platform admin: add, edit, hide fields incl. skills + both pathway lists, validated | `test_manage_career_fields`, E2E |
| FR-7.3 | Usage statistics | ✅ | Platform: users, schools, subscriptions, assessments by status, completion, flags, ratings, per school. School admin: own school only | `test_platform_statistics`, `test_school_statistics` |
| FR-7.4 | Anonymised export | ✅ | ZIP of CSVs: pseudonyms (keyed hash), age bands, no names/logins/emails/schools/comments; one-time 5-minute link; spreadsheet-formula protection | `test_anonymised_export`, `test_export_cells_cannot_run_as_spreadsheet_formulas`, E2E (real ZIP inspected) |

## Non-functional requirements

| Category | Status | Notes |
|---|---|---|
| Usability | 🟡 | Large touch targets, short texts, step indicator, saved progress. Total time **not yet measured with real students** (estimate: 20-30 min game + 5 min questions); measure in the pilot |
| Performance | 🟡 | Event logging is batched and does not block play (module design). Server: ~3 full assessments/s on 2 CPUs. **Frame rate on a real phone not yet measured** |
| Reliability | ✅ | Autosave + resume (game and questions); game link retried automatically; idempotent uploads (no duplicates under retries) |
| Security | ✅ / 🟡 | scrypt password hashing, hashed tokens, server-side roles, input validation, parameterised SQL (no SQL injection), no HTML rendering of user text in the app (no XSS); rate limits; token in the phone's secure storage. **HTTPS is a deployment step** (production build refuses http; demo build allows it on your Wi-Fi) |
| Privacy | ✅ | Data minimisation (game data is pseudonymous: `user-<id>`), consent stored, anonymised export, students see only their own results, school admins see completion only |
| Explainability | ✅ | Every recommendation carries its numbers, weights and formula |
| Validity / reliability of assessment | 🟡 | Tooling ready (ratings, export with item-level answers and game features for internal consistency and comparison with a standard Big Five questionnaire). **The evaluation itself is future work** |
| Compatibility | 🟡 | Android/iOS app (Expo SDK 57) and web build. Tested in Chromium; **not yet on physical phones** |
| Maintainability | ✅ | Separate app / server / database / scoring; weights and mappings in config files and the database |
| Scalability | ✅ | Classroom: 40 students all at once - all completed, worst wait ~6 s. A school of 300 all at once - all completed, no errors, waits up to ~45 s |
| Portability / Docker | ✅ | `Dockerfile` + `docker-compose.yml` (gunicorn; internal dashboard + public app API) |
| Testability | ✅ | Pure scoring/recommendation functions with known inputs and expected outputs |
| Ethical | ✅ | Guidance framing, no labels or stigmatising language ("Emotional sensitivity" instead of a bare "Neuroticism" label), quality notes worded kindly |

## Security review (findings during this work)

| # | Risk | Status |
|---|---|---|
| 1 | Password-reset emails: long links were cut by the email encoder | fixed (8-bit encoding), test |
| 2 | Password-reset poisoning (forged `Host` header in emailed links) | fixed: links only from `RAHYAAB_PUBLIC_URL`, test |
| 3 | Anyone could upload game data into another student's session | fixed: `RAHYAAB_REQUIRE_USER_AUTH=1`, test + E2E |
| 4 | Spreadsheet formula injection via exported text | fixed, test |
| 5 | Account enumeration (login / forgot password) | same answers for existing and unknown accounts, equal timing; registration necessarily says "email already exists" |
| 6 | Brute force on logins and reset codes | rate limits per login and per address; codes: 5 tries, expiry, single use |
| 7 | Rate limits are in memory, one server process | fine for one gunicorn process; behind a proxy set `RAHYAAB_TRUST_PROXY=1`; schools share one internet address, so limits are per login name first |
| 8 | Plain http on a demo Wi-Fi | demo builds only; production must use HTTPS |
| 9 | Server address is changeable on the login screen | always displayed; a person with the phone could point it elsewhere - use the production build with a fixed address for real deployments |
| 10 | The export still contains grade, age band and gender | small groups can be re-identified: keep exports inside the team (stated in the export README) |
| 11 | Old phone-only data (`rahyaab_mobile_v1`) from the first app version stays on phones | not used any more; remove by reinstalling the app |

## Performance (classroom simulation, real server, 2 CPUs, everything at the same instant)

| Scenario | Result |
|---|---|
| 40 students (one class) - full assessment | 40/40, no errors, slowest step ~6 s |
| 300 students (a school) - full assessment | 300/300, no errors, no duplicates, 2.9 assessments/s; waits up to ~45 s |
| Bottlenecks | scoring at `/complete` (pandas, CPU), password hashing at login (deliberately slow, ~84 ms) |
| Fixed during the test | linking recalculated the score a second time: removed (+46 % throughput) |
| Next steps for bigger use | scoring in a background job queue; PostgreSQL + more server processes |
