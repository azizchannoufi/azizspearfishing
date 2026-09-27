import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const APP_NAME = "server-cms-reader";

let signInPromise: Promise<void> | null = null;

function getServerApp(): FirebaseApp {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;
  return initializeApp(firebaseConfig, APP_NAME);
}

/**
 * Server-only Firestore client signed in as the bootstrap admin.
 * Used when public (unauthenticated) reads are blocked by security rules.
 */
export async function getServerCmsDb(): Promise<Firestore | null> {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password || !firebaseConfig.apiKey) return null;

  const app = getServerApp();
  const auth: Auth = getAuth(app);

  if (!auth.currentUser) {
    if (!signInPromise) {
      signInPromise = signInWithEmailAndPassword(auth, email, password)
        .then(() => undefined)
        .catch((err) => {
          signInPromise = null;
          throw err;
        });
    }
    await signInPromise;
  }

  return getFirestore(app);
}
