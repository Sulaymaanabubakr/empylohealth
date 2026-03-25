# Deployment Guide

This document provides instructions for deploying all components of the Empylo Circles application.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)
- Node.js 20.x installed

## Backend Cloud Functions

### Region
Functions are deployed in `europe-west1` (Belgium) by definition in source code (`functions.region('europe-west1')`).

### Full Deployment

Deploy all functions at once:

```bash
cd /Users/sulaymaanabubakr/Desktop/Empylo
firebase deploy --only functions
```

### Partial Deployment

Deploy specific functions:

```bash
# Core user-facing functions
firebase deploy --only functions:getUserStats,functions:getKeyChallenges,functions:getRecommendedContent

# Admin dashboard functions
firebase deploy --only functions:getDashboardStats,functions:getAllUsers,functions:getAllContent,functions:getAdminAffirmations,functions:getTransactions

# Triggers
firebase deploy --only functions:onUserCreate,functions:onMessageCreate

# Subscription + webhook functions
firebase deploy --only functions:getSubscriptionCatalog,functions:getSubscriptionStatus,functions:validateAppleSubscriptionReceipt,functions:validateGoogleSubscriptionPurchase,functions:restoreSubscriptions,functions:handleAppleSubscriptionNotifications,functions:handleGoogleSubscriptionNotifications

# Huddle subscription enforcement workers
firebase deploy --only functions:warnUpcomingSubscriptionHuddleExpiry,functions:expireSubscriptionLimitedHuddles
```

### Before Every Deployment

1. **Build the backend**:
   ```bash
   cd backend
   npm run build
   ```

2. **Verify the build succeeded**:
   ```bash
   ls -la lib/
   # Should show compiled .js files
   ```

3. **Deploy functions**:
   ```bash
   cd ..
   firebase deploy --only functions
   ```

## Admin Dashboard

The admin app lives under `web/admin/`.

### Build for Production

```bash
cd web/admin
npm run build
```

This creates a `dist/` folder with optimized production files.

### Deploy to Hosting (if configured)

```bash
firebase deploy --only hosting:admin
```

### Local Development

```bash
cd web/admin
npm run dev
```

Runs on `http://localhost:5173`

## Frontend Mobile App

### Development Build

```bash
cd frontend
npx expo start
```

### Production Build

For Android:
```bash
cd frontend
eas build --platform android --profile production
```

For iOS:
```bash
cd frontend
eas build --platform ios --profile production
```

## Firestore Rules & Indexes

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

## Deep Linking & Landing Deployment

### Backend deep-link functions

These functions must be deployed for enterprise deep linking:
- `resolveDeepLink`
- `serveAssetLinks`
- `serveAppleAssociation`
- `createCircleInvite`
- `resolveInviteToken`
- `joinCircleWithInvite`
- `listCircleInvites`
- `revokeCircleInvite`

Deploy:

```bash
cd /Users/sulaymaanabubakr/Desktop/Empylo
firebase deploy --only functions:resolveDeepLink,functions:serveAssetLinks,functions:serveAppleAssociation,functions:createCircleInvite,functions:resolveInviteToken,functions:joinCircleWithInvite,functions:listCircleInvites,functions:revokeCircleInvite
```

### Landing web

```bash
cd web/landing
npm run build
cd /Users/sulaymaanabubakr/Desktop/Empylo
firebase deploy --only hosting:landing
```

### Association endpoints

After deploy, verify:
- `https://empylo.com/.well-known/assetlinks.json`
- `https://empylo.com/apple-app-site-association`

## Subscription Deployment

### Backend env vars

Populate these in `backend/.env` before deploying subscription support:

