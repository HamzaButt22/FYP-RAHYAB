# Integrating Valley Explorer into RahYaab

The RahYaab app source was **not available**, so this module was built standalone behind an adapter, as agreed. Everything RahYaab-specific is supplied by the host.

## 1. Copy and install
1. Copy `src/valley/` into the RahYaab project.
2. Install the dependencies with Expo-compatible versions:
   `npx expo install @react-native-async-storage/async-storage react-native-svg react-native-safe-area-context expo-crypto`
3. Built and tested on **Expo SDK 58 / React Native 0.88 / React 19.3**. If RahYaab uses an older SDK, run `npx expo install --fix` and re-run `npm test`. The module uses only core React Native APIs plus these four packages.

## 2. Mount it on the assessment screen
```tsx
import { ValleyExplorer, type RahYaabHostAdapter } from '../valley';

const adapter: RahYaabHostAdapter = {
  studentId: auth.pseudonymousId,          // NEVER a name, phone number or CNIC/B-Form number
  consentGranted: consent.parent && consent.assent,
  language: settings.language,             // 'en' | 'ur' (Urdu UI strings: see limitations)
  mode: 'student',
  eventSink: rahyaabSink,                  // see §3
  storage: rahyaabEncryptedStore,          // see §4 — strongly recommended
  onComplete: (out) => pathways.submitAssessment(out.eligible_outputs, out.versions),
  onExit: () => navigation.goBack(),
};
return <ValleyExplorer adapter={adapter} />;
```
On logout from a shared phone, call `purgeAllLocalData(store)`.

## 3. Event sink (requires backend support)
Implement `EventSink.send(events)` against RahYaab's agreed ingestion endpoint. Requirements:
- **Idempotent per `event_id`.** The outbox resends after crashes and timeouts.
- Throw `new SinkError(msg, retryable)`: retryable for network errors, 5xx and 429; non-retryable for 4xx validation errors (the events are kept, not dropped).
- If RahYaab's contract differs from `contract/events.ts`, translate in the sink. Do not change the game.

`PrototypeBackendSink` already works with the original Flask backend, after these backward-compatible changes (included in this delivery, covered by the 3 new Python tests):
- `analytics/event_schema.py`: adds `SESSION_RESUMED, LEVEL_EXIT, REFLECTION_RESPONSE, ITEM_PRESENTED, ITEM_RESPONSE, HINT_USED`
- `backend/services/assessment_service.py`: skips events whose `metadata.event_id` is already stored
- `backend/database/repository.py`: `existing_event_ids()`

Valley Explorer events are stored with `level_id = NULL`; the module level is in `metadata.ve_level_id`. The Python Big Five pipeline does not read them. Do **not** call `/complete` for Valley Explorer sessions: that runs the old Big Five pipeline.

## 4. Storage (requires a host decision)
The default `asyncStorageStore` is **not encrypted**. RahYaab's ethics plan requires encryption at rest for minors' data. Provide a `KeyValueStore` backed by an encrypted database, for example the app's existing encrypted outbox or an SQLCipher-based store in a development build. `multiSet` must be transactional.

## 5. What RahYaab receives (`AssessmentOutput`)
- `eligible_outputs.riasec`: scores (0–100 per area), `holland_code`, `shown_top`, `flat_profile`, version, or `null` if there was too little evidence
- `eligible_outputs.ability[family]`: attempted/correct/correct-without-hint counts and version, for families with enough evidence only
- `riasec`, `ability`: full transparent details; `versions`; `validation_status: 'prototype_not_validated'`
- `context.reflection`: never for scoring

No personality output exists. The pathway engine must treat these as **guidance inputs**, never eligibility rules.
