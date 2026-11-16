# Serious games and gamified systems for career guidance of secondary-school students: a literature catalogue

Method note: I ran structured searches through the OpenAlex API (about 20 queries: "serious game career guidance", "RIASEC game", "gamified career guidance students", "VR career exploration students", "serious game vocational orientation", "Minecraft career", "CareerQuest" and others). I pulled abstracts and author countries by DOI and added targeted web searches and full-text fetches. **Evidence level per entry:** FT = details from the full text; ABS = abstract or metadata only. I could not get the IEEE TLT 2025 full text or the like2be full text (MDPI returned 403), so for those I rely on abstracts. "PR" = peer-reviewed journal or conference; "NR" = institutional repository or student project, not peer-reviewed. Several Indonesian counselling-journal papers are low-tier but peer-reviewed.

## Q1. Which serious games and gamified systems for school-student career guidance exist? (catalogue)

### Takeaway
I found about 30 relevant systems from 2014 to 2026. Only about 5 are rigorous digital studies with real school samples:
- like2be (Switzerland, n=809)
- Kazakhstan GCG (n=1,865, SUS 76.4)
- the Ecuador RIASEC narrative game with OpenAI (IEEE TLT, n=200)
- a UK nursing serious game (n=137)
- the NEFELE model (RCT)

Most of the rest are small design or R&D papers, mainly Indonesian card and board games validated only by expert ratings. Prototypes such as the Korean 2026 life simulation, the Brazilian RIASEC "islands" game, Malaysia's MyUniPath and TraitsNavigator Quest, and the Colombian Holland game have no outcome data. No published system does what the Pakistani app plans to do in full (mobile games, then a validated interest and aptitude profile, then a stream or major recommendation) with psychometric validation.

### Cited Findings

**A. Digital games that infer interests or aptitude and output recommendations (closest analogues)**

