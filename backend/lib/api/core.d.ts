import * as functions from 'firebase-functions/v1';
/**
 * Generate a signature for client-side uploads.
 * Callable Function: 'generateUploadSignature'
 */
export declare const generateUploadSignature: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Create a new Circle
 * Callable Function: 'createCircle'
 */
export declare const createCircle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Join an existing Circle
 * Callable Function: 'joinCircle'
 */
export declare const joinCircle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Leave an existing Circle
 * Callable Function: 'leaveCircle'
 */
export declare const leaveCircle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Create or Get Direct Chat
 * Callable Function: 'createDirectChat'
 */
export declare const createDirectChat: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Send a Message
 * Callable Function: 'sendMessage'
 */
export declare const sendMessage: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Submit Daily Check-in / Assessment
 * Callable Function: 'submitAssessment'
 */
export declare const submitAssessment: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get User Wellbeing Stats
 * Callable Function: 'getUserStats'
 */
export declare const getUserStats: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Key Challenges
 * Callable Function: 'getKeyChallenges'
 */
export declare const getKeyChallenges: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Update Subscription Plan
 * Callable Function: 'updateSubscription'
 */
export declare const updateSubscription: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Start a Huddle (Video Call Session)
 * Callable Function: 'startHuddle'
 */
export declare const startHuddle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Join/Leave Huddle
 * Callable Function: 'updateHuddleState'
 */
export declare const updateHuddleState: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Explore Content
 * Callable Function: 'getExploreContent'
 * (Can initially just return curated lists, or complex querying)
 */
export declare const getExploreContent: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Daily Affirmations
 * Callable Function: 'getAffirmations'
 */
export declare const getAffirmations: functions.HttpsFunction & functions.Runnable<any>;
export declare const submitContactForm: functions.HttpsFunction;
export declare const deleteUserAccount: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=core.d.ts.map