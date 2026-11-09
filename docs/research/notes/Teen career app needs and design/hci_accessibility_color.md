# HCI, UX, Accessibility, Colour and Typography Guidance for "Rahyaab" (teen career-assessment app, Pakistan, Urdu + English)

Research done 2026-10-29. About 20 tool calls. Evidence-quality labels: **[STRONG]** = standard or replicated research; **[MODERATE]** = a single good study or official guidance; **[WEAK/PRACTICE]** = practitioner, forum or opinion sources; **[MYTH-RISK]** = popular claim that fails replication.

## 1. Teen-specific UX research (reading, patience, condescension, trust, expectations)

### Takeaway
NN/g's teen research is the main evidence base: 3 studies, 100 teens aged 13–17, 210 sites and 30 apps, 130 guidelines. It finds teens are *less* successful than adults, impatient, put off by dense text, and quick to reject anything babyish. The design should be scannable, fast and touch-friendly, with interactive elements (quizzes and games work well), and should never talk down to teens. [STRONG for direction; the studies are US/UK/AU, not Pakistan]

### Cited Findings
- 100 users aged 13–17 across 3 studies (38, 46 and 16 teens). Methods were usability tests, field studies and interviews. Sites and apps tested in the US, UK and Australia; research spans about 15 years from 2004; latest edition has 130 guidelines (2019) — [NN/g, Teenagers on the Web](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)
- Teens complete fewer tasks than adults. The three causes are weaker reading skills, less developed research strategies and lower patience — [NN/g](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)
- Teens dislike dense text and prefer content they can scan or see illustrated. Recommendation: write at a **6th-grade reading level or lower** for broad audiences, use short chunks and bullets for steps, and leave generous white space. Small fonts frustrate teens as much as adults — [NN/g](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)
- Teens give up quickly when pages are slow. Overconfidence leads them to blame the design rather than themselves when they fail — [NN/g](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)
- Teens did best on ecommerce sites, which follow conventions and need little reading. They did worst on government, nonprofit and school sites, which had dense content and weak navigation — [NN/g](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)
- Teens reject babyish or condescending content and want to be treated as older. A "Kids" label drives them away. Peer-created stories and examples resonate — [NN/g](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)
- Interactive features where teens can *do* something (quizzes, polls, games) work well. Avoid heavy animation, autoplay and gratuitous multimedia. Avoid forced registration and public profiles. Design for touch, not hover or precise drag-and-drop. Older devices and slow connections are common — [NN/g](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)

### Inferences
- Rahyaab's own "school/government-like" content (career info, results explanations) carries the highest failure risk. Use ecommerce-style conventions: cards, clear CTAs, minimal reading.
- Visual tone should be "young adult", not cartoon-child. Avoid mascots that read as pre-teen. Use real Pakistani peer stories or examples, such as student testimonials, for career pages.
- Game mechanics should not depend on drag precision or hover. Prefer tap or select interactions with large targets.
- Do: onboarding of ≤3 screens with skippable tips, no forced account before the first game, a 6th-grade reading level in both Urdu and English, and microcopy of 1–2 lines per screen.
- Don't: text-heavy instructions before games, autoplay video intros, cartoonish "Great job, kiddo!" tone.

### Gaps
- No NN/g data specific to South Asian teens or Urdu-language interfaces. Findings are Western.
- Not separately fetched: NN/g teen *mobile*-specific findings or the 2019 report's full guideline list (paywalled).
- No Pakistan-specific teen app-usage UX study found in this session.

## 2. Usability heuristics and accessibility standards (Nielsen, Shneiderman, Material 3, Apple HIG, WCAG 2.2, colour-vision deficiency)

### Takeaway
Concrete numbers: touch targets of **48×48dp** (Android/Material); WCAG 2.2 AA requires **24×24 CSS px** minimum targets (or spacing), text contrast of **4.5:1** (3:1 for large text), and colour never as the only cue. Colour-vision deficiency affects roughly **1.4–5.8% of Pakistani males** depending on the study, with no population-based estimate. Design for red-green CVD by default.