1. **Gutierrez, R., Maldonado Navarro, A., Villegas-Ch, W., Mera-Navarrete, A. (2025).** "The Use of Interactive Narratives in Educational Games to Assess Vocational Interests: An Application of the RIASEC Test Integrated With OpenAI." *IEEE Transactions on Learning Technologies*. DOI 10.1109/TLT.2025.3579226. PR. [ABS]
   - Country: Ecuador.
   - Game: a serious game that embeds the RIASEC test in an interactive narrative, with AI generating personalised scenarios in real time.
   - Sample: n=200 high-school and university students.
   - Evaluation: satisfaction surveys, interviews, and pre/post-game responses.
   - Results: satisfaction 4.2–4.5 on a 5-point scale, and a "significant correlation between game responses and academic performance". — [IEEE TLT via OpenAlex](https://doi.org/10.1109/tlt.2025.3579226)
   - A secondary summary (the University of Alicante doctoral-day document by the first author; I could not parse the PDF) says the 200 were 100 secondary and 100 university students, usability was 4.3/5, and in-game scores correlated with the traditional RIASEC test. The coefficient is unverified. — [UA PhD doc](https://web.ua.es/va/phdinf/documentos/jdi-2026/rommeljairgutierrezyepez.pdf)
   - This is the closest published analogue of a "RIASEC story/narrative game".

2. **Tokzhigitova, N.K., Jarassova, G., Tokzhigitova, A., Ospanova, N., Baizhumanov, S. (2025).** "Gamified hidden-assessment platform for diagnosing ICT competences and supporting career guidance among Kazakhstani high-school students." *Frontiers in Education*. DOI 10.3389/feduc.2025.1643246. PR, open access. [FT] — [Frontiers](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1643246/full)
   - Country and sample: Kazakhstan (Pavlodar). n=1,865 grade-11 students from 45 state schools, mean age 17.2.
   - Game: "Game for Career Guidance (GCG)", a bilingual Kazakh–Russian 3-D web game with three levels (Computer Science, Coworking, IT School). Each level has quests such as debugging code and configuring network topologies and ends with assembling a working artifact. It uses badges and a top-5 leaderboard.
   - Constructs: stealth or hidden assessment of five IT domains (programming, cyber-security, web, graphics/UX, computer architecture). Log events are converted to Rasch-weighted mastery scores in bands: High ≥0.5 logit, Medium −0.5 to 0.49, Low <−0.5.
   - Recommendations: no explicit career-mapping algorithm. Counselors get dashboards.
   - Results:
     - SUS 76.4±9.2
     - IMI 5.6/7
     - state anxiety 1.9/5
     - 92% finished the tutorial
     - level completion 57%, 49% and 41%
     - flow predicted mastery (β=0.28) controlling for GPA
   - Validity: no correlation with any external test. The authors only say the pattern "closely mirrored" regional self-report surveys.
   - Limitations: one region, a 6-week novelty effect, single-cohort Rasch calibration, self-reported GPA.
   - Stack: React 18 with React-Three-Fiber, Ktor/Kotlin, PostgreSQL, Docker. The authors call it open source but give no repository link.

3. **Seo, J.-W. (서지웅) & Jang, J. (2026).** "Behavioral Choice-Augmented Career Exploration System Using a RIASEC-Based Life Simulation and Generative AI." *Journal of the Korean Institute of Smart Media (Smart Media Journal)* 15(9):91. DOI 10.30693/smj.2026.15.9.91. PR (Korean). [ABS]
   - Country and audience: Korea, middle-school students.
   - Game: a situational-choice life simulation whose choices are treated as RIASEC "behavioral evidence".
   - Recommendations: the game choices are compared with the student's CareerNet Vocational Interest Inventory (H) results, and an LLM report summarises agreements, differences, areas to explore, recommended activities and cautions.
   - Status: Flutter prototype, checked only for whether the workflow functions, on a "small operational dataset". No validity statistics. — [OpenAlex record](https://doi.org/10.30693/smj.2026.15.9.91)

4. **Siebert, D.B. et al. (2026).** "Orientação Vocacional Gamificada: o Uso do Modelo RIASEC em um Jogo Digital Interativo." *Anais do Computer on the Beach* 17:758-760. DOI 10.14210/cotb.v17.p758-760. PR short paper. [ABS]
   - Country: Brazil.
   - Game: players explore six thematic islands, one per RIASEC type, completing challenges. An "oracle" then suggests the best-fitting academic path from a predefined list.
   - Status: design only, no evaluation. — [Univali](https://periodicos.univali.br/index.php/acotb/article/download/22308/12957)

5. **Cruz Eraso, A.F., González Serrano, C., Moreno, J. (2016).** "Diseño preliminar de un juego serio para orientación vocacional a partir de la teoría tipológica de Holland." *LACLO 2016* (IEEE). DOI 10.1109/LACLO.2016.7751759. PR. [ABS]
   - Country: Colombia.
   - Content: a serious-game architecture based on Holland's theory. Results are meant to be validated against O*NET, but the paper reports no validation data. — [IEEE](https://doi.org/10.1109/laclo.2016.7751759)

6. **Morais, I.R.P. & Mustaro, P.N. (2020).** "Serious game to support professional choice selection: a decision tree-based proposal." *INTED2020 Proceedings*. DOI 10.21125/inted.2020.1847. Conference paper. [ABS]
   - Country: Brazil.
   - Game: a Unity3D puzzle game for career counsellors.
   - Recommendations: a decision tree built on the 18REST short form of Holland's RIASEC infers the player's professional tendency.
   - Status: proposal, no evaluation. — [IATED](https://doi.org/10.21125/inted.2020.1847)

7. **Azmi, M.S.M., Zabil, M.H.M., Shaidi, N.B., Lim, K.C. (2026).** "MyUniPath: A Gamified Web-Based ICT Programme Recommendation System for SPM School Leavers Using Persona-Based Character Mapping." *Journal of Computational Systems and Informatics* (UNITEN). DOI 10.52650/wkekmr72. PR (institutional journal). [ABS]
   - Country and audience: Malaysia, SPM school leavers (about age 17–18).
   - Game: a 12-question scenario quiz set in everyday contexts (social media, school events). Persona scoring maps the student to one of six archetype characters, one per ICT programme. It uses XP, levels, speed combos, streaks, confetti, and an RPG-style character reveal.
   - Stack: React/TypeScript/Vite.
   - Evaluation: informal only, at a university marketing exhibition (high completion, positive feedback). No psychometrics. — [UNITEN](https://journal.uniten.edu.my/index.php/jcsi/article/download/449/353)
   - This may be the "Malaysian gamified career tool" the brief refers to.

8. **Abdul Aziz, A.A.H. & Mat Zain, N.H. (2025).** "TraitsNavigator Quest: gamified psychometric career assessment." UiTM Institutional Repository / Progress in Computer and Mathematics Journal. NR (student project). [ABS]
   - Country and audience: Malaysia, teenagers and students.
   - Content: a game-like interface wrapped around a psychometric career assessment. It was evaluated for enjoyment only. — [UiTM IR via OpenAlex](https://api.openalex.org/works?search=TraitsNavigator%20Quest)

9. **Vaněček, D., Rehman, I.U., Dobias, M. (2026).** "Advancing From Subjective to Objective Career Counselling: A Hybrid Approach Utilizing Self-Regulated Learning, Virtual Reality, and Vocational Interests for Career Guidance." *IEEE Access*. DOI 10.1109/ACCESS.2026.3690510. PR, open access. [ABS]
   - Country: Czech Republic. n=103 students; the school level is not stated in the abstract.
   - Modules: a "VR Zoo game" for self-regulated learning (Zimmerman model), "Virtual Open Days" measuring implicit interest through eye-tracking, and "Activity Cards" for explicit RIASEC interest.
   - Correlations:
     - SRL cognition vs the General Academic Prerequisites (OSP) test: r=0.504
     - in-game metrics vs expert-rated metacognition: r=0.783
     - game motivation vs IMI: r=0.430
     - AI vs human metacognition ratings: r=0.673
   - The abstract reports no RIASEC convergence figure. — [IEEE Access](https://doi.org/10.1109/access.2026.3690510)

10. **Jammalamadaka, S.B. (2019).** "Career Guidance through TIC-TAC-TOE Game." *IJETER* 7(6). DOI 10.30534/ijeter/2019/01762019. Low-tier journal. [ABS]
    - Country: India (inferred).
    - Content: game play is meant to measure "intelligence, learning ability, perseverance, patience, speed", and an expert system predicts a career. The audience is graduates. No validation. — [IJETER](https://doi.org/10.30534/ijeter/2019/01762019)

11. **Sorokin, V., Tovbis, E., Kazakovtsev, L.A. (2023).** "Browser Game as a New Way of Career Guidance." *European Proceedings of Computers and Technology*. DOI 10.15405/epct.23021.28. Conference paper. [ABS]
    - Country: Russia.
    - Content: a browser game for university applicants that produces recommendations using the Hurwicz decision criterion. Design only. — [EP](https://www.europeanproceedings.com/pdf/article/10.15405/epct.23021.28)

**B. Exploration and occupational-horizon games (no individual recommendation, or recommendation is secondary)**

12. **Keller, C., Döring, A.K., Makarova, E. (2023).** "Factors Influencing the Effectiveness of Serious Gaming in the Field of Vocational Orientation." *Education Sciences* 13(1):16. DOI 10.3390/educsci13010016. PR, open access. [ABS]
    - Country and sample: Switzerland, n=809 lower-secondary adolescents (about age 13–15).
    - Analysis: confirmatory factor analysis, regression and SEM.
    - Results: stimulating *cognitive processes* significantly predicted gains in knowledge about occupations, but enjoyment, flow and self-perceived benefit did **not**. — [MDPI](https://doi.org/10.3390/educsci13010016)
    - **Companion paper:** Keller, Makarova, Döring (2023), "Career Choice With the Serious Game Like2be," *International Journal of Game-Based Learning* 13(1). DOI 10.4018/IJGBL.327788.
      - Design: quasi-experimental, n=809.
      - Results: like2be broadened career-choice horizons, especially when embedded in a teaching concept. Effects on reflection about one's own aptitude and on gender-sensitive attitudes were "limited". — [IGI](https://doi.org/10.4018/ijgbl.327788)

13. **Dunwell, I., Lameras, P., de Freitas, S., Petridis, P., Hendrix, M., Arnab, S., Star, K. (2014).** "Providing Career Guidance to Adolescents through Digital Games: A Case Study." *International Journal of Game-Based Learning* 4(4). DOI 10.4018/ijgbl.2014100104. PR. [ABS]
    - Country: UK.
    - Game: "MeTycoon", a career-tycoon game about non-linear career paths and transferable skills.
    - Reach and evaluation: 38,097 site visits and 408,247 video views. A player survey (n=97) was positive about design and enjoyment. — [Coventry](https://pureportal.coventry.ac.uk/en/publications/15bc06ed-b7c4-4c57-bb72-01b1be7133e6)

14. **Mitchell, G. et al. (2024).** "Employing a serious game intervention to promote adolescent school children's perceptions of nursing and midwifery professions." *BMC Nursing* 23. DOI 10.1186/s12912-024-02045-1. PR, open access. [ABS]
    - Country and sample: UK (Northern Ireland), n=137 students aged 16–17 in 3 schools.
    - Design: pre/post.
    - Results: total score rose from 131.06 to 139.57. The largest gains were in self-efficacy, job prospects and social influences (all p<.001). Girls and students at girls' schools scored higher. — [BMC](https://bmcnurs.biomedcentral.com/counter/pdf/10.1186/s12912-024-02045-1)

15. **Vukanovic-Criley, J.M. et al. (2025).** "Increasing STEM Career Interest in Middle Schoolers Through a Health-Themed Serious Game." *ECGBL 2025*. DOI 10.34190/ecgbl.19.1.4098. PR conference. [ABS]
    - Country: USA.
    - Game: "End of Imperial", an online medical-mystery role-play in which students act as detectives working with health professionals.
    - Results: a post-only Likert survey across 3 school types showed a significant increase in health and science career interest. — [ECGBL](https://papers.academic-conferences.org/index.php/ecgbl/article/download/4098/3670)

16. **Brandenburger, J., Mötsch, I., Janneck, M. (2023).** "Design Features of a Career Guidance Platform to Promote Intrinsically Motivated Use." *Mensch und Computer 2023* (ACM). DOI 10.1145/3603555.3603561. PR. [ABS]
    - Country: Germany.
    - Platform: JOLanDA, a gamified platform for pupils aged 12+ using interactive digital storytelling and scroll-activated animations.
    - Evaluation: a usability test (n=14) and school workshops (n=197, grades 7–9). The narrative and playful approach drew strong interest, and the paper gives design recommendations. — [ACM](https://dl.acm.org/doi/pdf/10.1145/3603555.3603561)

17. **Aragon-Hahner, S., Körber, J., Schneller, M., Strickroth, S. (2023).** "FindMyself: A Mobile Self-Reflection App to Support Students in Career Decision-Making." *MUM 2023* (ACM). DOI 10.1145/3626705.3627774. PR. [ABS]
    - Country: Germany.
    - App: a mobile app built on short challenges and reflection tasks that build a strengths and interests profile.
    - Evaluation: a field study (n=46) found it easy, flexible and fun. **Some users requested concrete career recommendations.** — [ACM](https://dl.acm.org/doi/pdf/10.1145/3626705.3627774)

18. **Shipepe, A. & Peters, A.N. (2018).** "Designing an interactive career guidance learning system using gamification." *AfriCHI 2018* (ACM). DOI 10.1145/3283458.3283481. PR. [ABS]
    - Country: Namibia. Audience: high-school students in a low-resource setting.
    - Method: a mobile career game co-designed through participatory workshops with students and counsellors. Prototype stage. — [ACM](https://doi.org/10.1145/3283458.3283481)

19. **Ipiña Sifuentes, R. & Chans, G.M. (2023).** "DiplomaTec: An experimental and gamified tool that contributes to vocational guidance and career decision-making for high school students." *ICEMT 2023* (ACM). DOI 10.1145/3625704.3625709. PR. [ABS]
    - Country: Mexico (Tec de Monterrey).
    - Programme: a gamified programme of lectures, workshops, tests and tours.
    - Outcome: the rate of first-year engineering students switching programmes fell from about 26% to 18% over 3 years. This is an observational before/after comparison. — [ACM](https://dl.acm.org/doi/pdf/10.1145/3625704.3625709)

20. **Tablatin, C.L.S., Casano, J.D.L., Rodrigo, M.M.T. (2023).** "Using Minecraft to cultivate student interest in STEM." *Frontiers in Education* 8:1127984. DOI 10.3389/feduc.2023.1127984. PR, open access. [ABS]
    - Country: Philippines.
    - Intervention: WHIMC modules in Minecraft.
    - Results: pre/post on the STEM Interest Questionnaire showed **only a minimal effect** on overall STEM interest, with a significant effect only on "Choice Actions". GEQ immersion was higher for high performers. — [Frontiers](https://www.frontiersin.org/articles/10.3389/feduc.2023.1127984/pdf)
    - Engineering-career Minecraft study: Springer LNNS 2025, DOI 10.1007/978-3-031-85649-5_7 (not reviewed).

21. **Putz, L.-M., Beil, D., Dopler, S., Diephuis, J. (2022).** "Combining Gamification and Augmented Reality to Raise Interest in Logistics Careers." *Applied Sciences* 12(18):9066. DOI 10.3390/app12189066. PR. [ABS]
    - Country: Austria.
    - App: "Logistify", a gamified AR app.
    - Evaluation: qualitative, three phases. Positive change in how logistics jobs are perceived. — [MDPI](https://doi.org/10.3390/app12189066)

22. **Shahriar, S. et al. (2022).** "Narrative Integrated Career Exploration Platform (NICE)." *Frontiers in Education* 7:798950. DOI 10.3389/feduc.2022.798950. PR. [ABS]
    - Country: UAE/USA.
    - Platform: four playable narrative problem-solving tracks (AI, cybersecurity, IoT, electronics).
    - Evaluation: a usefulness case study with university students. — [Frontiers](https://www.frontiersin.org/articles/10.3389/feduc.2022.798950/pdf)

23. **Ozaki, K., Geng, X., Yamada, M. (2026).** "Promoting Career Self-regulation in High School Students Using a Career Simulation Game." Springer LNCS. DOI 10.1007/978-3-032-30784-2_26. PR. Country: Japan. [Title/metadata only; no abstract available] — [Springer](https://doi.org/10.1007/978-3-032-30784-2_26)

**C. VR career exploration for teens and young people**

24. **Holly, M., Weichselbraun, C., Wohlmuth, F., Glawogger, F., Seiser, M., Einwallner, P., Pirker, J. (2024).** "VRChances: An Immersive Virtual Reality Experience to Support Teenagers in Their Career Decisions." *Multimodal Technologies and Interaction* 8(9):78. DOI 10.3390/mti8090078. PR, open access. [ABS]
    - Country: Austria.
    - Content: users perform occupational tasks in VR.
    - Sample: 23 teenagers and 8 experts, an exploratory evaluation of expectations and potential. — [MDPI](https://doi.org/10.3390/mti8090078)

25. **Dascălu, M.-I. et al. (2024).** "Virtual Reality for Career Development and Exploration: The CareProfSys Profiler System Case." *Electronics* 13(13):2629. DOI 10.3390/electronics13132629. PR. [ABS]
    - Country: Romania.
    - Design: a profession recommender whose recommendations are delivered as WebVR gamified "try the job" scenarios for 6 jobs.
    - Sample: 47 engineering undergraduates (not school-age). Users rated it useful and entertaining. — [MDPI](https://doi.org/10.3390/electronics13132629)

26. **Khaleghian, H., LiKamWa, R., Finn, E. (2026).** "Making futures playable: role-based VR career exploration to promote student imagination and creative self-efficacy." *Frontiers in Virtual Reality*. DOI 10.3389/frvir.2026.1783996. PR. [ABS]
    - Country: USA. System: "Career XRcade: Esports Land".
    - Sample: pilot N=35, of whom 13 completed both the lecture and VR conditions.
    - Results: VR added gains in creative self-efficacy (dz=0.80) and career interest (dz=0.92), measured with single-item anchors. — [Frontiers](https://public-pages-files-2025.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2026.1783996/pdf)

**D. Non-digital or hybrid card and board games (mostly Indonesia and Malaysia; counselor-led)**

27. **Indrawan, P.A., Korohama, K.E.P., Tajuddin, A.I. (2025).** "Gamifying Career Guidance: A Quasi-Experimental Study Using the Career Snakes and Ladders Game." *Bisma: The Journal of Counseling* 9(3). DOI 10.23887/bisma.v9i3.104502. PR. [ABS]
    - Country and sample: Indonesia, n=20 grade-8 students.
    - Design: experimental vs lecture group.
    - Results: p=0.001 and Cohen's d=2.54. A very small sample, so the effect is likely inflated. — [Undiksha](https://ejournal.undiksha.ac.id/index.php/bisma/article/download/104502/36451)

28. **Rohimah, T., Nurfarhanah, Karneli, Y., Ardi, Z. (2026).** "Gamifying Classical Guidance: Enhancing Career Understanding for University Major Selection Among Indonesian High School Students." *AL-ISHLAH* 18(2). DOI 10.35445/alishlah.v18i2.9758. PR. [ABS]
    - Sample: n=27 grade-11 students, one group pre/post.
    - Results: career understanding rose from 76.04 to 97.78 (Z=−4.54). — [OpenAlex](https://doi.org/10.35445/alishlah.v18i2.9758)

29. **Syahira, Umar, N.F., Harum, A. (2025).** "Development and Validation of an Augmented Reality-Based Career Card Game." *IJOLEC* 8(1). DOI 10.31960/ijolec.v8i1.3138. PR. [ABS]
    - Country: Indonesia.
    - Product: "AR Career Explorer", Holland theory plus AR cards.
    - Evaluation: expert or practicality validation only. — [IJOLEC](https://journal.ilininstitute.com/index.php/IJoLEC/article/download/3138/1098)

30. **Other Indonesian and Malaysian RIASEC card and board games (all R&D with expert validation, no outcome trials):**
    - Zahrani, Sinring, Amirullah (2025), RIASEC-QR code quartet card game, *JPGI*, DOI 10.29210/026767jpgi0005: n=64, material-expert validity 91.67% and media-expert validity 97.92%, practicality 89%. — [JPGI](https://doi.org/10.29210/026767jpgi0005)
    - Yendi & Ginting (2026), Career Monopoly with RIASEC, *Insight J. Counseling & Psychology*, DOI 10.66851/ijcp.v1i2.200: content validity 92.5%, student practicality 94% (n=8). — [IJCP](https://doi.org/10.66851/ijcp.v1i2.200)
    - Ibrahim, Azizan, Zolhani (2025), SWICi board game for at-risk Malaysian adolescents aged 13–17. Validated by 10 experts, piloted, with improvements in career identity and world-of-work knowledge. UiTM IR, NR. — [UiTM via OpenAlex](https://api.openalex.org/works?search=SWICi%20board%20career)
    - Geida (2019), "Pass On" didactic game for grades 7–9, Latvia, *HTQE*, DOI 10.22364/htqe.2019.12. — [HTQE](https://doi.org/10.22364/htqe.2019.12)

### Inferences
- The field splits into two clusters:
  - "Exploration" games that broaden horizons (like2be, MeTycoon, VR job try-outs).
  - "Assessment" games that infer RIASEC or competence and recommend (Gutierrez, Kazakhstan GCG, Korean life simulation, MyUniPath, Brazilian islands).
  The Pakistani app sits in the second cluster, which has the weakest evidence.
- Among the assessment games, only the Kazakhstan study combines a large school sample, a stated psychometric model (Rasch) and SUS reporting. Its target constructs are IT competences, not general stream choice.
- No study comes from Pakistan or South Asia, apart from one Indian low-tier paper aimed at graduates. Namibia (AfriCHI) and Indonesia are the most comparable low-resource settings.

### Gaps
- I could not find peer-reviewed papers titled "CareerQuest" for school students. The OpenAlex hits were a 2025 IGI chapter and an ICCUBEA 2025 ML/NLP system, neither of them games. I also found no Roblox career-exploration study.
- I found no EU-funded project paper named "Career guidance serious game" in OpenAlex beyond like2be (Swiss) and MeTycoon (UK).
- I found no evaluation data for the Japanese 2026 career simulation game beyond its title.
- Full-text verification is still needed for like2be effect sizes, the Gutierrez RIASEC correlation coefficient, and the TraitsNavigator Quest sample.

## Q2. Did any study validate game-derived interest scores against established inventories? What correlations?

### Takeaway
Almost none report hard convergent-validity numbers for *interest* scores.
- **Gutierrez et al. (2025, IEEE TLT)** reports a significant correlation of game responses with academic performance. A secondary source claims correlation with the traditional RIASEC test, but no coefficient was retrievable.
- **The Korean 2026 system** compares game choices with the CareerNet inventory, but only qualitatively, through an LLM report.
- **The Colombian 2016 design** planned an O*NET comparison that was never reported.
- The best numeric evidence comes from adjacent constructs in **Vaněček et al. (2026, IEEE Access)**: game-based self-regulated learning vs an academic-prerequisites test r=0.50, game motivation vs IMI r=0.43, and in-game metrics vs expert ratings r=0.78.

This lack of validation is the main gap a Pakistani app could fill.

### Cited Findings
- Gutierrez et al.: "significant correlation between game responses and academic performance". The abstract gives no r value. — [IEEE TLT](https://doi.org/10.1109/tlt.2025.3579226)
- A summary attributed to the first author's UA doctoral document says in-game scores correlated with the traditional RIASEC test, with usability 4.3/5 and n=100 secondary plus 100 university students. I could not parse the PDF, so this is unverified. — [UA](https://web.ua.es/va/phdinf/documentos/jdi-2026/rommeljairgutierrezyepez.pdf)
- Korean RIASEC life simulation: game choices are "compared with CareerNet Vocational Interest Inventory (H) results". The prototype was checked for workflow only, and no statistics are given. — [SMJ](https://doi.org/10.30693/smj.2026.15.9.91)
- Vaněček et al.: SRL cognition vs OSP r=0.504; in-game vs expert metacognition r=0.783; game motivation vs IMI r=0.430; n=103. The RIASEC "Activity Cards" are described as validating explicit interest, but the abstract reports no RIASEC coefficient. — [IEEE Access](https://doi.org/10.1109/access.2026.3690510)
- Kazakhstan GCG: no external correlation. The authors say mastery patterns "closely mirrored" regional surveys without statistics, and flow predicted mastery with β=0.28. — [Frontiers](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1643246/full)
- Benchmark for what "good" convergence looks like among established inventories: SDS RIASEC scales correlate .24–.71 with the Strong Interest Inventory and .31–.80 with the O*NET Interest Profiler. This comes from a secondary source, a ResearchGate summary of SDS response-format work. — [ResearchGate](https://www.researchgate.net/publication/291016202_Self-Directed_Search_Response_Project)
- Adolescent caution: a Slovak study found the RIASEC circular order was not confirmed in adolescent samples. — [ResearchGate](https://www.researchgate.net/publication/338004875_Validity_of_Holland's_theory_in_adolescence_evidence_from_a_Slovak_sample)

### Inferences
- A Pakistani app should plan a convergent-validity study itself. Students would play the games and take an established RIASEC instrument such as the O*NET Interest Profiler short form or an Urdu adaptation. Per-scale correlations of about .5 or higher would be in line with how established inventories agree with each other.
- The Like2be finding (cognitive engagement mattered, enjoyment did not) suggests engagement metrics should not be presented as evidence of validity.

### Gaps
- I found no meta-analysis or pooled correlation for game-based interest assessment. The adjacent personnel-selection GBA literature (e.g., *Int. J. Selection & Assessment*) covers cognitive ability, not RIASEC interests.

## Q3. Are there systematic reviews or meta-analyses?

### Takeaway
There is one core systematic review, **Parola et al. (2023)**: 7 studies from 2008–2021 with thin evidence, suggesting positive effects on career adaptability. Adjacent reviews are an Indonesian SLR (2026, 12 articles, mostly higher education), a girls-in-CS gaming SLR (2020, 25 papers), and an expert-system review (2022). I found **no meta-analysis**.

### Cited Findings
- **Parola, A., Di Fuccio, R., Marcionetti, J., Limone, P. (2023).** "Digital games for career guidance: a systematic review using PRISMA guidelines." *Behaviour & Information Technology*. DOI 10.1080/0144929X.2023.2177822.
  - Scope: 7 studies (2008–2021).
  - Conclusions: evidence of use is limited, but usability experiences suggest a positive effect on career development, especially career adaptability. — [T&F](https://doi.org/10.1080/0144929x.2023.2177822)
- **Fazria, N., Daniati, N.H., Ifdil, I., Daharnis, D. (2026).** "Integration of Gamification in Career Guidance to Improve Students' Work Skills in the Digital Era: A Systematic Literature Review." *G-Couns* 10(3). DOI 10.31316/g-couns.v10i03.8374.
  - Scope: PRISMA 2020, 12 articles (2020–2025), focused on higher education.
  - Findings: gains in motivation, self-efficacy and engagement.
  - Barriers: cost, digital literacy, staff training. — [UPY](https://journal.upy.ac.id/index.php/bk/article/download/8374/5198)
- **Sharma, K., Torrado, J.C., Gómez, J., Jaccheri, L. (2020).** "Improving girls' perception of computer science as a viable career option through game playing and design: Lessons from a systematic literature review." *Entertainment Computing* 36:100387.
  - Scope: 25 papers.
  - Key design factors: personalisation, collaboration, and a female lead character. — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1875952120300951/pdf)
- **Gunwant, S. (2022).** "A Systematic Study of the Literature on Career Guidance Expert Systems for Students." *J. Learning for Development* 9(3).
  - Scope: 25 expert systems.
  - Finding: rule-based approaches dominate because they are simple. Relevant to how recommendations are produced. — [JL4D](https://doi.org/10.56059/jl4d.v9i3.648)
- Related model: the NEFELE career-guidance model (Frontiers in Psychology 2024, DOI 10.3389/fpsyg.2024.1437472) uses a game for classroom career exploration. A search summary reports its effectiveness was demonstrated by an RCT; I have not verified this in the full text. — [Frontiers](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1437472/full)

### Inferences
- The review base is too thin to give pooled effect sizes. A new Pakistani study would add to a field with fewer than about 10 rigorous digital studies.

### Gaps
- I could not access the Parola review's list of the 7 included studies. It likely overlaps with MeTycoon and like2be.

## Q4. Which design patterns recur, and what worked for engagement?

### Takeaway
Six patterns recur:
1. **Narrative or role-play with situational choices mapped to RIASEC** (Gutierrez, Korean life simulation, JOLanDA, NICE)
2. **Job try-out simulations or quests** (VRChances, CareProfSys, Kazakhstan GCG, End of Imperial)
3. **Themed worlds per RIASEC type** (Brazilian six islands)
4. **Persona or archetype reveal plus XP, streaks and badges** (MyUniPath, GCG leaderboard)
5. **Card and board games played with a counsellor** (Indonesian RIASEC cards, Monopoly, Snakes & Ladders, SWICi)
6. **Reflection prompts** (FindMyself)

Engagement is reliably high (SUS about 76, IMI 5.6/7, satisfaction 4.2–4.5/5). Learning or decision gains depend on cognitive engagement and integration with teachers or counsellors, not on fun alone.

### Cited Findings
- like2be: cognitive stimulation predicted learning, while enjoyment and flow did not. Effectiveness was higher when the game was embedded in a pedagogical concept with teaching materials. — [MDPI](https://doi.org/10.3390/educsci13010016); [IGI](https://doi.org/10.4018/ijgbl.327788)
- Kazakhstan: authentic micro-tasks and a seamless bilingual UI were valued. Completion dropped from 57% to 41% over successive levels, and flow predicted mastery. — [Frontiers](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1643246/full)
- JOLanDA: interactive digital storytelling and scroll-activated animations attracted 12–15-year-olds. — [ACM](https://dl.acm.org/doi/pdf/10.1145/3603555.3603561)
- FindMyself: short challenges plus reflection were fun, but users wanted explicit recommendations. — [ACM](https://dl.acm.org/doi/pdf/10.1145/3626705.3627774)
- MyUniPath: everyday-context scenarios (social media, school events), a persona reveal, XP, combos and streaks led to high completion at an exhibition. — [UNITEN](https://journal.uniten.edu.my/index.php/jcsi/article/download/449/353)
- Generative-AI personalisation of narrative scenarios (Gutierrez) and LLM explanation reports (Korea 2026) are an emerging 2025–26 pattern. — [IEEE TLT](https://doi.org/10.1109/tlt.2025.3579226); [SMJ](https://doi.org/10.30693/smj.2026.15.9.91)
- Minecraft WHIMC produced only a minimal STEM-interest effect, so a sandbox game alone does not shift career interest. — [Frontiers](https://www.frontiersin.org/articles/10.3389/feduc.2023.1127984/pdf)
- Gender: the girls-in-CS review recommends personalisation, collaboration and a female lead. The nursing game found girls scored higher at both pre- and post-test. — [Entertainment Computing](https://www.sciencedirect.com/science/article/pii/S1875952120300951/pdf); [BMC Nursing](https://bmcnurs.biomedcentral.com/counter/pdf/10.1186/s12912-024-02045-1)
- Low-resource contexts: Namibia used mobile-first participatory co-design because smartphones are widespread among youth. — [ACM](https://doi.org/10.1145/3283458.3283481)

### Inferences — what is reusable for a Pakistani classes 9–12 app
- **Assessment architecture:** combine a RIASEC narrative or situational-choice module (Gutierrez, Korean life simulation) with stealth-assessed aptitude mini-tasks scored with Rasch or IRT (Kazakhstan GCG), and keep a short self-report inventory as an anchor so convergence can be computed.
- **Recommendation layer:** a transparent rule-based or persona mapping (MyUniPath, the expert-system review), optionally with an LLM-written explanation that contrasts game evidence with self-report (Korea 2026). The prior report already covers rule-based stream mapping.
- **Engagement:** use Pakistani everyday contexts (MyUniPath-style), a bilingual Urdu–English UI (Kazakhstan's bilingual lesson), short quests (completion fell at later levels), and a persona or character reveal. Female role models and personalisation support girls.
- **Deployment:** embed the app in school or counsellor sessions with teacher materials (like2be). Counsellor dashboards help (Kazakhstan).
- **Evaluation template:** SUS (target ≥68; GCG reached 76), IMI, a state-anxiety short form, completion funnels, and convergent r with an established RIASEC test. A follow-up on stream choice or switching rates would mirror DiplomaTec, which measured outcomes as reduced programme-switching.
- **Avoid:** VR (cost, and samples were mostly older students), expert-validation-only R&D designs, and n<30 pre/post studies as the evidence base.

### Gaps
- I found no study of avatar progression's specific effect on career-game outcomes.
- I found no published game validated for Urdu-speaking or South Asian secondary students.
- No study tracked long-term outcomes such as actual stream or major choice and satisfaction, apart from DiplomaTec's institutional switching rate.
