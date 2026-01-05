# Empylo

Monorepo structure:

- frontend/ (Expo React Native app)
- backend/functions/ (Firebase Cloud Functions)

## Frontend

```bash
cd frontend
npm run start
```

## Backend (Functions)

```bash
cd backend/functions
npm install
```

Deploy (after Firebase CLI login and project set):

```bash
firebase deploy --only functions
```

Update `.firebaserc` with your Firebase project id.
