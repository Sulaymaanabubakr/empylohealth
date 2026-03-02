# Deep Linking Test Matrix

## Installed App
- [ ] iOS/Android app-invite (`/ref/:token`) opens app invite flow.
- [ ] iOS cold start: WhatsApp invite link opens `InviteLanding`.
- [ ] iOS warm start: SMS affirmation link opens target affirmation.
- [ ] Android cold start: invite link opens `InviteLanding`.
- [ ] Android warm start: resource link opens target resource screen.

## Not Installed (No Deferred SDK)
- [ ] App invite link (`/ref/:token`) opens landing page with install CTA.
- [ ] iOS Safari invite link opens landing page with install CTA.
- [ ] Android Chrome affirmation link opens landing page with install CTA.
- [ ] Landing page message explicitly instructs user to open app and go to Invitations after install.
- [ ] After install/login, user can open invite via Invitations screen.

## Logged Out Continuation
- [ ] Open invite link while logged out.
- [ ] App routes to auth flow.
- [ ] After successful login, app resumes exact target automatically.
- [ ] Restart during auth still resumes pending deep link.
- [ ] `Invitations` screen lists recent invite links created by the user.
- [ ] `Invitations` screen accepts pasted Empylo link and routes correctly.

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