### Cited Findings
- Nielsen's 10 heuristics: visibility of system status; match with the real world; user control and freedom (clear exits, undo); consistency and standards; error prevention; recognition rather than recall; flexibility and efficiency; aesthetic and minimalist design; help users recognize, diagnose and recover from errors; help and documentation — [NN/g](https://www.nngroup.com/articles/ten-usability-heuristics/) [STRONG]
- Android: each interactive element should have a touch target of at least **48dp × 48dp**. Material components (Button, IconButton, ListItem) enforce this; custom elements need explicit sizing (`sizeIn(minWidth=48.dp, minHeight=48.dp)`) — [Android Developers, Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps) [STRONG]
- Android contrast: text under 18sp (or bold under 14sp) needs **≥4.5:1**; other text **≥3:1**. Test with Accessibility Scanner, Lint and Compose tests. Content descriptions should describe purpose, not appearance ("Submit", not "Submit button") — [Android Developers](https://developer.android.com/guide/topics/ui/accessibility/apps) [STRONG]
- WCAG 2.2 SC 2.5.8 Target Size (Minimum, AA): pointer targets must be **≥24×24 CSS px**, or undersized targets must be spaced so 24px circles don't intersect. Exceptions cover equivalent controls, inline text, user-agent controls and essential presentation. W3C advises aiming for the stricter 2.5.5 (AAA) for important controls — [W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) [STRONG]
- WCAG SC 1.4.1 Use of Color (A): colour must not be the only means of conveying information. The page explicitly fails a green-valid/red-invalid outline with no other cue. Pairing colour with an icon or text passes. A colour difference with ≥3:1 lightness contrast counts as an additional cue, but an extra indicator is still needed where meaning depends on identifying a specific hue such as red vs green — [W3C Understanding 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) [STRONG]
- CVD prevalence in Pakistan (all Ishihara-based, mostly convenience or screening samples): Quetta general sample n=1450, **5.75% males**, 1% females (Pak J Zool 2016); Pukhtoon high-school students n=314, **5.32% males**, 2.06% females; Karachi/Murree/Sargodha students 2003–2008, n≈8,200, overall 2.75%, mostly red-green and male; AKU pre-employment 2013–14, n=3437, **1.4% males**, 0.4% females; Rawalpindi pre-employment 2018–19, n=1500, 4.86% overall, most unaware of their condition. One commentary notes the lack of population-based studies in Pakistan — [ZSP Pak J Zool PDF](https://zsp.com.pk/pdf48/1045-1049%20%2820%29%20QPJZ-0391-2015%2019-4-16%20%28revised%20and%20highlighted%20%29%20%282%29%20%281%29.pdf); [Pak J Ophthalmol](https://distantreader.org/stacks/journals/pjo/pjo-1180.pdf); [PAFMJ](https://www.pafmj.org/PAFMJ/article/download/2289/1985); [AKU eCommons](https://ecommons.aku.edu/pakistan_fhs_mc_surg_surg/596); [KFUPM record](https://pure.kfupm.edu.sa/en/publications/incidence-of-protanopia-and-deuteranopia-defects-of-colour-vision/) [MODERATE; wide range]
- Many people with CVD are unaware of it (Rawalpindi study) — [PAFMJ](https://www.pafmj.org/PAFMJ/article/download/2289/1985)

### Inferences
- With teen boys in a typical class, expect roughly 1 in 20 to have a red-green deficiency. Many won't know. Never encode results, game states or "interest strength" in red vs green alone.
- Practical spec: 48dp minimum targets with ≥8dp gaps in game grids; primary game buttons at 56dp+. Text contrast ≥4.5:1, with no "large text" relaxation for Urdu because Nastaliq's apparent size is unreliable. Non-text UI such as chart bars, focus rings and icons at ≥3:1 (WCAG 1.4.11, not fetched this session).
- Map heuristics to Rahyaab:
  - **Visibility of status** → progress such as "Game 2 of 6".
  - **User control** → pause, quit and save at any point; let the user change an answer before submit.
  - **Error prevention** → confirm before leaving mid-game.
  - **Recognition over recall** → keep game instructions viewable mid-game via a "?" icon.
  - **Match the real world** → use Pakistani career and education terms (Matric, FSc, ICS, O/A-level).
- Support TalkBack with labels in both Urdu and English, and test with the device font scale at 130–200%.

### Gaps
- **Not fetched/verified this session:** Shneiderman's 8 golden rules (canonical source: [cs.umd.edu](https://www.cs.umd.edu/users/ben/goldenrules.html)); Apple HIG 44×44pt minimum; WCAG 1.4.11 Non-text Contrast (3:1) wording; Material 3 motion tokens and reduced-motion guidance (the m3.material.io page returned no body content via fetch). The report writer should treat these as standard but uncited here.
- No population-representative CVD prevalence for Pakistan exists per the sources. The global figure of about 8% for Northern European males is commonly cited but was not fetched.

## 3. Colour theory and palette selection (psychology evidence vs myth, Pakistani cultural meanings, right/wrong signalling, dark mode, accessible palettes)

### Takeaway
Colour-psychology effects on performance are largely **not robust**. The famous "red impairs test performance" effect failed replication, and a 2020 meta-analysis found no evidential value after correcting for publication bias. Choose colours for **contrast, CVD-safety, consistency and cultural fit**, not claimed "calming" or "focus" effects. Use a tonal system (Material HCT) where tone differences of about 50 give about 4.5:1 contrast.

### Cited Findings
- Elliot et al. (2007) reported red stimuli impaired achievement performance by activating avoidance motivation. Colour-in-context theory (Elliot & Maier 2007, 2014) says colour meanings are learned and context-dependent — [Frontiers in Psychology 2015](https://www.frontiersin.org/articles/10.3389/fpsyg.2015.00368/pdf); [ScienceDaily 2007](https://sciencedaily.com/releases/2007/02/070228170240.htm)
- A large-sample replication found **no effect of red on test performance**, and Steele (2014) likewise found none — [Gold eprints, von Stumm 2015](https://eprints-gro.gold.ac.uk/11188/1/PSY-vonStumm2015.pdf); [Steele poster](https://www.appstate.edu/~steelekm/documents/Psychonomics2015Poster_Steele.pdf)
- 2020 meta-analysis (Psychonomic Bulletin & Review): after correcting for publication bias, "no evidential value" for an effect of red on intellectual performance — [Springer s13423-020-01772-1](https://link.springer.com/article/10.3758/s13423-020-01772-1); [PMC7704521](https://pmc.ncbi.nlm.nih.gov/articles/PMC7704521/) [STRONG that the effect is unreliable]
- In sports, findings on red are mixed: some studies show enhancement, others impairment — [Int J Sport Psychol 2020](https://ijsp-online.com/download/51/int.j.sport.psychol.2020.51.141-157.pdf)
- Pakistan flag colours: green is widely associated with Islam and the Muslim majority (also peace and prosperity), white with religious minorities. These associations are culturally salient — [WorldAtlas](https://www.worldatlas.com/articles/what-do-the-colors-and-symbols-of-the-flag-of-pakistan-mean.html); [Color Matters, Pakistan](https://colormatters.com/pakistan-color-symbolism) [MODERATE, popular sources]
- WCAG 1.4.1 explicitly calls out green-valid/red-invalid as needing a non-colour cue — [W3C](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- Material HCT tone rule of thumb: tones ≥40 apart give about **3:1**, ≥50 apart about **4.5:1**, ≥70 apart about **7:1**. Material Color Utilities runs a final contrast pass that adjusts foreground tone when targets aren't met — [Android Wear color system](https://developer.android.com/design/ui/wear/guides/styles/color/system); [Material Color Utilities docs](https://docsearch.algolia.com/mcp/docs/repo/material-foundation/material-color-utilities); [Dubai Design System colors](https://designsystem.dubai.ae/foundations/colors) [MODERATE; ratios vary slightly with hue and chroma, so always verify]

### Inferences
- **Myths to drop from any spec or pitch:** "blue calms test-takers", "red raises anxiety or lowers scores", "green boosts creativity" as *performance* claims. At most, colour carries learned associations (red = error, warning or danger in UI conventions). That is a reason to avoid red as a *results* colour, not a proven anxiety mechanism.
- **Interest/aptitude tasks have no right or wrong answers.** Don't use red/green or tick/cross feedback for interest items; use a neutral selection state (brand primary plus a check icon). Reserve red only for real system errors, always with an icon and text.
- **Cultural fit:** green is positive and national-identity-laden in Pakistan, so a green-led primary is culturally safe. It may read as "official" or political if it matches flag green exactly, so shift the hue, for example toward teal. Avoid pairing flag-green with white in ways that resemble the flag on a results screen.
- **Palette size (practice, not evidence):** one primary, one secondary/accent and one tertiary key colour, generating tonal palettes (the Material 3 model), plus neutral and error. For results categories (e.g. 6 RIASEC-like interest types), use a CVD-tested qualitative palette of up to about 6 hues differentiated by lightness as well as hue, always with labels and icons.
- **Dark mode:** generate from the same tonal palettes (light theme roles at tone 40/90, dark at tone 80/20 in M3 convention, not verified this session). Recheck chart colours in both themes, and prefer dark grey to pure black surfaces.
- **OKLCH:** a perceptually uniform space useful for building lightness ramps on web/design tooling. HCT is the native Android/M3 option. Either works if contrast is checked numerically.

### Gaps
- No peer-reviewed source found on Pakistani **wedding or mourning colour customs** (e.g. white in mourning, red in bridal wear). Commonly asserted but not verified here, so treat as unverified.
- No OKLCH-specific authoritative accessibility source retrieved.
- Elliot & Maier 2014 review text not retrieved directly.
- No evidence found on an "optimal number of colours" for teens; the recommendation above is practice-based.

## 4. Typography and RTL (Nastaliq vs Naskh, sizes, line height, fonts, bidi, numerals, literacy)

### Takeaway
No controlled study comparing Nastaliq and Naskh readability on mobile was found. Urdu readers strongly prefer and expect Nastaliq; Naskh-for-Urdu is often seen as "Arabic-looking". Nastaliq needs much more vertical space: practitioner consensus is a **body line-height of about 1.8** (floor of about 1.4 for headings) and no fixed-height containers, which clip glyphs. Noto Nastaliq Urdu needs Android-specific padding fixes. [WEAK/PRACTICE]

### Cited Findings
- No controlled Nastaliq vs Naskh mobile readability study was located. A UGA undergraduate (2023) is studying neural differences between Naskh and Nastaliq reading; no results were reported — [UGA Linguistics](https://www.linguistics.uga.edu/news/stories/2023/linguistics-undergraduate-student-zahin-hoque-wins-fall-2023-curo-research-award)
- Urdu readers favour Nastaliq, which is more compact per word; Arabic readers prefer Naskh — [UGA Linguistics](https://www.linguistics.uga.edu/news/stories/2023/linguistics-undergraduate-student-zahin-hoque-wins-fall-2023-curo-research-award)
- Most Urdu books and newspapers are still printed in Nastaliq. It takes more vertical space than Naskh, and its cascading form makes digital rendering more software-reliant. Digital Nastaliq fonts are scarce — [Google Fonts blog, 2023](https://fonts.googleblog.com/2023/03/why-are-there-so-few-digital-nastaliq.html) (body text not retrievable via fetch; claims via search summary); [arXiv 2210.12273](https://arxiv.org/pdf/2210.12273)
- fontconfig maintainers argue Nastaliq Urdu should not be the default *Arabic* font, which shows script/locale mismatch risks — [freedesktop issue #173](https://gitlab.freedesktop.org/fontconfig/fontconfig/-/issues/173)
- Line height: a standard 1.5 line-height causes nuqtas to clip or overlap. Recommendation is **1.8 for body**, with headings not below 1.4. At 1.2 the lines overlap — [Open Design, Urdu design system](https://open-design.ai/plugins/design-system-urdu/) [PRACTICE]
- Input fields are too short for Nastaliq when body line-height is 1.5 — [Anki forum](https://forums.ankiweb.net/t/height-of-input-fields-when-creating-cards-is-too-small-for-nastaliq-fonts/32581). Noto Nastaliq Urdu renders unusually large relative to other fonts — [Discourse meta](https://meta.discourse.org/t/discourse-font-rendering/378897)
- Fixed heights smaller than the font metrics clip the bottom of text — [Chromium review](https://codereview.chromium.org/1386343002/)
- Android: migrating to Noto Nastaliq caused excess vertical space, fixed by removing font padding and trimming measured height — [ProAndroidDev, Taming Noto Nastaliq](https://proandroiddev.com/taming-noto-nastaliq-fixing-urdu-font-rendering-issues-in-android-c65e83b40b34)
- Nastaliq's baseline shifts with context within a word, which makes line height hard to predict — [Unicode mailing list 2004](https://www.unicode.org/mail-arch/unicode-ml/y2004-m09/0121.html)

### Inferences
- **Font choice:** Noto Nastaliq Urdu (OFL, Google Fonts) or Gulzar (Google Fonts, newer Nastaliq) for Urdu UI. Jameel Noori Nastaleeq is widely used in Pakistan but its licensing for app embedding is unclear; verify before shipping. Consider Noto Naskh Arabic only as a fallback for very small labels, and user-test it because of the perception risk.
- **Size and leading:** set Urdu body text about 2–4sp larger than English equivalents for comparable legibility (practice; e.g. English 16sp ↔ Urdu 18–20sp), with line-height of about 1.8. Use `wrap_content` heights, never fixed, on buttons, chips and inputs. Set `includeFontPadding`/`lineHeight` explicitly in Compose and test 130–200% font scale.
- **RTL/bidi:** use `start/end` rather than left/right. Mirror navigation, back arrows and progress direction in Urdu. *Don't* mirror charts' numeric axes, media controls or clocks. Wrap English terms and numbers inside Urdu strings with bidi isolation (Unicode FSI/PDI or Android `BidiFormatter`).
- **Numerals:** Pakistani usage commonly mixes Western (0–9) digits in Urdu contexts (e.g. phone numbers, marks). Pick one convention per screen and test with users. Extended Arabic-Indic (۰–۹) is the Urdu-specific form.
- **Literacy:** combine the NN/g 6th-grade-or-lower recommendation (Section 1) with plain Urdu (avoid Persianized or Arabicized formal vocabulary) and offer an English toggle on every screen. Many urban teens read English-medium curricula but speak Urdu or a regional language.

### Gaps
- No eye-tracking or reading-speed study on Nastaliq vs Naskh on screens was found. The Naz et al. 2013 paper is OCR-focused, not readability.
- No authoritative font-size recommendation for Urdu on mobile; the numbers above are practice-based.
- Pakistani youth Urdu/English reading-level statistics (e.g. ASER Pakistan) were not retrieved in this session.
- Jameel Noori licensing not verified.

## 5. Reducing test anxiety and the "feels like a test" effect (framing, timers, feedback, progress, autonomy)

### Takeaway
Untimed conditions generally yield better performance, especially for anxious students, though whether timing *causes* anxiety is contested. Gamification has a small positive effect on intrinsic motivation, autonomy and relatedness but minimal effect on competence. Expected tangible rewards contingent on performance can undermine intrinsic motivation (Deci, Koestner & Ryan 1999). Design: no visible countdowns, explicit "no right or wrong answers" framing, choice and control, and informational rather than evaluative feedback.

### Cited Findings
- Timed math performance is often worse than untimed. In gifted sixth graders the difference was significant only when the timed condition came first — [PMC2806671](https://pmc.ncbi.nlm.nih.gov/articles/PMC2806671) [MODERATE]
- Untimed participants scored better, but timed participants were more accurate per item. That suggests a speed effect, not an accuracy effect. This is an undergraduate, non-peer-reviewed study — [WPI](https://digital.wpi.edu/show/h702q988w) [WEAK]
- Math anxiety correlates negatively with performance in both timed and untimed tasks (n=474 children), most strongly on applied problem-solving — [Columbia dissertation](https://academiccommons.columbia.edu/doi/10.7916/0qpc-c783)
- Critique: the evidence cannot show timed tests *cause* math anxiety; they may trigger anxiety in those already anxious — [Filling the Pail](https://fillingthepail.substack.com/p/more-timed-test-and-maths-anxiety) [OPINION]
- Meta-analysis (2024, *Educational Technology Research & Development*): 35 interventions, about 2,500 participants. Small but significant effect of gamification on intrinsic motivation, with gains in autonomy and relatedness and minimal impact on competence. Obstacles were low perceived competence and autonomy — [Springer s11423-023-10337-7](https://link.springer.com/article/10.1007/s11423-023-10337-7) [STRONG-MODERATE]
- Deci, Koestner & Ryan (1999): expected tangible rewards contingent on performance decrease intrinsic motivation. Choice in badges or points may support autonomy (Sailer et al. 2017) — [DiGRA 2026](https://dl.digra.org/index.php/dl/article/view/2773); [Springer 2024](https://link.springer.com/article/10.1007/s11423-023-10337-7)

### Inferences
- **Framing language:** use "activities", "challenges", "explore" and "discover your strengths"; avoid "test", "exam", "score", "pass/fail" and "correct/wrong". In Urdu, avoid امتحان (exam) and ٹیسٹ (test); try "سرگرمی" (activity) or "کھیل" (game), subject to user testing.
- **Timers:** none visible for interest or personality games. Where reaction time is an inherent measure, explain why up front and record time silently, with no countdown bar. Always allow pause or exit with progress saved (also an ICO recommendation, Section 6).
- **Feedback:** informational and process-focused ("You prefer hands-on puzzles") rather than evaluative ranks. For aptitude mini-games, show personal effort or progress, not peer comparison. No leaderboards.
- **Progress:** use a determinate indicator ("3 of 6 activities, about 10 min left"). Let users choose game order (autonomy) and allow short sessions.
- **Results:** use strengths-first, non-deterministic framing ("Your interests point toward…", "These are starting points, not limits"). Show multiple pathways and avoid a single "your career is X" verdict.

### Gaps
- No direct study found on UI framing ("game" vs "test" labels) reducing assessment anxiety in teens. Recommendation is inferential.
- No Pakistan-specific test-anxiety data retrieved. Pakistan's board-exam culture likely heightens "test" connotations; this is inferred and unverified.

## 6. Ethical gamification for minors (dark patterns, ICO Children's Code, 5Rights, Google Play Families, notifications)

### Takeaway
The ICO Children's Code (UK, 15 standards; standards 5 and 13 are relevant here) calls data-driven "sticky" features (reward loops, notifications, autoplay) likely unfair if they make disengaging hard. It wants neutral "keep playing" prompts, active choice to continue, and pause without losing progress. Nudges must not push children to share data or weaken privacy; pro-privacy and wellbeing nudges are encouraged. Streaks measurably increase use because of loss aversion, which makes them an effective but ethically risky lever. Google Play Families applies to apps targeting minors and restricts ads SDKs, identifiers and location.

### Cited Findings
- ICO Standard 5 (Detrimental use of data): don't use children's data in ways shown detrimental to wellbeing. Sticky features include reward loops, continuous scroll, notifications and auto-play. Designing data-driven features that make disengaging hard (exploiting reward, anticipation or peer pressure) is likely to breach UK GDPR fairness. Recommendations: no personalised incentives for longer play, neutral options to continue without implying loss, an active choice to continue, and pause any time without losing progress — [ICO Standard 5](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/5-detrimental-use-of-data/) [STRONG, regulatory UK]
- ICO Standard 13 (Nudge techniques): don't nudge children to provide unnecessary data or weaken privacy, and don't nudge them to lie about age (e.g. pre-selecting an older age band). Pro-privacy nudges and nudges toward healthy behaviour such as screen breaks are supported — [ICO Standard 13](https://ico.org.uk/for-organisations/guide-to-data-protection/ico-codes-of-practice/age-appropriate-design-a-code-of-practice-for-online-services/13-nudge-techniques); [SWGfL summary](https://swgfl.org.uk/magazine/a-quick-look-at-ico-s-age-appropriate-design-code/)
- Streaks plus personalised reminders significantly increased use of a math platform by 4th–6th graders in Peru, possibly amplified by loss aversion — [Northwestern IPR WP-26-05 (2026)](https://www.ipr.northwestern.edu/documents/working-papers/2026/wp-26-05.pdf)
- Kuo, Zhao & Scott (IDC 2026) argue retention-oriented gamification in educational apps (e.g. "exit dark patterns") can harm children's wellbeing and learning — [Deceptive.design summary](https://deceptive.design/articles/the-evil-bird-and-the-right-to-disconnect-children-s-vulnerability-to-exit-dark-patterns-in-gamified-educational-apps)
- 5th graders (n=66, NordiCHI 2024) mostly missed bad defaults nudging toward sharing personal data — [Deceptive.design](https://www.deceptive.design/articles/growing-up-with-dark-patterns-how-children-perceive-malicious-user-interface-designs)
- Popular children's apps (Feb 2023 analysis) used temporal, monetary and psychological dark patterns, including gambling-like periodic rewards — [ECGBL paper](https://papers.academic-conferences.org/index.php/ecgbl/article/view/1656); [arXiv 2512.17819](https://arxiv.org/html/2512.17819)
- Google Play Families: apps with children in the target audience must comply, and developers must consider whether users under 21 count as children under local law. Ads must use Families Self-Certified Ads SDKs. The policy prohibits precise location and transmitting device identifiers from children, and requires an accurate privacy policy — [Play Console Help 9893335](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en); [Self-Certified Ads SDK policy](https://support.google.com/googleplay/android-developer/answer/12918983) [STRONG; check current version]

### Inferences
- **Don'ts:** daily streaks with loss framing ("Don't lose your 7-day streak!"), loot boxes or random rewards, countdown "offer ends" banners, FOMO push notifications ("Your friends finished!"), confirmshaming on exit ("Quit and lose everything?"), leaderboards, pre-ticked data-sharing consent, defaulting age to 18.
- **Dos:** visible "Pause / continue later" with autosave, neutral exit copy ("Saved. Come back anytime."), completion badges for *finishing exploring* that never decay, optional reminders that are off by default or opt-in, privacy-protective defaults, and a parent report shared only with the teen's knowledge and consent.
- **Notifications (practice-based, no authoritative number found):** at most about 1 per week, opt-in only, none during school hours or late night (e.g. no notifications 21:00–08:00 local), and none tied to loss framing.
- Pakistan has no ICO-equivalent children's code that I found. Adopting ICO/5Rights standards is a voluntary best-practice benchmark that also eases Play Store compliance.

### Gaps
- 5Rights Foundation guidance not fetched directly.
- No authoritative notification-frequency number for teens.
- Pakistan's Personal Data Protection Bill status (2023/2025 drafts) not checked here.
- Google Play's "Teen" targeting specifics for 13–17 (vs Families for under 13) not fully verified; the 2025 updates search was inconclusive.

## 7. Data visualisation of results for teens and parents (radar/hexagon vs bars, uncertainty)

### Takeaway
Radar/hexagon charts look appealing and "game-like", but area grows with the square of values and changes with **axis order** (one example shrank from 19% to 2% of the chart by reordering). People judge radial length and angle less accurately than aligned bars, and can reliably read only similarity and outliers. Use **sorted horizontal bars** as the primary results view. A radar can be an optional "shape" view with fixed axis order, no fill emphasis and labelled values.

### Cited Findings
- Area scales with the square of values, exaggerating large values — [Wikipedia, Radar chart](https://en.wikipedia.org/wiki/Radar_chart); [Flourish](https://flourish.studio/blog/create-online-radar-spider-charts/)
- Axis order changes the enclosed area. In one example, moving two stats apart shrank the shape from 19% to 2% of chart area — [PerThirtySix newsletter 17 (2026)](https://perthirtysix.com/newsletters/17); [Scott Logic critique](https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts)
- Radial distances and angles are perceived less accurately than aligned bar lengths. Only similarity and extreme outliers are reliably discerned. More than about 3 overlapping polygons becomes unreadable, so use small multiples — [Scott Logic](https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts); [Observable, Avoid radar charts](https://observablehq.com/blog/avoid-radar-charts); [Significance, Off the radar](https://significancemagazine.com/off-the-radar-here-are-some-alternatives/)
- Counterpoint: the area-distortion critique assumes readers judge area, and there is limited evidence they do. Origami plots are proposed as an axis-order-invariant alternative — [PerThirtySix](https://perthirtysix.com/newsletters/17); [PMC10599795](https://pmc.ncbi.nlm.nih.gov/articles/PMC10599795)

### Inferences
- **Teen results screen:** top-3 interest or strength cards first (icon, name, 1-line meaning, example careers), then a sorted horizontal bar chart of all dimensions with labels on bars and no red/green. The hexagon "profile shape" can be an optional, shareable visual (RIASEC is traditionally hexagonal). Keep axis order fixed to the theory's order and avoid area-fill comparisons between people.
- **Uncertainty:** show bands or qualitative strength ("strong / moderate / emerging") rather than precise percentages. Say explicitly that results reflect today's answers and can change. Avoid decimals that imply false precision.
- **Parent report:** plain language in Urdu and English, strengths-based, with the same bar chart, a "how to talk with your child" section and a warning against treating results as a verdict. It should be shareable as a PDF/image for WhatsApp, a common channel in Pakistan (inferred), and print-friendly in greyscale.

### Gaps
- No NN/g or data-to-viz pages on radar charts were retrieved.
- No study specific to teens' or parents' comprehension of psychometric profile charts was found. Graph-literacy and uncertainty-communication research (e.g. Padilla, Kay et al.) was not fetched.

## 8. Low-end Android performance and UX budgets (size, startup, frame rate, offline)

### Takeaway
Android distinguishes cold, warm and hot starts and measures TTID (time to initial display) and TTFD (time to full display, via `reportFullyDrawn()`). The commonly cited Play Vitals "excessive" thresholds are **cold ≥5s, warm ≥2s, hot ≥1.5s**, and a 60Hz frame budget is about 16ms. These came from secondary knowledge, not the fetched page, so verify them in Play Console. NN/g confirms teens abandon slow experiences and often have older devices and slow connections.

### Cited Findings
- Definitions of cold, warm and hot start; TTID is reported automatically, TTFD requires `reportFullyDrawn()` — [Android Developers, App startup time](https://developer.android.com/topic/performance/vitals/launch-time)
- Excessive-start thresholds (cold ≥5s, warm ≥2s, hot ≥1.5s), the 16ms frame budget and ANR at about 5s input were **not shown on the fetched page**. They are commonly cited Android vitals values; verify at the Play Console vitals docs — [Android Developers](https://developer.android.com/topic/performance/vitals/launch-time) (unverified)
- Teens leave slow pages; older devices and slow connections are common — [NN/g](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)

### Inferences
- **Budgets (practice targets):** cold start TTID under about 2s on a 2–3GB RAM device. Hold a 60fps game loop on low-end Mali/Adreno GPUs and avoid heavy Lottie or particle effects. Ship an AAB with on-demand delivery of game assets; aim for an initial download of about 30MB or less (unverified benchmark, since data cost matters in Pakistan).
- Fonts: Nastaliq fonts are large. Subset them, or use Android downloadable fonts, which share the system cache.
- Offline: games should be fully playable offline, with results syncing later. Make loading states explicit (heuristic 1).
- Respect "Remove animations" (reduced motion) and battery saver.

### Gaps
- Exact Play Console vitals thresholds not verified from the primary page.
- No Pakistan-specific device-mix data (RAM or Android version distribution) retrieved.
- No authoritative app-size abandonment statistic retrieved this session.
