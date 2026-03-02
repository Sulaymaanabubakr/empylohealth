# Deep Linking Test Matrix

## Installed App
- [ ] iOS/Android app-invite (`/ref/:token`) opens app invite flow.
- [ ] iOS cold start: WhatsApp invite link opens `InviteLanding`.
- [ ] iOS warm start: SMS affirmation link opens target affirmation.
- [ ] Android cold start: invite link opens `InviteLanding`.
- [ ] Android warm start: resource link opens target resource screen.

## Not Installed (Deferred)
- [ ] App invite link (`/ref/:token`) -> landing -> install -> app opens app invite target.
- [ ] iOS Safari invite link -> landing -> install -> app opens invite destination.
- [ ] Android Chrome affirmation link -> landing -> install -> app opens affirmation destination.
- [ ] WhatsApp in-app browser deferred flow validated.
- [ ] Email link deferred flow validated.

## Logged Out Continuation
- [ ] Open invite link while logged out.
- [ ] App routes to auth flow.
- [ ] After successful login, app resumes exact target automatically.
- [ ] Restart during auth still resumes pending deep link.

## Invalid / Expired / Revoked Invite
- [ ] Web landing shows friendly unavailable state.
- [ ] App invite screen shows friendly error.
- [ ] User can continue to browse circles.

## Security
- [ ] `joinCircle` denied for private circles without invite.
- [ ] `joinCircleWithInvite` succeeds with valid token.
- [ ] Revoked token rejected.
- [ ] Expired token rejected.
- [ ] Max-uses exceeded token rejected.
- [ ] Rate limit returns `resource-exhausted` under brute-force attempts.

## Evidence to Capture
- Device logs with deep-link parse + route decisions.
- Function logs for `resolveInviteToken`, `joinCircleWithInvite`, `resolveDeepLink`.
- Screenshots/videos for each scenario.
- Final pass/fail table by platform + browser/channel.
