# Deployment Notes

## Apple Sign-In Configuration
When setting up "Sign in with Apple" in the Apple Developer Console (Service ID configuration), use this Return URL:
`https://empylo-health.firebaseapp.com/__/auth/handler`

## Firebase Config
The `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are located in this directory.
Do not commit them to public version control.
