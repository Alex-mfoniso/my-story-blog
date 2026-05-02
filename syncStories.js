import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccount = JSON.parse(readFileSync(new URL('./serviceAccountKey.json', import.meta.url)));

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function syncStories() {
  console.log('Starting story migration (adding isDraft: false)...');
  let updatedCount = 0;

  try {
    const storiesSnap = await db.collection('stories').get();
    console.log(`Found ${storiesSnap.size} stories.`);

    const batch = db.batch();
    
    storiesSnap.forEach((doc) => {
      const data = doc.data();
      if (data.isDraft === undefined) {
        batch.update(doc.ref, { isDraft: false });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully updated ${updatedCount} stories with isDraft: false.`);
    } else {
      console.log('No stories needed updating.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error migrating stories:', error);
    process.exit(1);
  }
}

syncStories();
