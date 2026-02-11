"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReport = exports.getReports = exports.getTransactions = exports.deleteAffirmation = exports.createAffirmation = exports.getAdminAffirmations = exports.deleteItem = exports.toggleUserStatus = exports.updateContentStatus = exports.getAllContent = exports.getPendingContent = exports.getAllUsers = exports.getDashboardStats = exports.deleteUserAccount = exports.sendAffirmationsEvening = exports.sendAffirmationsAfternoon = exports.sendAffirmationsMorning = exports.submitContactForm = exports.getAffirmations = exports.getRecommendedContent = exports.getExploreContent = exports.updateSubscription = exports.getSeedStatus = exports.seedAll = exports.backfillAffirmationImages = exports.seedAffirmations = exports.fixAssessmentQuestionsText = exports.seedAssessmentQuestions = exports.seedResources = exports.seedChallenges = exports.getKeyChallenges = exports.getUserStats = exports.submitAssessment = exports.sendMessage = exports.createDirectChat = exports.deleteScheduledHuddle = exports.scheduleHuddle = exports.updateHuddleState = exports.startHuddle = exports.submitReport = exports.resolveCircleReport = exports.handleJoinRequest = exports.manageMember = exports.leaveCircle = exports.updateCircle = exports.joinCircle = exports.createCircle = exports.generateUploadSignature = exports.onMessageCreate = exports.onUserCreate = void 0;
exports.createEmployee = exports.backfillUserCircles = exports.updateTicketStatus = exports.getSupportTickets = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Admin SDK once at entry point
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Import from consolidated files
const generalTriggers = __importStar(require("./triggers/general"));
const coreApi = __importStar(require("./api/core"));
const adminApi = __importStar(require("./api/admin"));
const userMgmtApi = __importStar(require("./api/usermanagement"));
// Export functions
// Triggers
exports.onUserCreate = generalTriggers.onUserCreate;
exports.onMessageCreate = generalTriggers.onMessageCreate;
// Core API (Media, Circles, Chat, Assessments, Subscription)
exports.generateUploadSignature = coreApi.generateUploadSignature;
exports.createCircle = coreApi.createCircle;
exports.joinCircle = coreApi.joinCircle;
exports.updateCircle = coreApi.updateCircle;
exports.leaveCircle = coreApi.leaveCircle;
exports.manageMember = coreApi.manageMember;
exports.handleJoinRequest = coreApi.handleJoinRequest;
exports.resolveCircleReport = coreApi.resolveCircleReport;
exports.submitReport = coreApi.submitReport;
exports.startHuddle = coreApi.startHuddle;
exports.updateHuddleState = coreApi.updateHuddleState;
exports.scheduleHuddle = coreApi.scheduleHuddle;
exports.deleteScheduledHuddle = coreApi.deleteScheduledHuddle;
exports.createDirectChat = coreApi.createDirectChat;
exports.sendMessage = coreApi.sendMessage;
exports.submitAssessment = coreApi.submitAssessment;
exports.getUserStats = coreApi.getUserStats;
exports.getKeyChallenges = coreApi.getKeyChallenges;
exports.seedChallenges = coreApi.seedChallenges;
exports.seedResources = coreApi.seedResources;
exports.seedAssessmentQuestions = coreApi.seedAssessmentQuestions;
exports.fixAssessmentQuestionsText = coreApi.fixAssessmentQuestionsText;
exports.seedAffirmations = coreApi.seedAffirmations;
exports.backfillAffirmationImages = coreApi.backfillAffirmationImages;
exports.seedAll = coreApi.seedAll;
exports.getSeedStatus = coreApi.getSeedStatus;
exports.updateSubscription = coreApi.updateSubscription;
exports.getExploreContent = coreApi.getExploreContent;
exports.getRecommendedContent = coreApi.getRecommendedContent;
exports.getAffirmations = coreApi.getAffirmations;
exports.submitContactForm = coreApi.submitContactForm;
exports.sendAffirmationsMorning = coreApi.sendAffirmationsMorning;
exports.sendAffirmationsAfternoon = coreApi.sendAffirmationsAfternoon;
exports.sendAffirmationsEvening = coreApi.sendAffirmationsEvening;
exports.deleteUserAccount = coreApi.deleteUserAccount;
// Admin API
exports.getDashboardStats = adminApi.getDashboardStats;
exports.getAllUsers = adminApi.getAllUsers;
exports.getPendingContent = adminApi.getPendingContent;
exports.getAllContent = adminApi.getAllContent;
exports.updateContentStatus = adminApi.updateContentStatus;
exports.toggleUserStatus = adminApi.toggleUserStatus;
exports.deleteItem = adminApi.deleteItem;
exports.getAdminAffirmations = adminApi.getAdminAffirmations;
exports.createAffirmation = adminApi.createAffirmation;
exports.deleteAffirmation = adminApi.deleteAffirmation;
exports.getTransactions = adminApi.getTransactions;
exports.getReports = adminApi.getReports;
exports.resolveReport = adminApi.resolveReport;
exports.getSupportTickets = adminApi.getSupportTickets;
exports.updateTicketStatus = adminApi.updateTicketStatus;
exports.backfillUserCircles = adminApi.backfillUserCircles;
// User Management
exports.createEmployee = userMgmtApi.createEmployee;
//# sourceMappingURL=index.js.map