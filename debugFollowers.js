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

async function checkUsers() {
  const snap = await db.collection('users').get();
  console.log(`Total users in DB: ${snap.size}`);
  snap.forEach(doc => {
    console.log(`User: ${doc.id}`, doc.data());
  });

  // Also check followers for a specific user if they have any
  for (const doc of snap.docs) {
    const followers = await db.collection(`users/${doc.id}/followers`).get();
    if (followers.size > 0) {
      console.log(`User ${doc.id} has ${followers.size} followers:`);
      followers.forEach(f => console.log(`  - ${f.id}`, f.data()));
    }
  }

  process.exit(0);
}

checkUsers();
