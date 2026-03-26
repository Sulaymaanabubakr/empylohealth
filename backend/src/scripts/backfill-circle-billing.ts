import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

const DEFAULT_FREE_BILLING = {
    billingTier: 'free',
    huddlesEnabled: false,
    memberCap: 6
} as const;

const toBool = (value: string | undefined, fallback = false) => {
    if (!value) return fallback;
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const main = async () => {
    const dryRun = toBool(process.env.DRY_RUN, true);
    const onlyMissing = toBool(process.env.ONLY_MISSING, true);
    const snap = await db.collection('circles').get();

    let scanned = 0;
    let changed = 0;
    const batch = db.batch();

    snap.docs.forEach((docSnap) => {
        scanned += 1;
        const data = docSnap.data() || {};
        const next: Record<string, any> = {};

        if (!onlyMissing || !String(data.billingTier || '').trim()) {
            next.billingTier = DEFAULT_FREE_BILLING.billingTier;
        }
        if (!onlyMissing || typeof data.huddlesEnabled !== 'boolean') {
            next.huddlesEnabled = DEFAULT_FREE_BILLING.huddlesEnabled;
        }
        if (!onlyMissing || !Number.isFinite(Number(data.memberCap)) || Number(data.memberCap) <= 0) {
            next.memberCap = DEFAULT_FREE_BILLING.memberCap;
        }

        if (Object.keys(next).length > 0) {
            changed += 1;
            console.log(`[circle:${docSnap.id}]`, dryRun ? 'would update' : 'updating', next);
            if (!dryRun) {
                batch.set(docSnap.ref, next, { merge: true });
            }
        }
    });

    if (!dryRun && changed > 0) {
        await batch.commit();
    }

    console.log(JSON.stringify({ scanned, changed, dryRun, onlyMissing }, null, 2));
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to backfill circle billing state', error);
        process.exit(1);
    });
