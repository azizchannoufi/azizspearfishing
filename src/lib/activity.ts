import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

export async function logActivity(
  db: Firestore,
  payload: {
    userId: string;
    userName: string;
    action: string;
    resource: string;
    resourceId?: string;
  },
) {
  try {
    await addDoc(collection(db, "activityLogs"), {
      ...payload,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Activity logging must not block primary actions
  }
}
