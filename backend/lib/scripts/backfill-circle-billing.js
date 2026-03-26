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
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const DEFAULT_FREE_BILLING = {
    billingTier: 'free',
    huddlesEnabled: false,
    memberCap: 6
};
const toBool = (value, fallback = false) => {
    if (!value)
        return fallback;
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
        const next = {};
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
//# sourceMappingURL=backfill-circle-billing.js.map