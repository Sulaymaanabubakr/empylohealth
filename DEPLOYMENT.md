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
