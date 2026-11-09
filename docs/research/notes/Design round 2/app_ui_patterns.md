# Rahyaab redesign: UI patterns from Gen-Z apps (design round 2)

Researched 2026-10-31. Sources are linked inline. Lines marked **[practice]** are standard design practice and my own synthesis, not claims from a cited source. Check every licence on the asset's own page before you ship it.

---

## 1. What makes Gen-Z apps feel premium rather than plain

| App | Technique that stops it looking plain | What Rahyaab can take from it |
|---|---|---|
| **Duolingo** | All illustrations are built from 3 shapes (rounded rectangle, circle, rounded triangle). Pointy shapes are "off-brand", and about 15 shapes per character is the right amount ([design.duolingo.com/illustration](https://design.duolingo.com/illustration), [characters](https://design.duolingo.com/illustration/characters)). The 2018 redesign replaced flat, pointy, muted art with this rounded style ([Duolingo blog, shape language](https://blog.duolingo.com/shape-language-duolingos-art-style/)). A mascot reacts to everything. Buttons are chunky, with a 4px darker "lip" underneath that squashes when pressed. Bright solid colours. | One mascot (e.g. a guide character, "Rahi") that appears on empty states, loading screens, results and errors. Rounded shapes only. Pressed-down 3D buttons. |
| **Finch** | The pet grows when you complete real-life goals. Onboarding is a conversation: the pet asks your name ([screensdesign teardown](https://screensdesign.com/articles/finch-app-onboarding-design/)). Critique: some screens get cluttered and progress indicators are inconsistent ([Pratt IxD critique](https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/)). | Run onboarding as a chat with the mascot. Grow an avatar or "journey" as game chapters are finished. Avoid clutter and always show progress. |
| **Spotify Wrapped** | Full-screen story slides, huge type, flat colour blocks, shapes with their own motion. 2024 used fewer tactics, which made it read cleaner than the cluttered 2021 edition ([Alex Jimenez](https://alexjimenezdesign.substack.com/p/three-design-elements-that-made-spotify), [It's Nice That 2024](https://www.itsnicethat.com/features/spotify-wrapped-2024-graphic-design-041224)). Motion work moved from engineers to motion designers ([Spotify Engineering 2023](https://engineering.atspotify.com/2024/1/exploring-the-animation-landscape-of-2023-wrapped)). Critique: copy is always centred, so screens vary little ([UX Collective](https://uxdesign.cc/whats-happened-to-spotify-wrapped-cdfc32bf56a7)). | Use this format for the results reveal (section 2.7). Vary the layouts between slides. |
| **Airbnb 2025** | A "dimensional" design system: 3D icons and an animated interface, built in-house over about 2 years so the icons work as a "universal language" ([It's Nice That](https://www.itsnicethat.com/articles/airbnb-app-redesign-140525), [TechBuzz](https://techbuzzireland.com/2025/05/14/redesigned-airbnb-app-now-available/)). It signals a move back to depth, gradients and shadows. | 3D clay icons for streams and subjects: Pre-Med (stethoscope), Pre-Eng (gear), ICS (laptop), Commerce (coins), Arts (palette). |
| **Headspace** **[practice]** | Soft blob characters, warm pastels, generous whitespace, slow easing. | Calm screens: parent link, settings. |
| **Apple Fitness rings / Strava / Nike Run Club** **[practice]** | One strong progress symbol, closing rings with haptics, streaks, an end-of-session summary card that can be shared. | A "trait ring" or radar that fills as you play, plus a per-chapter summary card. |
| **Revolut / SadaPay** **[practice]** | Dark surfaces with one vivid accent colour, big numbers, card-stack visuals. SadaPay is the local proof that Pakistani youth accept a bold, playful fintech style. | A bold accent colour on a neutral base, and big numerals for scores. |
| **BeReal / Snapchat / Instagram** **[practice]** | The camera or content is the UI. Minimal chrome, bottom-sheet actions, story progress bars at the top. | Story progress bars in the dialogue and Wrapped screens. Bottom sheets for choices. |
| **Arc Search / Notion** **[practice]** | Restrained UI that is lifted by one delightful animation (Arc's "browse for me" loader) and emoji/icon-led pages. | Emoji or 3D icons as section headers. One signature loading animation. |
| **Quizlet / Photomath / Brainly** **[practice]** | Flashcard flips, step-by-step reveals, confetti after a correct answer. | Card flip to reveal each "why" in the explanation. |

### Concrete techniques (the "not plain" toolkit)
1. **A mascot or character system**: one guide plus a reusable avatar (Duolingo, Finch).
2. **3D clay icons** for categories (Airbnb 2025, 3dicons, Fluent 3D).
3. **Bold type scale**: display text at 40–56sp in a grotesk with character, body at 16sp. Large weight contrast (800 against 400).
4. **Colour blocking**: each stream or chapter gets a saturated background colour, never grey cards on white.
5. **Depth without blur**: layered cards, soft coloured shadows (a shadow tinted with the card colour, not black), a 2–4px "lip" under buttons. Skip glass/backdrop blur on Android (section 4).
6. **Micro-animation**: press-in scale to 0.96, spring easing, confetti or star bursts on milestones, mascot reactions. Use Reanimated, with Lottie or Rive kept small.
7. **Haptics**: a light impact when a choice is selected, success haptics on reveal (`expo-haptics`) **[practice]**.
8. **Progress rituals**: a chapter map, streaks, trait rings, "chapter complete" summary cards.
9. **Sound**: short UI blips and one reveal sting, muted by default with an obvious toggle **[practice]**.
10. **Card stacks and swipes** for choices (Reigns-style), with clear visual cues and feedback ([CareerFoundry on cards](https://careerfoundry.com/en/wp-json/wp/v2/posts/5118)).

---

## 2. Screen patterns to copy

### 2.1 Splash and launch
- **Native splash** (`expo-splash-screen`): a solid brand-colour background and a centred logo mark only. It shows while fonts and the JS bundle load. Don't put text on it, because it can't be localised. **[practice]**
- **Then a branded animated intro** (under 1.5s and skippable): the logo mark morphs or bounces and the mascot waves. Play it only on cold start, not every time the app is opened.
- Hold the splash with `SplashScreen.preventAutoHideAsync()` until fonts load, so there's no flash of fallback text.

### 2.2 Loading states
- **Skeletons** for content screens (dashboard, results list). They must match the real layout, or the swap feels jarring, and slow steady shimmer feels shorter than fast shimmer ([UX Collective on skeletons](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a), [Tim Kadlec](https://timkadlec.com/remembers/2020/11/skeleton-screens/)). The evidence is mixed: Viget found skeletons did no better than spinners ([Viget](https://viget.com/articles/a-bone-to-pick-with-skeleton-screens)). Skeletons don't replace actual performance work.
- **Branded loader plus a tip** for longer waits (generating the recommendation, syncing). Show the mascot animation with a rotating tip, e.g. "Did you know? ICS students can still apply for BS Data Science", or Roman Urdu: "Thora sa intezaar… aap ka raasta tayyar ho raha hai". This turns a passive wait into an active one.
- **Sub-1s waits**: show nothing for about 300ms, then the indicator, so it doesn't flicker. **[practice]**

### 2.3 Onboarding
- 3 value-prop slides at most, or better, a **conversational onboarding with the mascot** (Finch pattern): the mascot asks for a nickname, grade (9/10/11), city type, and preferred language (English / Urdu / Roman Urdu).
- **Avatar creation** before the game starts: DiceBear (Open Peeps or similar style) with options for skin tone, hair, hijab/cap/dupatta, glasses and clothing colour. This builds investment, as in Finch.
- **Permission priming**: before calling the OS prompt for notifications, show a custom card explaining why ("We'll remind you when Chapter 3 unlocks"), with "Allow" and "Not now". Don't ask on first launch. **[practice]**
- Show a progress indicator on every onboarding step. The Finch critique flagged its absence ([Pratt](https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/)).

### 2.4 Sign-up for minors (14–18) without a phone number
**Why not SMS OTP:**
- **Cost:** vendor prices for Pakistan vary widely, from about $0.0045 to $0.08 per SMS segment. For a student project at scale, the higher figure is significant ([sent.dm pricing](https://www.sent.dm/resources/pakistan-sms-pricing)).
- **Regulation:** A2P senders must comply with PTA rules, and short codes take 4–6 weeks for PTA approval ([sent.dm guide](https://www.sent.dm/resources/pakistan-sms-guide), [Clickatell Pakistan](https://clickatell.com/sms-country-regulations/pakistan)).
- **Reliability:** documented delivery delays to Mobilink/Warid and a Feb 2024 nationwide mobile suspension ([Twilio status](https://status.twilio.com/incidents/gscy7n9y8p0n), [Twilio Feb 2024](https://status.twilio.com/incidents/6nh4zyy3wswb)).
- **Data:** many 14–16-year-olds use a parent's SIM, so the phone number identifies the parent, not the child. A phone number is also more personal data than the service needs (see the Children's Code below).

**Recommended layered approach:**
1. **Primary: Sign in with Google** (Android Credential Manager / `@react-native-google-signin`). Most Pakistani Android teens already have a Google account. It needs no password and is free. Google Family Link supervises over-13s with mutual parent and teen consent; teens can manage their own account at 13 ([Family Link FAQ](https://families.google/intl/my/familylink/faq/), [Google support](https://support.google.com/families/answer/9499456?hl=en)).
2. **Fallback: username plus 4–6 digit PIN or passphrase**, with no email required. Pair it with a **school/class code** from the teacher dashboard, the same pattern as Actively Learn, CommonLit and Khan Academy class codes ([Khan Academy](https://support.khanacademy.org/hc/en-us/articles/203444450-How-can-students-under-13-create-a-Khan-Academy-account-using-Google-Classroom), [district guidance](https://www.twinsburg.k12.oh.us/Downloads/Requirements%20for%20Actively%20Learn.pdf)). Teachers can reset PINs, which removes the need for email recovery.
3. **Optional: email magic link** for students with email (Supabase/Firebase email-link auth costs nothing).
4. **Parent link, consent-style**: the student app shows a QR code or 6-character link code, and the parent opens the web link and confirms. This mirrors Discord Family Center, where linking is by QR and the teen accepts on their own device ([Pinwheel guide](https://support.pinwheel.com/hc/en-us/articles/33055677537051-Setting-up-Discord-on-Parent-and-Child-s-phones)). The teen sees exactly what the parent can see (results, not individual choices).
5. **Age gate**: ask for birth year only (a neutral picker, not pre-filled). Under 14 shows a "this app is for 14–18" screen.

**Children's Code data minimisation (UK ICO, 15 standards, a strong reference even though it isn't Pakistani law):** collect and keep only the minimum data needed for the parts of the service a child is actively using. Defaults must be "high privacy". Either establish age with appropriate certainty or apply the standards to all users ([ICO code PDF](https://ico.org.uk/media/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services-2-1.pdf), [executive summary](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/executive-summary/), [gov.uk](https://gov.uk/guidance/child-online-safety-data-protection-and-privacy)). For Rahyaab that means:
- a nickname, not a real full name
- no phone number, no precise location (city tier at most)
- no public profile and no social features on by default
- parent and teacher visibility explained in plain language
- a "delete my data" option in settings.

### 2.5 Home / dashboard
- **Top:** greeting with the avatar ("Salaam, Ali!"), a streak flame, and a "Continue Chapter 3" hero card in the chapter's colour block with a 3D icon and a large progress ring. **[practice]**
- **Middle:** a horizontal carousel of the 3–4 traits revealed so far (chips with emoji), and a "Your top stream so far" teaser that stays blurred until enough chapters are played.
- **Bottom tab bar** (4 tabs at most): Play, Journey/Results, Explore streams, Me.

### 2.6 Game hub / map
- **A Duolingo-style winding path** of chapter nodes: circular 3D buttons zig-zagging down, with the mascot standing beside the current node, locked nodes greyed out and completed nodes gold. Duolingo moved from a skill tree to a single path in 2022 and reports better learning outcomes, but users disliked losing choice ([Duolingo blog](https://blog.duolingo.com/new-duolingo-home-screen-design), [UX Collective critique](https://uxdesign.cc/down-the-wrong-path-the-disaster-of-the-latest-duolingo-ui-update-a4cdd1e6ea1c)). **For Rahyaab:** keep the path, but allow replaying completed chapters, and show "side quests" as optional branches.
- Candy Crush-style themed zones **[practice]**: the background art changes per life stage (school → board exams → college choice → career), and each zone has its own colour block.

### 2.7 In-game dialogue and choice UI
Combine visual-novel conventions **[practice]**:
- Full-bleed **scene background** (illustrated location: classroom, home, tuition centre) with a **character bust** (Open Peeps/DiceBear) on the left or right, which bounces slightly when speaking.
- A **speech bubble or bottom dialogue box** with a name tag, text that types out (tap to skip), and a story **progress bar at the top** (Instagram stories style).
- **Choices** as 2–4 large stacked pill buttons in a bottom sheet (Episode/Choices style). Each choice can carry an emoji. On tap: haptic, press-in, and the other options fade out.
- **Reigns-style swipe card** for quick binary dilemmas: swipe left or right with a tilt, and the two option labels appear at the card's corners while dragging. Use it for variety, roughly every 3rd decision.
- **BitLife-style consequence toast** **[practice]**: after a choice, a small toast slides in ("+ Curiosity", "Logical thinking ↑") with a matching trait-icon micro-animation. This keeps the explainable recommendation visible during play.
- **Never paywall or lock choices.** Choices-style diamond-gated options frustrate players and are inappropriate for an assessment tool ([Common Sense Media](https://www.commonsensemedia.org/app-reviews/choices-stories-you-play), [PocketGamer.biz](https://www.pocketgamer.biz/how-does-choices-stories-you-play-monetise)).
- Florence-style **interaction as metaphor** **[practice]**: occasional mini-interactions, such as dragging puzzle pieces to arrange a timetable, instead of only tapping buttons.

### 2.8 Results / recap reveal (Wrapped format)
- 6–8 full-screen **story slides**, auto-advancing every 5–7s with tap-to-next and hold-to-pause, and segment bars at the top. Possible sequence:
  1. "Your Rahyaab is ready…" (mascot drumroll)
  2. Top trait (huge type)
  3. Trait radar animating in
  4. "Decisions that shaped this": 3 cited choices from the game. This is the explainability slide.
  5. Top stream reveal: 3D icon zoom plus confetti
  6. Runner-up streams with % fit bars
  7. "What this means": next steps
  8. A shareable card
- **Shareable card**: 9:16, bold colour block, avatar, top stream, top 3 traits, app logo and QR code. Export with `react-native-view-shot` and share through the system sheet. Leave out personal data such as real name or school.
- Vary the layouts (left-aligned, bottom-heavy, split) to avoid Wrapped's "always centred" monotony ([UX Collective](https://uxdesign.cc/whats-happened-to-spotify-wrapped-cdfc32bf56a7)).
- After the stories, land on a static, scrollable **results report** (for parents and teachers too) with the same data in plain text.

### 2.9 Settings / theme
- Grouped rounded sections with 3D or emoji icons. Theme picker: Light / Dark / System, plus 3–4 **accent colour swatches** (personalisation is cheap and appeals to Gen-Z) **[practice]**.
- Language: English / اردو / Roman Urdu. Text size slider. Sound and haptics toggles. "Reduce motion" toggle (also respect the OS setting through `AccessibilityInfo.isReduceMotionEnabled`).
- Privacy section: who can see my results (parent / teacher toggles), download my data, delete my account.

### 2.10 Parent web link and teacher dashboard
- **Parent:** one calm page in Headspace style. Results summary, an explanation of each trait, "how to talk to your child about this" tips, and Urdu toggle at the top.
- **Teacher:** a data-dense but friendly dashboard. Class code card, roster table with status chips (Not started / Playing / Done), a stream-distribution bar chart, and the same 3D stream icons for consistency.

---

## 3. Free asset sources (with licences)

| Asset | Source | Licence | Notes |
|---|---|---|---|
| 3D icons | **3dicons** by Vijay Verma ([3dicons.co](https://3dicons.co/about), [Smashing case study](https://smashingmagazine.com/2022/05/3dicons-open-source-library-case-study-download/)) | **CC0** | Multiple angles and colour styles. PNG, Blender, Figma. Third-party reviews cite 1,440+ icons; the about page says 200 in v1. Free for commercial use, no attribution needed. |
| 3D emoji | **Microsoft Fluent Emoji** ([github.com/microsoft/fluentui-emoji](https://github.com/microsoft/fluentui-emoji)) | **MIT** | 3D, colour, flat, high-contrast. Animated versions exist ([emojifyi](https://emojifyi.com/glossary/microsoft-fluent-emoji/)); easier packaging in [ciffelia/fluent-emoji](https://github.com/ciffelia/fluent-emoji). Keep the MIT notice in the app's About/licences screen. Great for trait chips. |
| Mix-and-match characters | **Open Peeps** (Pablo Stanley) ([openpeeps.com](https://www.openpeeps.com/)) | **CC0** | Over 584k combinations: bodies, faces/emotions, hair, accessories, sitting/standing poses. Good for dialogue busts. |
| Illustration kit | **Humaaans** ([humaaans.com](https://www.humaaans.com/)) | **CC0** (per its site) | Free for commercial and personal use. |
| Spot illustrations | **unDraw** ([undraw.co/license](https://undraw.co/license)) | unDraw licence | Free for commercial use, no attribution. Can't redistribute as a pack, no automated scraping or embedding without consent, no AI training. Recolour to the brand accent. |
| Illustrations | **Blush** ([blush.design/license](https://blush.design/license)) | Blush licence | Commercial use allowed, attribution appreciated. No reselling, redistributing or merch. Check the current free-plan export limits in the app. |
| Avatars (code) | **DiceBear** ([dicebear.com/styles/open-peeps](https://dicebear.com/styles/open-peeps), [licence file](https://github.com/dicebear/definitions/blob/master/./LICENSE.md)) | Core **MIT**, styles mostly **CC0** | Exception: *Personas* is **CC BY 4.0** (attribution required). Seeded, deterministic SVGs; renders offline with `react-native-svg`. |
| Lottie animations | **LottieFiles free** ([licensing basics](https://help.lottiefiles.com/animation-licensing-basics-)) | **Lottie Simple License** | Personal and commercial use, attribution optional. You can't scrape them into a competing service or redistribute them as standalone files. Individual pages can add creator terms, so check each one. |
| Rive animations | **Rive Community** (rive.app/community) | Varies per file (many CC BY) | Check each file. Smaller files, but a large runtime (section 4). |
| Display fonts | **Bricolage Grotesque** ([GitHub](https://github.com/ateliertriay/bricolage), [@expo-google-fonts](https://cdn.jsdelivr.net/npm/@expo-google-fonts/bricolage-grotesque@0.4.1/README.md)), **Unbounded**, **Space Grotesk** ([info](https://online-fonts.com/fonts/space-grotesk)) | **SIL OFL 1.1** | Bricolage is variable (opsz/wdth/wght) and full of character; recommended for headings. Unbounded is wide and rounded, good for Wrapped-style numbers. |
| Body/UI fonts | **Plus Jakarta Sans**, **Outfit**, **Urbanist** (Google Fonts) | **SIL OFL 1.1** | Plus Jakarta Sans is the most readable at small sizes. Pick ONE heading and ONE body font. |
| Urdu fonts | **Noto Nastaliq Urdu**, **Gulzar** ([github.com/googlefonts/Gulzar](https://github.com/googlefonts/Gulzar)) | **SIL OFL 1.1** | Gulzar is Nastaliq with a typographic rather than calligraphic feel, and is cleaner for UI. Use a line height of about 1.8× or the nuqtas clip ([guidance](https://open-design.ai/plugins/design-system-urdu/), secondary source, so test it). Noto Naskh Arabic is the fallback when Nastaliq is too heavy for small UI text. |

For the FYP report, list every asset with its licence in an "Acknowledgements / Third-party assets" appendix and an in-app Licences screen.

---

## 4. Pakistan-specific UX notes

### Language mixing
- Roman Urdu is the most common way of texting in Pakistan. Many participants were uncomfortable in English, and they switched language depending on who they were messaging (MobileHCI 2017 study, 116 users, 346k messages: [Roman-txt](https://researchnow.flinders.edu.au/en/publications/roman-txt-forms-and-functions-of-roman-urdu-texting/), [Adelaide record](https://digital.library.adelaide.edu.au/items/17c0706c-26d1-4f1a-8d4e-e3bf3fe738c7)). Young people code-switch more than other age groups ([UMT thesis](https://escholar.umt.edu.pk/bitstreams/7ba71542-a5b2-4fd4-9a16-0a6b22ae5f41/download)).
- **Recommendation:**
  - Write game dialogue in natural "Hinglish-style" Urdu–English, with Roman Urdu as the default story voice and an English toggle. That's how teens actually text: "Yaar, kal physics ka test hai!"
  - Keep UI labels short English words everyone knows (Play, Next, Settings) or offer them in proper Urdu script when Urdu is selected.
  - Don't use Roman Urdu for the formal results report given to parents. Offer English and Nastaliq Urdu there.
- **RTL:** when Urdu script is chosen, use `I18nManager`, or flip only the text containers if a full app restart for RTL is unwanted. Test the mirrored icons.

### Low-end Android performance
- **Market:** Transsion (Tecno/Infinix) has 44% of the smartphone market, Xiaomi 18%, Vivo 17%, Samsung 10% ([Profit/Pakistan Today](https://profit.pakistantoday.com.pk/2025/10/20/xiaomi-eyes-pakistans-expanding-smartphone-market-as-local-assembly-and-smart-tv-production-gain-pace/)). An industry estimate says 70% of smartphones sold cost under $100 ([Business Recorder](https://www.brecorder.com/news/40388277)). Design for a 3–4 GB RAM Helio/Unisoc phone.
- **Lottie vs Rive:**
  - In Callstack's React Native benchmark on an old Xperia Z3, Lottie ran at about 17 FPS and Rive did better on most metrics ([Callstack](https://callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation)). Rive files are 10–15× smaller (vendor claim: [Rive blog](https://rive.app/blog/rive-as-a-lottie-alternative)).
  - However, the Rive runtime adds about 14.8 MB to an Android AAB ([Wikimedia Phabricator](https://phabricator.wikimedia.org/T433250)).
  - **Recommendation:** pick ONE. Use Lottie (lottie-react-native) with small files (under 100 KB, no image layers, no effects or masks, under 3s, 30fps) for 3–5 signature moments. Do everything else with Reanimated (UI thread). Pause animations that are off-screen.
- **Avoid:**
  - `BlurView`/backdrop blur and large `elevation` shadows on long lists (fake depth with solid tinted layers and borders)
  - full-screen gradients redrawn every frame
  - large PNGs: 3D icons should be resized to 2× display size and converted to WebP (a 3D icon at 128dp needs a 256px WebP of about 15–30 KB)
  - more than 2 font families or many static weights (use variable fonts or 3 weights at most).
- Use `FlashList` for lists, `expo-image` with caching, and test on a real 3 GB device with "Profile GPU rendering". **[practice]**

### Offline and data
- Many teens are on prepaid data and patchy 4G. Treat the game as **offline-first**:
  - bundle story scripts and character art in the app
  - save choices locally (SQLite or MMKV) and sync when online
  - compute the recommendation on-device if the model allows, or queue it for sync
- Show an "Offline: your progress is saved" pill, never a hard block. **[practice]**
- Keep the APK small (target under 40 MB). Ship the 3D icons as WebP and avoid big video intros.
- The parent web link must load fast on 3G: server-rendered, no heavy JS, images under 200 KB total.

---

## 5. Quick visual direction proposal for Rahyaab
- **Base:** off-white `#FFF8F0` in light mode, ink navy `#14142B` in dark mode.
- **Accent:** one hero colour (for example electric green or a "Rahyaab teal").
- **Stream colours:**

  | Stream | Colour | Hex |
  |---|---|---|
  | Pre-Med | coral | `#FF6B6B` |
  | Pre-Eng | blue | `#4D7CFE` |
  | ICS | violet | `#8B5CF6` |
  | Commerce | amber | `#F5A524` |
  | Humanities/Arts | pink | `#EC4899` |

- **Type:** Bricolage Grotesque 800 for headings, Plus Jakarta Sans 400/600 for body, Gulzar for Urdu.
- **Shapes:** 20–28dp corner radius, chunky buttons with a 4dp darker bottom lip, stickers and 3D icons that slightly overlap card edges for depth.
- **Characters:** the Open Peeps/DiceBear avatar for the player, plus one custom mascot built from simple rounded shapes following Duolingo's 3-shape rule.
- **Motion:** spring press feedback everywhere, 3–5 Lottie moments (splash, chapter complete, stream reveal, streak, empty state), and haptics on choices.
