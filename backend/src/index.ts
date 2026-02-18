import * as admin from 'firebase-admin';

// Initialize Admin SDK once at entry point
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Import from consolidated files
import * as generalTriggers from './triggers/general';
import * as coreApi from './api/core';
import * as adminApi from './api/admin';
import * as userMgmtApi from './api/usermanagement';

// Export functions
// Triggers
export const onUserCreate = generalTriggers.onUserCreate;
export const onMessageCreate = generalTriggers.onMessageCreate;

// Core API (Media, Circles, Chat, Assessments, Subscription)
export const generateUploadSignature = coreApi.generateUploadSignature;
export const createCircle = coreApi.createCircle;
export const joinCircle = coreApi.joinCircle;
export const updateCircle = coreApi.updateCircle;
export const leaveCircle = coreApi.leaveCircle;
export const deleteCircle = coreApi.deleteCircle;
export const manageMember = coreApi.manageMember;
export const handleJoinRequest = coreApi.handleJoinRequest;
export const resolveCircleReport = coreApi.resolveCircleReport;
export const submitReport = coreApi.submitReport;
export const startHuddle = coreApi.startHuddle;
export const joinHuddle = coreApi.joinHuddle;
export const declineHuddle = coreApi.declineHuddle;
export const endHuddle = coreApi.endHuddle;
export const ringHuddleParticipants = coreApi.ringHuddleParticipants;
export const ringPendingHuddles = coreApi.ringPendingHuddles;
export const updateHuddleState = coreApi.updateHuddleState;
export const updateHuddleConnection = coreApi.updateHuddleConnection;
export const cleanupStaleHuddles = coreApi.cleanupStaleHuddles;
export const scheduleHuddle = coreApi.scheduleHuddle;
export const deleteScheduledHuddle = coreApi.deleteScheduledHuddle;
export const toggleScheduledHuddleReminder = coreApi.toggleScheduledHuddleReminder;
export const processScheduledHuddles = coreApi.processScheduledHuddles;
export const createDirectChat = coreApi.createDirectChat;
export const blockUser = coreApi.blockUser;
export const unblockUser = coreApi.unblockUser;
export const getPublicProfile = coreApi.getPublicProfile;
export const sendMessage = coreApi.sendMessage;
export const deleteChat = coreApi.deleteChat;
export const submitAssessment = coreApi.submitAssessment;
export const getUserStats = coreApi.getUserStats;
export const getKeyChallenges = coreApi.getKeyChallenges;
export const seedChallenges = coreApi.seedChallenges;
export const seedResources = coreApi.seedResources;
export const seedAssessmentQuestions = coreApi.seedAssessmentQuestions;
export const fixAssessmentQuestionsText = coreApi.fixAssessmentQuestionsText;
export const seedAffirmations = coreApi.seedAffirmations;
export const backfillAffirmationImages = coreApi.backfillAffirmationImages;
export const seedAll = coreApi.seedAll;
export const getSeedStatus = coreApi.getSeedStatus;
export const updateSubscription = coreApi.updateSubscription;

export const getExploreContent = coreApi.getExploreContent;
export const getRecommendedContent = coreApi.getRecommendedContent;
export const getAffirmations = coreApi.getAffirmations;
export const submitContactForm = coreApi.submitContactForm;
export const sendAffirmationsMorning = coreApi.sendAffirmationsMorning;
export const sendAffirmationsAfternoon = coreApi.sendAffirmationsAfternoon;
export const sendAffirmationsEvening = coreApi.sendAffirmationsEvening;

export const deleteUserAccount = coreApi.deleteUserAccount;

// Admin API
export const getDashboardStats = adminApi.getDashboardStats;
export const getAllUsers = adminApi.getAllUsers;
export const getPendingContent = adminApi.getPendingContent;
export const getAllContent = adminApi.getAllContent;
export const updateContentStatus = adminApi.updateContentStatus;
export const updateContentItem = adminApi.updateContentItem;
export const toggleUserStatus = adminApi.toggleUserStatus;
export const deleteItem = adminApi.deleteItem;
export const getAdminAffirmations = adminApi.getAdminAffirmations;
export const createAffirmation = adminApi.createAffirmation;
export const deleteAffirmation = adminApi.deleteAffirmation;
export const getTransactions = adminApi.getTransactions;
export const getReports = adminApi.getReports;
export const resolveReport = adminApi.resolveReport;
export const getSupportTickets = adminApi.getSupportTickets;
export const updateTicketStatus = adminApi.updateTicketStatus;
export const backfillUserCircles = adminApi.backfillUserCircles;

// User Management
export const createEmployee = userMgmtApi.createEmployee;
