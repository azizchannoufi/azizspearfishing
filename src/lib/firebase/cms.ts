import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  limit,
  orderBy,
  query,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { PAGE_SIZE } from "@/lib/firebase/types";

export async function getDocData<T>(path: string): Promise<T | null> {
  const parts = path.split("/").filter(Boolean);
  const snap = await getDoc(doc(getClientDb(), parts[0]!, ...parts.slice(1)));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function setDocData(path: string, data: DocumentData, merge = true) {
  const parts = path.split("/").filter(Boolean);
  await setDoc(
    doc(getClientDb(), parts[0]!, ...parts.slice(1)),
    { ...data, updatedAt: serverTimestamp() },
    { merge },
  );
}

export async function listCollection<T>(
  name: string,
  opts?: {
    orderField?: string;
    orderDir?: "asc" | "desc";
    pageSize?: number;
    cursor?: QueryDocumentSnapshot;
    filters?: QueryConstraint[];
  },
): Promise<{ items: T[]; last?: QueryDocumentSnapshot }> {
  const constraints: QueryConstraint[] = [...(opts?.filters || [])];
  if (opts?.orderField) {
    constraints.push(orderBy(opts.orderField, opts.orderDir || "asc"));
  }
  constraints.push(limit(opts?.pageSize ?? PAGE_SIZE));
  if (opts?.cursor) constraints.push(startAfter(opts.cursor));

  const snap = await getDocs(query(collection(getClientDb(), name), ...constraints));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  return { items, last: snap.docs[snap.docs.length - 1] };
}

export async function createItem(name: string, data: DocumentData) {
  const ref = await addDoc(collection(getClientDb(), name), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateItem(name: string, id: string, data: DocumentData) {
  await updateDoc(doc(getClientDb(), name, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteItem(name: string, id: string) {
  await deleteDoc(doc(getClientDb(), name, id));
}

export async function reorderItems(
  name: string,
  orderedIds: string[],
) {
  const batch = writeBatch(getClientDb());
  orderedIds.forEach((id, index) => {
    batch.update(doc(getClientDb(), name, id), {
      order: index,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function countCollection(name: string, filters?: QueryConstraint[]) {
  const q = filters?.length
    ? query(collection(getClientDb(), name), ...filters)
    : collection(getClientDb(), name);
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export { where, orderBy, serverTimestamp, doc, getClientDb };