```bash
IOS_SUBSCRIPTION_PRODUCT_IDS=com.empylo.premium.annual
ANDROID_SUBSCRIPTION_PRODUCT_IDS=com.empylo.premium.annual
ANDROID_PACKAGE_NAME=com.empylo.circlesapp
APPLE_IN_APP_PURCHASE_ISSUER_ID=...
APPLE_IN_APP_PURCHASE_KEY_ID=...
APPLE_IN_APP_PURCHASE_KEY_P8_BASE64=...
APPLE_ROOT_CA_PATH=certs/AppleRootCA-G3.pem
GOOGLE_PUBSUB_AUDIENCE=https://europe-west1-<project-id>.cloudfunctions.net/handleGoogleSubscriptionNotifications
GOOGLE_PUBSUB_SERVICE_ACCOUNT_EMAIL=...
SUBSCRIPTION_ACTIVITY_GATING_ENABLED=false
```

Notes:
- `APPLE_IN_APP_PURCHASE_ISSUER_ID`, `APPLE_IN_APP_PURCHASE_KEY_ID`, and `APPLE_IN_APP_PURCHASE_KEY_P8_BASE64` are used to mint App Store Server API JWTs. This replaces the deprecated shared-secret `verifyReceipt` flow.
- `APPLE_ROOT_CA_PATH` should point to the bundled Apple root certificate file shipped with the backend source. The default path in this repo is `backend/certs/AppleRootCA-G3.pem`.
- `GOOGLE_PUBSUB_AUDIENCE` must exactly match the deployed HTTPS URL of `handleGoogleSubscriptionNotifications`.
- Keep `SUBSCRIPTION_ACTIVITY_GATING_ENABLED=false` until resource access metadata has been curated.

### Functions to deploy

```bash
cd /Users/sulaymaanabubakr/Desktop/Empylo
firebase deploy --only functions:getSubscriptionCatalog,functions:getSubscriptionStatus,functions:validateAppleSubscriptionReceipt,functions:validateGoogleSubscriptionPurchase,functions:restoreSubscriptions,functions:handleAppleSubscriptionNotifications,functions:handleGoogleSubscriptionNotifications,functions:warnUpcomingSubscriptionHuddleExpiry,functions:expireSubscriptionLimitedHuddles
```

Or use grouped deploys:

```bash
cd backend
bash scripts/deploy-functions-group.sh user
bash scripts/deploy-functions-group.sh huddle
```

### Firestore deploy

Subscription enforcement requires the updated rules and indexes:

```bash
cd /Users/sulaymaanabubakr/Desktop/Empylo
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Apple App Store Server Notifications

1. Deploy `handleAppleSubscriptionNotifications`.
2. In App Store Connect, configure the Production Server URL to:
   `https://europe-west1-<project-id>.cloudfunctions.net/handleAppleSubscriptionNotifications`
3. Use the same for Sandbox if you want sandbox events routed to the same verifier.
4. Ensure the bundled Apple root certificate file is present at the configured `APPLE_ROOT_CA_PATH`.
5. Trigger a sandbox subscription lifecycle event and verify documents update in:
   - `subscriptionWebhookEvents`
   - `subscriptionEntitlements/{uid}`

### Google Play RTDN

1. Deploy `handleGoogleSubscriptionNotifications`.
2. Create or reuse a Pub/Sub topic for Real-time developer notifications in Google Play Console.
3. Create a push subscription pointing to:
   `https://europe-west1-<project-id>.cloudfunctions.net/handleGoogleSubscriptionNotifications`
4. Configure the push subscription to attach an OIDC token whose audience equals `GOOGLE_PUBSUB_AUDIENCE`.
5. Set `GOOGLE_PUBSUB_SERVICE_ACCOUNT_EMAIL` to the service account sending the OIDC token if you want email pinning enabled.
6. Trigger a test RTDN event and verify:
   - the HTTP endpoint accepts the signed push
   - `subscriptionWebhookEvents` is populated
   - matching entitlement docs are refreshed

### Frontend / native build

`react-native-iap` was added to the mobile app. Build a new dev client / production app before testing purchases:

