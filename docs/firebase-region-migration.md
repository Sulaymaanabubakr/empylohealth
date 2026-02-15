# Firebase Region Migration Plan (Belgium)

## Target
- Firestore: `eur3` (already active)
- Realtime Database: Belgium instance (`EXPO_PUBLIC_FIREBASE_RTDB_URL`)
- Cloud Functions: `europe-west1`

## Safe rollout
1. Deploy updated functions code with region set to `europe-west1`.
2. Release mobile/web clients configured for `europe-west1` callable invocations and Belgium RTDB URL.
3. Keep `us-central1` functions alive during a grace period for older app versions.
4. Monitor function invocations by region and app version adoption.
5. Delete `us-central1` functions after adoption threshold is reached.

## CLI commands

### List deployed functions (all regions)
```bash
firebase functions:list
```

### Deploy all updated functions (Belgium region comes from source code)
```bash
cd backend
npm run build
firebase deploy --only functions
```

### Deploy selected functions only
```bash
cd backend
npm run build
firebase deploy --only functions:startHuddle,functions:joinHuddle,functions:endHuddle
```

### Verify region from JSON output
```bash
firebase functions:list --json
```

### Delete legacy us-central1 functions safely (one-by-one with region)
```bash
firebase functions:delete onUserCreate --region us-central1 --force
firebase functions:delete onMessageCreate --region us-central1 --force
```

Or batch by scripting:
```bash
firebase functions:list --json | jq -r '.result[] | select(.region=="us-central1") | .id' \
  | xargs -n 1 -I {} firebase functions:delete {} --region us-central1 --force
```

## Client runtime checks
- Mobile debug logs should print:
  - `functionsRegion: europe-west1`
  - `firestoreRegion: eur3`
  - `rtdbUrl: https://<belgium-instance>.europe-west1.firebasedatabase.app`

## Environment
Set in mobile app build env:
```bash
EXPO_PUBLIC_FIREBASE_RTDB_URL=https://<your-belgium-rtdb-instance>.europe-west1.firebasedatabase.app
```
