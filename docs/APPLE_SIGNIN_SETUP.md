# Apple Sign-In Setup (Circles Health App)

## Scope
This runbook makes Apple Sign-In production-ready for this project:
- iOS bundle ID: `com.empylo.circlesapp`
- Expo app: `frontend/app.json`
- Firebase project: `circles-app-by-empylo`

It covers Apple Developer, Firebase Auth, EAS build, and app-level verification.

## Current Code Status
Already implemented in app code:
- Apple provider login flow in `frontend/src/services/auth/authService.js`
- Nonce + hashed nonce passed to Firebase credential exchange (`OAuthProvider('apple.com')`)
- iOS-only button rendering in:
  - `frontend/src/screens/SignInScreen.js`
  - `frontend/src/screens/SignUpScreen.js`
- Availability guard (`AppleAuthentication.isAvailableAsync`) and identity token checks.

## 1) Apple Developer Console Setup
1. Open Apple Developer -> Identifiers -> App IDs.
2. Select App ID for `com.empylo.circlesapp`.
3. Enable capability: **Sign In with Apple**.
4. Save and regenerate provisioning profiles.
5. Confirm profile is active and attached to the correct team.

## 2) Firebase Auth Provider Setup
1. Firebase Console -> Authentication -> Sign-in method -> Apple.
2. Enable Apple provider.
3. Fill these values from Apple Developer:
- Apple Team ID
- Key ID
- Private key (`.p8` contents)
- Service ID (only if your chosen flow requires it)
4. Save.

## 3) Expo / EAS Config Validation
From `frontend/app.json` ensure:
- `ios.bundleIdentifier` is `com.empylo.circlesapp`
- plugin includes `expo-apple-authentication`

From `frontend/eas.json` ensure:
- production iOS profile exists
- build number auto increment is enabled

## 4) Build & Deploy (Required)
Apple capability changes require a new native build.

Run iOS build:
```bash
cd frontend
npx eas build -p ios --profile production --clear-cache
```

Submit to TestFlight:
```bash
npx eas submit -p ios --profile production
```

## 5) Runtime Verification Checklist (Real iPhone)
Test on a physical iPhone (not simulator, not Expo Go):
1. Fresh install from TestFlight.
2. Tap Apple sign-in on Sign In screen.
3. Complete Apple consent.
4. Verify Firebase user is created and authenticated.
5. Sign out and sign in again with Apple.
6. Confirm returning sign-in works when Apple no longer returns name/email.
7. Confirm app profile document exists/updates in Firestore.

## 6) Failure Diagnostics
If Apple sign-in fails, capture:
- app log error code/message
- iOS version and device model
- whether first-time or returning Apple sign-in
- Firebase Auth error code in console/logs

Common causes:
- Sign in with Apple not enabled on App ID
- Firebase Apple provider misconfigured keys
- Bundle ID mismatch
- stale provisioning profile/cert
- using an old build before capability was enabled

## 7) App Behavior Notes
- Apple sign-in is intentionally iOS-only in UI.
- On non-iOS platforms, Apple path is blocked in service layer.
- Apple may return name/email only once; app handles missing fields on subsequent logins.

## 8) Security Notes
- Keep Apple private key out of repo.
- Rotate compromised Apple keys immediately.
- Ensure Firebase project and Apple Team match production ownership.
