import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User,
} from "firebase/auth";
import { getClientAuth } from "./client";

export async function loginWithEmail(email: string, password: string) {
  const auth = getClientAuth();
  await setPersistence(auth, browserLocalPersistence);
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(getClientAuth());
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(getClientAuth(), email);
}

export async function changePassword(
  user: User,
  currentPassword: string,
  newPassword: string,
) {
  if (!user.email) throw new Error("User has no email");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = getClientAuth().currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export async function getAdminClaim(user: User, forceRefresh = false): Promise<boolean> {
  const token = await user.getIdTokenResult(forceRefresh);
  return token.claims.admin === true;
}
