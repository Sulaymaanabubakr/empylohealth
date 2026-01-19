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

## Seeding Initial Content

Seed global resources/circles (local script):

```bash
cd backend
npx ts-node scripts/runSeed.ts
```

Seed resources (callable function):

```bash
cd backend
firebase functions:shell
seedResources()
```

## Technical Debt / Pending Rebuild

- **Push Notifications**: Temporarily disabled in `src/services/api/notificationService.js` to avoid rebuilding the Android dev client.
  - To re-enable: Uncomment imports and code in that file.
  - Then run: `eas build --profile development --platform android` to include `expo-device` and `expo-notifications` native code.

## Future Data Flow & Requirements

The following business logic is planned for implementation:

### 1. Recommended Activities
- **Source**: Dynamic based on User Assessment.
- **Logic**: The app should suggest activities tailored to the user's latest assessment scores and identified needs.

### 2. Key Challenges
- **Source**: Dynamic based on Weekly Assessment.
- **Logic**: Challenges should be determined and measured by the results of the user's weekly check-ins/assessments.

### 3. Daily Affirmations
- **Source**: Admin Dashboard.
- **Logic**: Content is managed centrally via the Admin Dashboard and fetched daily by the app.

### 4. Group Activities
- **Source**: Groups / Circles.
- **Logic**: Activities listed here should be directly sourced from the Circles the user has joined or available public circles.
