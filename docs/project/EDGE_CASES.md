# Exceptions and edge cases

Most students will join in class 8–12 at the usual age, in a standard board group, and play on their own phone. This document covers everyone else.

Each case below is rare on its own, but together they cover many real students:
- a student who wants to re-take class 9 in another group;
- a student who joins late, or much older than usual;
- O-Level, DAE, private and returning learners;
- a student who has no parent available, or whose family refuses;
- a student who tries to cheat.

**Requirements:** SRS FR-99 to FR-104 and NFR-73 to NFR-74 (added in v1.2), plus FR-04, FR-05, FR-12, FR-45, FR-50 and FR-88. **Tests:** `docs/testing/TEST_CASES.md` §2.11. **Data:** the `routes` and `age_rules` sections of `design/game/frameworks/streams.json`.

> **Board rules vary and change.** Every rule this document mentions (switch windows, re-take rules, additional-subject exams, age limits, equivalence) lives as **data with a source URL and a last-verified date**, never as code. Items marked **verify** must be checked with each board, IBCC or the institution before the pilot (RK-11).

## 1. Principles

1. **Unusual is not wrong.** Never block a real learner because their path is uncommon. Block only what the law or the Play policy requires: under-13 users, and uploads without consent.
2. **Show routes, not verdicts.** When the best fit is behind a closed door, show every real route to it, with its honest cost: time, an extra exam, money, who must agree. Also show the good options that are already open.
3. **The student asks; the app doesn't push.** Costly routes (re-taking a year, switching group) appear only on request, or when the evidence is strong (§3.3). They are never the headline recommendation.
4. **Always end with people.** Every exception screen offers "Talk to your family" and "Ask your teacher", and raises a teacher flag (with consent) so a counsellor can follow up.
5. **Collect no more data to handle an exception.** Age is stored as a band, and "my situation" is a choice from a list, never free text.

## 2. Joining at different points

The class a student picks at join, and any later class check-in (FR-101), sets the **mode** (FR-50).

