# Career Assessment Frameworks & Psychometrics for a Game-Based Stream/Career App (Pakistani students, Classes 9-12)

Scope note: Research done Oct 2026 using web search and fetches (about 20 tool calls). Several findings come from abstracts or secondary summaries, not full texts. These are flagged where relevant.

## 1. Holland RIASEC: evidence for adolescents, mapping to fields, O*NET Interest Profiler licensing, IPIP RIASEC markers

### Takeaway
RIASEC is the best-supported base for an interest-to-stream recommender. Interests are already fairly stable in adolescence and predict performance and persistence moderately well when person-environment fit is used. The O*NET Interest Profiler is free, but it is **not public domain**. Unmodified copies fall under CC BY-ND 4.0. Gamifying, translating, or rewording it needs the separate O*NET Tools Developer License, which requires validation. Public-domain IPIP-based RIASEC/basic-interest markers are the most flexible option for a modified, gamified Urdu version.

### Cited Findings
- **Interest stability:** Low, Yoon, Roberts & Rounds (2005, *Psychological Bulletin*) meta-analysed longitudinal studies from early adolescence to middle adulthood. As reported by secondary sources, rank-order stability is already substantial at ages 12-18 (adjusted coefficients about .55-.58). It stays flat through much of adolescence and rises sharply in the college years (18-21.9). These figures come from a secondary citation, so verify them in the original. — [Frontiers in Psychology 2025 brief report citing Low et al.](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1498424/full); [PubMed 16187855](https://www.pubmed.ncbi.nlm.nih.gov/16187855/)
- **Interests and performance:** Nye et al. (2012, *Perspectives on Psychological Science*) meta-analysed 60 studies from 1942-2011. Interests correlated moderately with performance and persistence at work **and in school**, and measures that captured person-environment fit predicted better. — [Univ. of Iowa repository](https://iro.uiowa.edu/esploro/outputs/journalArticle/Vocational-Interests-and-Performance-A-Quantitative/9984380553002771); [APS Observer summary](https://www.psychologicalscience.org/observer/employee-interests-predict-how-they-will-perform-on-the-job)
- **O*NET Interest Profiler versions:** Mini-IP has 30 items, is web/mobile, and is available in English and Spanish (My Next Move / Mi Próximo Paso). The Short Form has 60 items, is a free paper-and-pencil PDF in English, and has an English/Spanish web-service API. Completion takes about 10-20 minutes. Psychometric reports exist for both, plus an "emoji anchors" report on emoji response scales, which is relevant to a game UI. The page states no target age or reading level. The Career Starter score report targets people "without work experience or…just starting their education." — [O*NET IP page](https://www.onetcenter.org/IPSF.html); [IPSF Psychometric summary](https://www.onetcenter.org:443/dl_files/IPSF_Psychometric.pdf); [Mini-IP report](https://www.onetcenter.org:443/dl_files/Mini-IP.pdf); [IP Manual](https://www.onetcenter.org:443/dl_files/IP_Manual.pdf)
- **O*NET licensing:**
  - **Option 1** is CC BY-ND 4.0. You may copy and redistribute with credit to "O*NET Career Exploration Tools" and USDOL/ETA, but may not redistribute modified or extended versions.
  - **Option 2** is the O*NET Tools Developer License. It allows modifying, extending, or creating new tools, but you must credit the source and **validate** every product that uses the content. Registration is optional.
  - The trademark symbol is required, and "O*NET" must be used as an adjective. The page mentions no fee and says nothing explicit about commercial use or translation.
  - [O*NET Career Exploration Tools Content License](https://www.onetcenter.org/license_tools.html)
- **Conflicting licensing claims:** Some third-party sites call the IP Short Form CC BY 4.0, and an academic paper calls it "public domain." The official page says CC BY-ND 4.0 or the Developer License. Treat the official page as authoritative. — [O*NET license page](https://www.onetcenter.org/license_tools.html); compare [jobcannon.io listing](https://jobcannon.io/pl/tests/onet-interest-profiler)
- **Adaptations:** The IP-SF has been adapted to other languages, for example a Brazilian Portuguese adaptation. — [Mackenzie journal](https://mackenzie.emnuvens.com.br/ptp/article/view/12022)
- **IPIP public domain:** IPIP states its "items and scales are in the public domain." They can be copied, edited, translated, or used for any purpose without permission or fee. The pool has more than 3,000 items (3,320 listed) and more than 250 scales. — [ipip.ori.org](https://ipip.ori.org/)
- **Public-domain interest markers:** Liao, Armstrong & Rounds (2008, *Journal of Vocational Behavior*) built public-domain **Basic Interest Markers** from an Interest Item Pool as an alternative to commercial inventories. Armstrong, Allison & Rounds separately produced the **Alternate Forms Public Domain (AFPD) RIASEC markers**, covering interests and self-efficacy. These have been adapted across cultures, including a Spanish/Argentine version. Secondary sources blur the two instrument names, so verify which one you use. — [Illinois Experts: brief public-domain RIASEC markers](https://experts.illinois.edu/en/publications/development-and-initial-validation-of-brief-public-domain-riasec-/); [AFPD Spanish version (CONICET)](https://repositoriosdigitales.mincyt.gob.ar/vufind/Record/CONICETDig_e7b17e37d49451bac2ef942e8858bcce); [Rev. Argentina de Ciencias del Comportamiento 2014](https://doaj.org/article/1d2dcc93417446efabd440b3fad61bf7)

### Inferences
- If the app turns items into game scenarios, translates them to Urdu, or rewords them, CC BY-ND does not allow it. The team would need either the O*NET Developer License (which requires its own validation) or public-domain IPIP/AFPD items. IPIP/AFPD items are the lower-friction route for a commercial or edtech app.
- Map RIASEC to Pakistani streams with a mapping table you design yourself, then test it. A suggested starting heuristic:
  - I+R → Pre-Engineering/ICS
  - I+S → Pre-Medical
  - E+C → I.Com/Commerce
  - A+S → Humanities/Arts
  - R → technical/DAE routes
  
  This heuristic is my inference. It was not found in a source.
- Use O*NET occupation codes (RIASEC high-point codes per occupation) as the bridge from a stream to careers.

### Gaps
- I did not retrieve the full text of Low et al. (2005) or Nye et al. (2012). The coefficients come from secondary sources.
- I found no published mapping of RIASEC codes to Pakistani Matric/Intermediate streams (Pre-Med, Pre-Eng, ICS, I.Com, FA).
- The O*NET page does not say whether commercial use or translation under the Developer License carries any cost. It mentions no fee.
- I did not retrieve the reliability coefficients in the Mini-IP and IPSF psychometric PDFs.

## 2. Big Five / personality: usefulness and limits for stream choice; open licensing

### Takeaway
Big Five traits, especially Conscientiousness, predict academic performance across fields, independently of intelligence. They say little about *which* stream to choose. In the recommender, personality should be a secondary or explanatory layer, not a primary input. IPIP-based measures are public domain. For the BFI-2 I could not confirm license terms.

### Cited Findings
- Poropat (2009, *Psychological Bulletin*) meta-analysed cumulative samples of more than 70,000. Academic performance correlated with Agreeableness, Conscientiousness, and Openness. The Conscientiousness-performance link was largely independent of intelligence. — [Griffith repository](https://research-repository.griffith.edu.au/items/6bf37c65-b7fa-5f87-9046-89ba519cf530); [PDF mirror](https://Www.Gwern.net/doc/psychology/personality/conscientiousness/2009-poropat.pdf)
- Mammadov (2022, *Journal of Personality*) meta-analysed 267 samples. Conscientiousness was a strong and robust predictor of academic performance even after controlling for cognitive ability. — [PDF mirror](https://www.Gwern.net/doc/psychology/personality/conscientiousness/2021-mammadov.pdf)
- IPIP items and scales, including IPIP Big-Five markers, are public domain and free to adapt and translate. — [ipip.ori.org](https://ipip.ori.org/)
- **Urdu Big Five instruments:**
  - **BFI-10 Urdu:** 2022, JPMA. N=500, mostly male adults with mean age about 27.6. Alphas .71-.88, with convergent and discriminant validity. — [JPMA article](https://www.archive.jpma.org.pk/article-details/11482)
  - **BFI-44 Urdu:** 2025, *Journal of Research in Psychology*, LCWU. N=500. Alphas .86-.91, with satisfactory convergent and discriminant validity. The sample's age range is unconfirmed. — [Personality Speaks Urdu](https://jrp.lcwu.edu.pk/index.php/JRP/article/view/117)
  - **25-item Adolescent Personality Questionnaire Urdu:** Ages 13-18, Mirpur AJK. Pilot alpha .85 for English and .96 for Urdu. — [PJHSS](https://www.internationalrasd.org/journals/index.php/pjhss/article/download/2779/1855/15257)
- **Gamified Big Five convergence:** In the VASSIP study (*PLoS ONE* 2024, N=98 university students), the gamified Big Five matched the questionnaire in reliability, but Conscientiousness scores ran substantially higher in the game version. — [PMC11065274](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11065274/)

### Inferences
- The higher Conscientiousness scores in game formats suggest socially desirable responding or game-context bias. If the app reports traits, avoid strong normative claims.
- Use personality to frame advice, for example study habits or the fit between Social traits and medicine. Do not use it as a stream gate.
- Mini-IPIP (Donnellan et al., 20 items) is drawn from IPIP and is therefore presumably public domain. I did not verify this with a source in this session.

### Gaps
- **BFI-2 licensing:** The search returned nothing useful. Check Colby Personality Lab / Soto's site.
- **Big Five and RIASEC overlap:** I could not retrieve the Larson, Rottinghaus & Borgen (2002) meta-analysis.
- **Urdu IPIP for adolescents:** I found no validated Urdu IPIP Big Five for adolescents. IPIP's translations page did not show Urdu in the fetched content.

## 3. Aptitude / cognitive ability and open item banks (ICAR)

### Takeaway
Spatial ability in adolescence predicts STEM outcomes beyond math and verbal scores. Math and spatial ability together outperform math alone. Spatial and numerical/quantitative reasoning are therefore the most relevant aptitudes for a Pre-Engineering/Pre-Medical/ICS recommendation. ICAR is free but **restricted to academic use**: it is not public domain and commercial websites are excluded. A commercial app would need its own item bank or an academic partnership.

### Cited Findings
- Wai, Lubinski & Benbow (2009, *Journal of Educational Psychology*) used Project Talent and SMPY data. Spatial ability measured in adolescence is a salient predictor of STEM degrees and occupations. STEM-bound students had much higher spatial scores than students bound for humanities or social science. — [2009 PDF mirror](https://www.Gwern.net/doc/iq/high/smpy/2009-wai.pdf); [Lubinski 2010 review](https://www.Gwern.net/doc/iq/high/smpy/2010-lubinski.pdf)
- Kell, Lubinski, Benbow & Steiger (2013, *Psychological Science*) found that spatial ability at age 13 predicted creative and scholarly achievement 30+ years later, with incremental validity over math and verbal scores. — [APS press release](https://www.psychologicalscience.org/news/releases/early-spatial-reasoning-predicts-later-creativity-and-innovation-especially-in-stem-fields.html)
- **ICAR item types:** The core ICAR 60 covers Three-Dimensional Rotation, Letter & Number Series, Matrix Reasoning, and Verbal Reasoning. Further types are Figural Analogies, Number Series, Perceptual Maze, and Propositional Reasoning. Contributed sets include Face Detection, Melodic Discrimination, and a "Children's ICAR." A 12-item Sample Test is available. — [ICAR project page, TU Dortmund](https://sms.statistik.tu-dortmund.de/en/research/projects/completed-research-projects/international-cognitive-ability-resource-icar/)
- **ICAR license:**
  - Distributed under a Scientific Use License via PsychArchives ([doi.org/10.23668/psycharchives.22167](https://doi.org/10.23668/psycharchives.22167)). It is "intended for academic use exclusively."
  - Commercial websites are excluded. A commercial test may be validated only in limited scope with an academic partner.
  - Individual IQ determination is discouraged because no norms exist.
  - Verbal items have translations into Arabic, Bengali, Persian, Turkish, Hindi(?) and others, but **not Urdu**.
  - [ICAR project page](https://sms.statistik.tu-dortmund.de/en/research/projects/completed-research-projects/international-cognitive-ability-resource-icar/)
- **ICAR validation:** Condon & Revelle (2014) validated it with an online sample of about 97,000 using 60 items in four types. Concurrent and discriminant validity supported research use. The authors note that public exposure of the items is a validity threat. — [Condon & Revelle 2014 PDF](https://personality-project.org/revelle/publications/condon.icar.14.pdf)
- **Later ICAR studies:**
  - **WAIS-IV comparison:** A 2020 brief report compared ICAR16 against the WAIS-IV. — [SAGE PDF](https://journals.sagepub.com/doi/pdf/10.1177/0734282920943455)
  - **Malaysian Rasch analysis:** Good psychometric properties, but the items were difficult relative to the respondents. — [UKM](https://spaj.ukm.my/ppppm/jpm/article/download/616/474)
  - **NIH Mobile Toolbox implementation:** 2025 mobile version of Puzzle Completion and Block Rotation. — [PMC12733510](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12733510/)

### Inferences
- Mapping aptitudes to streams:
  - spatial + numerical → Pre-Engineering/ICS
  - numerical + verbal → Commerce
  - verbal → Humanities
  - general reasoning + (presumably) verbal/science knowledge → Pre-Medical
  
  This mapping is partly inference. Only the spatial/math → STEM link has strong cited evidence here.
- The ICAR Malaysian finding (items too hard) suggests difficulty must be calibrated for Pakistani 14-16-year-olds.
- Mental rotation, series completion, and matrix puzzles translate naturally into game mechanics. Puzzle formats are already "game-like."

### Gaps
- I found no source on mechanical-reasoning or clerical aptitude predicting commerce/humanities success specifically.
- I found no Pakistani study linking aptitude scores to success in the FSc/ICS/I.Com streams. The local data likely sit in theses or Board records not found here.
- The licensing terms of "Children's ICAR" were not confirmed.

## 4. Gardner's Multiple Intelligences and "learning styles": scientific status

### Takeaway
Both are widely regarded as neuromyths with no validating evidence. Learning-style "meshing" has failed proper crossover tests. MI's intelligences are not independent of g, and no validating studies exist. A credible app should avoid presenting MI or learning-style results as assessments, because doing so undermines scientific credibility with counselors and parents.

### Cited Findings
- **Learning styles:** Pashler et al. (2008) set the crossover-interaction criterion. The few studies that meet it show no support for meshing. Later reviews agree, and Willingham et al. (2015) classify learning styles as a neuromyth. Educators keep believing in it even after neuroscience training. — [Frontiers in Psychology 2018 mini-review](https://www.frontiersin.org/articles/10.3389/fpsyg.2018.01538/full); [Frontiers in Education 2023 review](https://frontiersin.org/articles/10.3389/feduc.2023.1147498/full)
- **Multiple intelligences:** Waterhouse (2006, *Educational Psychologist*) found that MI had no validating data. Waterhouse (2023, *Frontiers in Psychology*) calls MI a neuromyth: no study has directly sought the brain bases of the intelligences, and factor studies have not shown them to be independent. — [Frontiers 2023](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1217288/text); [PMC10493274](https://pmc.ncbi.nlm.nih.gov/articles/PMC10493274)
- Gardner & Moran (2006) replied that Waterhouse misunderstands MI theory. This is a counterpoint from the theory's author. — [Gardner & Moran 2006 PDF](https://people.bath.ac.uk/edspd/Weblinks/MA_ULL/Resources/Motivation%20and%20Intelligence/Gardner%20&%20Moran%202006%20EP.pdf)

### Inferences
- MI vocabulary ("you're a musical/bodily-kinesthetic learner") is popular in South Asian schools and career fairs, so users may expect it. The app can acknowledge it in educational content and explain why it isn't used. This is a trust-building opportunity.
- Separately measured abilities (spatial, verbal, numerical) are defensible. Labelling them "intelligences" in the MI sense is not.

### Gaps
- I found no primary psychometric study that formally tests MI against g; the critique rests on absence of evidence plus factor-analytic observations. I found no Pakistan-specific study on MI or learning-style use in career guidance.

## 5. Work values, self-efficacy (SCCT), career adaptability (Savickas) for teens

### Takeaway
Social Cognitive Career Theory (SCCT) is well supported: self-efficacy and outcome expectations predict interests, and interests predict choice goals. Self-efficacy has the most robust evidence. Self-efficacy is malleable, which suits a game that builds mastery experiences. Career adaptability (CAAS) has been validated with adolescents in several countries and could serve as an outcome or progress metric rather than a recommender input.

### Cited Findings
- Lent et al. (2018) meta-analysed 143 studies. Self-efficacy, outcome expectations, and STEM interests correlated at medium-to-large levels (>.50). — [Search summary, Springer/related](https://link.springer.com/article/10.1007/s11218-025-10068-y) (full text not retrieved; verify)
- Lent, Sheu & Singley (2008), a longitudinal study of engineering students: self-efficacy came before outcome expectations, interests, and goals in time. — [NCAT profile](https://profiles.ncat.edu/en/publications/longitudinal-relations-of-self-efficacy-to-outcome-expectations-i-5/)
- An Italian study of 796 **high school** students (2003) found that self-efficacy and outcome expectations predicted interests, and interests mediated their relation to choice consideration. Social supports and barriers worked mainly indirectly, through self-efficacy. — [Univ. Padova record](https://www.research.unipd.it/handle/11577/2461959)
- A review found robust evidence for the mediating role of self-efficacy and less consistent evidence for outcome expectations. — [Springer 2025](https://link.springer.com/article/10.1007/s11218-025-10068-y)
- Choi, Park & Yang ran a meta-analysis of career decision self-efficacy within SCCT. — [Korea Univ.](https://scholar.korea.ac.kr/handle/2021.sw.korea/107360?mode=full)
- **CAAS with adolescents:**
  - **Brazil:** Form validated with 592 adolescents aged 13-18, with an added "cooperation" dimension. — [Psico 2020](https://pucrs.emnuvens.com.br/revistapsico/article/view/33735)
  - **Croatia:** Validated in samples aged 14-15 (N=309) and 18 (N=492). — [CROSBI](https://www.bib.irb.hr/779950)
  - **Italy:** 12-item short form tested at ages 11-75. — [Unimib](https://boa.unimib.it/handle/10281/107149)
  - **Indonesia:** Rasch analysis with 1,953 adolescents supported all original items. — [search summary; see DOAJ/related](https://doaj.org/article/69047b4e02884c3ca12d3166382c0888)
- **AFPD markers:** The AFPD RIASEC markers come in matching interest and **self-efficacy** forms. — [AFPD Spanish version](https://repositoriosdigitales.mincyt.gob.ar/vufind/Record/CONICETDig_e7b17e37d49451bac2ef942e8858bcce)

### Inferences
- The app can measure RIASEC interests and RIASEC self-efficacy in parallel. A low-efficacy/high-interest pattern points to "build confidence" content rather than steering the student away.
- In Pakistan, family and social supports and barriers matter a great deal, for example parental push toward medicine or engineering, or gender norms. SCCT's contextual constructs give a theory-backed way to include them.

### Gaps
- I did not retrieve exact effect sizes from the Lent 2018 meta-analysis.
- I found no adolescent work-values instrument with open licensing in this session. O*NET has a Work Importance Profiler, but its license and teen suitability were not checked.
- I found no Pakistani CAAS or SCCT validation in this session.

## 6. Validity of gamified/game-based assessment vs questionnaires; measurement pitfalls

### Takeaway
Game-based assessments converge moderately with self-report (meta-analytic r about .52), with high heterogeneity. Gamifying the questionnaire itself preserves validity better than building fully game-based, behaviour-inferred assessments, while fuller games improve user reactions. Watch for score inflation (e.g., Conscientiousness), and validate any game version against the original instrument.

### Cited Findings
- Fadillah et al. (2025, *International Journal of Serious Games*) meta-analysed 18 studies from 13 articles. Overall convergence between game-based assessments and self-report personality was r = .516, with substantial heterogeneity, no significant moderators, and minimal publication bias. The authors call for IRT and predictive-validity studies. — [IJSG](https://journal.seriousgamessociety.org/~serious/index.php/IJSG/article/download/1028/636/6860); [UGM news](https://ugm.ac.id/en/news/examining-game-based-assessment-fadillah-earns-doctorate-in-psychology-from-ugm/)
- In the VASSIP study (*PLoS ONE* 2024, N=98), the gamified version had reliability and scores similar to the original, except that Conscientiousness was substantially higher. The authors judged that it needs more research before high-stakes use. A systematic review cited there found validity better in gamified/gamefully designed assessments, and applicant reactions better in game-based/playful games. — [PMC11065274](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11065274/)
- A DiGRA study (2016, N=212) found that personality responses were consistent between the traditional and game-based conditions, meaning game mechanics did not significantly change responses. — [DiGRA](https://dl.digra.org/index.php/dl/article/view/779)
- **Item exposure:** Public availability of free items is a validity threat because of exposure and coaching. The size of the effect is unknown. — [Condon & Revelle 2014](https://personality-project.org/revelle/publications/condon.icar.14.pdf)
- **ITC/ATP guidelines:** The ITC/ATP *Guidelines for Technology-Based Assessment* (Nov 2022) cover design, delivery, scoring, use, and translation/adaptation. One source mentions a v1.1 (July 2025), which I could not verify. — [Guidelines PDF](https://rd.mandela.ac.za/rcd/media/Store/documents/RecH/Guidelines-for-Technology-Based-Assessment-v20221108.pdf); [e-assessment.com](https://e-assessment.com/news/sponsor/making-sense-of-the-updated-technology-based-assessment-guidelines)

### Inferences
- Recommended architecture: wrap validated items in game narrative ("gamified questionnaire") for the core scores. Use embedded puzzles for aptitude, which are naturally game-like. Avoid inferring personality or interests only from in-game behaviour unless you validate it locally.
- **Pitfalls to design against:**
  - fatigue: keep sessions short and spread them over days
  - socially desirable responding toward "prestige" streams (medicine/engineering) under parental expectations
  - acquiescence
  - English reading level
  - item exposure if items are shared among peers
- O*NET's emoji-anchor report suggests that emoji response scales have been evaluated; see [O*NET IP page](https://www.onetcenter.org/IPSF.html).

### Gaps
- I found no study of gamified RIASEC instruments specifically in adolescents.
- I found no quantitative data on faking or fatigue in teen career-game contexts.
- I did not retrieve the full text of the Fadillah meta-analysis.

## 7. Cultural validity of RIASEC / Big Five in Pakistan and South Asia

### Takeaway
Pakistani evidence is thin. One Urdu RIASEC adaptation (Career Key Urdu, 2014) showed acceptable reliability but a poor fit to Holland's hexagon. One university study (2024, N=1,503) found discipline-interest congruence in some fields but not others. Urdu BFI versions exist, validated mainly in adults. Any app must run local validation.

### Cited Findings
- **Career Key Urdu (CKU):** Hussain, Jones, Fouad, Ismail, Munaf & Khan (2014, *Pakistan Journal of Psychological Research* 29(2), 187-201).
  - Sample: N=179 (94 boys, 85 girls), mean age 17.4, from Karachi and Lahore. 55 were under-matric, 56 intermediate, and 68 first-semester university students.
  - Reliability: CKU alphas were acceptable. CK and CKU scales correlated positively.
  - Structure: **Holland's hexagonal structure did not fit expectations.** Randomization-test indices were low compared with the US sample.
  - Prior work: The only earlier Urdu inventory was an unpublished Urdu Self-Directed Search (Naheed, 1988, n=114) with no manual.
  - [PJPR full text](https://pjpr.scione.com/cms/fulltext.php?id=284)
- **Faize & Husain (2024, *e-mentor* no. 4(106), DOI 10.15219/em106.1675):** O*NET Interest Profiler with 1,503 graduating university students in Pakistan.
  - Students of pure sciences, social sciences, architecture, fine arts, and psychology had chosen disciplines congruent with their RIASEC profiles.
  - Students of computer science, management sciences, electrical engineering, accounting & finance, and mathematics had **not**.
  - The authors describe it as the first such Pakistani study.
  - [e-mentor](https://www.e-mentor.edu.pl/eng/article/index/number/106/id/1675)
- **Aap Ki Dilchaspian (AKD):** An Urdu adaptation of Gordon's Occupational Checklist (not RIASEC) for matriculation students. — [PJPR abstract](https://pjpr.scione.com/cms/abstract.php?id=581)
- **Urdu Big Five versions:** The Urdu BFI-10 and BFI-44 validations and the adolescent Urdu personality questionnaire are listed in Section 2. — [JPMA](https://www.archive.jpma.org.pk/article-details/11482); [JRP LCWU](https://jrp.lcwu.edu.pk/index.php/JRP/article/view/117)
- **ICAR translations:** ICAR verbal items exist in Bengali, Persian, Arabic, and others, but not Urdu. — [ICAR project page](https://sms.statistik.tu-dortmund.de/en/research/projects/completed-research-projects/international-cognitive-ability-resource-icar/)

### Inferences
- The mismatch in CS, engineering, management, and finance in Faize & Husain is consistent with prestige- or family-driven choice in those fields. This is an inference and a strong product rationale for an interest-based tool.
- Because the hexagon fit was poor, the app should score the six RIASEC dimensions independently and avoid relying on hexagon-distance "consistency" indices.
- Local norms and a bilingual (Urdu/English, possibly Roman Urdu) pilot with Matric/Inter students are needed. A pilot with a Pakistani university psychology department could also meet O*NET Developer License validation requirements, and ICAR's academic-partner clause.

### Gaps
- I found no validated Urdu O*NET Interest Profiler and no validated Urdu IPIP RIASEC markers.
- I found no Pakistani gender-invariance data for RIASEC.
- A 2019 Pakistani study (N=1,147) testing RIASEC was mentioned in search results, but I could not obtain its details.
- I found no Indian or Bangladeshi RIASEC validation in this session, although Bengali and Hindi ICAR translations hint at regional work.

## 8. Ethical guidance on career assessment/advice for minors (ITC, APA standards)

### Takeaway
I found little specific material in this session. The ITC/ATP Technology-Based Assessment Guidelines (2022) are the most relevant current standard for a digital or gamified tool. Their minors-specific content, and the APA/AERA/NCME *Standards* and APA Ethics Code provisions on informed consent and assent, were not retrieved.

### Cited Findings
- The ITC/ATP *Guidelines for Technology-Based Assessment* (Nov 2022) cover design, delivery, scoring, use, and translation/adaptation for tech-based tests. — [Guidelines PDF](https://rd.mandela.ac.za/rcd/media/Store/documents/RecH/Guidelines-for-Technology-Based-Assessment-v20221108.pdf); [createadultskills.org record](https://createadultskills.org/resource/guidelines-technology-based-assessment)
- ICAR's developers discourage using ICAR for individual IQ determination because it has no norms. This is a relevant caution against reporting "IQ-like" scores to teens. — [ICAR project page](https://sms.statistik.tu-dortmund.de/en/research/projects/completed-research-projects/international-cognitive-ability-resource-icar/)
- O*NET's Developer License requires validation of modified tools before use. — [O*NET license](https://www.onetcenter.org/license_tools.html)

### Inferences
- Practical ethical design principles, inferred from general professional standards and not sourced here:
  - Present results as exploratory suggestions, not verdicts.
  - Never output a single "correct stream."
  - Show uncertainty.
  - Get parental consent plus child assent for under-18s.
  - Minimise data collection.
  - Avoid ability labels that stigmatise.
  - Offer counselor or teacher follow-up.
  - Avoid gender-stereotyped recommendations.

### Gaps
- I did not retrieve:
  - the ITC Test Adaptation Guidelines (2nd ed., 2017)
  - the ITC Guidelines on Test Use
  - the APA/AERA/NCME *Standards* (2014)
  - the APA Ethics Code provisions on assessment of minors
  - NCDA/IAEVG ethical codes for career guidance
  
  The report writer should cite these cautiously, or the team should verify them.
- I found no Pakistan-specific data-protection or child-consent guidance for edtech. Pakistan's Personal Data Protection Bill status as of 2026 is unverified.
