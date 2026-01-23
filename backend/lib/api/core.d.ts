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
/**
 * Seed Assessment Questions (Admin Utility)
 * Callable Function: 'seedAssessmentQuestions'
 */
export declare const seedAssessmentQuestions: functions.HttpsFunction & functions.Runnable<any>;
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
 * Join/Leave Huddle
 * Callable Function: 'updateHuddleState'
 */
export declare const updateHuddleState: functions.HttpsFunction & functions.Runnable<any>;
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
export declare const submitContactForm: functions.HttpsFunction;
export declare const deleteUserAccount: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Dashboard Stats
 */
export declare const getDashboardStats: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get All Content (Admin)
 * data: { type: 'circles'|'resources'|'affirmations', limit: number }
 */
export declare const getAllContent: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Update Content Status
 * data: { collection: string, docId: string, status: string }
 */
export declare const updateContentStatus: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Delete Item (Admin)
 * data: { collection: string, id: string }
 */
export declare const deleteItem: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Admin Affirmations
 */
export declare const getAdminAffirmations: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Create Affirmation
 */
export declare const createAffirmation: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Delete Affirmation
 */
export declare const deleteAffirmation: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Transactions
 * (Currently mocks data or fetches from a future 'transactions' collection)
 */
export declare const getTransactions: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get All Users (Admin)
 */
export declare const getAllUsers: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Create Employee (Admin)
 */
export declare const createEmployee: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Toggle User Status
 */
export declare const toggleUserStatus: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=core.d.ts.map