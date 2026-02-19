# Brevo + OTP Integration (Circles Health App)

## Overview
This implementation adds:
- Server-side OTP generation/verification for:
  - `SIGNUP_VERIFY`
  - `EMAIL_VERIFY`
  - `RESET_PASSWORD`
  - `CHANGE_PASSWORD`
  - `CHANGE_EMAIL`
- Brevo transactional email delivery for:
  - OTP code
  - New login detected
  - Password reset requested
  - Password changed
  - Account deleted
  - Circle deleted

All sending is backend-only via Firebase Cloud Functions. The mobile app never calls Brevo directly.

## Backend Functions Added
- `requestOtp`
- `verifyOtp`
- `registerWithOtp`
- `resetPasswordWithOtp`
- `changePasswordWithOtp`
- `completeEmailVerificationWithOtp`
- `changeEmailWithOtp`
- `recordLoginDevice`

Also integrated into existing flows:
- `deleteCircle` now sends circle-deleted emails to members (respects `settings.securityNotifications`)
- `deleteChat` (last-admin delete path) now sends circle-deleted emails
- `deleteUserAccount` now sends account-deleted confirmation email

## Security Controls
- OTP code: 6 digits, cryptographically random.
- OTP code storage: hashed (`sha256(code:salt:pepper)`), never plaintext.
- Expiry: 10 minutes.
- Verification session token expiry: 20 minutes.
- Rate limiting:
  - resend cooldown: 60 seconds
  - request window limit: 8 requests / 60 minutes
- Attempt limit:
  - max attempts: 5
  - lockout: 15 minutes after exceeding attempts/window
- Audit logs:
  - `otpAudit` collection captures request/verify events.

## Required Environment Variables (Functions)
Set these in backend runtime (do not commit secrets):
- `BREVO_API_KEY`
- `BREVO_FROM_EMAIL` (example: `noreply@empylo.com`)
- `BREVO_FROM_NAME` (example: `Circles Health App`)
- `OTP_PEPPER` (high-entropy random string)
- `SUPPORT_EMAIL`
- `APP_WEB_URL`
- `APP_PRIVACY_URL` (optional)
- `APP_TERMS_URL` (optional)

### Local `.env` example (for emulator/staging only)
```env
BREVO_API_KEY=YOUR_BREVO_API_KEY
BREVO_FROM_EMAIL=noreply@empylo.com
BREVO_FROM_NAME=Circles Health App
OTP_PEPPER=replace-with-long-random-secret
SUPPORT_EMAIL=support@empylo.com
APP_WEB_URL=https://www.empylo.com
APP_PRIVACY_URL=https://www.empylo.com/privacy
APP_TERMS_URL=https://www.empylo.com/terms
```

## Brevo Sender + DNS
1. In Brevo, create and verify sender email/domain.
2. Configure DNS records from Brevo:
   - SPF
   - DKIM
   - DMARC
3. Wait for DNS propagation and sender verification.
4. Use verified sender in `BREVO_FROM_EMAIL`.

## Email Template System
Templates are code-managed (rendered in Functions), not Brevo template IDs.

Template map:
- `otp`
- `newLogin`
- `passwordResetRequested`
- `passwordChanged`
- `accountDeleted`
- `circleDeleted`

Common style system:
- Branded gradient header
- Consistent typography + spacing
- CTA button style
- Security notice block
- Footer with support + legal links

## Frontend Flow Wiring
- Signup (`SignUpScreen`):
  1. `requestOtp(SIGNUP_VERIFY)`
  2. `OtpVerificationScreen`
  3. `registerWithOtp` (server creates user) + auto sign-in
- Forgot password (`ForgotPasswordScreen`):
  1. `requestOtp(RESET_PASSWORD)`
  2. `OtpVerificationScreen`
  3. `ResetPasswordScreen` uses `resetPasswordWithOtp`
- Profile change password (`PersonalInformationScreen`):
  1. Save profile updates
  2. `requestOtp(CHANGE_PASSWORD)`
  3. `OtpVerificationScreen` calls `changePasswordWithOtp`
- Email verify (`VerificationScreen`):
  1. `requestOtp(EMAIL_VERIFY)`
  2. `OtpVerificationScreen` calls `completeEmailVerificationWithOtp`
- New-device login detection:
  - `AuthContext` calls `recordLoginDevice` after auth state resolves.

## Emulator/Staging Test Plan
### OTP
1. Signup OTP:
   - Request code, verify valid code, account created.
2. Resend:
   - Tap resend before cooldown -> blocked, timer shown.
3. Wrong code:
   - 5 wrong attempts -> lockout response.
4. Expiry:
   - Verify after 10+ min -> expired.
5. Reset password via OTP:
   - Request, verify, set new password, sign-in succeeds.
6. Change password via OTP:
   - Request from profile, verify, password changes.

### Transactional Emails
1. OTP email arrives with code + expiry copy.
2. New device login email arrives only on first seen device ID.
3. Password reset requested email arrives when reset OTP is requested.
4. Password changed email arrives after reset/change success.
5. Account deleted email arrives on account deletion.
6. Circle deleted email arrives for affected members.

## Operational Notes
- Rotate `BREVO_API_KEY` immediately if exposed publicly.
- Keep OTP pepper secret and rotate carefully (rotation invalidates outstanding OTP hashes/sessions).
- Monitor `otpAudit` for abuse patterns.
