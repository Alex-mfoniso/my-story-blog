import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccount = JSON.parse(readFileSync(new URL('./serviceAccountKey.json', import.meta.url)));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncUsers() {
  console.log('Starting user sync...');
  let syncedCount = 0;
  let skippedCount = 0;

  try {
    const listUsersResult = await admin.auth().listUsers(1000); // adjust limit if > 1000 users
    const users = listUsersResult.users;

    console.log(`Found ${users.length} users in Firebase Authentication.`);

    for (const userRecord of users) {
      const userRef = db.collection('users').doc(userRecord.uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        await userRef.set({
          uid: userRecord.uid,
          email: userRecord.email || '',
          displayName: userRecord.displayName || 'User',
          photoURL: userRecord.photoURL || `https://ui-avatars.com/api/?name=${userRecord.displayName || 'User'}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Created document for user: ${userRecord.uid} (${userRecord.email})`);
        syncedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('--- Sync Complete ---');
    console.log(`Total Synced (New docs): ${syncedCount}`);
    console.log(`Total Skipped (Already existed): ${skippedCount}`);
    process.exit(0);

  } catch (error) {
    console.error('Error syncing users:', error);
    process.exit(1);
  }
}

syncUsers();
