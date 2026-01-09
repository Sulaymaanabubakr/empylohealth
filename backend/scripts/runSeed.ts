
import * as admin from 'firebase-admin';

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

    const circles = [
        {
            name: 'Community Connect',
            description: 'A community dedicated to connecting people from diverse backgrounds.',
            category: 'Culture',
            tags: ['Connect', 'Culture'],
            image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=640&q=80',
            activityLevel: 'High'
        },
        {
            name: 'Mindful Moments',
            description: 'Practice mindfulness and meditation techniques to reduce stress.',
            category: 'Mental health',
            tags: ['Mental health'],
            image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=640&q=80',
            activityLevel: 'Medium'
        }
    ];

    const batch = db.batch();
    resources.forEach(res => {
        const ref = db.collection('resources').doc();
        batch.set(ref, res);
    });

    circles.forEach(circle => {
        const ref = db.collection('circles').doc();
        batch.set(ref, {
            id: ref.id,
            name: circle.name,
            description: circle.description,
            category: circle.category,
            tags: circle.tags,
            image: circle.image,
            members: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            score: 75,
            activityLevel: circle.activityLevel
        });
    });

    await batch.commit();
    console.log(`Successfully seeded ${resources.length} resources and ${circles.length} circles.`);
};

seed().catch(console.error);
