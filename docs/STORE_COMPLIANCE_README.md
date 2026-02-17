# Store Compliance README

Last updated: 2026-02-17
App: Circles App (`com.empylo.circlesapp`)

## Purpose
This document tracks App Store (Apple) and Google Play policy readiness for the current app build, what is already implemented, what is missing, and the execution order to reach submission-ready status.

## Current Status Summary
- Overall status: `NOT SUBMISSION READY`
- Critical blockers: `3`
- High-priority gaps: `3`
- Medium-priority gaps: `3`

## Critical Blockers (Fix First)
1. Android restricted permissions risk
- Current: `READ_CALL_LOG`, `READ_PHONE_STATE`, `CALL_PHONE` are declared.
- Risk: Google Play may reject unless the app qualifies for restricted call-log/phone categories.
- Required action:
  - Remove `READ_CALL_LOG` immediately unless there is approved policy justification.
  - Keep only minimum required permissions for VoIP and notifications.

2. Missing clickable legal links
- Current: Terms/Privacy text exists, but not wired to open URLs from key surfaces.
- Risk: Store review failure for inaccessible legal/policy docs.
- Required action:
  - Add real links in signup/subscription/settings and open with `Linking.openURL`.
  - Ensure URLs are live and public.

3. Potentially misleading encryption claim
- Current: FAQ says "end-to-end encryption".
- Risk: Misrepresentation can trigger rejection.
- Required action:
  - Replace with technically accurate wording reflecting actual transport/storage protections.

## High Priority Gaps
1. UGC safety controls incomplete
- Implement explicit end-user blocking flow (not only report/moderator tools).
- Add visible community guidelines page and enforcement explanation.
- Ensure every user-generated surface has a report path.

2. Notification-permission crash
- Known issue from device testing.
- Must resolve before release candidate build.

3. Account deletion completeness
- `deleteUserAccount` exists, but deletion must comprehensively cover user data or clearly disclose retained data and retention window.
- Add documented deletion matrix (what is deleted, anonymized, retained, and why).

## Medium Priority Gaps
1. Over-permissioning cleanup
- Revalidate `SYSTEM_ALERT_WINDOW` and legacy storage permissions; remove if unnecessary.

2. Store metadata compliance
- Play Data Safety answers must match actual collection/use in code.
- Apple Privacy Nutrition Labels must match SDK and backend behavior.

3. Policy/disclosure consistency
- Ensure in-app copy, privacy policy website, and store listing claims all match exactly.

## Implemented Controls (Already Present)
- Account deletion entry point in app.
- Backend callable for user account deletion.
- UGC report + moderation actions for circles/chats.
- Notification action categories (reply / mark read).

## Code Reference Pointers
- Permissions/config:
  - `frontend/app.json`
  - `frontend/android/app/src/main/AndroidManifest.xml`
- Notification routing/actions:
  - `frontend/src/services/api/notificationService.js`
- Native call integration:
  - `frontend/src/services/native/nativeCallService.js`
- UGC report/moderation:
  - `frontend/src/screens/CircleSettingsScreen.js`
  - `backend/src/api/core.ts`
- Account deletion:
  - `frontend/src/screens/SecurityScreen.js`
  - `backend/src/api/core.ts`
- Legal text surfaces:
  - `frontend/src/screens/SignUpScreen.js`
  - `frontend/src/screens/SubscriptionScreen.js`
- FAQ wording:
  - `frontend/src/screens/FAQScreen.js`

## Execution Plan (Recommended Order)
1. Remove/justify restricted Android permissions.
2. Wire real Terms + Privacy URLs in all relevant screens.
3. Correct encryption/privacy copy to be technically accurate.
4. Fix notification permission crash on iOS and Android.
5. Add user block feature and expose safety controls clearly.
6. Harden account deletion coverage and publish deletion policy details.
7. Finalize Data Safety / Privacy Label forms from actual implemented behavior.

## Definition of Done (Submission Gate)
- No restricted permissions without approved justification.
- Legal and privacy links are functional everywhere required.
- No misleading security claims.
- No crash on first-run notification permission flow.
- UGC safety requirements satisfied (report + block + moderation + guidelines).
- Data deletion flow and disclosures consistent across app, backend, and policy pages.
- Store metadata and policy forms fully aligned with implementation.

