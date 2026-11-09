# Game-Based Assessment (GBA) and Gamified Psychometrics for a Teen Career/Stream Discovery App

Scope note: research conducted 2026-10-29 with ~16 tool calls. Several primary PDFs (Shute preprints, a 2026 RIASEC serious-game paper, the Northeastern pymetrics audit) could not be text-extracted, so some specifics come from search-result abstracts/snippets rather than full text; this is flagged where relevant. Statements under "Inferences" are the researcher's synthesis/background knowledge, not verified citations.

## 1. Stealth assessment (Shute) and Evidence-Centered Design (Mislevy)

### Takeaway
Stealth assessment = embedding ECD-designed assessment invisibly in gameplay so evidence is collected from natural actions; its rigor comes from Mislevy's ECD (competency -> evidence -> task models), usually scored with Bayesian networks, and it has been validated mainly by Shute's own group (Physics Playground: physics understanding, creativity, persistence).

### Cited Findings
- Shute & Rahimi state that stealth assessment's "conceptual coherence and psychometric rigor" rest on Mislevy's Evidence-Centered Design (ECD). — [Shute & Rahimi preprint, FSU](https://myweb.fsu.edu/vshute/pdf/saecdpreprint.pdf)
- Physics Playground was used to build and validate stealth assessments of three constructs: physics understanding, creativity and persistence; a 2015 EDM paper evaluated these for validity, reliability, learning and enjoyment. — [EDM 2015 short paper](https://www.educationaldatamining.org/EDM2015/proceedings/short428-431.pdf); [Shute & Rahimi preprint](https://myweb.fsu.edu/vshute/pdf/saecdpreprint.pdf)
- Validity of stealth assessments is established by correlating in-game estimates with external measures of the same competency; reliability via factor analyses and correlations. — [Shute & Moore, FSU](https://myweb.fsu.edu/vshute/pdf/ShuteMoore.pdf)
- Kim, Almond & Shute (International Journal of Testing, 2016) describe a 10-step ECD-based procedure for building the Physics Playground assessment machinery, with Bayesian networks as the scoring engine. — [Kim, Almond & Shute, IJT 2016](https://myweb.fsu.edu/vshute/pdf/IJT.pdf)
- Shute's psychometrics chapter frames stealth assessments as needing validity, reliability and fairness, with ECD supporting a Kane-style validity argument. — [Shute & Rahimi psychometrics chapter](https://myweb.fsu.edu/vshute/pdf/psychometrics.pdf)
- Press coverage reported the Shute team compared in-game metrics of creativity, conscientiousness and physics knowledge with established measures of the same qualities (secondary source). — [KQED MindShift](https://www.kqed.org/mindshift/38725/can-a-childs-creativity-and-persistence-be-assessed-by-a-game)
- Additional Shute primers/resources: [Stealth Assessment primer](https://myweb.fsu.edu/vshute/pdf/SA_Primer.pdf); [Shute ETRD 2023](https://myweb.fsu.edu/vshute/pdf/ETRD2023.pdf); [Shute IJGCMS](https://myweb.fsu.edu/vshute/pdf/IJGCMS.pdf)

### Inferences
- ECD's three core models, applied to this app (background knowledge of ECD, standard in Mislevy et al. 2003):
  - Competency (student) model: what we want to infer, e.g. 6 RIASEC interest dimensions + a few aptitude facets (numerical, verbal, spatial, logical) + a few work-style traits (persistence, risk tolerance, social orientation, creativity). Keep it small; every node needs multiple evidence sources.
  - Evidence model: (a) evidence rules turning raw telemetry into observables (e.g. "chose to fix the robot vs. negotiate with the client", "levels attempted after failure", "solution correct in < N moves"); (b) a measurement/statistical model (Bayesian network, IRT, or simple weighted sums) linking observables to competencies.
  - Task model: game situations designed to elicit those observables, with variable features (difficulty, context, distractors) so items are reusable and parallel forms can be generated.
  - Assembly/presentation models: which tasks each player sees, in what order, and how adaptively.
- Practical design workflow: start from the competency model and a "Q-matrix" mapping each task/observable to competencies; require >=3 independent observables per competency; prototype, collect telemetry from a pilot, and check correlations with a short traditional measure (e.g. O*NET Mini-IP or a short Holland scale) before trusting scores.
- Stealth assessment is a strong fit for interests and work-style traits (persistence, exploration) where self-report is easily faked by teens seeking "prestige" careers (e.g. doctor/engineer pressure common in Pakistan).

### Gaps
- Exact Physics Playground correlation values (e.g. persistence/creativity vs. external measures) could not be extracted from the PDFs (compressed text); report writer should not quote specific r values.
- Little independent (non-Shute-lab) replication of stealth assessment was visible in results.

## 2. Commercial game-based assessments: what they measure, validation, criticisms

### Takeaway
Commercial GBAs (pymetrics/Harver, HireVue games, Arctic Shores, Revelian Cognify, Owiwi, Knack) mostly repackage cognitive-psychology paradigms or SJTs into mini-games; published evidence is mostly vendor-authored, concurrent rather than predictive, and fairness "audits" have been narrow (four-fifths rule only).

### Cited Findings
**pymetrics (now Harver)**
- Battery of ~12 games, 25–30 minutes, reported across 91 traits (now a Harver product; used e.g. by BCG). Trait categories include attention, decision making, effort, emotion, fairness, focus, generosity, learning, risk tolerance. Exact lineup varies by source (secondary prep sites). — [MyConsultingCoach](https://www.myconsultingcoach.com/bcg-pymetrics); [RoadToOffer](https://www.roadtooffer.com/blog/bcg-pymetrics-test-ultimate-guide); [Oxford Careers Service](https://www.ox.ac.uk/careers/what-we-offer/news/the-pymetrics-games-overview-and-practice-guidelines)
- Games map to classic paradigms: Balloon = Balloon Analogue Risk Task (risk tolerance); Tower = Tower of Hanoi (planning; move count and pause before first move tracked); Digits = digit span (working memory); Money Exchange = trust/dictator-style economic game (fairness/altruism). — [MyConsultingCoach](https://www.myconsultingcoach.com/bcg-pymetrics); [Psychometric Success](https://psychometric-success.com/aptitude-tests/test-types/pymetrics)
- pymetrics patents describe "data-driven identification of talent" (models trained on incumbents' game data). — [US Patent 9842314](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9842314)
- Wilson et al. (FAccT 2021) Northeastern audit checked only pymetrics' claim of compliance with the UGESP four-fifths rule; it did not examine whether games measure capabilities or predict job performance. Auditors found the system satisfied the four-fifths rule. — [Pymetrics FAccT audit](https://www.ccs.neu.edu/home/amislove/publications/Pymetrics-FAccT.pdf); [cbw.sh audit whitepaper](https://cbw.sh/pymetrics/pymetrics_audit_result_whitepaper.pdf)
- Critiques: pymetrics paid Northeastern for the audit; MIT Technology Review noted the audit did not show the tool is bias-free nor that it selects the most qualified, though the company had marketed it as "entirely bias free". — [MIT Technology Review 2021](https://www.technologyreview.com/2021/02/11/1017955/auditors-testing-ai-hiring-algorithms-bias-big-questions-remain/)
- Raghavan & Kim argue the four-fifths rule (a statistical parity test) is especially problematic when used prospectively as the fairness target during model development — the pymetrics approach. — [Georgetown Law Tech Review](https://georgetownlawtechreview.org/wp-content/uploads/2026/08/RAGHAVAN_KIM_LIMITATIONS-OF-FOUR-FIFTHS-RULE.pdf)
- UK socio-legal analysis of automated hiring discrimination (including de-biasing approaches) — [Sánchez-Monedero et al., arXiv 1910.06144](https://arxiv.org/pdf/1910.06144)

**HireVue game-based cognitive assessment (Leutner et al., 2023, Frontiers in Psychology)**
- Four games: Numerosity, Shapedance, Pathfinder, Singularity; ML scoring (ridge regression with a "Bias Penalisation" term) trained against ICAR + Cognitive Reflection Test items. — [Frontiers 2023](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.942662/full)
- Convergent validity r = .50 (95% CI .43–.56) with questionnaire cognitive ability; test-retest r = .68 (n = 102, ~4 months). — same
- Adverse impact ratios > 0.8 for all groups (lowest 0.90 for Black applicants), small Cohen's d; 2SD test flagged women (−2.11). — same
- Applicants (n = 4,778): NPS 58, satisfaction 4.30/5; lowest-rated items were length, job relevance and ability to showcase skills; complaints that abstract tasks lacked job relevance. — same
- Limitations: concurrent validity only, no job performance criterion, ~60% of variance unexplained, bias-penalisation method unpublished, several authors HireVue employees. — same

**Arctic Shores**
- Vendor describes combining psychometric methodology, machine learning and mobile game design; no public technical manual or reliability/adverse-impact figures found. — [Escape the City profile](https://escapethecity.org/organisation/arctic-shores); [Interview Guys 2026 guide](https://blog.theinterviewguys.com/arctic-shores-test-guide/)
- Candidate anecdotes question score stability (unverified anecdotes). — [Corporate Law Academy forum](https://www.thecorporatelawacademy.com/forum/goto/post?id=60386)

**Revelian Cognify**
- Game-based cognitive assessment grounded in Cattell-Horn-Carroll (CHC) theory; validation evidence is company-reported (internal exercises, a validation with a multinational tech firm across US/UK/India). — [APS Workplace Excellence Awards case study 2019](https://psychology.org.au/workplace-excellence-awards/2019/case-studies/gaming-it-up-to-improve-the-recruitment-experience)

**Owiwi**
- Narrative game based on situational judgement test (SJT) methodology; scoring based on choices during play; validation claims are vendor-made with no independent study found. — [Owiwi](https://owiwi.co.uk/product/); [SHRM vendor directory](https://vendordirectory.shrm.org/company/810691/products/222612/owiwi)

**Independent/academic syntheses**
- Ramos-Villagrasa & Fernández-del-Río (2023) systematic review of game-related assessments (GRAs): GRAs closely resembling traditional tests show better reliability, construct and predictive validity; GRAs closer to real games elicit more favourable applicant reactions. Supposed advantages over conventional tests are "fewer than imagined". — [J. Work & Org Psych 2023](https://journals.copmadrid.org/jwop/art/jwop2023a18); [Unizar systematic review record](https://zaguan.unizar.es/record/121007?ln=en)
- Cross-national study of a game-based cognitive assessment (Australia vs. South Africa): strong general factor, but only partial metric/scalar invariance across nations; some predictive validity for work performance. — [University of Johannesburg](https://ujcontent.uj.ac.za/esploro/outputs/journalArticle/Crossnational-applicability-of-a-gamebased-cognitive/9926507807691)
- Calgary thesis (mock selection): GBAs correlated r = .35–.50 with traditional assessments and showed smaller racial differences than one traditional measure. — [University of Calgary PRISM](https://prism.ucalgary.ca/items/249de2d8-6a68-42f6-a1ab-d6f995013ae2/full)
- Vendor-buying guide recommends published reliability > .80 and adverse-impact testing across groups. — [Selection Lab](https://www.selectionlab.com/our-blogs/buying-assessments-10-things-to-watch-out-for)

### Inferences
- The cross-national invariance failure (Australia vs. South Africa) is directly relevant: norms/models built on Western samples should not be assumed to transfer to Pakistani teens; local norming and invariance testing (e.g. by gender, urban/rural, Urdu vs. English medium) are needed.
- The pymetrics "train on incumbents" approach is unsuitable for teen career guidance (no incumbents, and it would replicate existing occupational demographics, e.g. gender segregation). A theory-driven (ECD) mapping is more defensible.
- HireVue applicant feedback ("abstract tasks lack relevance") suggests teen users will engage more with tasks framed around recognisable careers/activities than with abstract cognitive puzzles.

### Gaps
- No verified information found on Knack (Wasabi Waiter, Meta Maze), CogniFit, Mindx, Harver's own non-pymetrics games, or HireVue's newer games — search returned nothing specific. Report writer should not make specific claims about these.
- Arctic Shores' technical documentation is not public in results; no independent validation found.
- Full text of Wilson et al. audit could not be fetched (certificate error).

## 3. Game mechanics that map to traits

### Takeaway
Most "neuroscience games" are lightly skinned lab paradigms (BART, digit span, Tower of Hanoi, trust/dictator games); BART has decent reliability (r ≈ .77) and adolescent validity evidence, but external validity is mixed across cultures; SJT/narrative-choice games are the main way to tap judgement/social traits.

### Cited Findings
- BART: adjusted average pumps showed test-retest r = .77 across separate days (adult sample, 2008, Exp Clin Psychopharmacology). — [Stony Brook: Test-retest characteristics of BART](https://researchconnect.stonybrook.edu/en/publications/test-retest-characteristics-of-the-balloon-analogue-risk-task-bar/)
- Youth BART (BART-Y; Lejuez et al. 2007) in 98 adolescents (mean age 14.8): related to a composite of real-world risk behaviours and sensation seeking, explaining unique variance beyond demographics and impulsivity. — [Stony Brook: Reliability and validity of BART-Y](https://researchconnect.stonybrook.edu/en/publications/reliability-and-validity-of-the-youth-version-of-the-balloon-anal/)
- A thesis on adolescents in peri-rural Uganda found no significant association between BART and real-world risk behaviours (unpublished). — [Uçar thesis, Univ. Pavia](https://unitesi.unipv.it/retrieve/4d44d8b6-64fd-404a-85cf-89013e742ff4/Merve%20_u%c3%a7ar_thesis%20%281%29.pdf)
- BART implementation reference (task parameters). — [Millisecond BART library](https://www.millisecond.com/library/bart)
- Tower of Hanoi game logs move count and pre-move planning time; digit span measures working memory; Money Exchange taps fairness/altruism. — [MyConsultingCoach](https://www.myconsultingcoach.com/bcg-pymetrics)
- SJT-style narrative choice games (Owiwi) score from decisions in story scenarios. — [Owiwi](https://owiwi.co.uk/product/)
- Landers et al. (2022, J Applied Psychology): a game-based measure designed with combined game-design + psychometric theory converged with general intelligence (beta = .97, N = 633) and drew more positive reactions than a traditional battery. — [Landers summary via academic newsletter](https://academicnewsletter.sufe.edu.cn/info/369148); [SIOP: Game-based and Gamified Assessments](https://www.siop.org/Research-Publications/Items-of-Interest/ArtMID/19366/ArticleID/3485/Game-based-and-Gamified-Assessments-Advances-at-the-Frontier-of-Psychometrics)

### Inferences (design mapping table; background knowledge, not individually verified)
| Target | Mechanic | Key observables |
|---|---|---|
| Risk tolerance | BART-style "pump the balloon / grow the crop / push the delivery" | mean pumps on non-exploded trials, explosions, change after loss |
| Delay of gratification | choose small reward now vs. larger later (delay discounting) | proportion of delayed choices, indifference point |
| Working memory / attention | n-back, digit/Corsi span skinned as "remember the order" | span length, accuracy, d' (avoid tight RT dependence on low-end phones) |
| Planning / logic | Tower of Hanoi, sliding/pipe puzzles | moves over optimal, first-move latency, resets |
| Spatial | mental rotation, folding, map/route puzzles | accuracy, items solved |
| Numerical/verbal | budgeting mini-games, word puzzles in Urdu/English | accuracy per difficulty level (IRT) |
| Creativity | "alternate uses" for objects, open build sandbox | fluency, originality (rated vs. corpus), flexibility |
| Social/empathy, judgement | SJT branching scenarios, emotion-recognition faces | option chosen vs. expert key, consistency |
| Persistence | voluntary retries after failure on optional hard levels | retries, time on unsolved task, quit point |
| Interests (RIASEC) | swipe-sort activity cards; free-choice "which task next"; day-in-the-life sims | swipe direction, dwell time, voluntary replays |
- Keep any reaction-time-based scoring minimal on Android (see Section 6); prefer accuracy and choice-based observables.

### Gaps
- No adolescent-specific BART test-retest coefficient found; no South Asian BART validation found.
- No primary sources gathered on delay-discounting games, n-back gamified reliability in teens, or creativity game scoring.

## 4. Interest elicitation without questionnaires (youth examples)

### Takeaway
Interest can be inferred from choice behaviour (activity selection, swipes, dwell time); early evidence (a thesis and a 2026 serious-game paper) suggests in-game RIASEC scores can correlate highly with traditional tests, and the free O*NET Mini-IP (30 activity items, mobile) is a natural benchmark/swipe-deck seed.

### Cited Findings
- A San Francisco State master's thesis validated a GBA of RIASEC interests against traditional measures using a multitrait-multimethod matrix. — [SFSU thesis](https://sfsu-dspace.calstate.edu/handle/10211.3/204060)
- A 2026 interactive-narrative serious game (Ecuador/Univ. of Alicante doctoral workshop) reportedly found Pearson correlations > .75 between in-game scores and a traditional RIASEC test for all six types, reduced perception of being formally evaluated, and satisfaction 4.2–4.5/5 (from search snippet; sample size/age unverified, peer review unclear). — [Gutiérrez Yépez, UA JDI 2026](https://web.ua.es/va/phdinf/documentos/jdi-2026/rommeljairgutierrezyepez.pdf)
- O*NET Mini Interest Profiler: 30 work-activity items (5 per RIASEC scale) cut from the 60-item Short Form, designed for mobile, free via My Next Move; reduced length lowers reliability so the Short Form is still recommended when possible. — [O*NET Mini-IP report](https://www.onetcenter.org/reports/Mini-IP.html); [Mini-IP PDF](https://www.onetcenter.org/dl_files/Mini-IP.pdf); [IP Short Form psychometrics](https://www.onetcenter.org/dl_files/IPSF_Psychometric.pdf)
- O*NET item examples are short activity statements, e.g. "Act in a movie", "Sell houses" — ideal for card-swipe UI. — [O*NET Interest Profiler](https://www.onetcenter.org/IPSF.html)
- O*NET reliability/validity reports cover college/adult samples, not adolescents. — [O*NET IP Reliability, Validity & Self-Scoring](https://www.onetcenter.org/reports/IP_RVS.html)
- Adolescent RIASEC instruments: Indonesian 24-item junior-high scale (loadings .61–.89, CR .80, RMSEA .039); Portuguese short-form found poor circular-order fit in secondary students. — [JPEP 2025](https://journal.uny.ac.id/index.php/jpep/article/view/84561); [Univ. Coimbra](https://estudogeral.uc.pt/handle/10316/107258?locale=en)
- Journal of Career Assessment (2025) adolescent RIASEC short-form work (Brazilian 18REST revision). — [JCA 2025](https://journals.sagepub.com/doi/10.1177/10690727241256289)

### Inferences
- A "Tinder-style" swipe deck of 60–90 localised activity cards (O*NET items adapted to Pakistani context: e.g. "repair a motorbike", "run a dukaan", "teach Quran/tuition", "code an app", "treat patients at a BHU") gives a fast, low-bandwidth RIASEC baseline; add a "super-like" for strength and log dwell time.
- Behavioural interest signals (which optional mini-game a player chooses, replays, time spent in each "career world") can be combined with swipes; but time-spent conflates interest with difficulty/ability, so normalise by task length and success.
- RIASEC structure may fit poorly in some adolescent/non-Western samples (Portugal finding), so local validation of the hexagonal structure is needed rather than assumed.

### Gaps
- No verified sources gathered on Xello's interactive activities, Roblox/Minecraft career-exploration experiences, or "CareerQuest"-type games; no Pakistan-specific interest-game evidence found.
- Peer-reviewed status and sample of the 2026 RIASEC serious-game paper could not be verified.

## 5. Engagement/gamification for 14–18 year olds; what makes it feel non-test

### Takeaway
Game-like designs improve reactions and may reduce test anxiety, but the closer to a "real game" the weaker the psychometrics; gamification works by changing behaviour/attitudes (Landers) and its effect depends on gaming experience and attitudes.

### Cited Findings
- Landers' theory of gamified learning (Simulation & Gaming, 2015): game elements affect behaviours/attitudes, which then moderate or mediate outcomes; gamification cannot substitute for high-quality underlying content. — [SAGE: Landers 2015](https://journals.sagepub.com/doi/10.1177/1046878114563660); [NeoAcademic blog](https://neoacademic.com/2015/01/15/psychological-theory-gamification-learning/)
- Gamified assessment (adding game elements to an existing test) is distinct from game-based assessment (a full game whose scores are meaningful); rigorous applied research on both is scarce. — [SIOP call](https://www.siop.org/Research-Publications/Items-of-Interest/ArtMID/19366/ArticleID/3485/Game-based-and-Gamified-Assessments-Advances-at-the-Frontier-of-Psychometrics)
- Anticipated value of gamified instruction was moderated by video-game experience and attitudes toward game-based learning. — [Richard N. Landers (overview)](https://en.wikipedia.org/wiki/Richard_N._Landers); [Landers papers](https://spanalumni.academia.edu/RichardLanders)
- Game format: women's higher baseline test anxiety did not produce gender differences in anxiety during gameplay (HireVue Study 3, n = 85; but anxiety × gender interaction on performance for men). — [Leutner et al. 2023](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.942662/full)
- More game-like GRAs = better reactions; more test-like GRAs = better psychometrics (trade-off). — [Ramos-Villagrasa & Fernández-del-Río 2023](https://journals.copmadrid.org/jwop/art/jwop2023a18)
- 2026 RIASEC narrative game reportedly reduced perception of being evaluated. — [UA JDI 2026](https://web.ua.es/va/phdinf/documentos/jdi-2026/rommeljairgutierrezyepez.pdf)
- Applicants rated assessment length lowest among experience items (HireVue). — [Leutner et al. 2023](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.942662/full)

### Inferences
- Design for short sessions (approx. 3–7 min per mini-game, total profile built over several days) with a story/world map, avatar, and "unlock a career world" progression; avoid timers, scores out of 100, and "correct/incorrect" feedback on interest/trait tasks, which re-introduce test framing and social desirability.
- Use "ability-like" games with transparent difficulty for aptitude (where test-like is fine) and invisible measurement for interests/traits.
- Avoid extrinsic rewards contingent on particular answers (would bias choices); reward participation/completion only.

### Gaps
- No direct evidence found that engagement improves data quality (e.g. fewer careless responses) in GBAs; no teen-specific session-length data; no Pakistan-specific engagement research.

## 6. Psychometric evidence: reliability/validity vs questionnaires, fairness, mobile/device confounds, practice effects

### Takeaway
GBAs typically show test-retest ~.6–.8 and convergent validity ~.35–.50 with traditional measures (lower than the .80 reliability benchmark); fairness claims rest largely on four-fifths-rule checks; touchscreen latency (50–200 ms) can swamp reaction-time differences on phones.

### Cited Findings
- Game-based cognitive test: test-retest r = .68, convergent r = .50. — [Leutner et al. 2023](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.942662/full)
- Schmidt & Hunter benchmark: cognitive ability predicts job performance r = .51 (cited in GBA literature). — [Cambridge: gamified assessment vs performance](https://resolve.cambridge.org/core/services/aop-cambridge-core/content/view/39125B6F3BD27F6B4C1AD514D2330E4A/S1138741619000052a.pdf/exploring-the-relationship-of-a-gamified-assessment-with-performance.pdf)
- 2025 meta-analysis (Fadillah et al., Int J Serious Games) of GBA convergent validity with self-report personality; minimal publication bias (pooled estimates not verified). — [IJSG](https://journal.seriousgamessociety.org/~serious/index.php/IJSG/article/download/1028/636/6860); [DOI 10.17083/etxn7795](https://api.crossref.org/works/10.17083%2FETXN7795)
- "Can we playfully measure cognitive ability?" construct validity & applicant reactions (IJSA, DOI 10.1111/ijsa.12450). — [CiteDrive record](https://www.citedrive.com/en/discovery/can-we-playfully-measure-cognitive-ability-constructrelated-validity-and-applicant-reactions/)
- GBA vs traditional r = .35–.50, smaller racial differences (mock selection thesis). — [Calgary](https://prism.ucalgary.ca/items/249de2d8-6a68-42f6-a1ab-d6f995013ae2/full)
- Partial invariance across countries. — [UJ cross-national study](https://ujcontent.uj.ac.za/esploro/outputs/journalArticle/Crossnational-applicability-of-a-gamebased-cognitive/9926507807691)
- Fairness: four-fifths rule audit limited; statistical parity critique. — [MIT Tech Review](https://www.technologyreview.com/2021/02/11/1017955/auditors-testing-ai-hiring-algorithms-bias-big-questions-remain/); [Raghavan & Kim](https://georgetownlawtechreview.org/wp-content/uploads/2026/08/RAGHAVAN_KIM_LIMITATIONS-OF-FOUR-FIFTHS-RULE.pdf)
- Device latency: study of 26 Android/iOS phones (Behav Res Methods 2022, "To BYOD or not") found touchscreen/display delays; simple RTs of 200–300 ms can be swamped by device delays of ~50–200 ms, which can exaggerate or suppress group differences. — [PubMed 35953659](https://pubmed.ncbi.nlm.nih.gov/35953659/); [PMC9918597](https://pmc.ncbi.nlm.nih.gov/articles/PMC9918597)
- NASA PVT on handhelds: fixed latency can be calibrated out but variability limits precision; recommends per-device-family calibration. — [NASA NTRS](https://ntrs.nasa.gov/api/citations/20160000581/downloads/20160000581.pdf)

### Inferences
- On low-end Android phones common among Pakistani teens, avoid scoring that depends on millisecond RT differences between people; use accuracy, choices, counts, and within-person RT contrasts (e.g. RT on hard minus easy trials on the same device) which cancel fixed device latency. Log device model, Android version, refresh rate, and frame drops as covariates.
- Practice effects: replayable games will inflate ability scores; score first attempt (or a fixed early window) for aptitude, use later plays only for persistence/engagement.
- Fairness checks to run locally: gender, urban/rural, province, language medium, school type (government/private/madrassa), device tier.
- Present results as exploratory "career directions" rather than diagnostic labels given modest reliability.

### Gaps
- No found evidence on practice effects specific to GBAs; no adolescent mobile GBA reliability data; no evidence on low-end Android specifically (most latency studies use mid/high-end phones).
- Pooled effect sizes from the 2025 meta-analysis not verified.

## 7. Telemetry/data design: what in-game behavioural data to log for scoring

### Takeaway
ECD-based stealth assessments rely on fine-grained action logs converted by evidence rules into observables; commercial GBAs log moves, latencies and choices (e.g. Tower of Hanoi moves and first-move pause), and ML-based scoring from gameplay features is used by HireVue.

### Cited Findings
- HireVue scores derive from ML on gameplay features, trained against criterion tests. — [Leutner et al. 2023](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.942662/full)
- pymetrics Tower game logs move count and pause before first move. — [MyConsultingCoach](https://www.myconsultingcoach.com/bcg-pymetrics)
- Physics Playground's ECD pipeline links in-game observables to competencies via Bayesian networks (10-step procedure). — [Kim, Almond & Shute 2016](https://myweb.fsu.edu/vshute/pdf/IJT.pdf)
- EDM community work on mining Physics Playground logs. — [EDM 2015](https://www.educationaldatamining.org/EDM2015/proceedings/short428-431.pdf)

### Inferences (suggested event schema)
- Session-level: anonymised user ID, session ID, app version, device model, Android version, RAM tier, screen refresh rate, language, local timestamp, connectivity (offline-first; batch upload).
- Event-level: event_type (task_start, choice, swipe, tap, move, hint, retry, quit, complete), task_id + task-model variant, item difficulty, option chosen / swipe direction / super-like, correctness, response latency (ms, device-monotonic clock) and dwell time on card/screen, number of attempts, hints used, idle periods, back-navigation/answer changes, frame-drop count.
- Derived observables (computed server-side by versioned evidence rules): RIASEC choice proportions, BART mean adjusted pumps, moves-over-optimal, span length, retries after failure, consistency across repeated/parallel items (for reliability and careless-response flags), straight-lining in swipes, implausibly fast responses.
- Keep raw logs to allow re-scoring as evidence models are recalibrated; version every evidence rule; store consent (parental consent for under-18) and minimise PII.

### Gaps
- No published open telemetry schema for a commercial GBA was found; recommendations above are synthesis, not cited standards.
- Pakistani data-protection requirements for minors' data were outside this search scope.
