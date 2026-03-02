# Deep Linking Architecture

## Overview
This system uses canonical HTTPS links on `https://empylo.com` with native app link association and Branch deferred deep linking.

## Canonical Routes
- Invite: `/invite/:token`
- App invite: `/ref/:token`
- Circle: `/circle/:circleId`
- Affirmation: `/a/:affirmationId`
- Resource: `/r/:resourceId`

## Components
- Mobile app:
  - `frontend/src/services/deepLink/DeepLinkRouter.js`
  - `frontend/src/services/deepLink/pendingDeepLink.js`
  - `frontend/src/screens/InviteLandingScreen.js`
- Backend:
  - Invite APIs and resolver in `backend/src/api/core.ts`
  - Exports in `backend/src/index.ts`
- Web landing:
  - `web/landing/src/pages/DeepLinkLanding.tsx`
- Hosting/rewrite config:
  - `firebase.json`

## Sequence: Installed App
1. User taps `https://empylo.com/...`.
2. iOS Universal Link / Android App Link opens app directly.
3. `DeepLinkRouter` parses route and navigates.
4. If auth missing, route is persisted and resumed post-login.

## Sequence: Not Installed App
1. User taps canonical link.
2. `resolveDeepLink` HTTP function returns landing HTML + OG metadata.
3. Landing shows Open in App + store buttons.
4. Branch attribution handles deferred open after install.

## Invite Security Model
- Invite token is random opaque data generated server-side.
- Firestore stores `tokenHash` only.
- Server validates expiry, revocation, max uses, and circle state.
- Rate limiting for brute-force via `deepLinkRateLimits`.
- Private circles require `joinCircleWithInvite`.
