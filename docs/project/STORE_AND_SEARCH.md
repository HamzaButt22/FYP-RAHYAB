# Rahyaab: Play Store, web SEO and AI-search plan (v1, 4 Nov 2026)

**Goal:** a student, parent or teacher who searches for help with a stream choice, in Google, the Play Store, or an AI assistant (Gemini, ChatGPT, Copilot, Perplexity), finds Rahyaab and understands it in one glance. Everything here stays inside Google Play's metadata and families policies, and inside our privacy rules (no third-party tracking in the app).

---

## 1. Google Play listing

**Limits:**
- title 30 characters;
- short description 80 characters;
- full description 4,000 characters;
- **no keyword field**: Play search reads the title, the short description and the full description, so keywords must appear in natural sentences;
- no emoji, ALL CAPS, "best", "#1", "free" in the title, competitor names or keyword stuffing;
- the same rules apply to every translation.

### 1.1 English listing

| Field | Text | Length |
|---|---|---|
| **App name** | Rahyaab: Career & Stream Guide | 30 |
| **Short description** | Play a story game to find your Matric group, FSc stream or university path. | 75 |
| **Category** | Education | — |
| **Tags** | Education, Career, Simulation, Story | — |

**Full description:**

> Not sure which group to choose after class 8, which FSc stream after Matric, or what to study at university? Rahyaab is a story game that helps you find your path, without a boring career test.
>
> Live one school year as yourself, a week at a time. Plan your week, choose what you'd really do in short scenes with friends and family, and solve everyday challenges like packing the car for a trip or splitting the chai bill. Hudhud, your guide, carries a letter from you five years from now. The more you play, the more of the letter you can read.
>
> After four weeks the letter opens. You get your top 3 paths with clear reasons, how sure the app is, what each path opens or closes, and a Plan B:
> • Class 8: Science (Biology), Science (Computer) or Humanities
> • Class 9–10: FSc Pre-Medical, Pre-Engineering, ICS, I.Com, FA, General Science or DAE, and A Level subjects
> • Class 11–12: medicine, engineering, computer science, business, design, law and more, with entry tests like MDCAT and ECAT
>
> Made for Pakistani students and families
> • English and Urdu, with Roman Urdu dialogue
> • A family report your parents can open from a WhatsApp link, no app needed
> • Explore streams, subjects, entry tests, costs and careers
> • "Try a day" job simulations: triage patients, wire a solar setup, debug a game, run a stall
>
> Safe and private
> • No ads, no streaks, no leaderboards, no in-app purchases
> • No real name, phone number or photo needed
> • For under-18s, nothing leaves the phone until a parent agrees
> • Play offline on budget phones; your results arrive after the next sync
> • Read-aloud, large text, high contrast and easy-read modes
>
> Rahyaab is a starting point for a conversation with your family and teachers, not a verdict. Built at Riphah International University.

The full description is about 1,700 characters, well under 4,000. It names every stream, class and test that people search for, once each, in natural sentences.

### 1.2 Urdu listing (localized, `ur`)

| Field | Text |
|---|---|
| **App name** | راہ یاب: کیریئر اور گروپ گائیڈ |
| **Short description** | کہانی والا گیم کھیلیں، اپنا میٹرک گروپ، ایف ایس سی یا یونیورسٹی کا راستہ چنیں۔ (78 characters) |

The full description is a faithful Urdu version of §1.1, reviewed by a native Urdu editor. Keep stream names as people type them (ایف ایس سی پری میڈیکل، آئی سی ایس، آئی کام، ایم ڈی کیٹ).

### 1.3 Search terms people use (to weave into copy and screenshots)

| Language | Terms |
|---|---|
| English | career counselling Pakistan, stream selection, which group after class 8, FSc pre medical or pre engineering, ICS or FSc, after matric what to do, career guidance app, university field, MDCAT, ECAT |
| Roman Urdu | matric ke baad kya karein, konsa group lun, FSc ya ICS, career guidance |
| Urdu | کیریئر کونسلنگ، میٹرک کے بعد کیا کریں، کون سا گروپ لوں، ایف ایس سی یا آئی سی ایس |

**Before launch:** check these terms in **Play Console → Store listing experiments** and the Google Ads Keyword Planner (Pakistan, Urdu and English), then keep the top ones in the title, short description and the first lines of the full description.

### 1.4 Graphics

| Asset | Spec | Source |
|---|---|---|
| App icon | 512 × 512 PNG | `design/brand/app-icon/png/icon-ios-expo.png` (1024, scale down) |
| Feature graphic | 1024 × 500 | `design/brand/store/play-feature-graphic-1024x500.png` |
| Phone screenshots | 8 at 1080 × 1920, each with a 4–6 word caption | From `design/screens/png/` (§4 of `design/screens/README.md`) |
| Screenshot order | 1 the letter · 2 plan your week · 3 Dil vs Duniya · 4 an everyday task · 5 the Blueprint · 6 family report · 7 Explore streams · 8 privacy and accessibility | Captions in English and Urdu |
| Promo video (optional) | 30 s, the GT Road splash scene → a week → the letter opening | Later |

