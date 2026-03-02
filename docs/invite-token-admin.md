# Invite Token Admin Guide

## APIs
- `createCircleInvite({ circleId, expiresInHours, maxUses })`
- `listCircleInvites({ circleId })`
- `revokeCircleInvite({ token })`
- `resolveInviteToken({ token })`
- `joinCircleWithInvite({ token })`

## Invite Lifecycle
1. Moderator/admin/creator creates token.
2. Token shared as `https://empylo.com/invite/<token>`.
3. Recipient resolves token and joins via `joinCircleWithInvite`.
4. Invite may expire, be revoked, or hit max uses.

## Admin Operations
- Create short-lived invite for sensitive circles.
- Revoke compromised tokens immediately.
- Monitor usage via `inviteTokens` and `inviteTokenUses`.
- Investigate abuse via `deepLinkRateLimits`.

## Recommended Defaults
- Expiry: 7 days
- Max uses: 20
- Rotate frequently for private circles

## Incident Response
- Suspected leak:
  1. Revoke affected token(s).
  2. Generate new token(s).
  3. Review `inviteTokenUses` for unusual IP/user-agent patterns.
  4. Increase moderation for affected circle.
