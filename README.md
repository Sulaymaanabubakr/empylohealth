# Empylo

Wellbeing and community app: daily check-ins, circles (support groups), chat, huddles (video), and admin dashboard.

## Project structure

| Part | Path | Stack | Purpose |
|------|------|-------|---------|
| **Mobile app** | `frontend/` | Expo, React Native, JS | iOS/Android user app |
| **Backend** | `backend/` | Firebase Functions, Firestore, TypeScript | API, triggers, seed/backfill |
| **Admin** | `web/admin/` | React, Vite, TypeScript | Content & user management |
| **Landing** | `web/landing/` | React, Vite, TypeScript | Marketing site |

All apps use the same Firebase project. Functions run in `us-central1`. See `DEPLOYMENT.md` for env vars and deploy steps; see `docs/firestore-collections.md` for data model.

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

## Seeding from the terminal

Seed and backfill run from your terminal in this workspace, not from the admin dashboard. Use the HTTP endpoints via the helper script:

```bash
export SEED_TOKEN=your-secret   # same value as in Firebase Functions config
./backend/scripts/seed-from-terminal.sh status    # show counts
./backend/scripts/seed-from-terminal.sh seed      # seed resources, challenges, affirmations
./backend/scripts/seed-from-terminal.sh seed force   # clear and reseed
./backend/scripts/seed-from-terminal.sh backfill  # add images to affirmations
```

Requires deployed functions and `SEED_TOKEN` set in Firebase. Full details: **docs/SEEDING.md**.

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