### 1.5 Policy and trust fields

- **Target audience:** 13–15 and 16–17, plus 18+ for parents and teachers. Teen-appropriate content and ads policies apply; the app has no ads.
- **Content rating:** IARC questionnaire answered honestly. Expected: Everyone / PEGI 3.
- **Data safety form:**

| Item | Answer |
|---|---|
| Data collected | App activity (in-app choices and task results); app info and performance (crash logs, self-hosted); device or other IDs (an app-generated installation ID, for sign-in only); personal info: a parent's phone number on the individual path only |
| Encryption | Encrypted in transit |
| Data shared | None shared with third parties (service providers acting for us, such as the SMS company, do not count as sharing under Play's definition) |
| Deletion | In the app (You → Delete my data) and through the web page `rahyaab.pk/delete` |
| Location, contacts, photos, advertising ID | Not collected |

- **Privacy policy URL:** the website (§2), in English and Urdu.
- **Ratings:** ask for a rating with the Play In-App Review API **only** after the Blueprint and a successful family share, never during play, at most once.

---

## 2. Website SEO (rahyaab.pk or a university subdomain; placeholder)

A small, fast, static site in English and Urdu. It is the home for the privacy policy, the parent and school information, and shared links.

### 2.1 Pages

| Page | Purpose | Title tag (≤ 60 chars) |
|---|---|---|
| `/` | What Rahyaab is, download | Rahyaab: career and stream guide for Pakistani students |
| `/streams/` and one page per stream | FSc Pre-Medical, Pre-Engineering, ICS, I.Com, FA, DAE, Matric groups: what you study, what it opens, tests | FSc Pre-Medical or Pre-Engineering? What each one opens |
| `/parents/` | How the family report works; safety; consent | Rahyaab for parents: help your child choose a stream |
| `/schools/` | Class codes, dashboard, privacy agreement | Rahyaab for schools and teachers |
| `/how-it-works/` | The game, the frameworks (RIASEC, abilities, values), the validation study in plain words | How Rahyaab works: interests, strengths and values |
| `/privacy/`, `/accessibility/`, `/.well-known/security.txt` | Policies | — |
| `/ur/...` | Urdu versions of every page | — |

### 2.2 Technical SEO

- **Fast and indexable:** server-rendered or static HTML (no content only in JavaScript); good Core Web Vitals on 3G; images in WebP with alt text.
- **Language versions:** `hreflang` pairs (`en-PK`, `ur-PK`), canonical URLs, `sitemap.xml`, a `robots.txt` that allows public pages and blocks `/p/` (parent share links) and the dashboard.
- **Structured data (JSON-LD):**
  - `MobileApplication` (name, operating system, category, offers price 0, publisher);
  - `Organization`;
  - `FAQPage` on `/parents/` and `/how-it-works/`;
  - `BreadcrumbList` on stream pages.
- **Social previews (Open Graph and Twitter cards):** WhatsApp shows these previews, which matters most in Pakistan. Share links for parents use a neutral preview with no child data.
- **Analytics:** privacy-friendly and self-hosted (or none). No cross-site trackers or advertising pixels.

---

## 3. AI search (being cited by AI assistants)

AI assistants answer questions like "which FSc group is best for computer science?" by summarising pages they trust. To be a source they cite:

1. **Answer real questions directly.** Each stream page opens with a two-sentence plain answer, then details (subjects, doors, tests, Plan B), with dated sources (PMDC, PEC, IBCC, boards).
2. **Facts in text, not images.** Tables of streams, gates and tests as HTML, with dates.
3. **One consistent identity:** always "Rahyaab (راہ یاب)", the same one-line description, the same publisher (the Riphah FYP team), and links between the site, the Play listing and any university page.
4. **Show evidence:** publish the validation study summary and the frameworks (RIASEC, ICAR-style abilities, O\*NET work values) on `/how-it-works/`. AI systems favour pages that explain method and cite sources.
5. **`llms.txt`** at the site root: a short markdown map of the key pages and facts. It's an emerging convention; it's cheap to add.
6. **Allow reputable AI crawlers** in `robots.txt` for public pages (Google-Extended, GPTBot and similar, as the team decides). Always block parent share links, the dashboard and the API.
7. **Never** publish student data, real reports or anything from the app on the public site.

---

## 4. Launch checklist

- [ ] Title, short and full descriptions final in English and Urdu; checked against the Play metadata policy.
- [ ] 8 screenshots with captions (EN, UR), feature graphic, icon.
- [ ] IARC rating, target audience, Data safety form, privacy policy URL.
- [ ] Website live with `hreflang`, sitemap, JSON-LD, Open Graph, `llms.txt`, `security.txt`.
- [ ] Store listing experiment set up (two icon or screenshot variants), run for at least 2 weeks.
- [ ] Search terms reviewed in Play Console after the first month; copy adjusted.
