import admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK safely
 */
function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!projectId || !clientEmail || !privateKey) {
        console.warn('Firebase environment variables are missing. Cloud storage will be unavailable.');
        // Don't throw here to avoid crashing the whole build, but log it
        return null;
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            storageBucket,
        });
        console.log('Firebase Admin Initialized Successfully');
        return admin;
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
        return null;
    }
}

// Export a getter for the bucket to ensure it's accessed only after successful initialization
export const getStorageBucket = () => {
    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) return null;
    return firebaseAdmin.storage().bucket();
};

export default getFirebaseAdmin;
