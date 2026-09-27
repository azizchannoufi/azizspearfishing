/**
 * Create the first admin user and set custom claim { admin: true }.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-admin.ts
 *
 * Requires .env or .env.local with Firebase Admin + ADMIN_BOOTSTRAP_* vars.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function loadEnvFile(fileName: string, override = false) {
  const envPath = resolve(process.cwd(), fileName);
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || !process.env[key]) process.env[key] = value;
  }
}

// .env first, then .env.local overrides (matches Next.js)
loadEnvFile(".env");
loadEnvFile(".env.local", true);

const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const displayName = process.env.ADMIN_BOOTSTRAP_NAME || "Admin";
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!email || !password || !projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing required env: ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD, FIREBASE_ADMIN_*",
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

async function main() {
  const auth = getAuth();
  const db = getFirestore();

  let user;
  try {
    user = await auth.getUserByEmail(email!);
    console.log(`User already exists: ${user.uid}`);
    await auth.updateUser(user.uid, {
      password: password!,
      displayName,
      emailVerified: true,
    });
    console.log("Updated password and display name");
  } catch {
    user = await auth.createUser({
      email: email!,
      password: password!,
      displayName,
      emailVerified: true,
    });
    console.log(`Created user: ${user.uid}`);
  }

  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log("Set custom claim: { admin: true }");

  try {
    await db.collection("users").doc(user.uid).set(
      {
        email,
        name: displayName,
        role: "admin",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    console.log("Wrote users/" + user.uid);
  } catch (err) {
    console.warn(
      "Could not write users doc (Firestore may not be created/enabled yet):",
      err instanceof Error ? err.message : err,
    );
    console.warn(
      "Create a Firestore database in Firebase Console if you have not already.",
    );
  }
  console.log("Done. Sign in at /admin/login");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
