# Firestore collections

High-level reference for the main collections and subcollections. All writes go through the backend; client access is read-only (or create-only where noted).

## Top-level collections

| Collection | Purpose | Client read | Client write |
|------------|---------|-------------|--------------|
| `users` | User profiles (uid, email, name, photo, settings, stats) | Any authenticated | Own doc only |
| `circles` | Support groups; metadata, adminId, members, chatId | Any authenticated | — |
| `chats` | Direct or group chats; type, participants, circleId | Participants | — |
| `resources` | Articles/videos for Explore | Any authenticated | — |
| `challenges` | Wellbeing challenges | Any authenticated | — |
| `affirmations` | Daily affirmation content | Any authenticated | — |
| `subscriptionPlans` | Plans (billing not active yet) | Any authenticated | — |
| `huddles` | Active video call sessions; roomUrl, participants | Any authenticated | — |
| `notifications` | In-app notifications | Own (uid) | — |
| `learningSessions` | Learning progress | Own (uid) | — |
| `campaigns` | Campaigns | Own (uid) | — |
| `assessments` | Check-in / questionnaire submissions | Own (uid) | Create own |
| `assessment_questions` | Admin-managed questions | Any authenticated | Admin only |
| `contactMessages` | Contact form submissions | Admin only | — |
| `reports` | Global moderation queue (from backend) | — | — |
| `support_tickets` | Support tickets (from contact form) | — | — |
| `transactions` | Billing transactions (admin) | — | — |
| `daily_affirmations` | Per-day picks (date → affirmationIds) | — | — |

## Subcollections

### circles/{circleId}/members

Member list and roles. Fields: `uid`, `role` (creator | admin | moderator | member), `status`, `joinedAt`.

### circles/{circleId}/requests

Join requests for private circles. Doc id = userId. Fields: uid, displayName, photoURL, answers, status, createdAt.

### circles/{circleId}/reports

Circle-scoped reports. Fields: reporterId, targetId, targetType, reason, description, status, etc.

### circles/{circleId}/scheduledHuddles

Scheduled group calls. Fields: title, scheduledAt, createdBy, createdAt.

### circles/{circleId}/messages

Legacy circle-level messages (if used). Prefer `chats/{chatId}/messages` for group chat.

### chats/{chatId}/messages

Chat messages. Fields: senderId, text, type, mediaUrl, createdAt, readBy.

## Indexes

Defined in `firestore.indexes.json` (and root `firestore.indexes.json`). Main composite indexes cover:

- `circles`: members + createdAt
- `challenges`: status + priority
- `resources`: status + publishedAt
- `affirmations`: status + publishedAt
- `assessments`: uid + createdAt

Deploy with: `firebase deploy --only firestore:indexes`.
