# How To Test (Latency + Bootstrap + Realtime)

## Local (dev)
1. Mobile: set RTDB URL
   - `EXPO_PUBLIC_FIREBASE_RTDB_URL=https://<belgium-rtdb>.europe-west1.firebasedatabase.app`
2. Run mobile dev client
   - `cd frontend`
   - `npm install`
   - `npx expo start --dev-client`
3. Watch logs on cold start
   - Expect debug print showing:
     - `functionsRegion: europe-west1`
     - `firestoreRegion: eur3`
     - `rtdbUrl: https://...europe-west1.firebasedatabase.app`
   - Expect perf marks:
     - `time_to_auth_resolve`
     - `time_to_profile_ready`
     - no navigation flash to ProfileSetup when profile is complete.

## Realtime Presence
1. Open app on device A and device B with two users.
2. On device A, open a circle detail page.
3. Verify member status changes without a manual refresh.
   - presence is stored at RTDB `/status/{uid}`

## Typing Indicator
1. Open a direct chat between A and B.
2. Type on device A.
3. Device B should show header status `Typing...`.
   - typing is stored at RTDB `/typing/{chatId}/{uid}`

## Backend (staging/prod)
1. Build + deploy functions
   - `cd backend && npm run build`
   - `firebase deploy --only functions`
2. Verify functions region is Belgium
   - `firebase functions:list --json | jq -r '.result[] | [.id,.region] | @tsv'`
   - Expect `europe-west1` for all functions.

## Rules
1. Deploy Firestore + RTDB rules
   - `firebase deploy --only firestore:rules,database`
2. Confirm security:
   - unauthenticated reads/writes rejected
   - user can only write own `/status/{uid}`
   - user can only write own typing node `/typing/{chatId}/{uid}`

## Nigeria latency sanity check
1. Test with a Nigerian network (or simulate high latency).
2. Key UX checks:
   - Circle list + chat list load via Firestore listeners (no functions call).
   - Message send writes directly; remote device receives via Firestore subscription.
   - No app flow that "fetches data via callable" before rendering core screens.
