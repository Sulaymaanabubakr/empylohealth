# Circles RevenueCat Setup

## App IDs

- iOS bundle id: `com.empylo.circlesapp`
- Android package name: `com.empylo.circlesapp`

## Current Product IDs

### iOS subscriptions

- `circles.pro.monthly.ios`
- `circles.pro.annual.ios`
- `circles.premium.monthly.ios`
- `circles.premium.annual.ios`

### Android subscriptions

- `circles.pro.monthly.android`
- `circles.pro.annual.android`
- `circles.premium.monthly.android`
- `circles.premium.annual.android`

## Prices To Use

- Pro monthly: `GBP 9.99`
- Pro annual: `GBP 99.99`
- Premium monthly: `GBP 24.99`
- Premium annual: `GBP 249.99`

### Boosts

Leave boosts out of RevenueCat for now.

## RevenueCat Names To Use

### Entitlements

- `Pro`
- `Premium`

### Offering

- `default`

### Packages

- `pro_monthly`
- `pro_annual`
- `premium_monthly`
- `premium_annual`

## Step 1: App Store Connect

Make sure:

- the app exists
- Paid Applications agreement is accepted
- banking is set
- tax is set

Create one subscription group:

- `Circles Membership`

Create these subscriptions:

- `circles.pro.monthly.ios`
- `circles.pro.annual.ios`
- `circles.premium.monthly.ios`
- `circles.premium.annual.ios`

Use these names in App Store Connect:

### Subscription group name

- `Circles Membership`

### Reference names

- `Circles Pro Monthly`
- `Circles Pro Annual`
- `Circles Premium Monthly`
- `Circles Premium Annual`

### Display names

- `Circles Pro`
- `Circles Pro`
- `Circles Premium`
- `Circles Premium`

### App Store localization descriptions

Use this copy in the App Store subscription localization fields.

#### Circles Pro Monthly

- Display name: `Circles Pro`
- Description: `Premium activities, support, and more huddle time.`

#### Circles Pro Annual

- Display name: `Circles Pro`
- Description: `Premium activities, support, and more huddle time.`

#### Circles Premium Monthly

- Display name: `Circles Premium`
- Description: `More support, more features, and higher limits.`

#### Circles Premium Annual

- Display name: `Circles Premium`
- Description: `More support, more features, and higher limits.`

### Product ID mapping

- `Circles Pro Monthly` -> `circles.pro.monthly.ios`
- `Circles Pro Annual` -> `circles.pro.annual.ios`
- `Circles Premium Monthly` -> `circles.premium.monthly.ios`
- `Circles Premium Annual` -> `circles.premium.annual.ios`

### Prices

- `Circles Pro Monthly` -> `GBP 9.99`
- `Circles Pro Annual` -> `GBP 99.99`
- `Circles Premium Monthly` -> `GBP 24.99`
- `Circles Premium Annual` -> `GBP 249.99`

Set the levels so:

- `Premium` is above `Pro`

Create sandbox testers too.

## Step 2: Google Play Console

Make sure:

- the app exists
- a signed build has been uploaded
- a test track exists
- testers have been added

Create these subscriptions:

- `circles.pro.monthly.android`
- `circles.pro.annual.android`
- `circles.premium.monthly.android`
- `circles.premium.annual.android`

Do not move boosts yet.

## Step 3: RevenueCat Project

Create one project:

- `Circles Health App`

Add two apps:

1. Apple app
- bundle id: `com.empylo.circlesapp`

2. Google Play app
- package name: `com.empylo.circlesapp`

## Step 4: Apple Credentials In RevenueCat

RevenueCat needs two different Apple keys.

### In-App Purchase Key

This is the file named like:

- `SubscriptionKey_XXXXXXXXXX.p8`

Get it from:

- App Store Connect
- Users and Access
- Integrations
- In-App Purchase

RevenueCat also needs:

- Key ID
- Issuer ID

### App Store Connect API Key

This is the file named like:

- `AuthKey_XXXXXXXXXX.p8`

Get it from:

- App Store Connect
- Users and Access
- Integrations
- App Store Connect API

Use this for product import/pricing sync.

## Step 5: Google Credentials In RevenueCat

RevenueCat wants a Google Cloud service account JSON key.

It is:

- a `.json` file
- from a Google Cloud service account
- that same service account must also be added in Google Play Console

Recommended service account purpose:

- RevenueCat Play access

Upload that JSON file in the RevenueCat Android app config.

## Step 6: Import Products

Do not manually create real products in RevenueCat unless import fails.

In RevenueCat:

1. open `Product catalog`
2. open `Products`
3. import products from Apple
4. import products from Google

You should end up with these 8 subscription products:

