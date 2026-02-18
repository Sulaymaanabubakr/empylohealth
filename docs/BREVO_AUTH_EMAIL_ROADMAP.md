# Brevo Auth Email Roadmap

## Goal
Introduce Brevo-powered email flows for Circles auth and account security, including:
- OTP verification at sign-up,
- Password reset via OTP/email,
- Account verification and security-related email actions.

## Scope (Planned)

### 1) Sign-up Verification
- User creates account.
- Generate one-time code (OTP).
- Send OTP using Brevo transactional email API.
- User enters OTP in app.
- Backend verifies OTP and marks account as verified/active.

### 2) Password Reset
- User requests password reset.
- Generate OTP/reset token.
- Send via Brevo email template.
- User submits OTP + new password.
- Backend validates token and updates password securely.

### 3) Other Security Emails
- New login/security alerts (optional phase).
- Email change verification.
- Admin/security notifications for critical account actions.

## Recommended Architecture

### Backend (Firebase Functions)
- Add dedicated auth-email endpoints:
  - `requestSignupOtp`
  - `verifySignupOtp`
  - `requestPasswordResetOtp`
  - `verifyPasswordResetOtp`
  - `resendOtp`
- Use server-side Brevo API key from Secret Manager (not `.env` in client).
- Store OTP hashes (never plaintext) in Firestore with TTL metadata.
- Enforce rate limits per email/IP/device.

### Data Model (Proposed)
Collection: `auth_otps`
- `email`
- `purpose` (`signup`, `password_reset`, etc.)
- `otpHash`
- `expiresAt`
- `attempts`
- `maxAttempts`
- `status` (`pending`, `verified`, `expired`, `blocked`)
- `createdAt`
- `updatedAt`

Collection: `auth_audit_logs`
- `email`
- `action`
- `result`
- `ip` (if available)
- `userAgent` (if available)
- `createdAt`

## Security Requirements
- OTP expiry: 5-10 minutes.
- Max attempts per OTP: 5.
- Cooldown between resend attempts (e.g. 30-60s).
- Daily cap per email/device.
- Hash OTP with strong one-way hash before storing.
- Invalidate old OTP when a new OTP is issued.
- Log all verification failures for abuse monitoring.

## Brevo Integration Notes
- Use Brevo Transactional Email API.
- Keep template IDs in backend config/secrets.
- Templates should include:
  - app name,
  - OTP,
  - expiry message,
  - security warning if not requested by user.

## Frontend UX Requirements
- OTP input screen with resend countdown.
- Clear states: sending, verifying, success, error.
- Disable repeated taps while request in flight.
- Friendly fallback messages for rate-limit and expired code.
- Deep-link support from email where relevant.

## Migration Plan
1. Add backend Brevo client + secret wiring.
2. Implement OTP storage/verification functions.
3. Add frontend OTP screens and flow wiring.
4. Soft launch with logs and rate limits.
5. Switch existing verification/reset flow to Brevo OTP flow.
6. Add monitoring and dashboard metrics.

## Out of Scope (for first phase)
- SMS OTP.
- Full multi-factor auth app-based TOTP.
- Advanced anomaly detection.

## Open Decisions
- OTP length: 6 digits or 8 digits.
- Allow both link + OTP or OTP-only.
- Whether non-password providers (Google/Apple) can set password during OTP reset flow.

## Implementation Checklist
- [ ] Add Brevo API key to Secret Manager.
- [ ] Build backend email service wrapper.
- [ ] Create OTP request/verify endpoints.
- [ ] Add Firestore TTL cleanup for expired OTP docs.
- [ ] Add rate limiting and abuse controls.
- [ ] Build signup OTP UI flow.
- [ ] Build password reset OTP UI flow.
- [ ] Add analytics/audit logs.
- [ ] QA on Android, iOS, Web Admin.
- [ ] Update compliance docs and privacy copy.

## Notes
- Existing Firebase email verification/reset can remain as fallback during migration.
- Production rollout should be staged behind a feature flag.
