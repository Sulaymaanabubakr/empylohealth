import * as admin from 'firebase-admin';

// Initialize Firebase Admin
// Assuming default credentials are available in the environment
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const questions = [
    {
        text: "I've been feeling relaxed",
        type: "scale",
        category: "General",
        tags: ["Stress"],
        weight: 1,
        order: 1,
        isActive: true
    },
    {
        text: "I've been feeling useful",
        type: "scale",
        category: "General",
        tags: ["Motivation"],
        weight: 1,
        order: 2,
        isActive: true
    },
    {
        text: "I've had energy to spare",
        type: "scale",
        category: "General",
        tags: ["Energy"],
        weight: 1,
        order: 3,
        isActive: true
    },
    {
        text: "I've been feeling interested in other people",
        type: "scale",
        category: "General",
        tags: ["Social Connection"],
        weight: 1,
        order: 4,
        isActive: true
    },
    {
        text: "I've been thinking clearly",
        type: "scale",
        category: "General",
        tags: ["Focus"],
        weight: 1,
        order: 5,
        isActive: true
    }
];

async function seed() {
    console.log("Starting seed...");
    try {
        const batch = db.batch();
        const collectionRef = db.collection('assessment_questions');

        // Optional: clear existing? No, just add for now.
        // Actually, let's check if they exist to avoid duplicates if run twice.
        // For simplicity in this task, we will just add them.

        for (const q of questions) {
            const docRef = collectionRef.doc();
            batch.set(docRef, q);
            console.log(`Prepared: ${q.text}`);
        }

        await batch.commit();
        console.log("Seed completed successfully.");
    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    }
}

seed();
