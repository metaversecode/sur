const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let db = null;       // Firestore — person records + search
let rtdb = null;     // Realtime Database — photos + stats
let initialized = false;

try {
  let credential;

  // ── Option 1: Environment variables (Netlify / production) ──
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });
    console.log('  Using environment variable credentials');
  }
  // ── Option 2: Service account JSON file (local development) ──
  else {
    const serviceAccountPath = path.resolve(
      __dirname,
      '..',
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
        './firebase admin config/projectxxx10-firebase-adminsdk-fbsvc-fdeb871e0c.json'
    );
    const serviceAccount = require(serviceAccountPath);
    credential = admin.credential.cert(serviceAccount);
    console.log('  Using service account JSON file');
  }

  admin.initializeApp({
    credential,
    databaseURL:
      process.env.FIREBASE_DATABASE_URL ||
      'https://projectxxx10-default-rtdb.firebaseio.com',
  });

  db = admin.firestore();
  rtdb = admin.database();
  initialized = true;
  console.log('✓ Firebase connected — Firestore + Realtime DB');
} catch (error) {
  console.error('✗ Firebase initialization failed:', error.message);
  console.warn('⚠  Running in demo mode. Database features disabled.');
}

module.exports = { db, rtdb, admin, initialized };
