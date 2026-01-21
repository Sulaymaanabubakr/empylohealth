import * as functions from 'firebase-functions/v1';
/**
 * Get Dashboard Stats
 */
export declare const getDashboardStats: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get All Users (Paginated)
 */
export declare const getAllUsers: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Pending Circles/Content
 */
export declare const getPendingContent: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get All Content (Circles/Resources)
 */
export declare const getAllContent: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Approve or Reject Content
 */
export declare const updateContentStatus: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Suspend/Activate User
 */
export declare const toggleUserStatus: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Delete Item (User, Circle, Resource)
 */
export declare const deleteItem: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Admin Affirmations
 */
export declare const getAdminAffirmations: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Create Admin Affirmation
 */
export declare const createAffirmation: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Delete Admin Affirmation
 */
export declare const deleteAffirmation: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Transactions (Admin)
 */
export declare const getTransactions: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Reports (Moderation)
 */
export declare const getReports: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Resolve Report
 */
export declare const resolveReport: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Get Support Tickets
 */
export declare const getSupportTickets: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Update Ticket Status
 */
export declare const updateTicketStatus: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=admin.d.ts.map