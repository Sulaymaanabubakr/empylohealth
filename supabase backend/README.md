# Supabase Backend

Slice 1 backend assets live here and nowhere else.

## Structure

- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/seed.sql`
- `supabase/functions/`
- `scripts/`

## Required secrets

Set these in your Supabase project and local function env:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OTP_HMAC_SECRET`
- `OTP_SESSION_SECRET`
- `OTP_TTL_SECONDS`
- `OTP_HOURLY_CAP`
- `BREVO_API_KEY`
- `BREVO_FROM_EMAIL`
- `BREVO_FROM_NAME`

## Notes

- Edge Functions are the only privileged backend boundary for slice 1.
- `backend/` remains untouched legacy code during this migration.
- Firebase RTDB presence is intentionally disabled in the mobile app for this slice.

## Helpful scripts

Regenerate the Apple Sign in with Apple client secret locally:

```bash
cd "/Users/sulaymaanabubakr/Desktop/Empylo/supabase backend"
node scripts/generate_apple_client_secret.mjs \
  --team-id <APPLE_TEAM_ID> \
  --key-id <APPLE_KEY_ID> \
  --client-id com.empylo.circlesapp \
  --p8 "/absolute/path/to/AuthKey_<APPLE_KEY_ID>.p8"
```
