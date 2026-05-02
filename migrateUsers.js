import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

const serviceAccount = JSON.parse(readFileSync(path.join(process.cwd(), 'serviceAccountKey.json')));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrate() {
  const usersSnap = await db.collection('users').get();
  console.log(`Updating ${usersSnap.size} users...`);
  
  const batch = db.batch();
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.displayName && !data.displayNameLower) {
      batch.update(doc.ref, { displayNameLower: data.displayName.toLowerCase() });
    }
  });
  
  await batch.commit();
  console.log("Migration complete!");
  process.exit(0);
}

migrate();
