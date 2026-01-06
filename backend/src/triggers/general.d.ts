import * as functions from 'firebase-functions/v1';
/**
 * Trigger: Auth User OnCreate
 * Goal: Create a User Profile in Firestore when a new Auth user is created.
 */
export declare const onUserCreate: functions.CloudFunction<import("firebase-admin/auth").UserRecord>;
/**
 * Trigger: Firestore Message OnCreate
 * Goal: Send Push Notification to chat participants when a new message arrives.
 */
export declare const onMessageCreate: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
//# sourceMappingURL=general.d.ts.map