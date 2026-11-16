# Pakistani Mobile/Technical Context and Quality Frameworks for Rahyaab's Non-Functional Requirements (as of Oct 2026)

Research note. This pass used about 20 web searches/fetches. Most findings come from search-result summaries of the cited pages. Only DataReportal Digital 2026 Pakistan and the Profit cloud-accreditation article were fetched in full. This note builds on `research_notes/Career guidance games app Pakistan/tech_stack_privacy.md`, which already covers Expo SDK 55/New Architecture, Supabase/PostHog, Nastaliq/RTL, the PDP Bill/PECA/COPPA/AADC basics and Play Age Signals. Those points are not repeated here except where a number is needed for an NFR. A few well-known, stable standard facts that I did not re-fetch in this pass are labelled "(not re-verified this pass)".

## 1. Device landscape: OS, Android versions, brands, RAM/storage, shared phones, ownership by gender/region

### Takeaway
Pakistan is overwhelmingly Android: about 92% of mobile/tablet web traffic. The installed base is fragmented across Android 11-16, with Android 13 the single largest version at about 18%. Android 11 and 12 together still make up about a quarter. Phones are mostly locally assembled budget Transsion devices (Infinix/Tecno/Itel), plus Vivo, Xiaomi and Samsung. Current entry models ship with 4 GB RAM and 128 GB storage. Many teens, especially girls, use a shared or borrowed phone: 28% of women who use mobile internet do so only on someone else's phone. Ownership is deeply gendered (women 68% vs men 93%).

