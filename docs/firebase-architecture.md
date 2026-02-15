# Firebase Architecture (EU-first)

## Goals
- Reduce latency for Nigeria and EU users by removing UI round-trips through Cloud Functions.
- Align compute with data: Firestore `eur3` + Functions `europe-west1` + RTDB (Belgium) for live state.

## Responsibilities

### Firestore (eur3): durable app data
- `/users/{uid}` profile + stable fields
- `/circles/{circleId}` + membership subcollection
- `/chats/{chatId}` + message history `/chats/{chatId}/messages/{messageId}`
- `/assessments/{assessmentId}` + computed stats written into `/users/{uid}`
- `/resources`, `/affirmations`, `/challenges` content

### Realtime Database (Belgium): ephemeral live state
- `/status/{uid}`: presence
  - `{ state: 'online'|'offline', lastChanged: serverTimestamp }`
- `/typing/{chatId}/{uid}`: typing indicator
  - `{ state: 'typing', updatedAt: serverTimestamp }` (removed when not typing)
- `/live/{roomId}`: huddle/call live state
  - `{ state, chatId, hostUid, participants, updatedAt }`

### Cloud Functions (Belgium): background + privileged operations
Keep Functions for:
- push notification fanout (trigger on new chat messages)
- huddle start/join/end (Daily room + tokens)
- admin tools (dashboard, moderation)
- scheduled jobs (affirmations)
- webhooks/payments (if any)

Avoid Functions for:
- normal profile fetch
- normal chat list/messages fetch
- normal circle browsing and membership writes (except privileged actions)

## Client data layer
Repositories:
- `frontend/src/services/repositories/ProfileRepository.js` (Firestore)
- `frontend/src/services/repositories/ChatRepository.js` (Firestore)
- `frontend/src/services/repositories/CircleRepository.js` (Firestore)
- `frontend/src/services/repositories/AssessmentRepository.js` (Firestore)
- `frontend/src/services/repositories/PresenceRepository.js` (RTDB)
- `frontend/src/services/repositories/LiveStateRepository.js` (RTDB)

## Startup routing
- Decision is made once, based on cached profile first, then network refresh.
- Profile Setup is only shown if we are sure profile is incomplete.
