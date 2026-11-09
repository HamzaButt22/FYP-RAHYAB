# Tech Stack, Architecture and Privacy Compliance for a Game-Based Career Guidance App (Pakistan, ages 14-18), as of Oct 2026

Research note: 15 web searches; most findings come from search-result summaries of the pages cited, not full-page reads. Third-party blogs are flagged where used. Items with no source are kept in Inferences or Gaps.

## 1. React Native / Expo in 2026: versions, New Architecture, EAS

### Takeaway
Expo SDK 55 (React Native 0.83, React 19.2) is the current stable baseline, and it supports only the New Architecture, which can no longer be turned off. SDK 56 (RN 0.84/0.85) is in beta. A new project should start on SDK 55+ with development builds, not Expo Go, because Skia, Reanimated 4 and similar native modules need them.

### Cited Findings
- Expo SDK 55 ships React Native 0.83 (0.83.2 per Expo; some third-party guides say 0.83.1) and React 19.2 — [Expo changelog SDK 55](https://expo.dev/changelog/sdk-55); [Expo upgrade blog](https://expo.dev/blog/upgrading-to-sdk-55)
- SDK 55 drops the Legacy Architecture entirely: the New Architecture is always on and cannot be disabled. SDK 54 / RN 0.81 was the last release that supported the Old Architecture — [Expo New Architecture guide](https://docs.expo.dev/guides/new-architecture.md); [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55)
- Expo recommends moving to the New Architecture on SDK 54 first and then creating a development build. Reanimated v4 and FlashList v4 support only the New Architecture — [How to upgrade to Expo SDK 55](https://expo.dev/blog/upgrading-to-sdk-55)
- SDK 55 adds Hermes v1. Opting into it means building React Native from source, which "significantly increases native build times" — [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55)
- SDK 56 beta is available. Its release notes point to the RN 0.84 and 0.85 notes. No stable release date was confirmed — [Expo SDK 56 beta](https://expo.dev/changelog/sdk-56-beta)
- Expo UI (native UI components) is working towards a stable release around mid-2026 — [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55)
- The RN docs version selector already lists 0.84 through 0.87 for I18nManager pages, which suggests RN 0.86/0.87 exist or are in progress by late 2026 — [reactnative.dev I18nManager 0.87](https://reactnative.dev/docs/0.87/i18nmanager)

### Inferences
- Recommendation: start with Expo SDK 55 (or 56 once stable), the managed workflow with Continuous Native Generation (prebuild), and development builds via EAS. Expo Router handles navigation.
- EAS Update (OTA) can push JS-only changes such as game tuning, question text and scoring weights without a Play Store review. This suits fast iteration with pilot schools. Keep recommendation weights server-side anyway, so they can be changed without any app update.
- Cost-conscious approach: EAS Build's free tier has limited build minutes (exact 2026 quota not verified). Teams can also run `eas build --local` or build Android with Gradle in GitHub Actions at no cost.

### Gaps
- Exact EAS free-tier quotas (builds/month, update MAUs) for 2026 were not retrieved. Check expo.dev/pricing.
- SDK 56 stable date and its exact RN version were not confirmed.

## 2. 2D game and animation options inside React Native

### Takeaway
For the planned mini-games (puzzles, swipe/card sorts, reaction tasks, choice stories), the best default is react-native-skia for drawing, Reanimated 4 with react-native-worklets for UI-thread animation, and Gesture Handler for input. Add Lottie for simple decorative animation, or Rive if character animation has to respond to state. Avoid Unity/Phaser embeds on the low-end Android phones common in Pakistan: they add size and overhead, and none of these games needs a full engine.

### Cited Findings
- Reanimated 4.x supports only the New Architecture (Fabric). Reanimated 3 is still maintained for old-architecture apps — [Reanimated migration 3.x to 4.x](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x); [Reanimated compatibility table](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility)
- In Reanimated 4, worklets moved to a separate `react-native-worklets` package, which brings a new Babel plugin. Reanimated 3 does not work with react-native-worklets installed — [Reanimated migration guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x)
- Reanimated 4 adds CSS-style animations and transitions. Reanimated 4.2.0 has been released — [SWM blog: Reanimated 4 is new but also very familiar](https://swmansion.com/blog/reanimated-4-is-new-but-also-very-familiar-b926dd59aa40); [Introducing Reanimated 4.2.0](https://swmansion.com/blog/introducing-reanimated-4-2-0-71eea21ca861/)
- Integrations with Gesture Handler and React Native Skia work the same as in 3.x. For complex animations, SWM recommends Reanimated plus react-native-skia over rendering many individual React components — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance)
- New Architecture performance regressions are mostly visible in debug builds. Release builds with compiler optimizations perform much better. SWM recommends the `debugOptimized` Android variant for profiling — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance)
- react-native-skia adds roughly 4 MB of Android download size with App Bundles on arm64, per the library's install docs — [React Native Skia install docs (mirror)](https://mintlify.com/shopify/react-native-skia/getting-started/installation)
- No 2025/26 benchmark of react-native-skia runtime or memory use on low-end Android was found. General RN guidance says APK size matters most on entry-level phones and recommends testing on them — [Callstack: optimize Android app size](https://www.callstack.com/blog/optimize-android-application-size-with-gradle-settings); [Expo app size guide](https://docs.expo.dev/distribution/app-size.md)
- Lottie vs Rive: Rive claims files 10-15x smaller than Lottie (vendor claim) — [Rive blog](https://rive.app/blog/rive-as-a-lottie-alternative). Its runtime is heavier: a Wikimedia Android prototype measured about 14.8 MB added, of which about 12.3 MB was native Rive libraries across 4 ABIs — [Wikimedia Phabricator T433250](https://phabricator.wikimedia.org/T433250)
- Common guidance: use Lottie for animations that just play, and Rive for interactive/state-driven animation — [Callstack: Lottie vs Rive](https://callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation)
- SWM built the same app in KMP and React Native and published its comparison, a useful reference for RN performance in 2025-26 — [SWM: KMP vs React Native](https://swmansion.com/blog/we-built-the-same-app-in-kmp-and-react-native-here-s-what-we-found)

### Inferences
- Mapping of games to libraries:
  - **Swipe/card sort** (RIASEC "like/dislike" cards): Gesture Handler `Pan` plus Reanimated shared values. Plain RN Views are enough, and Skia is not needed.
  - **Puzzles** (tile/sliding/pattern, logic grids): Skia canvas, or Views with Reanimated. Use Skia when there are many sprites or custom shapes.
  - **Timed reaction tasks** (go/no-go, simple RT, Stroop-like): Skia or a minimal View. Read stimulus timing from the UI thread (see Section 3).
  - **Choice-based stories**: plain RN screens with a JSON/Ink-like story graph, plus Lottie illustrations. No game engine needed.
- Physics (Matter.js) and react-native-game-engine are probably unnecessary: none of the listed game types needs physics. react-native-game-engine is an older, JS-thread game loop. (No current source on its maintenance status was retrieved.)
- react-three-fiber/expo-gl (3D) and Unity (react-native-unity) or Phaser in a WebView would add tens of MB and memory pressure on 2-3 GB RAM Android phones. WebView-embedded Phaser also adds input/frame latency, which is bad for reaction-time measurement. These are unsourced engineering judgments, so verify with a prototype.
- Pick either Rive or Lottie to limit APK growth. The ~12-15 MB Rive native cost (with 4 ABIs) drops substantially with App Bundle per-ABI splitting.
- Android-first sizing: ship an AAB so Play delivers per-ABI splits, enable R8/minify and resource shrinking, and subset fonts. The Nastaliq font itself is large.

### Gaps
- No sourced benchmarks for react-native-game-engine, Matter.js-in-RN, react-native-unity or Phaser-in-WebView on low-end Android.
- No independent frame-rate/memory benchmark of Skia vs Views on sub-$150 Android phones.
- Current maintenance status of react-native-game-engine and react-native-unity was not verified.

## 3. Accurate timing for reaction-time tasks on mobile

### Takeaway
Touchscreen and display latency on phones is large (roughly 50-200 ms) and varies between devices by about 100 ms, which is comparable to the individual differences being measured. Absolute reaction times are therefore unreliable across students' own phones. The app should use within-subject, relative measures (e.g., go/no-go accuracy, RT variability, change across trials), timestamp with native event times, and never compare raw milliseconds across devices.

### Cited Findings
- A 2023 Behavior Research Methods study used a robot to test 26 smartphones (under $100 to $1000+, Android and iOS), measuring display and touch latency. It found about 105 ms of total device variability, and device latencies of 50-200 ms for touchscreen devices — [PubMed 35953659: "To BYOD or not"](https://pubmed.ncbi.nlm.nih.gov/35953659/); [PMC9918597](https://pmc.ncbi.nlm.nih.gov/articles/PMC9918597)
- A 2025 Sensors paper tested 5 Android devices for RT logging precision: only 2 met its precision criterion. Combining touchscreen and accelerometer data improved resolution from 8.33 ms (120 Hz frame limit) to 4 ms — [HAL / Sensors 2025](https://dumas.ccsd.cnrs.fr/IRCAM/hal-05315986v1)
- A NASA Ames study found device-reported RTs on an iPod Touch were 80 ± 20 ms longer than actual touch time and concluded that per-device-family calibration is needed for absolute RTs — [NASA NTRS 20160000581](https://ntrs.nasa.gov/api/citations/20160000581/downloads/20160000581.pdf)
- An older (around 2013) vendor benchmark put iPhone 5 touch latency at 55 ms vs 114 ms for the best Android tested. It is dated, so treat it cautiously — [New Atlas](https://newatlas.com/smartphone-screen-latency/29144/)

### Inferences
- Implementation guidance:
  - Record the stimulus time as the frame it was actually presented (e.g., from a Reanimated `useFrameCallback` / Skia frame timestamp on the UI thread). Record the response from the Gesture Handler event, handled on the UI thread via worklets, rather than JS `onPress`, which adds bridge/JS-thread scheduling delay.
  - Use a monotonic clock (`performance.now()` or native timestamps) and never `Date.now()`.
  - Randomize foreperiods, run enough trials (e.g., at least 20 per condition), drop anticipations (< 100-150 ms) and lapses, and use median or intra-individual variability.
  - Log device model, refresh rate and Android version with each session, so analysis can include a device covariate or per-device normalization.
  - Measure low-end devices with a short calibration task (e.g., a baseline simple-RT block) and express choice-RT as a difference from that baseline. This cancels much of the constant device latency.
  - Run a frame-drop check: record dropped frames during the task and flag invalid sessions.
- Product implication: RT-based traits should carry low weight in stream recommendation and be framed as "processing style" signals, not ability scores. Device latency variance of about 100 ms could otherwise systematically disadvantage students with cheaper phones, an equity issue in the Pakistani market.

### Gaps
- No RN-specific measurement of JS vs UI-thread touch-to-timestamp latency on New Architecture was found.
- No data on the latency profile of the specific budget Android brands popular in Pakistan (e.g., Infinix, Tecno, Itel, Redmi).

## 4. Backend, telemetry and offline-first sync

### Takeaway
For a small team, Supabase (Postgres, Auth, Row Level Security, Edge Functions) is the most pragmatic backend. Gameplay telemetry should go to its own Postgres event table, which is the source of truth for scoring, with PostHog (free tier, 1M events/month) used only for product analytics. On the device, expo-sqlite plus an outbox-sync pattern (MMKV for small key-value state) covers offline play on patchy connections. Use PowerSync or WatermelonDB only if two-way sync of large data becomes necessary.

### Cited Findings
- Supabase free plan: projects pause after 1 week of inactivity, but data is kept and the project can be resumed. 500 MB database per project, 2 active projects, about 1 GB file storage. Third-party bandwidth/egress figures conflict (10 GB vs 500 MB). Pro starts at $25/month with 8 GB disk, and Pro projects don't pause — [Supabase pricing](https://supabase.com/pricing.md); [CostBench Supabase free plan](https://costbench.com/software/database-as-service/supabase/free-plan/); [JetAdmin Supabase pricing 2026](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)
- expo-sqlite is built into the Expo SDK, supports standard SQL, WAL mode and live queries, and is called the simplest relational choice for Expo apps. WatermelonDB suits large datasets — [PkgPulse 2026 (third-party)](https://www.pkgpulse.com/guides/expo-sqlite-vs-watermelondb-vs-realm-react-native-local-2026)
- A drawback noted for WatermelonDB: it predates the New Architecture (Fabric, TurboModules, Bridgeless) — [RxDB article (competitor, biased)](https://rxdb.info/articles/alternatives/watermelondb-alternative.md)
- PowerSync provides delta sync between a local SQLite store and Supabase Postgres. One 2026 write-up argues the sync layer must be chosen from day one — [SourceForge/blog roundup](https://sourceforge.net/software/offline-first-databases/integrates-with-react-native/); [Supabase: Realm/Device Sync alternatives](https://supabase.com/blog/mongodb-realm-and-device-sync-alternatives)
- Supabase's own (2023) tutorial wires Expo + WatermelonDB to Supabase. Legend-State is promoted as a local-first state layer that syncs with Supabase — [Supabase blog: offline-first with WatermelonDB](https://supabase.com/blog/react-native-offline-first-watermelon-db)
- 2026 guides describe an expo-sqlite + Drizzle ORM + outbox pattern for offline-first RN — [React Native Relay: Expo SQLite, Drizzle, sync](https://reactnativerelay.com/article/building-offline-first-react-native-apps-2026-expo-sqlite-drizzle-orm-sync-strategies)
- PostHog free tier: 1M product analytics events/month (resets monthly), 1M feature flag requests, 1,500 survey responses, and about 5,000 session recordings. One third-party source says only 2,500 of those are mobile recordings (unverified). Paid mobile recordings cost about $0.01 each in the 5k-15k band — [PostHog pricing](https://posthog.com/pricing); [PostHog EU](https://posthog.com/eu); [fitgap (third-party)](https://us.fitgap.com/products/posthog)

### Inferences
- Recommended architecture for a student/startup budget:
  - **Client**: Expo app. Game sessions are written to local SQLite as an append-only `events` table (session_id, game_id, trial_idx, event_type, payload JSON, t_mono, t_wall, device_meta, app_version). A background outbox flusher batches uploads when online (expo-network / NetInfo) and is idempotent by event UUID.
  - **Server**: Supabase Postgres holds `users` (pseudonymous ID), `consents`, `game_sessions`, `events` (partitioned by month) and `trait_scores` (derived, versioned by scoring model). An Edge Function or Postgres function computes trait scores. RLS ensures a student can read only their own rows. Counselors/schools get a scoped role.
  - **Why not Firebase**: Firestore's per-read/write billing and NoSQL model suit relational/analytical scoring less well. Postgres SQL lets the team compute features and later export training data directly. Firebase Crashlytics is still useful (Section 8).
  - **When to go custom (NestJS/FastAPI + Postgres)**: once ML scoring is in Python, add a small FastAPI service for the model and keep Supabase for auth and data. A full custom backend is not needed at MVP.
  - The 500 MB free DB fills quickly with raw trial-level telemetry. Estimate about 200 bytes/event x 300 events/session; at 10k sessions that is about 600 MB, so plan for Pro ($25/mo) or aggregate trials on the device for pilots.
  - Free-tier inactivity pausing makes the free plan unsuitable for production (schools use the app sporadically).
- Keep PostHog for funnels/retention with pseudonymous IDs only. Disable session replay for minors, or mask all input and text, so screens with personal data are never recorded.

### Gaps
- PostHog's exact 2026 mobile session-replay free allowance was not confirmed on its own site.
- No head-to-head 2026 benchmark of expo-sqlite vs WatermelonDB vs PowerSync was found.
- Supabase data-residency regions near Pakistan (e.g., Mumbai/Singapore) were not verified in this search.

## 5. Recommendation logic: rules to ML, explainability, LLM explanations, cold start

### Takeaway
At launch there are no outcome labels, so the engine should be a transparent, versioned, rule-based weighted scoring model: game-derived trait scores (e.g., RIASEC interests, aptitudes, work styles), times a hand-built trait-to-stream weight matrix built with counselors, plus academic constraints (marks, subject eligibility). It should produce a ranked shortlist with per-trait contributions as the explanation. ML models (gradient boosting on features, later collaborative filtering) should come only after outcome data exists (stream chosen, satisfaction, grades a year later). An LLM can turn the computed explanation into Urdu/English prose, but must never decide the recommendation.

### Cited Findings
- No sources were fetched specifically on recommendation algorithms, explainability libraries or LLM safety in this research pass (search budget spent on stack/privacy). All points below are inferences. Other researchers on the team may cover psychometric scoring.
- Relevant constraint from the privacy findings: the UK AADC expects profiling to be off by default for under-18s unless there is a compelling reason in the child's best interests, with specific, age-appropriate explanations — [ICO AADC summary, RPC](https://www.rpclegal.com/snapshots/data-protection/ico-age-appropriate-design-code-for-information-society-services/); [Lewis Silkin](https://lewissilkin.com/en/insights/ico-issues-final-text-of-age-appropriate-design-code-for-online-services-to-keep-children-safe)
- The Play Age Signals API policy (reported by a secondary source) bars using age data for profiling/analytics or storing it long term — [QAwerk (secondary)](https://qawerk.com/blog/google-play-age-verification-usa-state-laws/)

### Inferences
- **Phase 1 (MVP, rule-based)**:
  - Each game emits features. Normalize them within age band and gender if norms exist, else use z-scores from pilot data, then combine into 6-10 trait scores with reliability estimates.
  - `stream_score = Σ_t w[stream][t] * trait_t + academic_fit + stated_interest_bonus`
  - Keep weights in a versioned JSON/DB table so they can be tuned without app updates.
  - Output the top 3 with confidence bands, never a single answer.
  - Cover the Pakistani pathways: Matric to FSc Pre-Medical / Pre-Engineering, ICS, I.Com, FA (Humanities), DAE/technical/TEVTA, A-levels subject combos, plus O/A-level equivalents.
- **Explainability**: since the score is linear, explanations are exact. "Your strongest signals for ICS were logical-puzzle accuracy (+0.8) and preference for building/tech cards (+0.6)." Store the contribution vector with every recommendation for audits.
- **Phase 2 (ML)**:
  - Collect outcomes with consent: chosen stream, satisfaction survey at 6 and 12 months, and grades.
  - Gradient boosting (LightGBM/XGBoost) with SHAP values keeps per-student explanations.
  - Collaborative filtering ("students like you chose and thrived in...") needs thousands of outcome records, and carries bias risks (it reproduces gender and socio-economic stream patterns). Use it as a secondary signal, with fairness audits by gender, province and urban/rural.
  - Keep the rule model as a fallback and baseline. Retrain offline, and deploy as a versioned model behind a FastAPI or Edge Function.
- **Cold start**: new students are not a cold-start problem for content-based rules. The cold start is at the system level (no outcomes). Fix it with expert-elicited weights, a pilot with counselors labelling "good fit", and stated-preference questions.
- **LLM explanations**:
  - Send only the structured, de-identified result: trait names and scores, top streams and contribution values, language (Urdu/English), and reading level. Send no name, school or free text.
  - A system prompt constrains the model to explain the given numbers only, avoid deterministic/fatalistic language and gender stereotypes, and encourage talking to parents and teachers.
  - Validate output: check streams mentioned ⊆ provided streams, run a profanity/safety filter, and cache the result per score-vector bucket to cut cost.
  - Show a human-written fallback template if the API fails.
  - Generating explanations server-side (Edge Function) keeps API keys off the device.
  - Verify the API terms on use with minors and data retention before launch.

### Gaps
- No sources gathered on validated game-based psychometric scoring, Pakistani stream-choice outcome datasets, fairness benchmarks, or LLM-provider usage policies for under-18 end users (check each provider's terms directly).

## 6. Localization: Urdu (RTL), fonts, i18n

### Takeaway
React Native supports RTL through `I18nManager`, but switching direction requires an app restart. Use logical style properties (start/end) and let RN flip row layouts automatically. Noto Nastaliq Urdu is the standard Nastaliq font, but its tall ascenders/descenders need generous line heights. No RN-specific source on clipping was found, so test on device.

### Cited Findings
- `I18nManager` RTL changes (`allowRTL`, `forceRTL`) take effect on the next app start, not immediately — [reactnative.dev I18nManager](https://reactnative.dev/docs/i18nmanager); [RN 0.83 I18nManager](https://reactnative.dev/docs/0.83/i18nmanager)
- RN docs (0.80) advise against forcing RTL in production apps because of the restart requirement — [RN 0.80 I18nManager](https://reactnative.dev/docs/0.80/i18nmanager)
- RN automatically reverses `flexDirection: 'row'` under RTL, so adding `row-reverse` flips twice. Use `marginStart`/`marginEnd` rather than left/right — [vp0: Fixing Arabic RTL flexbox bugs (third-party)](https://vp0.com/blogs/fixing-arabic-rtl-flexbox-ai-react-native); [DEV: RN app for 20 languages](https://dev.to/pocket_linguist/building-a-react-native-app-for-20-languages-lessons-in-i18n-378d)
- Noto Nastaliq Urdu is the font conventionally loaded for Urdu script (e.g., the bhasha-js library) — [bhasha-js README](https://cdn.jsdelivr.net/npm/bhasha-js@0.4.0/README.md)

### Inferences
- Stack:
  - Libraries: `expo-localization` (device locale), with `i18next` + `react-i18next` (or Lingui) for strings and plurals.
  - Fonts: `expo-font` loads Noto Nastaliq Urdu for reading text. Consider Noto Naskh Arabic for small UI labels and buttons, which is more compact and legible at small sizes on low-DPI screens.
  - Layout: logical props everywhere.
  - Language switch: on change, call `I18nManager.forceRTL` and reload with `expo-updates` `reloadAsync()` (or `DevSettings.reload` in dev).
- Nastaliq needs a lineHeight of about 1.8-2.2x font size and `includeFontPadding` checks on Android. Test with long Urdu strings. (Engineering judgment, unsourced.)
- Game mechanics need RTL review: swipe direction semantics (right = like?), progress bars, story choice ordering, and number rendering (Western vs Urdu numerals).
- Offer English, Urdu and Roman Urdu. Many Pakistani teens text in Roman Urdu. (Unsourced market assumption; validate in user research.)

### Gaps
- No RN-specific source on Nastaliq clipping or line-height bugs, and no data on Noto Nastaliq Urdu file size or subsetting (the font is known to be large; verify).

## 7. Data privacy for minors: Pakistan law, COPPA, GDPR-K/AADC, Google Play

### Takeaway
As of Oct 2026, Pakistan has no enacted comprehensive data protection law. The Personal Data Protection Bill (2023 and 2025 drafts) is still unpassed, so the app should comply with the draft's likely principles plus international best practice. PECA (amended 2025) mainly governs online content and cybercrime rather than privacy. COPPA (amended rule fully in force since 22 April 2026) applies only to under-13s and US users, but is a useful benchmark. The UK AADC treats all under-18s as children and expects high-privacy defaults and profiling off by default. For Google Play, a 14-18 target audience avoids the full Families (under-13) program, but teen content rules apply. The Play Age Signals API is rolling out globally in late 2026.

### Cited Findings
**Pakistan**
- No comprehensive personal data protection act has been enacted. A Chambers practice guide (updated March 2026) describes the bill as still in draft — [Chambers Data Protection & Privacy 2026: Pakistan](https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/pakistan); [Commoner Law: Data privacy without a PDP Act (2026)](https://commoner-law.com/pakistan/data-privacy-digital-rights/data-privacy-without-pdp-act)
- Sources conflict on the bill's path. One says the 2023 bill was withdrawn after referral to committee. Another says the cabinet approved it but it was never enacted. A third says the 2025 draft had not passed Parliament as of 23 May 2026. A 14 May 2026 NA debate referenced a "Personal Data Protection Act 2026", but with no act number, assent or Gazette notice, so it is not evidence of enactment — [Commoner Law](https://commoner-law.com/pakistan/data-privacy-digital-rights/data-privacy-without-pdp-act); [DataGuidance Pakistan overview](https://www.dataguidance.com/notes/pakistan-data-protection-overview-0)
- In March 2025, approval of the PDP Bill was reported delayed again — [ARY News](https://arynews.tv/tag/pakistan-it-ministry/)
- The 2024 IT Ministry draft reportedly set fines of up to PKR 2 million — [ProPakistani May 2024](https://propakistani.pk/2024/05/22/it-ministry-finalizes-data-protection-bill-with-fines-up-to-2-million/amp/)
- Privacy International has critiqued earlier drafts of the bill — [Privacy International](https://privacyinternational.org/advocacy/2230/personal-data-protection-bill-pakistan-its-important-get-it-right)
- PECA Amendment Act 2025: the NA and Senate passed it in January 2025 (Senate on 28 Jan) and the President signed it. It creates a social-media regulator (reported as DRPA or SMPRA), a Social Media Protection Tribunal with appeals to the Supreme Court within 60 days, and a broader "social media platform" definition that reportedly covers tools/software used to access platforms — [ARY: key points](https://arynews.tv/peca-amendment-act-2025-the-key-points/); [Daily Pakistan](https://en.dailypakistan.com.pk/28-Jan-2025/senate-passes-controversial-peca-amendment-bill-amid-ruckus-by-opposition); [Amnesty](https://www.amnesty.org/en/latest/news/2025/01/pakistan-authorities-pass-bill-with-sweeping-controls-on-social-media/)
- Critics, including LUMS law school, say the amendment threatens constitutional rights. Litigation was ongoing in June 2026, with provinces made party to the case — [LUMS SAHSOL analysis](https://sahsol.lums.edu.pk/sites/default/files/2025-11/The%20PECA%20Amendment%202025%20A%20Critical%20Analysis.pdf); [Express Tribune June 2026](https://tribune.com.pk/story/2554524/provinces-made-party-to-case-against-peca-amendments)

**US COPPA (benchmark)**
- The amended COPPA Rule was published 22 April 2025 and took effect 23 June 2025. The general compliance date was 22 April 2026, now passed, and enforcement exposure is active — [Federal Register](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule); [Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/coppa-rule-amendment-compliance-deadline-approaches); [Mondaq: now in full effect](https://webiis10.mondaq.com/unitedstates/privacy-protection/1790866/coppas-amended-rule-is-now-in-full-effect-what-operators-need-to-know)

**UK Age Appropriate Design Code (best practice)**
- The AADC defines children as under 18 and has 15 standards for services likely to be accessed by children — [RPC](https://www.rpclegal.com/snapshots/data-protection/ico-age-appropriate-design-code-for-information-society-services/); [gov.uk child online safety guidance](https://gov.uk/guidance/child-online-safety-data-protection-and-privacy)
- Profiling is off by default unless there is a compelling reason in the child's best interests. Commercial gain is unlikely to qualify. Where profiling is on, there must be safeguards and age-appropriate explanations, with prompts to talk to an adult. Geolocation is off by default — [Lewis Silkin](https://lewissilkin.com/en/insights/ico-issues-final-text-of-age-appropriate-design-code-for-online-services-to-keep-children-safe); [HSF](https://www.hsfkramer.com/notes/tmt/2020-01/the-ico-publishes-its-age-appropriate-design-code-of-practice-for-online-services)
- Providers must either establish age with certainty proportionate to the risk, or apply the standards to all users — [TechCrunch 2020](https://techcrunch.com/2020/01/22/uk-watchdog-sets-out-age-appropriate-design-code-for-online-services-to-keep-kids-privacy-safe)

**Google Play**
- The Families policy requirements apply if children (under 13) are among the target audience. For 13-15 and 16-17 there is content guidance (e.g., avoid realistic violence or risky challenges). Developers targeting under-21 users must check whether those users count as children under local law. Mixed audiences need neutral age screens and ads only from Play self-certified ad SDKs. Google may review the declared target audience, and youthful marketing can trigger rejection — [Play Console Help: target audience and app content](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en); [Play Families policy](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
- Play Age Signals API (announced 29 July 2026): it returns age bands (default 0-12, 13-15, 16-17, 18+, configurable in Play Console). It is live in Brazil, expanding to Australia and Canada by mid-August 2026, with a global rollout later in 2026. Parents opt in via Family Link and age is not shared by default. "Restrict Minor Access" in Play Console controls discoverability — [Android Developers Blog, Jul 2026](https://android-developers.googleblog.com/2026/07/google-play-age-signals-api-safer-experiences.html); [TechCrunch](https://techcrunch.com/2026/07/29/google-is-rolling-out-its-age-assurance-tech-for-apps-worldwide-by-year-end/)
- A secondary source reports that the age-signal data-use policy (effective 1 Jan 2026) bars using it for ads, profiling or analytics, and bars long-term storage — [QAwerk (secondary; verify)](https://qawerk.com/blog/google-play-age-verification-usa-state-laws/)

### Inferences
- **Play Console setup**: declare target age groups 13-15 and 16-17 (and optionally 18+), not under 13. This keeps the app out of the full Families program while following teen content rules. Store-listing art should not look child-directed, or Google may treat it as targeting under-13s. Ship no ads at all.
- **Consent flow**:
  - Age gate at onboarding: a neutral date-of-birth picker. Block under-13s or route them to a parent flow.
  - For under-18s, get parent/guardian consent: the student enters a parent's phone, and the parent gets an SMS/WhatsApp OTP link with an Urdu/English plain-language notice and a consent checkbox. Store a timestamped consent record (who, what version of notice, scopes).
  - School-mediated deployments can use school-collected consent (principal/counselor), with a documented agreement.
  - Separate, granular toggles cover (a) gameplay data for personal recommendations (core), (b) anonymized data for research and model improvement (off by default, consistent with the AADC), and (c) product analytics.
- **Data minimization**: collect no full name (use a nickname), no CNIC/B-form number, no precise location (province/district selected manually), no contacts, no photos, and no free-text chat. Keep the school name optional. Use a pseudonymous UUID as the primary key, and keep contact details (parent phone) in a separate, access-restricted table.
- **Retention and rights**: delete raw trial-level events after aggregation (e.g., 12 months). Provide in-app "download my data" and "delete my account". Write the privacy notice in Urdu and English at a teen reading level.
- **Security**: encrypt in transit (TLS) and at rest (Supabase default). RLS on all tables. Server-only service keys. Keep no secrets in the app bundle (EAS Secrets for build-time).
- **Framing**: the PDP Bill draft (if enacted) would likely require consent, purpose limitation and possibly data localization for "critical" data. Building to GDPR/AADC standards now future-proofs the app. PECA is mostly relevant to any user-generated content features: avoid open UGC and chat to stay clear of moderation obligations.
- Adopt the Play Age Signals API when available in Pakistan as an extra signal, but do not store the result, per the reported policy.

### Gaps
- Exact text and current status of the 2025 PDP Bill (e.g., children's consent age, cross-border transfer rules, localization) were not retrieved. Check the MoITT site and National Assembly/Senate bill trackers.
- Whether Play Age Signals is live in Pakistan as of Oct 2026 was not confirmed.
- Whether the ICO has revised the AADC since 2020 (e.g., after the UK Data (Use and Access) Act 2025) was not checked.
- No source on the Pakistani education authorities' (FBISE/provincial boards) rules for apps collecting student data in schools.

## 8. Analytics, A/B testing and crash reporting on a low budget

### Takeaway
A zero-to-low-cost stack: PostHog Cloud free tier for product analytics, feature flags and A/B tests (1M events + 1M flag requests/month); Sentry or Firebase Crashlytics for crashes; EAS Update channels for staged rollouts. Keep scientific telemetry in your own Postgres, not the analytics vendor.

### Cited Findings
- PostHog free: 1M events/month, 1M feature-flag requests, 1,500 survey responses, and about 5k session recordings (mobile share possibly 2.5k, unverified). Allowances reset monthly — [PostHog pricing](https://posthog.com/pricing); [PostHog EU](https://posthog.com/eu)
- Third-party sources disagree on some PostHog free-tier details, so verify on the pricing page — [Userpilot PostHog pricing](https://userpilot.com/blog/posthog-pricing/); [fitgap](https://us.fitgap.com/products/posthog)

### Inferences
- Use PostHog EU Cloud for a GDPR-aligned posture. Turn off autocapture of text and screen names that might contain PII, and disable or fully mask session replay for minors.
- A/B tests via PostHog experiments: test game onboarding, card-deck length and explanation styles. Never A/B test the recommendation outcome itself without counselor/ethics oversight.
- Crash reporting: Sentry (`@sentry/react-native`, which has an Expo config plugin) has a free developer tier. Firebase Crashlytics is free with no quota but adds the Firebase SDK. Pick one. (Pricing for both not retrieved in this pass.)
- Use Android vitals in Play Console (free) for ANRs/crashes on low-end devices.

### Gaps
- Current 2026 free-tier limits for Sentry and Crashlytics, and for Expo EAS Update MAUs, were not retrieved.
- No source compared PostHog vs Firebase Analytics vs self-hosted options (e.g., Aptabase, Umami) for RN in 2026.
