# Account Deletion Matrix

Last updated: 2026-02-18  
App: Circles App (`com.empylo.circlesapp`)

## Scope
This matrix documents what happens when a user uses **Delete My Account** in-app.

## Data Handling by Category

1. Account profile (`users/{uid}`)
- Action: **Deleted**
- Timing: Immediate during callable execution
- Notes: Includes profile metadata (name, email reference, photo URL, settings fields)

2. Auth identity (Firebase Authentication user)
- Action: **Deleted**
- Timing: Immediate during callable execution
- Notes: User can no longer sign in with previous credentials

3. Circle membership (`circles.members` arrays)
- Action: **Removed**
- Timing: Immediate
- Notes: User is removed from member arrays where present

4. Chat participation (`chats.participants` arrays)
- Action: **Removed**
- Timing: Immediate
- Notes: User is removed from participant arrays

5. Assessments (`assessments` where `uid == user`)
- Action: **Deleted**
- Timing: Immediate, batched
- Notes: Historical assessment documents for the user are removed

6. Existing chat messages authored by user
- Action: **Retained**
- Timing: N/A
- Notes: Messages remain in conversation history for continuity/moderation unless separately moderated

7. Moderation reports filed by user
- Action: **Retained**
- Timing: N/A
- Notes: Retained for abuse investigation/audit integrity

8. Aggregated analytics/operational logs
- Action: **Retained (de-identified where possible)**
- Timing: Per platform retention controls
- Notes: Required for security, anti-abuse, and service reliability monitoring

## User-Facing Disclosure Summary
- Deletion removes account access and profile data.
- Membership and chat participation links are removed.
- Some content and moderation records may be retained for safety, legal, and abuse-prevention reasons.