- `circles.pro.monthly.ios`
- `circles.pro.annual.ios`
- `circles.premium.monthly.ios`
- `circles.premium.annual.ios`
- `circles.pro.monthly.android`
- `circles.pro.annual.android`
- `circles.premium.monthly.android`
- `circles.premium.annual.android`

## Step 7: Create Entitlements

In RevenueCat:

1. open `Product catalog`
2. open `Entitlements`
3. click `+ New`

Create:

### Entitlement 1

- Identifier: `Pro`
- Description: `Circles Pro access`

### Entitlement 2

- Identifier: `Premium`
- Description: `Circles Premium access`

## Step 8: Attach Products To Entitlements

### Attach to `Pro`

- `circles.pro.monthly.ios`
- `circles.pro.annual.ios`
- `circles.pro.monthly.android`
- `circles.pro.annual.android`

### Attach to `Premium`

- `circles.premium.monthly.ios`
- `circles.premium.annual.ios`
- `circles.premium.monthly.android`
- `circles.premium.annual.android`

In RevenueCat:

1. open `Product catalog`
2. open `Entitlements`
3. click the entitlement
4. click `Attach`
5. select the products
6. save

## Step 9: Create Offering

In RevenueCat:

1. open `Product catalog`
2. open `Offerings`
3. click `+ New`

Type:

- Identifier: `default`
- Description: `Main Circles subscriptions`

Save it.

## Step 10: Create Packages

Open the `default` offering.

Click `+ Add package` and create these:

### Package 1

- Identifier: `pro_monthly`
- Description: `Circles Pro monthly`

Attach:

- iOS: `circles.pro.monthly.ios`
- Android: `circles.pro.monthly.android`

### Package 2

- Identifier: `pro_annual`
- Description: `Circles Pro annual`

Attach:

- iOS: `circles.pro.annual.ios`
- Android: `circles.pro.annual.android`

### Package 3

- Identifier: `premium_monthly`
- Description: `Circles Premium monthly`

Attach:

- iOS: `circles.premium.monthly.ios`
- Android: `circles.premium.monthly.android`

### Package 4

- Identifier: `premium_annual`
- Description: `Circles Premium annual`

Attach:

- iOS: `circles.premium.annual.ios`
- Android: `circles.premium.annual.android`

Then mark `default` as the default offering.

## Step 11: Paywall

You do not need a RevenueCat paywall unless you want RevenueCat to render the subscription screen UI.

For Circles, recommended:

- keep the custom Circles subscription screen
- use RevenueCat only for billing logic

So:

- paywall is optional

## Step 12: Customer Center

Recommended:

- enable Customer Center

Use it for:

- restore
- manage subscription
- store management links

## Step 13: Env Keys

Saved in:

- [frontend/.env](/Users/sulaymaanabubakr/Desktop/Empylo/frontend/.env)

Current values:

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_SESpOJZqGwqhOjKQcmtaKvISe1m`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_kTXaYZlZuhuUmPQXSmBgGHuXvoM`

## Step 14: App Integration Plan

Install:

```bash
npm install --save react-native-purchases react-native-purchases-ui
```

Then:

1. configure RevenueCat on app boot
2. use the Circles user id as the RevenueCat app user id
3. fetch offerings
4. show the `default` offering in the subscription screen
5. buy one of these packages:
   - `pro_monthly`
   - `pro_annual`
   - `premium_monthly`
   - `premium_annual`
6. check entitlements:
   - `Pro`
   - `Premium`

## Step 15: Backend Plan

Recommended:

- RevenueCat handles purchase state
- Supabase remains the source of truth for app usage and gating

So add a RevenueCat webhook later to sync:

- `user_entitlements`
- billing period state
- subscription analytics

## Quick Checklist

```txt
APPLE
[ ] App exists
[ ] Agreements/banking/tax complete
[ ] Subscription group created
[ ] 4 iOS subscription products created
[ ] Sandbox tester created
[ ] In-App Purchase key added to RevenueCat
[ ] App Store Connect API key added to RevenueCat

GOOGLE
[ ] App exists
[ ] Signed build uploaded
[ ] Test track created
[ ] Testers added
[ ] 4 Android subscription products created
[ ] Google service account JSON created
[ ] Service account added to Play Console
[ ] JSON uploaded to RevenueCat

REVENUECAT
[ ] Apple app added
[ ] Google app added
[ ] Products imported
[ ] Entitlement Pro created
[ ] Entitlement Premium created
[ ] Products attached to entitlements
[ ] Offering default created
[ ] Package pro_monthly created
[ ] Package pro_annual created
[ ] Package premium_monthly created
[ ] Package premium_annual created
[ ] Default offering set
[ ] Customer Center enabled

APP
[ ] RevenueCat SDK installed
[ ] RevenueCat configured on app boot
[ ] Custom subscription screen uses RevenueCat offerings
[ ] Entitlement checks wired up
```
