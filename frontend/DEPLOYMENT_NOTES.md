# Deployment Notes

## Android Build & Deployment

**IMPORTANT:** This project uses **EAS Build** for generating Android binaries (APK/AAB/Dev Client).

-   **Do NOT rely on local builds** (e.g., `npx expo run:android` using local Gradle/Keystore) for production or shared development builds.
-   The source of truth for signing keys is **EAS Credentials**, not `android/app/debug.keystore` or `release.keystore`.

### Debugging Google Sign-In
To ensure Google Sign-In works, the **SHA-1 fingerprint** from the **EAS Build Profile** you are using must be added to the Firebase Console.

1.  Run `eas credentials -p android`
2.  Select the profile you are building with (e.g., `development` or `production`).
3.  Note the **SHA1 Fingerprint**.
4.  Add this fingerprint to your Firebase Project Settings > General > Your Apps > Android App.
5.  Download the updated `google-services.json` (optional, but good practice).

### Common Mistakes
-   Looking at `keytool -list -keystore android/app/debug.keystore` (This is WRONG for EAS builds).
-   Running `./gradlew clean` to fix signing issues (This does nothing for EAS builds).
