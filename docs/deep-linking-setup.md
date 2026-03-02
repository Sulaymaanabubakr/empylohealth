# Deep Linking Setup

## Environment Variables

### Backend (Cloud Functions)
- `CANONICAL_WEB_URL=https://empylo.com`
- `IOS_STORE_URL=<app store url>`
- `ANDROID_STORE_URL=<play store url>`
- `DEEPLINK_APP_SCHEME=circlesapp://`
- `IOS_APP_ID=<APPLE_TEAM_ID>.com.empylo.circlesapp`
- `ANDROID_PACKAGE_NAME=com.empylo.circlesapp`
- `ANDROID_SHA256_CERT_FINGERPRINTS=<comma-separated sha256 cert fingerprints>`

### Frontend (Expo)
- `EXPO_PUBLIC_CANONICAL_WEB_URL=https://empylo.com`
- `EXPO_PUBLIC_IOS_STORE_URL=<app store url>`
- `EXPO_PUBLIC_ANDROID_STORE_URL=<play store url>`
- Branch keys via EAS secrets:
  - `BRANCH_TEST_KEY`
  - `BRANCH_LIVE_KEY`

### Web Landing
- `VITE_CANONICAL_WEB_URL=https://empylo.com`
- `VITE_APP_STORE_URL=<app store url>`
- `VITE_PLAY_STORE_URL=<play store url>`

## Branch Integration
1. Create Branch test and live environments.
2. Configure Branch link domain(s), iOS bundle ID, Android package ID.
3. Add associated domains for Branch in `frontend/app.json`.
4. Ensure Branch keys are provided at build time.
5. `react-native-branch` does not provide an Expo config plugin in this repo setup, so complete native Branch setup via prebuild/native projects (iOS plist settings, Android manifest metadata, and Branch init checks).
6. Build and test with test key first, then live key.

## Apple / Android Association Files
- Android: `/.well-known/assetlinks.json` served by `serveAssetLinks`.
- iOS: `/apple-app-site-association` served by `serveAppleAssociation`.

Set correct fingerprints and iOS appID before production rollout.

## Deploy
1. `npm run --prefix backend build`
2. `firebase deploy --only functions`
3. `npm run --prefix web/landing build`
4. `firebase deploy --only hosting:landing`

If using admin hosting target too:
- `firebase deploy --only hosting:admin`
