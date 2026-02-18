# Apple Sign-In Setup (Circles)

## Purpose
This guide explains how to make Apple Sign-In work correctly for the Circles app.

## 1) Apple Developer Configuration
1. Go to Apple Developer Console.
2. Open your App ID (bundle ID used by Circles iOS app).
3. Enable capability: **Sign in with Apple**.
4. Regenerate provisioning profiles after enabling capability.
5. Ensure certificates/profiles are valid for the target app.

## 2) Firebase Configuration
1. Firebase Console -> Authentication -> Sign-in method.
2. Enable provider: **Apple**.
3. Add:
- Apple Team ID
- Apple Key ID
- Apple private key (`.p8`)
- Service ID (if required for your flow)
4. Save and verify provider is enabled.

## 3) Expo / App Config Requirements
1. Confirm iOS bundle identifier in app config matches Apple Developer App ID.
2. Ensure project uses dev build/TestFlight build (not Expo Go).
3. Keep `expo-apple-authentication` installed and linked in native build.
4. Rebuild app after capability/config changes.

## 4) Client Flow Requirements
- Use `AppleAuthentication.signInAsync(...)` on iOS.
- Generate nonce and hashed nonce.
- Exchange Apple credential with Firebase using:
  - `OAuthProvider('apple.com')`
  - `idToken`
  - `rawNonce`
- Store name/email on first sign-in (Apple may only provide once).

## 5) Testing Checklist
- Test on a **real iPhone**.
- Verify first-time consent flow.
- Verify returning user login flow.
- Verify app handles missing name/email on subsequent logins.
- Verify user record is created/updated in Firestore.

## 6) Common Failure Causes
- Sign in with Apple capability not enabled on App ID.
- Firebase Apple provider missing/wrong keys.
- Bundle ID mismatch between Expo app config and Apple App ID.
- Using Expo Go instead of a native dev/TestFlight build.
- Not rebuilding after entitlement/capability changes.

## 7) Deployment Notes
- iOS native capability changes require a new EAS iOS build.
- Test in TestFlight before App Store release.

## 8) Operational Notes
- If Apple login fails for specific users, capture:
  - Firebase auth error code
  - device iOS version
  - whether it is first login or returning login
- Log and monitor auth failures to detect config regressions.
