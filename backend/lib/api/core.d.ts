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
/**
 * Create a new Circle
 * Callable Function: 'createCircle'
 */
export declare const createCircle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Update Circle Details (Creator/Admin Only)
 * Callable Function: 'updateCircle'
 */
export declare const updateCircle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Join an existing Circle
 * Callable Function: 'joinCircle'
 */
/**
 * Join an existing Circle
 * Callable Function: 'joinCircle'
 */
export declare const joinCircle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Leave an existing Circle
 * Callable Function: 'leaveCircle'
 */
/**
 * Leave an existing Circle
 * Callable Function: 'leaveCircle'
 */
export declare const leaveCircle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Manage Member (Promote/Demote/Kick/Ban)
 * Callable Function: 'manageMember'
 */
export declare const manageMember: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Handle Join Request (Accept/Reject)
 * Callable Function: 'handleJoinRequest'
 */
export declare const handleJoinRequest: functions.HttpsFunction & functions.Runnable<any>;
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
export declare const seedAssessmentQuestions: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Fix Assessment Question Text (Admin Utility)
 * Callable Function: 'fixAssessmentQuestionsText'
 */
export declare const fixAssessmentQuestionsText: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Seed Challenges (Admin Utility)
 * Callable Function: 'seedChallenges'
 */
export declare const seedChallenges: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Seed Resources (Admin Utility)
 * Callable Function: 'seedResources'
 */
export declare const seedResources: functions.HttpsFunction & functions.Runnable<any>;
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
 * Get Recommended Content
 * Callable Function: 'getRecommendedContent'
 */
export declare const getRecommendedContent: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Update Subscription Plan
 * Callable Function: 'updateSubscription'
 */
export declare const updateSubscription: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Start a Huddle (Video Call Session)
 * Callable Function: 'startHuddle'
 */
/**
 * Start a Huddle (Video Call Session)
 * Callable Function: 'startHuddle'
 */
export declare const startHuddle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Join an existing huddle and mint participant token
 * Callable Function: 'joinHuddle'
 */
export declare const joinHuddle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Decline an incoming huddle.
 * Callable Function: 'declineHuddle'
 *
 * - For p2p: ends the huddle for everyone with endedReason=declined
 * - For group: records the decline and only ends if nobody else can accept anymore
 */
export declare const declineHuddle: functions.HttpsFunction & functions.Runnable<any>;
export declare const updateHuddleConnection: functions.HttpsFunction & functions.Runnable<any>;
/**
 * End/leave huddle (any participant)
 * - If the caller is the host OR is the last participant: ends the huddle for everyone
 * - Otherwise: removes the caller from the huddle (like a leave)
 * - Idempotent: if huddle is already ended, returns success
 * Callable Function: 'endHuddle'
 */
export declare const endHuddle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Re-ring a Huddle while still waiting for participants
 * Callable Function: 'ringHuddleParticipants'
 */
export declare const ringHuddleParticipants: functions.HttpsFunction & functions.Runnable<any>;
export declare const ringPendingHuddles: functions.CloudFunction<unknown>;
/**
 * Join/Leave Huddle
 * Callable Function: 'updateHuddleState'
 */
export declare const updateHuddleState: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Scheduled cleanup: auto-end huddles stuck in ringing/accepted too long.
 * - ringing: end as timeout after 45s
 * - accepted (but not ongoing): end as failed_to_connect after 30s
 */
export declare const cleanupStaleHuddles: functions.CloudFunction<unknown>;
/**
 * Schedule a Huddle
 * Callable Function: 'scheduleHuddle'
 */
export declare const scheduleHuddle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Delete a Scheduled Huddle
 * Callable Function: 'deleteScheduledHuddle'
 */
export declare const deleteScheduledHuddle: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Submit a Report (Circle Context)
 */
export declare const submitReport: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Resolve Circle Report (Admin/Mod Only)
 * Callable Function: 'resolveCircleReport'
 */
export declare const resolveCircleReport: functions.HttpsFunction & functions.Runnable<any>;
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
export declare const seedAffirmations: functions.HttpsFunction & functions.Runnable<any>;
export declare const backfillAffirmationImages: functions.HttpsFunction;
export declare const seedAll: functions.HttpsFunction;
export declare const getSeedStatus: functions.HttpsFunction;
export declare const sendAffirmationsMorning: functions.CloudFunction<unknown>;
export declare const sendAffirmationsAfternoon: functions.CloudFunction<unknown>;
export declare const sendAffirmationsEvening: functions.CloudFunction<unknown>;
export declare const submitContactForm: functions.HttpsFunction;
export declare const deleteUserAccount: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=core.d.ts.map