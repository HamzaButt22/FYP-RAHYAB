# Forms, errors and help

Every input in Rahyaab tells the user **what's wrong, how to fix it, and gives an example**, in their language. It can also read that message aloud. The same rules keep attackers from learning anything useful.

**Requirements:**
- FR-102 (guided validation);
- FR-103 (help everywhere);
- NFR-73 (message quality);
- NFR-74 (help that doesn't leak).

**Tests:** TC-VAL-01 to TC-VAL-10.

## 1. Anatomy of a field

```
Label                      Class code from your teacher
Hint (always visible)      6 letters and numbers, like RYB-4K2
[ input ]                  [ RYB-4K_ ]
Inline message             ✕ One more character, then tap Next        (error: icon + text, never colour alone)
                           ✓ Looks right                               (success, after a valid value)
Help card (after 2 tries)  Need help with the code?
```

- **Hints come first.** Show the format before the user types; most errors never happen.
- **Prevent rather than reject:** pickers instead of free text (class, birth year, board, group, district), and input masks that auto-format (`ryb4k2` → `RYB-4K2`).
- **Timing:** check a field when the user leaves it, and on submit. Never flash errors on every keystroke. Clear an error as soon as the value becomes valid.
- **After an error:** move focus to the first field with a problem, announce the message to screen readers (live region), and keep everything else the user typed.
- **After 2 failures on the same field:** show a help card with the most likely fix, and a way out (the help card on S-03; "Ask your teacher" once a profile exists).
- **Language:** messages follow the app's language, have Urdu versions, are at Grade 6 reading level or lower, and have a speaker button.

**Message formula:** *[what happened] + [how to fix] + [example]*. Never blame the user, never use codes, never write "invalid".

## 2. Field rules (app)

| Field | Rule | Message (EN) | Message (UR) |
|---|---|---|---|
| Class code | `AAA-XXX` (3 letters, dash, 3 letters or digits); auto-uppercase and auto-dash | "Codes have 6 letters and numbers, like RYB-4K2." | "کوڈ میں 6 حروف اور نمبر ہوتے ہیں، جیسے RYB-4K2۔" |
| Class code with O, 0, I or 1 | Printed codes never use these look-alikes (`codes.py`), so the app says which to check | "Codes never use O, 0, I or 1. Check that letter with your teacher, like RYB-4K2." | "کوڈ میں O، 0، I یا 1 کبھی نہیں ہوتے۔ یہ حرف اپنے استاد سے چیک کریں، جیسے RYB-4K2۔" |
| Class code (server says no) | **Generic on purpose** (§4) | "That code didn't work. Check each letter with your teacher." | "یہ کوڈ کام نہیں کر رہا۔ اپنے استاد سے ہر حرف چیک کریں۔" |
| Nickname | 2–20 characters; letters, numbers, `_` and spaces; no control or direction characters | "Use 2 to 20 letters or numbers, like Ayesha_10." | "2 سے 20 حروف یا نمبر لکھیں، جیسے Ayesha_10۔" |
| Nickname looks like a real full name (two words that match the common first-name and surname lists, in English, Roman Urdu or Urdu script) | **Blocked** (decided 14 Nov 2026; checked by the app and the server, code `full_name`; the lists are in `backend/api/src/rahyaab_api/data/common_names.json`); a single first name is allowed (it cannot identify a student on its own) | "This looks like a full name. A nickname keeps you private, like Ayesha_10." | "یہ پورا نام لگتا ہے۔ نِک نیم آپ کو محفوظ رکھتا ہے، جیسے Ayesha_10۔" |
| Nickname contains a phone number (7+ digits) or an email (`@`) | Blocked | "Please don't add a phone number or email. Use a nickname instead." | "فون نمبر یا ای میل نہ لکھیں، صرف نِک نیم لکھیں۔" |
| Nickname contains a rude word (EN, UR and Roman Urdu list) | Blocked | "Please choose a different nickname." | "براہ کرم کوئی اور نِک نیم چنیں۔" |
| Class | Picker 8–12 | — (cannot be wrong) | — |
| Birth month and year | Two pickers (the server needs the month for the age check); under 13 leads to the neutral stop screen and nothing is sent | Unusual class and age: soft check (EDGE_CASES §4, not built yet) | — |
| Consent-slip code (S-04) | `XXXX-XXXX`; auto-uppercase and auto-dash; same look-alike rule | "Slip codes have 8 letters and numbers, like AB23-CD45." Server says no: "That code didn't work. Check each letter on the slip, or ask your teacher." | "پرچی کے کوڈ میں 8 حروف اور نمبر ہوتے ہیں، جیسے AB23-CD45۔" |
| Board, group, district | Pickers; search for districts | "Pick your district from the list. Start typing to search." | "فہرست سے اپنا ضلع چنیں۔ تلاش کے لیے لکھنا شروع کریں۔" |
| Marks (optional) | 0–100 per subject, or blank | "Enter a number from 0 to 100, or leave it empty." | "0 سے 100 تک نمبر لکھیں، یا خالی چھوڑ دیں۔" |
| PIN | 4 digits; no `1111` or `1234`; must be entered twice | "Pick 4 numbers that aren't all the same or in order." | "4 ایسے نمبر چنیں جو ایک جیسے یا ترتیب میں نہ ہوں۔" |
| Wrong PIN | 5 tries, then 1 minute, then 5 minutes, then teacher reset. **The remaining tries are not shown** | "That PIN didn't match." After a lockout: "Try again in 1 minute." | "PIN درست نہیں۔" / "1 منٹ بعد دوبارہ کوشش کریں۔" |
| Parent OTP | 6 digits, valid 10 minutes, 5 tries | "Enter the 6-digit code from the SMS. It works for 10 minutes." | "SMS میں آنے والا 6 ہندسوں کا کوڈ لکھیں۔ یہ 10 منٹ تک کام کرتا ہے۔" |

## 3. Field rules (dashboard)

| Field | Rule | Message |
|---|---|---|
| Staff email | Valid format; trimmed; ≤ 254 characters | "Enter your work email, like name@school.edu.pk." |
| Password (new) | ≥ 12 characters; not in the breached-password list; strength meter | "Use at least 12 characters. A short sentence is easy to remember." |
| Login fails | **Generic** | "Email or password is not right." (Never say which one.) |
| Forgot password | **Generic** | "If an account exists for that email, we've sent a link." (Same message and timing for every email.) |
| Reset link expired or used | **Generic** | "This link has expired. Ask for a new one." |
| TOTP | 6 digits | "Enter the 6-digit code from your authenticator app." |
| Note | ≤ 500 characters; plain text | Counter "120 / 500"; "Notes can be up to 500 characters." |
| CSV upload (admin) | UTF-8; the expected columns; ≤ 2 MB | A row-level report: "Row 14: class must be 8 to 12." |

## 4. Helpful to users, useless to attackers

| Rule | Why |
|---|---|
| **Be specific about format, generic about secrets.** "Codes look like RYB-4K2" is fine. "That code exists but expired" is not | Codes, tokens and accounts can't be discovered by trial and error (enumeration) |
| Auth and code errors have the **same message, status and response time**, whether the thing exists or not | Timing and wording attacks |
| Rate-limit messages state the **wait time** ("Try again in 12 minutes") but not the limit's internals or the **number of tries left** | Real users know what to do; attackers learn nothing new |
| **Help never opens a way around a check.** "Join without a code" (post-MVP, not in the app) would still need parent OTP consent; "Ask your teacher" sends a flag, not data; no help path resets a PIN, password or consent without the same checks | Help can't be used as a back door |
| The server **never echoes input** in HTML. Messages are keys rendered by the client; parent pages escape everything | XSS |
| Strip zero-width and bidi-override characters (U+200B–U+200F, U+202A–U+202E, U+2066–U+2069) from nicknames and notes | Spoofed names; reversed text in teacher views |
| **Length caps** on every field, on both client and server | Overflow and database abuse |
| The client checks for help, the **server checks for safety**. Client checks are never trusted | A modified app can skip them |
| Field errors from the server use `problem+json` `errors[]`: `{field, code, message_key}` | The client shows the right localised help; codes are stable for tests |
| Repeated failures raise a `quality` flag or a security alert, not a ban | Students make mistakes; patterns of abuse are reviewed by people |

## 5. Help everywhere (FR-103)

- **"?" on every screen:** what this screen is for, in 2 lines, with read-aloud.
- **Empty states explain the next step**, for example "No paths saved yet. Tap ☆ on a stream to save it."
- **Offline FAQ** (You → Help): joining, consent, privacy, results, and "What if my group is wrong?". Every answer works offline.
- **"Ask your teacher"** sends a one-tap flag, only if consent covers teacher visibility, with the screen ID and no free text.
- **Hudhud tips** appear only after a struggle (2 failed attempts or 30 s idle on a form), at most once per screen.
