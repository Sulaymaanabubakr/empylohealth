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
exports.seedResources = exports.getExploreContent = exports.updateHuddleState = exports.startHuddle = exports.updateSubscription = exports.submitAssessment = exports.sendMessage = exports.createDirectChat = exports.joinCircle = exports.createCircle = exports.generateUploadSignature = exports.onMessageCreate = exports.onUserCreate = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Admin SDK once at entry point
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Import from consolidated files
const generalTriggers = __importStar(require("./triggers/general"));
const coreApi = __importStar(require("./api/core"));
// Export functions
// Triggers
exports.onUserCreate = generalTriggers.onUserCreate;
exports.onMessageCreate = generalTriggers.onMessageCreate;
// Core API (Media, Circles, Chat, Assessments, Subscription)
exports.generateUploadSignature = coreApi.generateUploadSignature;
exports.createCircle = coreApi.createCircle;
exports.joinCircle = coreApi.joinCircle;
exports.createDirectChat = coreApi.createDirectChat;
exports.sendMessage = coreApi.sendMessage;
exports.submitAssessment = coreApi.submitAssessment;
exports.updateSubscription = coreApi.updateSubscription;
exports.startHuddle = coreApi.startHuddle;
exports.updateHuddleState = coreApi.updateHuddleState;
exports.getExploreContent = coreApi.getExploreContent;
exports.seedResources = coreApi.seedResources;
//# sourceMappingURL=index.js.map