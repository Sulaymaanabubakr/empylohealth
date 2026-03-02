# Deep Linking Architecture

## Overview
This system uses canonical HTTPS links on `https://empylo.com` with native iOS Universal Links and Android App Links only. No paid deep link SDK is used.

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
  - `frontend/src/screens/InvitationsScreen.js`
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
4. User installs app and opens it manually.
5. User goes to `Invitations` screen to paste/open link or recover recent invite links.

## Invite Security Model
- Invite token is random opaque data generated server-side.
- Firestore stores `tokenHash` only.
- Server validates expiry, revocation, max uses, and circle state.
- Rate limiting for brute-force via `deepLinkRateLimits`.
- Private circles require `joinCircleWithInvite`.
