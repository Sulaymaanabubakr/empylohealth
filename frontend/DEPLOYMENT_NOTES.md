# Deployment Notes

## Apple Sign-In Configuration
When setting up "Sign in with Apple" in the Apple Developer Console (Service ID configuration), use this Return URL:
`https://circles-app-by-empylo.firebaseapp.com/__/auth/handler`

## Firebase Config
The `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are located in this directory.
Do not commit them to public version control.
