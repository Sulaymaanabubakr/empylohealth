import * as admin from 'firebase-admin';

// Initialize Admin SDK - this will use GOOGLE_APPLICATION_CREDENTIALS if available, 
// or default credentials. For local emulator usage, it should connect if env is set.
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const grantAdminAccess = async (email: string) => {
    try {
        const user = await admin.auth().getUserByEmail(email);
        if (user.customClaims && (user.customClaims as any).admin === true) {
            console.log(`User ${email} is already an admin.`);
            return;
        }

        await admin.auth().setCustomUserClaims(user.uid, {
            admin: true
        });
        console.log(`Successfully granted admin access to ${email}`);
    } catch (error) {
        console.error(`Error granting access to ${email}:`, error);
    }
};

const main = async () => {
    const admins = [
        'sulaymaanabubakr@gmail.com',
        'Gcmusariri@gmail.com'
    ];

    console.log('Granting admin privileges...');
    for (const email of admins) {
        await grantAdminAccess(email);
    }
    process.exit(0);
};

main();