```bash
cd frontend
npx expo install
eas build --platform ios --profile production
eas build --platform android --profile production
```

For local device testing with native modules:

```bash
cd frontend
npx expo run:ios
# or
npx expo run:android
```

### Resource gating rollout

Before turning on `SUBSCRIPTION_ACTIVITY_GATING_ENABLED=true`, update `resources` docs with:

```json
{
  "access": {
    "kind": "self_development",
    "plans": ["free", "premium"],
    "shareRequiresPremium": false
  }
}
```

For premium-only/group content:

```json
{
  "access": {
    "kind": "group_activity",
    "plans": ["premium"],
    "shareRequiresPremium": true
  }
}
```

Only enable the flag after this metadata is curated.

## Common Issues & Solutions

### Issue: "not-found" error when calling functions

**Solution**: Ensure functions are deployed and the region is explicitly set to `us-central1`:

```typescript
// In frontend/src/services/firebaseConfig.ts
const functions: Functions = getFunctions(app, 'us-central1');

// In admin/src/lib/firebase.ts
export const functions = getFunctions(app, 'us-central1');
```

### Issue: CORS errors in admin dashboard

**Solution**: 
1. Verify functions are using `functions.https.onCall` (auto-handles CORS)
2. Ensure you're logged in to the admin dashboard
3. Check that your email is in the `SUPER_ADMINS` array in `backend/src/api/admin.ts`

### Issue: Functions not deploying

**Solution**:
1. Check you're on the correct Firebase project: `firebase use circles-app-by-empylo`
2. Ensure billing is enabled (Blaze plan required for Node.js 20)
3. Build the backend first: `cd backend && npm run build`

## Environment Variables

### Backend (.env in backend/)

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
DAILY_API_KEY=your_daily_key
CONTACT_ALLOWED_ORIGINS=*
IOS_SUBSCRIPTION_PRODUCT_IDS=com.empylo.premium.annual
ANDROID_SUBSCRIPTION_PRODUCT_IDS=com.empylo.premium.annual
ANDROID_PACKAGE_NAME=com.empylo.circlesapp
APPLE_IN_APP_PURCHASE_ISSUER_ID=...
APPLE_IN_APP_PURCHASE_KEY_ID=...
APPLE_IN_APP_PURCHASE_KEY_P8_BASE64=...
APPLE_ROOT_CA_PATH=certs/AppleRootCA-G3.pem
GOOGLE_PUBSUB_AUDIENCE=https://europe-west1-<project-id>.cloudfunctions.net/handleGoogleSubscriptionNotifications
GOOGLE_PUBSUB_SERVICE_ACCOUNT_EMAIL=...
SUBSCRIPTION_ACTIVITY_GATING_ENABLED=false
```

### Admin (web/admin/.env)

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=circles-app-by-empylo
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Seed/backfill are done from the terminal in this workspace; see **docs/SEEDING.md**.

### Frontend (app.config.js)

Firebase config is embedded in `frontend/src/services/firebaseConfig.ts` directly.

## Complete Deployment Checklist

- [ ] Backend functions built (`cd backend && npm run build`)
- [ ] Backend functions deployed (`firebase deploy --only functions`)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] Admin dashboard built (`cd web/admin && npm run build`)
- [ ] Admin dashboard tested locally (`cd web/admin && npm run dev`)
- [ ] Frontend mobile app tested on physical device
- [ ] Environment variables verified for all projects

## Quick Reference

| Component | Directory | Build Command | Deploy Command |
|-----------|-----------|---------------|----------------|
| Backend Functions | `backend/` | `npm run build` | `firebase deploy --only functions` |
| Admin Dashboard | `web/admin/` | `npm run build` | N/A (local or hosting) |
| Frontend App | `frontend/` | N/A | `eas build` |
| Firestore Rules | Root | N/A | `firebase deploy --only firestore:rules` |
| Firestore Indexes | Root | N/A | `firebase deploy --only firestore:indexes` |