### Cited Findings
**OS and Android versions**
- In June 2026, Android held about 91.6% and iOS about 8.3% of the mobile/tablet/console OS share in Pakistan — [StatCounter mobile-tablet OS share Pakistan](https://gs.statcounter.com/os-market-share/mobile-tablet/pakistan)
- Android version share in Pakistan, June 2026: Android 13 about 17.7%, Android 11 about 15%, Android 15 about 13.9%, Android 12 about 11%, Android 14 about 10.7%, Android 16 about 10.5% — [StatCounter Android version share Pakistan](https://gs.statcounter.com/android-version-market-share/mobile-tablet/pakistan)
- July 2026 snapshot: Android 13 about 18.2%, Android 15 about 13.2%, Android 16 about 11.9%. Different StatCounter pages show slightly different values for the same month — [StatCounter Android version share (mobile) Pakistan](https://gs.statcounter.com/android-version-market-share/mobile/pakistan)

**Brands and market structure**
- Q2 2025 unit share: Transsion (Tecno, Infinix, Itel) 44%, Xiaomi 18%, Vivo 17%, Samsung 10%, Oppo 6%. Xiaomi shipments fell about 41% YoY. About 95% of smartphone sales go through independent retailers, not carriers — [Profit/Pakistan Today, Oct 2025](https://profit.pakistantoday.com.pk/2025/10/20/xiaomi-eyes-pakistans-expanding-smartphone-market-as-local-assembly-and-smart-tv-production-gain-pace/)
- PTA local assembly in 2025 (units): Infinix 3.65M, VGO Tel 3.57M, Vivo 2.80M, Itel 2.34M, Samsung 1.85M, Tecno 1.84M, Xiaomi 1.38M, Q Mobile 1.11M, Realme 1.06M, OPPO 1.01M. Local assembly met 93% of demand in 2025, down from 95% in 2024 — [MEA Tech Watch, Jan 2026 (PTA data)](https://meatechwatch.com/2026/01/22/local-mobile-phone-manufacturing-dipped-in-december-2025-pta/)
- Reports say the smartphone share of local production declined in Jan-Jul 2025 (17.8M phones produced). VGO Tel and Q Mobile are largely feature-phone brands — [MEA Tech Watch](https://meatechwatch.com/?p=32484)
- StatCounter vendor web-traffic share, June 2026: Infinix 7.23%, Samsung 6.97%, Vivo 6.25%, Oppo 5.14%, Tecno 4.66%, with 53.61% "unknown". An August 2026 snapshot gives Samsung 13.8%, Infinix 13.34%, Vivo 12.33%. The two disagree on ordering — [StatCounter vendor share Pakistan](https://gs.statcounter.com/vendor-market-share/mobile/pakistan)

**Typical specs and prices of budget phones (2025-26)**
- Tecno Spark 40C: about Rs 25,799, 4 GB/128 GB up to 8 GB/256 GB — [ProPakistani price page](https://propakistani.pk/price/tecno-spark-40c/)
- Tecno Spark 50 (announced Mar 2026): from about Rs 33,600 for 4 GB/128 GB. The Spark 50 4G comes in 4/128, 6/128 and 8/256 — [ProPakistani Spark 50](https://propakistani.pk/price/tecno-spark-50/); [ProPakistani Spark 50 4G](https://propakistani.pk/price/tecno-spark-50-4g/)
- Tecno Spark 40 Pro: about Rs 45,999, 8 GB RAM, 6.78-inch 144 Hz display, 5,200 mAh battery — [ProPakistani](https://propakistani.pk/price/tecno-spark-40-pro-2/)
- Price aggregators conflict (e.g., Spark 50 at Rs 55,999 on WhatMobile vs Rs 33,600 on ProPakistani) — [WhatMobile comparison](https://www.whatmobile.com.pk/Tecno_Spark-50-vs-Infinix_Hot-70)

**Ownership, sharing, gender and region**
- GSMA Mobile Gender Gap Report 2026 (2025 data):
  - Phone ownership is women 68% vs men 93%, the widest ownership gap of all surveyed countries.
  - 28% of women mobile-internet users access it exclusively on someone else's phone, vs 4% of men.
  - Women's mobile internet use rose from 45% to 53%, and the usage gap fell from 25% to 8% — [Arab News](https://www.arabnews.pk/node/2649428/pakistan); [Dawn](https://www.dawn.com/news/2012291)
- Women's smartphone ownership rose from 30% to 40%, and the smartphone gender gap narrowed from 48% to 30% (GSMA 2026 as reported). The ownership gap fell from 37% to 27% — [Dawn](https://www.dawn.com/news/2012291); [ProPakistani Jun 2026](https://propakistani.pk/2026/06/18/telecom-operators-association-hosts-gsma-gender-gap-report-launch-lauds-record-reduction-in-pakistans-mobile-gender-gap/amp/)
- GSMA 2025 report (2024 data): the mobile internet gender gap narrowed from 38% to 25%, with about 8M women coming online in 2024 — [Profit](https://profit.pakistantoday.com.pk/2025/05/15/8-million-women-come-online-in-pakistan-in-2024/); [GSMA report PDF](https://www.gsma.com/wp-content/uploads/2025/12/The-Mobile-Gender-Gap-Report-2025.pdf)
- PSLM-HIES 2024-25 (PBS):
  - Individual mobile/smartphone ownership is 50%, up from 45%. KP 51%, Punjab 50%, Sindh 50%, Balochistan 42%.
  - Household internet access is 70%, up from 34%.
  - Individual internet use is 57% in 2025, up from 17% in 2019. Female and male use are about equal overall; urban women 71% vs urban men 67% — [FAFEN](https://fafen.org/pslm-mobile-internet-access-rises-computer-ownership-stays-flat/)
- The GSMA and PSLM figures use different bases and methods and should not be compared directly. The PSLM age base was not confirmed — [FAFEN](https://fafen.org/pslm-mobile-internet-access-rises-computer-ownership-stays-flat/)

### Inferences
- **Compatibility NFR**:
  - minSdk 24-26 is unnecessary. Android 11 (API 30) and older together are probably under about 20% of traffic, but with versions 11-16 all significant, a floor of API 29/30 seems reasonable. Note that Expo SDK 55 / RN 0.83 set their own minSdk (verify, likely API 24). Supporting from API 24 costs little if the framework allows it.
  - targetSdk must be 36 (Section 4).
  - Test matrix: at least one 4 GB RAM Infinix/Tecno phone (Android 13-15, Helio G-series class), one Samsung A0x/A1x, one Redmi, and one Android 11 device.
  - iOS is about 8%, so iOS is secondary but cheap with Expo.
- **Performance NFR**:
  - Design for a 4 GB RAM / 64-128 GB device that is often full of photos and WhatsApp media.
  - Keep the app's resident memory below about 250-300 MB during games. This is an engineering judgment.
- **Shared-phone NFR**:
  - Support multiple student profiles or quick sign-out on one device.
  - Use PIN-locked profiles, so a sibling or parent cannot see another student's results.
  - Avoid persistent push notifications that reveal results on the lock screen.
  - Support data wipe on logout.
  - This matters especially for girls, given the 28% exclusive-borrowed-phone figure.
- Screen size: budget models are about 6.6-6.8 inches, 720p-class (inferred from model specs above; resolution not sourced). Layouts must also work on smaller 5.5-6 inch and low-DPI screens.

### Gaps
- No 2025-26 Counterpoint/IDC Pakistan report with named sources was found. The 44% Transsion figure comes from a press article without attribution.
- No source gives RAM/storage distribution of the installed base or teen-specific ownership (ages 14-18). PSLM/GSMA cover adults or 10+. GSMA surveys adults 18+.
- No data on screen resolution/DPI distribution in Pakistan (StatCounter screen-resolution page not fetched).

## 2. Connectivity, data cost, shutdowns and power cuts: offline-first and app size

### Takeaway
Median mobile download is about 24 Mbps (Ookla, 2025) and 4G averages about 19 Mbps (Opensignal Q2 2026). 5G covers under 4% of connected time. Data is among the world's cheapest at about Rs 27-29 per GB (about US$0.10). However:
- Pakistan led the world in shutdown losses in 2024 (US$1.62B, 18 shutdowns, 9,735 hours).
- Regional mobile data suspensions continued in 2025-26 (e.g., Balochistan).
- More than 2,000 of 12,665 electricity feeders face over 10 hours of daily load-shedding.

Rahyaab therefore needs offline-first gameplay, small downloads, and resumable sync.

### Cited Findings
**Users and speeds**
- Digital 2026 Pakistan:
  - 194M cellular connections at end-2025 (75.9% of population), 79.5% of them broadband (3G/4G/5G).
  - 117M internet users in Oct 2025 (45.6% penetration); 139M people (54.4%) offline.
  - Ookla median mobile download 24.32 Mbps (+24.1% in the year to Aug 2025); fixed 16.28 Mbps — [DataReportal Digital 2026 Pakistan](https://datareportal.com/reports/digital-2026-pakistan)
- Digital 2025 reported a median mobile download of 20.89 Mbps and fixed of 15.53 Mbps — [DataReportal Digital 2025 Pakistan](https://datareportal.com/reports/digital-2025-pakistan)
- PTA/Opensignal Q2 2026: 4G average download 18.9 Mbps. 5G averages 127.74 Mbps but users were on it only 3.95% of connected time — [Digital Rights Monitor (Aug 2026)](https://digitalrightsmonitor.pk/mobile-internet-faster-than-wifi-in-pakistan/)
- Pakistan has been ranked about 198th globally for internet speed in some coverage (methodology and date per article) — [Profit](https://profit.pakistantoday.com.pk/?p=179643); [Digital Rights Monitor](https://digitalrightsmonitor.pk/pakistan-internet-speeds-global-rank/)

**Subscribers and coverage**
- PTA Annual Report 2024-25: 4G users rose from 111.9M to 141.4M. Broadband subscribers grew to about 150M, with penetration about 60.6%. Mobile subscribers numbered 197.8M — [MEA Tech Watch](https://meatechwatch.com/2026/01/05/pakistans-telecom-sector-hits-200-million-subscribers-rs1-trillion-revenue-in-fy2024-25/); [Profit](https://profit.pakistantoday.com.pk/?p=201771)
- About 95% of cellular network sites are reported to be 4G-enabled. This measures site coverage, not population coverage — [ProPakistani Mar 2026](https://propakistani.pk/2026/03/02/pakistans-telcos-revenue-crosses-rs-1-billion-with-nearly-150-million-4g-users/amp/)
- Mobile subscriptions were reported at 225.75M by Jan 2026 (PTA) — [MEA Tech Watch](https://meatechwatch.com/?p=47921)

**Data cost**
- Economic Survey FY2025: 1 GB costs about US$0.10, the lowest in the region and sixth-lowest globally. The effective price fell from Rs 77.1/GB to Rs 27.0/GB — [TechJuice](https://www.techjuice.pk/pakistan-ranks-6th-globally-for-cheapest-mobile-data/); [MEA Tech Watch Jun 2025](https://meatechwatch.com/2025/06/16/pakistan-offers-some-of-the-worlds-cheapest-mobile-data-with-prices-dropping-65-since-2018/)
- Users pay about Rs 29/GB and ARPU is about $1/month. Telcos say data prices may rise (Aug 2026) — [ProPakistani Aug 2026](https://propakistani.pk/2026/08/13/telcos-could-increase-data-charges-for-survival/)
- Average monthly mobile data use is reported at about 9 GB per user — [The News](https://www.thenews.pk/print/1417655-mobile-data-eases-to-9-01gb-from-march-record-stays-on-growth-track)
- Conflict: cable.co.uk's earlier methodology put Pakistan at US$1.85/GB (rank 33, 2019), which PTA disputed — [PTA press release](https://pta.gov.pk/index.php/en/media-center/single-media/pakistan-has-been-ranked-number-1-for-the-provision-of-most-affordable-telecom-services-250319)

**Shutdowns and throttling**
- Top10VPN 2024: Pakistan had the highest global shutdown cost at US$1.62B, from 18 shutdowns lasting 9,735 hours and affecting 82.9M users — [Digital Rights Foundation](https://digitalrightsfoundation.pk/internet-shutdowns-cost-pakistan-us1-62-billion-report/); [TechRadar](https://www.techradar.com/vpn/vpn-privacy-security/government-imposed-internet-shutdowns-cost-over-usd7-billion-in-2024-and-pakistan-was-the-most-affected-nation)
- 2025 incidents include Balochistan mobile data suspensions (around 30 Aug and 6 Sep 2025) and October 2025 shutdowns tied to gatherings. A social-media/internet disruption was reported on 14 Oct 2026 — [Aaj News](https://english.aaj.tv/news/330432051/balochistan-internet-shutdown-mobile-data-suspended-today-and-on-sept-6-pakistan-news); [LUMS MHRC](https://mhrc.lums.edu.pk/pakistans-digital-dilemma-true-cost-internet-shutdowns); [BOL News](https://bolnews.com/pakistan/internet-and-social-media-disrupted-in-pakistan)
- PTA requires VPN registration and has blocked unregistered VPN apps — [TechRadar](https://www.techradar.com/vpn/vpn-privacy-security/pakistan-begins-blocking-unregistered-vpn-apps-and-this-popular-service-is-among-the-casualties)

**Power cuts**
- Feb 2026 NA reply: more than 2,000 of 12,665 feeders face over 10 hours of daily load-shedding. QESCO 604/814, PESCO 642/1,376, SEPCO 407/707, HESCO 322/747 — [The News](https://www.thenews.pk/print/1398879-more-than-2-000-feeders-face-over-10-hours-of-daily-loadshedding-na-told)
- In Oct 2026 the shortfall exceeded 4,000 MW, with 3-4 hours/day of load-shedding reported — [ARY](https://arynews.tv/en/pakistan-electricity-shortfall-surpasses-4000mw); [Pakistan Observer](https://pakobserver.net/?p=780363)
- The government plans to shift load-shedding from feeders to transformers from June 2027 — [ProPakistani Oct 2026](https://propakistani.pk/2026/10/19/pakistan-to-shift-load-shedding-from-feeders-to-transformers-from-next-year/)
- Load-shedding during power cuts also takes down home Wi-Fi and some cell sites, though no source quantifying cell-site downtime was found.

### Inferences
- **Availability NFR**:
  - All mini-games, questionnaires and story content for a session must work with zero connectivity once downloaded.
  - Results queue in a local outbox (SQLite) and sync idempotently when online.
  - Sync must survive app kill/battery death: write each trial to disk immediately, never hold it in memory only.
  - The recommendation should be computable on-device as a preliminary result, then confirmed by the server.
- **Performance and network NFRs**:
  - API p95 latency ≤ 800 ms on a 4G connection at about 5 Mbps.
  - Initial sync payload ≤ 1 MB.
  - Per-session telemetry upload ≤ 200 KB compressed.
  - Use exponential backoff with no tight retry loops, to save battery during outages.
  - Treat 3G / 1 Mbps as the degraded-test profile.
- **Size NFR**:
  - Play download size ≤ 30-40 MB (AAB per-ABI); downloadable content packs (Urdu fonts, story art) ≤ 10 MB each and optional.
  - Rationale: data is cheap at Rs 27-29/GB, so the binding constraint is free storage on 64-128 GB phones crowded with media, and slow or interrupted downloads, not data cost.
- **Battery NFR**: battery drain matters because phones can't be charged for 10+ hours on some feeders. Target ≤ 5% battery per 20-minute session on a 5,000 mAh device (engineering target, unsourced). Avoid background services and use dark/low-brightness-friendly themes.

### Gaps
- No Ookla Speedtest Global Index monthly figure for Sep/Oct 2026 was retrieved (DataReportal's end-2025 figure used).
- No 2025/2026 Top10VPN Pakistan cost figure was found.
- No authoritative national average of daily load-shedding hours for 2026, and no data on rural 4G population coverage by province.

## 3. Language and literacy of Grade 9-12 students

### Takeaway
ASER 2023 shows weak foundational reading: only about half of Grade 5 rural children can read a Grade 2 Urdu/regional story, and only about 29% can read English sentences. Many Grade 9-12 students in government schools, especially rural ones, will therefore read English slowly. Urdu-first (with English toggle), short sentences, audio and icon support are usability requirements, not extras.

### Cited Findings
- ASER 2023 (rural, 151 districts, 272,370 children aged 3-16): 49% of Grade 5 children can read a Grade 2 story in Urdu/Siraiki, 29% can read English sentences, and 34% can do basic subtraction — [ASER 2023 provisional via State of Children](https://stateofchildren.com/annual-status-of-education-pakistan-2023-provisional); [ProPakistani](https://propakistani.pk/?p=1038106)
- Sindh rural Grade 5: Sindhi/Urdu story reading 39% in 2023 (40% in 2021); English sentences 22% (23% in 2021) — [Dawn](https://www.dawn.com/news/amp/1824238)
- Reading levels are described as flat or declining since 2019, with wide variation by district (e.g., Bahawalpur vs Thatta) — [State of Children: subject-wise 2019-2023](https://stateofchildren.com/subject-wise-performance/)

### Inferences
- **Localization NFR**:
  - Full Urdu (Nastaliq) and English UI at launch, switchable at any time.
  - Roman-Urdu labels are an optional later addition.
  - Optional audio narration for questions and results in Urdu.
  - Regional languages (Sindhi, Pashto, Punjabi/Saraiki) are a later phase, so architect i18n keys now.
- **Usability NFR**:
  - Target an English reading level of about Grade 5-6 (e.g., Flesch-Kincaid ≤ 6) and short Urdu sentences.
  - At most one instruction per screen, with an icon and an example.
  - Validate with think-aloud testing with rural/government-school students: 90% task completion without help for core flows.
- Grade 9-12 is roughly ages 14-18 (inferred from the Pakistani school system). ASER only tests up to age 16 and assesses Grade 2-level competencies, so it gives a floor, not a direct measure of Grade 9-12 reading.

### Gaps
- No direct reading-level data for Grades 9-12 was found (ASER caps at age 16 and Grade 2-level texts). National Assessment (NAT) Grade 8 results were not searched.
- No data on the share of students in Urdu- vs English-medium streams for Grade 9-10 by province.

## 4. Quality and security standards that structure the NFRs

### Takeaway
Use ISO/IEC 25010:2023 as the NFR taxonomy. It has nine characteristics, including the new Safety, the renamed Interaction capability (formerly usability) and Flexibility (formerly portability). Map these concrete thresholds onto it:
- Google Play: targetSdk 36 since 31 Aug 2026.
- Android vitals: user-perceived crash rate < 1.09% and ANR rate < 0.47% overall, < 8% per device model.
- Startup: cold start < 5 s (vitals "excessive") and warm < 2 s.
- Security: OWASP MASVS v2.1 (8 control groups including MASVS-PRIVACY), Mobile Top 10 2024 for app risks, and OWASP ASVS for the FastAPI backend.
- Accessibility: WCAG 2.2 AA.

### Cited Findings
**ISO/IEC 25010:2023**
- The 2023 edition adds Safety as a characteristic, with subcharacteristics operational constraint, risk identification, fail safe, hazard warning and safe integration.
- Usability is renamed Interaction capability, with inclusivity, self-descriptiveness and user engagement added (user engagement replaces UI aesthetics; accessibility is split into inclusivity and user assistance).
- Portability is renamed Flexibility, with scalability added.
- Security gains resistance.
- Sources: [arc42 quality: ISO 25010 update 2023](https://quality.arc42.org/articles/iso-25010-update-2023); [arc42 ISO 25010](https://quality.arc42.org/standards/iso-25010); [ISO/IEC 25010:2023 preview (ANSI)](https://webstore.ansi.org/preview-pages/ISO/preview_ISO+IEC+25010-2023.pdf)
- The standard text is paywalled; details above come from secondary sources — [SonarSource explainer](https://www.sonarsource.com/resources/library//iso-iec-25010-explained/)

**Google Play and Android vitals**
- Target API: since 31 Aug 2026, new apps and updates must target Android 16 (API 36), and existing apps need API 35 to stay available to new users on newer devices. One secondary source mentions an extension to 1 Nov 2026 on request (unverified) — [Android Developers: target SDK](https://developer.android.com/google/play/requirements/target-sdk); [Play Console Help](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-419)
- Android vitals bad-behavior thresholds:
  - Overall user-perceived crash rate 1.09% and user-perceived ANR rate 0.47% of daily active users.
  - Per phone model, 8% for each.
  - Exceeding them can reduce Play visibility and trigger a store-listing warning. Thresholds are subject to change — [Android Developers: vitals](https://developer.android.com/games/optimize/vitals); [Android Developers Blog Oct 2022](https://android-developers.googleblog.com/2022/10/raising-bar-on-technical-quality-on-google-play.html?m=1)
- Startup: Android vitals flags excessive startup at ≥ 5 s cold, ≥ 2 s warm and ≥ 1.5 s hot, measured as time to initial display (TTID). Google recommends `reportFullyDrawn` for TTFD — [Android Developers: App startup time](https://developer.android.com/topic/performance/launch-time); [Play Console Help: Android vitals](https://support.google.com/googleplay/android-developer/answer/9844486?hl=en-GB)

**OWASP**
- MASVS v2.1.0 (Jan 2024) added MASVS-PRIVACY. The 8 control groups are STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE, RESILIENCE and PRIVACY — [OWASP MAS news: MASVS v2.1.0](https://mas.owasp.org/news/2024/01/18/masvs-v210-release--masvs-privacy/); [Open Security Architecture: MASVS v2.1](https://opensecurityarchitecture.org/frameworks/owasp-masvs-v2)
- OWASP Mobile Top 10 2024 (final; replaces 2016): M1 Improper Credential Usage, M2 Inadequate Supply Chain Security, M3 Insecure Authentication/Authorization. Insecure Data Storage, Insecure Communication and Insufficient Cryptography remain on the list — [Approov](https://approov.io/info/how-to-use-the-2024-owasp-mobile-top-ten); [Bureau Veritas](https://cybersecurity.bureauveritas.com/services/information-technology/pentesting-services/what-can-be-pentested/mobile-apps-pentesting/owasp-mobile-top-ten-update-2024)
- The remaining Mobile Top 10 2024 items were not confirmed in this pass. From prior knowledge (not re-verified this pass): M4 Insufficient Input/Output Validation, M5 Insecure Communication, M6 Inadequate Privacy Controls, M7 Insufficient Binary Protections, M8 Security Misconfiguration, M9 Insecure Data Storage, M10 Insufficient Cryptography — [OWASP Mobile Top 10 project](https://owasp.org/www-project-mobile-top-10/)
- OWASP ASVS: (not re-verified this pass) ASVS 5.0.0 was released in 2025 with levels L1-L3. L2 is the usual target for apps handling sensitive personal data — [OWASP ASVS project](https://owasp.org/www-project-application-security-verification-standard/)

**WCAG 2.2 AA** (not re-verified this pass; stable W3C Recommendation, Oct 2023)
- Text contrast is 4.5:1, or 3:1 for large text and UI components.
- SC 2.5.8 Target Size (Minimum) is 24×24 CSS px.
- SC 3.3.8 Accessible Authentication: no cognitive-function tests such as remembering passwords without alternatives.
- SC 2.4.11 Focus Not Obscured.
- Source: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

### Inferences
Proposed NFRs mapped to ISO 25010:2023:

- **Performance efficiency**:
  - Cold start TTID ≤ 3 s and TTFD ≤ 5 s on the reference 4 GB Transsion device. This keeps Rahyaab well below the 5 s vitals limit.
  - Warm start ≤ 1.5 s.
  - Games hold 60 fps, with ≥ 95% of frames under 16.7 ms; reaction-time tasks must flag sessions with dropped frames.
  - Memory ≤ 300 MB.
  - API p95 ≤ 800 ms, p99 ≤ 2 s.
- **Reliability**:
  - Crash-free users ≥ 99.5%, i.e., crash rate ≤ 0.5%, half of the 1.09% vitals limit.
  - ANR rate ≤ 0.2%, and no device model above 2%.
  - No loss of a completed game session across app kill, outage or power loss (verified by fault-injection tests).
  - Backend availability ≥ 99.5% monthly during school hours (Section 6).
- **Compatibility / Flexibility**: targetSdk 36 (and the following year's level each August); Android 10/11 through 16; screens 5.5-6.8 inches; works at 1 Mbps; installs with ≤ 150 MB free space.
- **Security**:
  - Mobile app: MASVS L1 across all groups plus the MASVS-PRIVACY controls.
  - Backend (FastAPI): ASVS L2.
  - Network: TLS 1.2+ only, with certificate pinning optional.
  - Tokens in Keystore via `expo-secure-store`; no secrets in the bundle; dependency/SBOM scanning (M2 supply chain).
  - Rate limiting on auth/OTP endpoints.
  - An annual penetration test before school rollouts.
- **Interaction capability**:
  - WCAG 2.2 AA, with 44-48 dp targets (above the 24 px minimum, given low-end touchscreens).
  - Support font scaling to 200% without loss of content.
  - No reliance on colour alone.
- **Safety** (new in 25010):
  - Hazard warnings and fail-safes for recommendation output: never show a single "verdict".
  - Show confidence and counsellor/parent prompts.
  - Content filters on any LLM text.
- **Maintainability**:
  - Server-side config of scoring weights.
  - EAS Update OTA for JS fixes within 24 h.
  - ≥ 70% unit test coverage on scoring logic.
  - Versioned scoring models.
  - Mean time to patch critical vulnerabilities ≤ 7 days.

### Gaps
- Full Mobile Top 10 2024 ordering and ASVS 5.0 release details were not verified from OWASP pages in this pass.
- The ISO/IEC 25010:2023 full subcharacteristic list was not checked against the standard text (paywalled).
- WCAG 2.2 criteria were cited from prior knowledge; the W3C page was not re-fetched.

## 5. Legal and privacy for minors in Pakistan (2026) plus international benchmarks

### Takeaway
As of Oct 2026, Pakistan still has no enacted comprehensive data protection law. The 2023/2025 PDP Bill drafts leave children's consent and age verification to future rules, so there is no statutory "digital age of consent" in Pakistan. The Cloud First Policy (2022) and the May 2026 cloud-provider accreditation push localization of sensitive data for the public sector, which matters if Rahyaab is deployed via government schools. Best practice: treat all users under 18 as children (UK Children's Code), get parental consent for under-18s, use high-privacy defaults, and comply with COPPA/GDPR Art. 8 as benchmarks.

### Cited Findings
**Pakistan**
- No version of the PDP Bill had been enacted as of May 2026. A 14 May 2026 NA reference to a "Personal Data Protection Act 2026" is not supported by any Senate register or Gazette entry. Chambers (updated Mar 2026) calls the bill a draft — [Chambers 2026 Pakistan](https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/pakistan); [offlist.me (less authoritative)](https://www.offlist.me/what-is-pakistan-data-protection)
- The 2023 final draft emphasises protection of children's data and leaves age verification and parental consent mechanics to rules (no fixed age found in the summaries) — [MoITT Final Draft PDP Bill May 2023](https://moitt.gov.pk/SiteImage/Misc/files/Final%20Draft%20Personal%20Data%20Protection%20Bill%20May%202023.pdf); [Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/pakistan-introduces-new-draft-of-personal-data-protection-bill)
- Pakistan Cloud First Policy (Feb 2022): a five-tier data classification (Open, Public, Restricted, Sensitive/Confidential, Secret) with minimum security and deployment baselines per tier, applying to federal public-sector ICT investments — [ProPakistani 2022](https://propakistani.pk/2022/03/14/5-data-types-and-security-arrangements-under-pakistans-cloud-first-policy/amp/); [Cyber Policy Portal](https://database.cyberpolicyportal.org/en/entity/16zdqyw1tg7?page=2)
- Cloud provider accreditation (May 2026):
  - MoITT launched accreditation under the Cloud First Policy and received 6 applications.
  - Providers need security audits by PK-CERT-registered auditors.
  - Sensitive (government/citizen) data should be stored on servers physically in Pakistan.
  - The article does not say whether private apps are covered — [Profit, 26 May 2026](https://profit.pakistantoday.com.pk/2026/05/26/pakistan-launches-cloud-provider-accreditation-under-new-data-localization-push)
- A draft National Data Governance Policy (2026) is drawing industry concern over classification and localization — [ProPakistani Aug 2026](https://propakistani.pk/2026/08/27/it-industry-warns-national-data-policy-could-hit-pakistans-it-exporters/); [PhoneWorld](https://www.phoneworld.com.pk/psha-flags-gaps-in-pakistans-draft-data-governance-policy-warns-of-risks-for-it-exporters/)
- PECA 2025 amendments and litigation are covered in the earlier tech_stack_privacy.md note (Section 7).

**International benchmarks** (not re-verified this pass except where linked in the earlier note)
- GDPR Art. 8: parental consent is needed for information-society services offered to children under 16, and member states may lower this to 13 — [EUR-Lex GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- COPPA: under-13s; the amended Rule's compliance date was 22 Apr 2026 (see earlier note, Federal Register).
- UK AADC: under-18s are children; 15 standards; profiling and geolocation off by default (see earlier note).

### Inferences
- **Privacy NFRs**:
  - Verifiable parent/guardian consent for all users under 18, recorded with notice version and timestamp.
  - Grade 9 students may be 13-14. No under-13 users; block them with a neutral age gate.
  - Data minimisation: no CNIC/B-Form, no precise location, no contacts or photos.
  - Pseudonymous IDs.
  - Profiling for research off by default.
  - Export and delete within 30 days of request.
  - Raw telemetry deleted or aggregated after 12 months.
  - Bilingual privacy notice at Grade 6 reading level.
  - Breach notification to parents and schools within 72 h (borrowed GDPR timing as a self-imposed standard).
- **Data residency NFR**:
  - For a private pilot, hosting outside Pakistan is currently lawful (no enacted PDP law).
  - If deployed through government schools or provincial education departments, student records may be classed as "Restricted/Sensitive" under the Cloud First Policy. Design for portability to an accredited in-country cloud: containerised FastAPI, standard PostgreSQL, and no proprietary lock-in.

### Gaps
- No primary-source confirmation (Gazette or Senate register) of PDP Bill status as of Oct 2026.
- The exact child-consent age and cross-border transfer clauses of the 2025 draft were not retrieved.
- No source on provincial education department rules for EdTech handling student data.

## 6. Hosting options near Pakistan, costs and uptime expectations

### Takeaway
No AWS, Azure or Google Cloud region exists inside Pakistan as of this search. Local hyperscale plans (Khazana Cloud with NASTP) are announced, not operating. The nearest hyperscaler regions are in the UAE (AWS me-central-1), Bahrain (me-south-1) and Mumbai (ap-south-1). The UAE and Mumbai are about 30 ms apart on the AWS backbone; actual Karachi/Lahore latency was not found. For school use, about 99.5% monthly availability during school hours is a proportionate target for a small team, with offline-first covering outages.

### Cited Findings
- No Pakistan region appears among the 15 new public cloud regions hyperscalers opened in 2025 (Thailand, Malaysia, Indonesia, New Zealand, Chile, etc.) — [S&P Global, Feb 2026](https://www.spglobal.com/energy/en/technology-ai-research-insights/blogs/hyperscalers-continue-global-data-center-expansion-despite-geopolitical-tensions)
- Khazana Cloud and NASTP plan Pakistan's "first hyperscale data center" (announcement only) — [DatacenterDynamics tag: Khazana Cloud](https://www.datacenterdynamics.com/en/tags/khazana-cloud/)
- In 2022, Amazon and Google were reported to be investing in nationwide cloud services in Pakistan — [ProPakistani Jan 2022](https://propakistani.pk/2022/01/24/amazon-and-google-are-investing-in-pakistan-for-nationwide-cloud-services/amp/)
- AWS inter-region latency (third-party measurement): me-central-1 (UAE) ↔ ap-south-1 (Mumbai) about 30-31.5 ms; me-south-1 (Bahrain) ↔ me-central-1 about 14.7 ms — [Economize](https://www.economize.cloud/resources/aws/latency/me-central-1-vs-ap-south-1/)
- MoITT is accrediting in-country cloud providers (6 applicants as of May 2026) — [Profit](https://profit.pakistantoday.com.pk/2026/05/26/pakistan-launches-cloud-provider-accreditation-under-new-data-localization-push)
- Supabase Pro costs $25/mo and free projects pause after 1 week of inactivity (from the earlier note) — [Supabase pricing](https://supabase.com/pricing.md)

### Inferences
- **Hosting recommendation for the FastAPI/PostgreSQL stack**:
  - Primary in the UAE or Mumbai (managed Postgres plus a container service), or a low-cost VPS provider with a Middle East/India location.
  - Keep a migration path to an MoITT-accredited Pakistani cloud.
  - Expected cost for a pilot of 1-5k students is about $25-60/month (managed Postgres small tier plus one small container). Unverified estimate; check current price sheets.
- **Uptime NFR**:
  - 99.5% monthly (about 3.6 h downtime per month) with planned maintenance outside 08:00-15:00 PKT on school days.
  - RPO ≤ 24 h with daily backups plus point-in-time recovery if available; RTO ≤ 4 h.
  - Because gameplay is offline-first, server downtime should not block students mid-session. Only sync, consent and counsellor dashboards depend on uptime.
  - 99.9% is unnecessary cost for a pilot.
- **Latency NFR**: measure real RTT from Jazz/Zong/Telenor/Ufone 4G in Karachi, Lahore, Peshawar and Quetta to the candidate regions before choosing. Target p95 RTT ≤ 150 ms.

### Gaps
- No measured latency from Pakistani mobile networks to the UAE/Mumbai/Bahrain cloud regions.
- No pricing found for local Pakistani cloud/hosting providers (e.g., NTC government cloud, Jazz/Garaj, PTCL/Ufone cloud services), and no confirmed list of accredited providers.
- No published uptime standard for EdTech in Pakistani schools was found; the 99.5% target is a proposal.
