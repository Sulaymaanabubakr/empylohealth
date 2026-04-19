# Native Dependency Audit And Cleanup Plan

Date: 2026-04-14

## Goal

Clean up the app's native packages properly so the Android build is stable, the app is easier to maintain, and we are not stuck living on fragile patches.

This plan is written in simple product terms:

- what stays
- what gets removed
- what gets replaced
- what gets upgraded
- what order we should do it in

## The Main Problem

The app has a few older packages mixed in with newer ones.

That creates three risks:

1. Android builds become unreliable
2. call and notification features become harder to trust
3. every future upgrade becomes more painful

So the right move is to clean the package list properly instead of stacking more fixes on top.

## Final Decisions

### Keep For Now

- `react-native-background-timer`

Why:

- the app does not import it directly
- but Daily does depend on it
- Daily's shipped runtime code imports it
- removing it now could break huddles or call behavior

Decision:

- do not remove it right now
- only revisit this if:
  - Daily removes the dependency in a newer version, or
  - we move away from Daily entirely

### Replace

- `react-native-callkeep`

Why:

- it is the package behind the current incoming huddle call behavior
- but it keeps pulling the app toward a heavy phone-style setup
- for Circles, we do not need the app to behave like a real phone network
- we just need a strong app call experience:
  - incoming huddle screen
  - ringtone
  - accept / decline
  - good behavior when the app is minimized

Decision:

- replace `react-native-callkeep`
- move to a simpler app-call style solution instead of a phone-call style solution

Replacement direction:

- use a custom incoming call flow that feels more like WhatsApp or Telegram
- keep iOS VoIP push support where needed
- use app-controlled incoming huddle UI instead of leaning on phone-style behavior

### Upgrade

- `react-native-iap`

Current:

- `14.7.17`

Target:

- `15.x`

Why:

- it is actively used
- it is important for subscriptions and boosts
- it has a newer maintained version available

Decision:

- upgrade it

### Keep

These are actively used and should stay:

- `@daily-co/react-native-daily-js`
- `@daily-co/react-native-webrtc`
- `@react-native-async-storage/async-storage`
- `@react-native-community/datetimepicker`
- `@react-native-community/slider`
- `@react-native-google-signin/google-signin`
- `react-native-gesture-handler`
- `react-native-safe-area-context`
- `react-native-screens`
- `react-native-svg`
- `react-native-reanimated`
- `react-native-worklets`
- `react-native-nitro-modules`
- `expo-notifications`
- `expo-task-manager`
- `react-native-voip-push-notification`

## What This Means In Practice

We are not going to:

- keep fighting old call packages forever
- keep unused packages around
- leave billing on an older version if a cleaner supported upgrade exists

We are going to:

1. remove what we do not need
2. replace what no longer fits the product well
3. upgrade what is worth keeping

## Architecture Decision

For now, Android should stay on the safer build path until this cleanup is complete.

That means:

- finish dependency cleanup first
- then test turning the newer Android mode back on later

This is not giving up.
This is cleaning the house first before adding more pressure.

## Cleanup Plan

### Phase 1: Remove True Dead Weight

- keep `react-native-background-timer` for now because Daily depends on it
- remove only packages that are truly unused and not required by another package
- remove the `react-native-background-timer` patch only if:
  - a better Daily-compatible path is found, or
  - the package is no longer required

Success looks like:

- we do not remove something that huddles still need
- we only remove what is truly safe to remove

### Phase 2: Replace Call Handling

- remove `react-native-callkeep`
- replace the incoming huddle flow with an app-controlled call experience
- keep the user experience focused on:
  - heads-up incoming call
  - ringtone
  - accept / decline
  - reliable minimized-app behavior

Success looks like:

- the app behaves like a modern chat app call
- less fragile Android setup
- easier long-term maintenance

### Phase 3: Upgrade Billing

- upgrade `react-native-iap` to `15.x`
- update any billing code that needs adjustment
- retest subscriptions, boosts, restore, and purchase flow

Success looks like:

- billing stays current
- less upgrade pressure later

### Phase 4: Recheck Android Build Mode

Only after the cleanup above:

- test the newer Android mode again in a separate pass
- keep it only if the build is clean and the app remains stable

Success looks like:

- stable build
- stable huddles
- stable notifications
- stable purchases

## Recommended Order

This is the order we should do the work:

1. replace `react-native-callkeep`
2. upgrade `react-native-iap`
3. keep `react-native-background-timer` unless Daily gives us a better path
4. rebuild and retest Android
5. revisit the newer Android mode later

## Final Recommendation

The clean long-term answer is:

- replace `react-native-callkeep`
- upgrade `react-native-iap`
- keep `react-native-background-timer` for now because Daily still needs it

That gives us the best chance of ending up with:

- a cleaner Android build
- a better incoming huddle experience
- fewer future dependency problems

## Working Decision

We will treat these as the working cleanup decisions:

- `react-native-background-timer`: keep for now because Daily depends on it
- `react-native-callkeep`: replace
- `react-native-iap`: upgrade

Everything else should follow from that.
