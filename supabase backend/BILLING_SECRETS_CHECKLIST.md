# Billing Secrets Checklist

These secrets are required for the new Supabase billing verification flow.

## Apple App Store Server API

Set these in Supabase Edge Function secrets:

- `APPLE_IN_APP_PURCHASE_ISSUER_ID`
- `APPLE_IN_APP_PURCHASE_KEY_ID`
- `APPLE_IN_APP_PURCHASE_KEY_P8_BASE64`
  - base64-encoded contents of the `.p8` private key
  - or use `APPLE_IN_APP_PURCHASE_KEY_P8` with the raw multiline key
- `IOS_BUNDLE_ID`
  - current app bundle id: `com.empylo.circlesapp`

Optional:

- `ENTERPRISE_DEMO_URL`

## Google Play / Android Publisher API

Preferred:

- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64`
  - base64-encoded Play service account JSON

Alternative:

- `GOOGLE_PLAY_CLIENT_EMAIL`
- `GOOGLE_PLAY_PRIVATE_KEY` or `GOOGLE_PLAY_PRIVATE_KEY_BASE64`

Also set:

- `ANDROID_PACKAGE_NAME`
  - current package id: `com.empylo.circlesapp`

## Supabase core secrets

These must already exist for the functions to work:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Optional:

- `OPENAI_MODEL`

## Suggested deploy order

1. Push the new migration.
2. Set or verify all billing secrets above.
3. Deploy these functions:
   - `app-billing`
   - `app-ai`
   - `app-content`
   - `start-huddle`
   - `join-huddle`
   - `update-huddle-connection`
   - `end-huddle`
   - `admin-billing`

## Validation checklist

After deploy, test:

1. `getSubscriptionCatalog`
2. `getSubscriptionStatus`
3. Apple subscription purchase validation
4. Google subscription purchase validation
5. Apple boost purchase validation
6. Google boost purchase validation
7. assessment submit -> AI Key Challenges generation
8. huddle start/join limits and countdown warning
