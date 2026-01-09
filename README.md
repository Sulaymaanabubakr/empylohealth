# Empylo

Monorepo structure:

- frontend/ (Expo React Native app)
- backend/ (Firebase Cloud Functions)

## Frontend

```bash
cd frontend
npm run start
```

## Backend (Functions)

```bash
cd backend
npm install
```

Deploy (after Firebase CLI login and project set):

```bash
firebase deploy --only functions
```

Update `.firebaserc` with your Firebase project id.

## Seeding Demo Data

Seed global resources/circles (local script):

```bash
cd backend
npx ts-node scripts/runSeed.ts
```

Seed user-scoped demo data (callable function):

```bash
cd backend
firebase functions:shell
seedDemoData()
```

## Technical Debt / Pending Rebuild

- **Push Notifications**: Temporarily disabled in `src/services/api/notificationService.js` to avoid rebuilding the Android dev client.
  - To re-enable: Uncomment imports and code in that file.
  - Then run: `eas build --profile development --platform android` to include `expo-device` and `expo-notifications` native code.
