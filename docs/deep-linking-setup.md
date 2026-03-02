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

### Web Landing
- `VITE_CANONICAL_WEB_URL=https://empylo.com`
- `VITE_APP_STORE_URL=<app store url>`
- `VITE_PLAY_STORE_URL=<play store url>`

## Native Link Integration
1. Configure iOS Associated Domains with:
   - `applinks:empylo.com`
   - `applinks:www.empylo.com`
2. Configure Android intent filters for:
   - `/invite/*`
   - `/ref/*`
   - `/circle/*`
   - `/a/*`
   - `/r/*`
3. Ensure `autoVerify` is enabled for Android app links.
4. Ensure app route parsing is handled by `DeepLinkRouter` with `Linking.getInitialURL()` and runtime `url` events.

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
