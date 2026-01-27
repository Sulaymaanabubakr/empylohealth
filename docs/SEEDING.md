# Seeding from the terminal

Seed and backfill are **not** in the admin dashboard. Use this workspace and your terminal.

## Prerequisites

- Deployed functions (`firebase deploy --only functions`)
- **SEED_TOKEN** set in Firebase (Cloud Console → your project → Functions → Environment variables). Use any long random string you keep secret.

## Quick usage

From the **project root** (Empylo/):

```bash
export SEED_TOKEN=your-secret   # same value as in Firebase config

# Check what’s already in Firestore
./backend/scripts/seed-from-terminal.sh status

# Seed resources, challenges, affirmations (no reset)
./backend/scripts/seed-from-terminal.sh seed

# Clear and reseed everything
./backend/scripts/seed-from-terminal.sh seed force

# Add images to affirmations (or seed affirmations if missing, with force)
./backend/scripts/seed-from-terminal.sh backfill
./backend/scripts/seed-from-terminal.sh backfill force
```

Requires `curl` and `jq`. Optional: set `FIREBASE_PROJECT_ID` if you use a different project (default is `circles-app-by-empylo`).

## What the script calls

| Command | HTTP endpoint | Effect |
|--------|----------------|--------|
| `status` | `getSeedStatus?token=...` | Returns counts for resources, challenges, affirmations, daily_affirmations |
| `seed` | `seedAll?token=...` | Inserts from `backend/src/seedData.ts` into Firestore |
| `seed force` | `seedAll?token=...&force=1` | Clears those collections then inserts |
| `backfill` | `backfillAffirmationImages?token=...` | Adds image URLs to existing affirmations |
| `backfill force` | `...&force=1` | If affirmations are empty, seeds them first then adds images |

## Other ways to seed

- **Admin callables** (need an admin user): `seedChallenges`, `seedResources`, `seedAssessmentQuestions`, `seedAffirmations` — call via Firebase shell or your own script using a signed-in admin.
- **Assessment questions only**: `cd backend && npx ts-node scripts/seed_questions.ts` (or use `seed-questions.js`) if you have Firestore credentials and only want to seed `assessment_questions`.
