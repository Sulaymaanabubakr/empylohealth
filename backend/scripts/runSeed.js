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
const admin = __importStar(require("firebase-admin"));
// Initialize Admin SDK
// We assume GOOGLE_APPLICATION_CREDENTIALS is set or we use default creds from `firebase login` 
// (locally this works if we use `firebase-admin` coupled with `firebase use`).
// Actually easier: use service account if available, or just rely on standard auth.
// For local script, allow it to fail if not auth.
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const seed = async () => {
    console.log("Seeding Resources...");
    const resources = [
        {
            title: 'Sleep hygiene',
            type: 'article',
            tag: 'LEARN',
            time: '12 Mins',
            status: 'published',
            category: 'Self-development',
            image: 'https://img.freepik.com/free-vector/sleep-analysis-concept-illustration_114360-6395.jpg',
            content: "Good sleep hygiene is typically defined as a set of behavioral and environmental recommendations..."
        },
        {
            title: 'Mindfulness for Beginners',
            type: 'video',
            tag: 'WATCH',
            time: '5 Mins',
            status: 'published',
            category: 'Wellness',
            image: 'https://img.freepik.com/free-vector/meditation-concept-illustration_114360-2212.jpg',
            mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            content: "A short video introducing mindfulness techniques."
        },
        {
            title: 'Stress Management 101',
            type: 'article',
            tag: 'LEARN',
            time: '8 Mins',
            status: 'published',
            category: 'Mental Health',
            image: 'https://img.freepik.com/free-vector/stress-concept-illustration_114360-2394.jpg',
            content: "Learn how to manage stress effectively with these simple tips."
        }
    ];
    const batch = db.batch();
    resources.forEach(res => {
        const ref = db.collection('resources').doc();
        batch.set(ref, res);
    });
    await batch.commit();
    console.log(`Successfully seeded ${resources.length} resources.`);
};
seed().catch(console.error);
//# sourceMappingURL=runSeed.js.map