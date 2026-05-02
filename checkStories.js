import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Since serviceAccountKey.json is missing or path is wrong, I'll check the current directory.
const serviceAccountPath = './serviceAccountKey.json';
let serviceAccount;
try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath));
} catch (e) {
    console.error("Could not find serviceAccountKey.json. Please ensure it is in the root directory.");
    process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkStories() {
  const snap = await db.collection('stories').get();
  console.log(`Total stories: ${snap.size}`);
  
  let missingAuthorId = 0;
  let drafts = 0;
  
  snap.forEach(doc => {
    const data = doc.data();
    if (!data.authorId) missingAuthorId++;
    if (data.isDraft === true) drafts++;
    
    console.log(`Story: ${doc.id} | Title: ${data.title} | AuthorId: ${data.authorId} | isDraft: ${data.isDraft}`);
  });
  
  console.log(`\nSummary:`);
  console.log(`Missing authorId: ${missingAuthorId}`);
  console.log(`Drafts: ${drafts}`);
  
  process.exit(0);
}

checkStories();
