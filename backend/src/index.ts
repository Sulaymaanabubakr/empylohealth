import * as admin from 'firebase-admin';

// Initialize Admin SDK once at entry point
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Import from consolidated files
import * as generalTriggers from './triggers/general';
import * as coreApi from './api/core';

// Export functions
// Triggers
export const onUserCreate = generalTriggers.onUserCreate;
export const onMessageCreate = generalTriggers.onMessageCreate;

// Core API (Media, Circles, Chat, Assessments, Subscription)
export const generateUploadSignature = coreApi.generateUploadSignature;
export const createCircle = coreApi.createCircle;
export const joinCircle = coreApi.joinCircle;
export const leaveCircle = coreApi.leaveCircle;
export const createDirectChat = coreApi.createDirectChat;
export const sendMessage = coreApi.sendMessage;
export const submitAssessment = coreApi.submitAssessment;
export const getUserStats = coreApi.getUserStats;
export const getKeyChallenges = coreApi.getKeyChallenges;
export const updateSubscription = coreApi.updateSubscription;
export const startHuddle = coreApi.startHuddle;
export const updateHuddleState = coreApi.updateHuddleState;
export const getExploreContent = coreApi.getExploreContent;
export const getAffirmations = coreApi.getAffirmations;
export const submitContactForm = coreApi.submitContactForm;

export const deleteUserAccount = coreApi.deleteUserAccount;
