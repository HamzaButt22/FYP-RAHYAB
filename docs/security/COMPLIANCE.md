# Compliance mapping

Which laws, policies and standards apply to Rahyaab, what each one asks of us, and where we meet it. The supervisor and the ethics committee should review this before the pilot.

**Read with:**
- `SECURITY.md` (threat model);
- `DATA_GOVERNANCE.md` (retention and encryption);
- `docs/project/STORE_AND_SEARCH.md` (Play listing);
- SRS §10.6 and §17.4.

> **Not legal advice.** This is an engineering mapping made by the project team. Where a law is still a draft, we design to its stated principles and mark it *(draft)*. Have the university's legal or ethics office confirm the items marked **verify**.

## 1. What applies

| # | Instrument | Status for us | Why it applies |
|---|---|---|---|
| L1 | **Personal Data Protection Bill, Pakistan** *(draft)* | Not yet law. We design to its principles **voluntarily**; this is not a claim of legal compliance. Trigger: if it is enacted, re-run the DPIA and this mapping within 30 days (cross-border transfer and children's data first) | Processes the personal data of Pakistani minors. The draft covers consent, children's data, purpose limitation, security, breach notice and cross-border transfer. |
| L2 | **Prevention of Electronic Crimes Act 2016 (PECA), as amended (including the PECA (Amendment) Act 2025)** | Law | A **criminal** law, not a general data-protection law. The parts relevant to us are the offences of unauthorised access to information systems and data, interference with them, and unauthorised use of identity information; they protect our users and bind the team. The 2025 amendment mainly adds online-content rules and a new regulator, which do not change our design; this is to be re-checked with the university's legal office. It drives our security and access controls. |
| L3 | **Pakistan Cloud First Policy (MoITT)** and data classification | Policy for public-sector bodies; **not binding on the FYP team** | Used as guidance: if a public school or education department later adopts Rahyaab, its hosting rules may apply (hosting in Pakistan or on an accredited cloud, NFR-48). |
| L4 | **Google Play Developer Policies**: User Data, Data safety, account deletion, policies for apps used by minors, Ads, Permissions | Binding for distribution | The app is on Google Play, and its target audience includes 13–17. |
| L5 | **ICO Age Appropriate Design Code (UK Children's Code)** | Best practice we adopted | It is the most concrete design standard for children's services; we follow its 15 standards. |
| L6 | **GDPR principles (Art. 5)** | Reference only | A widely recognised baseline; it helps if the app is used by overseas Pakistani families. |
| L7 | **Riphah research ethics** (informed consent and assent, minimal risk) | Binding for the pilot | The pilot is human-subjects research with minors (§17.4). |
| S1 | **OWASP MASVS v2.1 L1 + MASVS-PRIVACY** | Adopted standard | Mobile app security (NFR-36). |
| S2 | **OWASP ASVS 5.0 L2** | Adopted standard | API and web security (NFR-37). |
| S3 | **WCAG 2.2 AA** | Adopted standard | Accessibility (NFR-22, NFR-64, NFR-65). |
| S4 | **ISO/IEC 25010:2023** | Adopted standard | Quality model for the NFRs (SRS §10). |
| S5 | **Licences:** O*NET, the RIASEC dataset, fonts, icons, Ink | Contractual | Attribution and use limits (RK-10). |

## 2. Requirement-to-control mapping

**Status key:** **Designed** = specified in the docs, to be built. **Planned** = scheduled with a sprint. **Verify** = needs confirmation by legal, ethics or the supervisor.

### 2.1 Personal data and children (L1, L5, L6, L7)

| Obligation | Control in Rahyaab | Requirement | Evidence | Status |
|---|---|---|---|---|
| Lawful basis and **verifiable parental consent** before processing a child's data | School path: paper consent recorded by the teacher. Individual path: parent SMS OTP. Server consent gate on every upload. Purge on the device after 14 days without consent | FR-05, FR-70, NFR-45 | T-INT-01; consent records (versioned) | Designed |
| **Child assent** in plain language | Assent screen at Grade 6 reading level, with read-aloud | FR-06, FR-11, FR-96 | Usability round comprehension check | Designed |
| **Adults (18+) consent for themselves**; under-13s are not served | Age gate; self-consent recorded with method `self`; age stored only as a band; adults excluded from research unless approved | FR-100 | TC-EDGE-06, TC-EDGE-07 | Designed; **verify** adult inclusion with the ethics office |
| **Data minimisation** | No name, phone, email, CNIC/B-form, photo, contacts, location or advertising ID from students | NFR-44 | T-PRIV-01 (manifest vs network trace) | Designed |
| **Purpose limitation** | Data used only for guidance and, with a separate opt-in, research. No ads and no selling | FR-09, ADR-0007 | Privacy notice; Data safety form | Designed |
| **Profiling of children:** off by default, with safeguards | Recommendations are framed as "starting points", with a top-3 + Plan B, confidence and "ask an adult". Gender is excluded from features, and a fairness audit runs | NFR-59, NFR-60, FR-48 | T-FAIR-01–03 | Designed |
| **No nudges or dark patterns** (ICO std 13) | No streaks, leaderboards, loss framing, timers or push spam | NFR-63, FR-86 | Design review | Designed |
| **High privacy by default** (ICO std 7) | Research opt-in off; sharing off until the student creates a link; task strengths can be hidden | FR-09, FR-66 | UI test | Designed |
| **Transparency** | Bilingual privacy notice; "Why this?" for every result | FR-11, FR-56 | Content review | Designed |
| **Data subject rights:** access, deletion, withdrawal | Download my data; delete my data (≤ 30 days); parents can withdraw consent by link | FR-10, FR-70, NFR-46 | T-PRIV-03 | Designed |
| **Retention limits** | Retention schedule (`DATA_GOVERNANCE.md` §3) and automated jobs | FR-84, NFR-46 | T-PRIV-03 | Designed |
| **Breach notification** | Runbook; notify schools and parents within 72 hours | NFR-49 | Tabletop exercise | Planned (M-B) |
| **Cross-border transfer** limits | Self-hostable on any Linux host; region decision recorded; no third-party processors | NFR-48, ADR-0003, ADR-0007 | Deploy test | **Verify** (region for production) |
| **Research ethics:** consent, assent, withdrawal, minimal risk, de-identified exports | Separate research consent; de-identified, opted-in exports; the benchmark runs outside the app | FR-85, §14.4, §17.4 | Ethics approval letter | Planned (S1 submission) |

### 2.2 Security and computer misuse (L2, S1, S2)

| Obligation | Control | Requirement | Evidence | Status |
|---|---|---|---|---|
| Prevent unauthorised access | RBAC + tenant scoping; MFA for staff; rate limits; no backdoors | NFR-40, NFR-42, NFR-66, NFR-67 | T-SEC-05 authorisation matrix; pentest | Designed |
| Protect data in transit and at rest | TLS 1.2+; SQLCipher on the device; disk and column encryption; encrypted backups | NFR-38, NFR-39 | `DATA_GOVERNANCE.md` §4; MASTG | Designed |
| Accountability | Audit log of staff and admin access; exports logged | FR-83, NFR-43 | Log review | Designed |
| Secure development | Threat model, code review, SAST, secrets scanning, SBOM, pinned CI | NFR-41, NFR-71 | CI artefacts | Designed |

### 2.3 Google Play (L4)

| Policy area | What Play asks | How we comply | Status |
|---|---|---|---|
| **Target audience and content** | Declare the ages; content must be appropriate | Target audience 13–15, 16–17 and 18+ (parents, teachers). IARC questionnaire. Content checklist §5.7 | Planned (launch) |
| **Ads and SDKs for minors** | Restrictions on ads and data collection in apps used by minors | No ads, no ad SDKs, no third-party analytics (ADR-0007) | Designed |
| **Data safety form** | Accurate disclosure of collection, sharing, security and deletion | Answers in `STORE_AND_SEARCH.md` §1.5, generated from the data inventory | Planned (launch) |
| **Account deletion** | Apps that let users create accounts must offer deletion **in the app and through a web link** | You → Download/Delete my data (FR-10), plus a web deletion request page (`rahyaab.pk/delete`) linked from the listing and the Data safety form | **Launch blocker**: owner Hamza Butt, built in S8 with the parent pages |
| **User Data: prominent disclosure and consent** | Disclose before collecting; follow the privacy policy | Onboarding assent + privacy notice; consent gate | Designed |
| **Permissions** | Request only what is needed | INTERNET (and VIBRATE) only | Designed |
| **Privacy policy** | Linked in the listing and in the app | Website `/privacy/`, in English and Urdu | Planned |

### 2.4 Accessibility (S3)

| Obligation | Control | Requirement | Status |
|---|---|---|---|
| WCAG 2.2 AA across the app, parent page and dashboard | Accessibility spec; read-aloud; settings; accessible task modes; contrast tokens | NFR-22–28, NFR-64, NFR-65, FR-96–98 | Designed |

### 2.5 Licences and attribution (S5)

| Asset | Licence | Obligation | Status |
|---|---|---|---|
| O*NET Web Services and data | O*NET terms; data under CC BY 4.0 | Attribution on career pages; Interest Profiler used unchanged, in English (A-03) | **Verify** the current terms |
| OpenPsychometrics RIASEC dataset (~145k) | Published with the dataset | Used for calibration only; cite it; not redistributed | **Verify** the licence |
| Bricolage Grotesque, Plus Jakarta Sans, Gulzar, Atkinson Hyperlegible | SIL OFL 1.1 | Keep the licence file with the fonts | Designed |
| Lucide icons | ISC | Keep the notice | Designed |
| Ink and inkjs | MIT | Keep the notice | Designed |

## 3. Who owns what

| Area | Owner | Reviewer |
|---|---|---|
| Consent, ethics, content safety | Daniyal Sarwar | Supervisor |
| Security, data governance, hosting | Zahid Bashir | Hamza Butt |
| Mobile privacy (storage, permissions, Play forms) | Hamza Butt | Zahid Bashir |

Review this mapping:
- at every milestone (M-A to M-E);
- whenever a new data field, SDK, permission or hosting change is proposed;
- if the PDP Bill is enacted.

### SMS delivery (individual path)

Transactional SMS in Pakistan must go through a PTA-registered aggregator with a registered sender ID. The team uses such a provider for parent OTPs (budget and sender-ID registration time are in the risk register). If registration is slow, the pilot uses the school path only, which needs no SMS.
