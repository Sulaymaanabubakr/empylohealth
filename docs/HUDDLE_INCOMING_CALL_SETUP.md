# Incoming Huddles

The app now uses an app-controlled incoming huddle flow.

What this means:

- no `react-native-callkeep`
- no phone-account setup
- Daily still powers the actual huddle session
- push notifications open the app's own incoming huddle experience

Current flow:

1. `HUDDLE_STARTED` push arrives
2. the app deduplicates by `huddleId`
3. foreground users see `IncomingHuddleScreen`
4. background and closed-app users get the push notification with `Accept` / `Reject`
5. missed huddles are tracked by the backend after 60 seconds

Missed huddles:

- are stored in `missed_huddles`
- appear in notifications
- appear in the chat area under `Missed Huddles`
- can only join the original huddle if it is still active

Important:

- no callback / retry flow exists
- no new huddle is created from a missed huddle item
- Android stays on the safer build mode for now
