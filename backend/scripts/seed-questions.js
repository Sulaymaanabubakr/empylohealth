require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Read from .env
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT not found in .env');
    console.log('💡 Alternative: Run this command first:');
    console.log('   gcloud auth application-default login');
    process.exit(1);
}

// Initialize with service account from .env (if available)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: 'circles-app-by-empylo'
});

const db = getFirestore(app);

const questions = [
    { text: "I've been feeling relaxed", type: "scale", category: "General", tags: ["Stress"], weight: 1, order: 1, isActive: true },
    { text: "I've been feeling useful", type: "scale", category: "General", tags: ["Motivation"], weight: 1, order: 2, isActive: true },
    { text: "I've been had energy to spare", type: "scale", category: "General", tags: ["Energy"], weight: 1, order: 3, isActive: true },
    { text: "I've been feeling interested in other people", type: "scale", category: "General", tags: ["Social Connection"], weight: 1, order: 4, isActive: true },
    { text: "I've been thinking clearly", type: "scale", category: "General", tags: ["Focus"], weight: 1, order: 5, isActive: true }
];

async function seed() {
    try {
        console.log('🔄 Connecting to Firestore...');
        const collectionRef = db.collection('assessment_questions');

        // Check if already seeded
        console.log('🔍 Checking for existing questions...');
        const existing = await collectionRef.get();
        if (!existing.empty) {
            console.log(`✅ Questions already exist (found ${existing.size}). Nothing to do!`);
            process.exit(0);
        }

        // Seed questions
        console.log(`📝 Seeding ${questions.length} questions...`);
        const batch = db.batch();
        questions.forEach(q => {
            const docRef = collectionRef.doc();
            batch.set(docRef, {
                ...q,
                createdAt: FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log(`✅ Successfully seeded ${questions.length} questions to Firestore!`);
        console.log('');
        console.log('🎉 Done! Refresh your Admin Dashboard to see the questions.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        console.error('');
        console.error('💡 Make sure FIREBASE_SERVICE_ACCOUNT is set in backend/.env');
        console.error('   or run: gcloud auth application-default login');
        process.exit(1);
    }
}

seed();
