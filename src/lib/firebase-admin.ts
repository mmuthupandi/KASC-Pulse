import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Lazy singleton — initialized on first request, not at build time
let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;

  // Reuse if already initialized (hot reload / multiple imports)
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  // Option 1: Full service account JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    _app = initializeApp({ credential: cert(serviceAccount) });
    return _app;
  }

  // Option 2: Individual env vars
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    _app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    return _app;
  }

  throw new Error(
    "Firebase Admin SDK credentials not found. " +
      "Set FIREBASE_SERVICE_ACCOUNT_JSON or " +
      "FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY."
  );
}

// Getters — called inside route handlers, never at module scope
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
