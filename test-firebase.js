import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const envPath = './.env';

function parseEnv() {
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    // Support either KEY=VALUE or KEY: "VALUE"
    let key, val;
    if (trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      key = trimmed.substring(0, idx).trim();
      val = trimmed.substring(idx + 1).trim();
    } else if (trimmed.includes(':')) {
      const idx = trimmed.indexOf(':');
      key = trimmed.substring(0, idx).trim();
      val = trimmed.substring(idx + 1).trim();
    }
    
    if (key && val) {
      // Strip surrounding quotes
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      // Clean up escaped newlines
      val = val.replace(/\\n/g, '\n');
      env[key] = val;
    }
  });
  return env;
}

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const env = parseEnv();
  console.log('Parsed Env Keys:', Object.keys(env));
  console.log('Project ID:', env.FIREBASE_PROJECT_ID);
  console.log('Client Email:', env.FIREBASE_CLIENT_EMAIL);
  
  let privateKey = env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    console.error('FIREBASE_PRIVATE_KEY is missing in env!');
    return;
  }
  
  console.log('Private key length:', privateKey.length);
  console.log('Private key starts with:', privateKey.substring(0, 50));
  console.log('Private key ends with:', privateKey.substring(privateKey.length - 50));
  
  try {
    const app = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    
    const db = getFirestore(app);
    console.log('Attempting to list users collection...');
    const snapshot = await db.collection('users').limit(1).get();
    console.log('Success! Found docs count:', snapshot.size);
  } catch (err) {
    console.error('Firebase connection error:', err);
  }
}

run();