| Situation | Mode | What the student gets |
|---|---|---|
| Class 8, any month | `matric` | Matric group (Science-Biology, Science-Computer, Humanities), with a preview of Intermediate streams |
| **Class 9, early in the year** (the board's group-change window still open, **verify**) | `inter` + **current-group fit check** | "Is your group right for you?" (FR-99). If not, the routes: switch now while the window is open, or re-take class 9 in another group next session. Then the Intermediate streams |
| Class 9, after the window, or class 10 | `inter` + current-group fit check | Intermediate streams, with doors set by the current group. If the best fit is closed, show the routes (§3) |
| Class 10, between board exams and results | `inter` | The same, plus timing notes: admission dates and when to choose (FR-87) |
| Class 11, early | `university` + **current-stream fit check** | "Is your stream right for you?" If not, the routes: switch stream early in class 11 where the college allows (**verify**), the DAE route, or the right university fields from the current stream |
| Class 11 late, or class 12 | `university` | University fields, entry tests and their timing, with doors from the current stream |
| **Finished class 12 (gap year, re-attempting entry tests)** | `university` | The same, with "after Intermediate" options: re-attempting entry tests, improving marks, technical and associate degrees |
| O-Level (Grade 8–9) | `alevel` | A-Level subject bundles. An IBCC equivalence note for local admissions (FR-104) |
| A-Level | `university` | University fields; IBCC equivalence notes |
| DAE (diploma) student | `university` | B.Tech / BS Engineering Technology routes and entry rules (FR-104) |

**When it starts doesn't matter.** "Your Year" is 4 play-weeks, not the school year, so a student can join in any month. Joining late only changes the timing notes.

## 3. Changing your current group or stream

### 3.1 Routes the app knows about

| Route | When it applies | Cost shown to the student | Data |
|---|---|---|---|
| **Switch group now** | Class 9, inside the board's change window | Catch up on the new subjects; school and board approval | `routes.switch_group_window` per board (**verify**) |
| **Re-take class 9 in another group** | After the window, in class 9 or class 10 | **One extra year**; re-registration; family agreement | `routes.retake_class_9` |
| **Add the missing subject** | After Matric, where the board allows an additional-subject exam (for example Biology, needed for Pre-Medical) | An extra exam sitting; self-study or tuition; possibly a later start | `routes.additional_subject` per board (**verify**) |
| **Switch Intermediate stream early** | The first months of class 11, if the college allows | Catch-up; college approval | `routes.switch_stream_window` (**verify**) |
| **Alternative route to the same field** | Always | Shown with what it opens and closes. Examples: Computer group → ICS → BS Computer Science (no MBBS); Humanities → FA → law, media, social sciences, education; DAE → B.Tech | `stream.doors`, `stream.plan_b` |
| **Stay and do well where you are** | Always | None. This is the **default**, shown first | — |

### 3.2 How it looks (S-10c "Is your group right for you?")

1. **Your current group: Science (Computer).** Fit band and 2 reasons, the same evidence as "Why this?".
2. **Good paths open from your group:** the top 3 open paths. This always comes first.
3. **A path that fits you is behind a closed door:** shown only when the rule in §3.3 triggers. For example, "Pre-Medical needs Biology at Matric".
4. **Ways to get there:** the routes from §3.1 that apply, each with its cost, the rule's source and date, and who must agree.
5. **Talk it over:** share with family (with this section included), ask a teacher, and save for later.

### 3.3 When the app raises a route (anti-push rule)

Costly routes (re-take, switch, additional subject) appear **automatically** only when **all** of these hold. Otherwise they sit behind a "See other routes" button.

- Confidence is **high** or **medium**.
- The best closed path out-fits the best open path by at least **δ_route**. It starts at 0.15 on the fit scale and is set on the pilot.
- The student's class is still inside the route's window.

The teacher dashboard shows a `route_question` flag. Counsellors are told never to recommend a re-take on the app's result alone.

## 4. Age

Age is asked as a birth-year picker. Only an **age band** is stored: 13–15, 16–17, 18–19, 20–24, 25+.

| Age | What happens | Why |
|---|---|---|
| **Under 13** | A neutral stop screen ("Rahyaab is for students aged 13 and older"). Nothing is stored | Play policy and consent law; the design is not made for younger children |
| **13–17** (minor) | Normal path; **parental consent** before any upload (FR-05) | Children's data |
| **18 and over** (adult) | **Self-consent** replaces parental consent. Family sharing is optional, and the student invites family if they want | Adults consent for themselves (FR-100) |
| **Older than usual for the class** (for example 17 in class 8, 19 in class 9, 22 in class 11) | Allowed. An "older learner" note adds routes: private candidate, open and distance schooling (for example AIOU Matric and Intermediate), evening programmes, and technical or vocational training. Any **age limits** on programmes are shown as rules with sources (**verify** each) | Late learners exist and need the same respect |
| **Much older** (25+) | Allowed, with one note: "Rahyaab is made for school students. Your interests and strengths are still real, and we've added routes for adult learners." The student is excluded from the research dataset unless the ethics approval covers adults | The design and the validation study target ages 14–18 |
| **Unusual class and age combination** | A soft check, not an error: "You picked class 9 and born 1999. Is that right?" with **Yes, that's right** and **Change** | Typos are more common than real cases, but real cases must pass |

## 5. Other exceptions

| Case | Handling | Requirement |
|---|---|---|
| **Re-taking or repeating a class** | "My situation" option "I am repeating this class". The mode follows the class; earlier results are kept as history | FR-101, FR-104 |
| **Private candidate, or out of school and returning** | "My situation" options. Routes include private registration and open schooling | FR-104 |
| **Changed board or province** | Board picked again at check-in; the rules come from the new board | FR-101 |
| **Madrassa, or a foreign or overseas certificate** | Equivalence note (IBCC) with a source; routes shown as "check equivalence first" (**verify**) | FR-104 |
| **No parent or guardian available** | Consent from the legal guardian. In the school path, the head teacher's guardian procedure follows the ethics approval (**verify**). Until then the student can play locally and explore | FR-05 |
| **Family refuses consent** | The student can still explore streams offline and play locally. Nothing is uploaded, and local play is purged after 14 days. No nagging | FR-05, NFR-45 |
| **Student and family disagree** | The parent report stresses talking together and lists every open path, not one answer | FR-68 |
| **No phone of their own** | Shared-phone PIN profiles (FR-07). A **school lab mode**: on a teacher-supervised device, students sign in with a code and PIN, and data is wiped on sign-out | FR-07 |
| **No internet for weeks** | Fully offline play; a provisional result labelled as such; sync later | FR-49, NFR-32 |
| **Low literacy, or a disability** | Read-aloud, easy read, accessible task modes | FR-96–98 |
| **Random or careless answers** | Quality flags (impossible speed, straight-lining) lower confidence and suggest "play one more week". Never blocked or shamed | FR-43, FR-51 |
| **Trying to game the result** | The server decides; implausible patterns are flagged; results are never accepted from the phone | SECURITY §3 |
| **Two accounts for one student** | Allowed technically (no identity data to stop it). The teacher can merge two roster entries in the same class | FR-80 |
| **Lost or new phone** | Re-link code from the teacher, or a parent OTP on the individual path | FR-12 |
| **Moves to another school or class** | Teacher or admin transfers the student; the old teacher loses access at once | FR-80 |
| **Board rule changes mid-year** | Rules have effective dates; results show the rule version; affected students are re-ranked by the `rescore` job | FR-45, RFC-0003 |
| **Wants to play again** | Full replay after 90 days, or earlier with teacher approval; "what changed" view | FR-88, FR-89 |

## 6. Where this lives in the system

| Piece | Change |
|---|---|
| `streams.json` | New `routes` (switch windows, re-take, additional subject), `age_rules` and `situations` sections, each with sources |
| API | `Recommendation.current_fit` with `routes[]`; `PATCH /me/profile` accepts `grade`, `current_group` and `situation` (a class check-in); `JoinRequest.birth_year` widened; problem+json `errors[]` for field help |
| Database | `student.age_band`, `student.situation`; `consent.method` gains `self`; `flag.type` gains `route_question` |
| Screens | S-03e join with field help; S-10c "Is your group right for you?"; S-31 class check-in |
| Tests | TC-EDGE-01 to TC-EDGE-12 |
