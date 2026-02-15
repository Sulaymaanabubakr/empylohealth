import { auth, db } from '../firebaseConfig';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export const subscriptionService = {
    updateSubscription: async (planId, status = 'active') => {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('User must be authenticated.');

        await setDoc(
            doc(db, 'users', uid),
            {
                subscription: {
                    planId,
                    status,
                    updatedAt: serverTimestamp()
                },
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        return { success: true };
    }
};
