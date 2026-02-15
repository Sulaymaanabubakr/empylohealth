import { auth, db } from '../firebaseConfig';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'firebase/firestore';

const circlesRef = collection(db, 'circles');

const canModerate = (role) => ['creator', 'admin', 'moderator'].includes(role);

export const circleRepository = {
    async createCircle({ name, description, category, type, image, visibility }) {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('User must be authenticated.');
        if (!name?.trim()) throw new Error('Circle name is required.');

        const circleDoc = await addDoc(circlesRef, {
            name: name.trim(),
            description: description || '',
            category: category || 'General',
            type: type || 'public',
            visibility: visibility || 'visible',
            image: image || null,
            photoURL: image || null,
            createdBy: uid,
            adminId: uid,
            members: [uid],
            membersCount: 1,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        await Promise.all([
            setDoc(doc(db, 'circles', circleDoc.id, 'members', uid), {
                uid,
                role: 'creator',
                status: 'active',
                joinedAt: serverTimestamp()
            }),
            setDoc(
                doc(db, 'userCircles', uid),
                {
                    circleIds: arrayUnion(circleDoc.id),
                    updatedAt: serverTimestamp()
                },
                { merge: true }
            )
        ]);

        return { success: true, circleId: circleDoc.id, status: 'active' };
    },

    async updateCircle(circleId, data) {
        const uid = auth.currentUser?.uid;
        if (!uid || !circleId) throw new Error('Invalid request.');

        const memberSnap = await getDoc(doc(db, 'circles', circleId, 'members', uid));
        const role = memberSnap.data()?.role;
        if (!canModerate(role)) {
            throw new Error('Only admins/moderators can update this circle.');
        }

        const allowedUpdates = {
            name: data.name,
            description: data.description,
            category: data.category,
            type: data.type,
            image: data.image,
            photoURL: data.photoURL,
            visibility: data.visibility
        };

        Object.keys(allowedUpdates).forEach((key) => {
            if (allowedUpdates[key] === undefined) {
                delete allowedUpdates[key];
            }
        });

        await updateDoc(doc(db, 'circles', circleId), {
            ...allowedUpdates,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    },

    async joinCircle(circleId) {
        const uid = auth.currentUser?.uid;
        if (!uid || !circleId) throw new Error('Invalid request.');

        const circleRef = doc(db, 'circles', circleId);
        const memberRef = doc(db, 'circles', circleId, 'members', uid);
        const requestRef = doc(db, 'circles', circleId, 'requests', uid);
        const userCirclesRef = doc(db, 'userCircles', uid);

        const circleSnap = await getDoc(circleRef);
        if (!circleSnap.exists()) {
            throw new Error('Circle not found.');
        }

        const circle = circleSnap.data();
        const isPrivate = circle.type === 'private';

        if (isPrivate) {
            await setDoc(requestRef, {
                uid,
                status: 'pending',
                createdAt: serverTimestamp()
            }, { merge: true });
            return { success: true, status: 'pending', message: 'Request submitted for approval.' };
        }

        await runTransaction(db, async (transaction) => {
            const memberSnapTxn = await transaction.get(memberRef);
            if (memberSnapTxn.exists() && memberSnapTxn.data()?.status === 'active') {
                return;
            }

            transaction.set(memberRef, {
                uid,
                role: 'member',
                status: 'active',
                joinedAt: serverTimestamp()
            }, { merge: true });

            transaction.update(circleRef, {
                members: arrayUnion(uid),
                membersCount: (circle.membersCount || 0) + 1,
                updatedAt: serverTimestamp()
            });

            transaction.set(userCirclesRef, {
                circleIds: arrayUnion(circleId),
                updatedAt: serverTimestamp()
            }, { merge: true });
        });

        return { success: true, status: 'joined' };
    },

    async leaveCircle(circleId) {
        const uid = auth.currentUser?.uid;
        if (!uid || !circleId) throw new Error('Invalid request.');

        const circleRef = doc(db, 'circles', circleId);
        const circleSnap = await getDoc(circleRef);
        if (!circleSnap.exists()) {
            return { success: true };
        }

        const circleData = circleSnap.data();
        if (circleData.adminId === uid || circleData.createdBy === uid) {
            throw new Error('Circle creator must transfer ownership before leaving.');
        }

        await Promise.all([
            updateDoc(circleRef, {
                members: arrayRemove(uid),
                membersCount: Math.max((circleData.membersCount || 1) - 1, 0),
                updatedAt: serverTimestamp()
            }),
            setDoc(doc(db, 'circles', circleId, 'members', uid), {
                status: 'left',
                leftAt: serverTimestamp()
            }, { merge: true }),
            setDoc(doc(db, 'userCircles', uid), {
                circleIds: arrayRemove(circleId),
                updatedAt: serverTimestamp()
            }, { merge: true })
        ]);

        return { success: true, status: 'left' };
    }
};
