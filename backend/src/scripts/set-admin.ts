import * as admin from 'firebase-admin';

// Initialize Admin SDK - this will use GOOGLE_APPLICATION_CREDENTIALS if available, 
// or default credentials. For local emulator usage, it should connect if env is set.
if (admin.apps.length === 0) {
    admin.initializeApp();
}

type ClaimProfile = {
    admin: true;
    role: 'admin' | 'editor' | 'viewer' | 'moderator' | 'support' | 'finance';
    superAdmin?: boolean;
    permissions?: string[];
};

const grantAdminAccess = async (email: string, claims: ClaimProfile) => {
    try {
        const user = await admin.auth().getUserByEmail(email);
        const currentClaims = user.customClaims || {};
        const alreadyMatches =
            currentClaims.admin === claims.admin &&
            currentClaims.role === claims.role &&
            Boolean(currentClaims.superAdmin) === Boolean(claims.superAdmin) &&
            JSON.stringify(currentClaims.permissions || []) === JSON.stringify(claims.permissions || []);
        if (alreadyMatches) {
            console.log(`User ${email} is already an admin.`);
            return;
        }

        await admin.auth().setCustomUserClaims(user.uid, claims);
        console.log(`Successfully granted admin access to ${email}`, claims);
    } catch (error) {
        console.error(`Error granting access to ${email}:`, error);
    }
};

const main = async () => {
    const admins: Array<{ email: string; claims: ClaimProfile }> = [
        {
            email: 'sulaymaanabubakr@gmail.com',
            claims: {
                admin: true,
                role: 'admin',
                superAdmin: true,
                permissions: ['*']
            }
        },
        {
            email: 'gcmusariri@gmail.com',
            claims: {
                admin: true,
                role: 'admin'
            }
        }
    ];

    console.log('Granting admin privileges...');
    for (const entry of admins) {
        await grantAdminAccess(entry.email, entry.claims);
    }
    process.exit(0);
};

main();
