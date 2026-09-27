"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { countCollection, deleteItem, updateItem, where as cmsWhere } from "@/lib/firebase/cms";
import { logActivity } from "@/lib/activity";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/admin/AuthProvider";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  PageHeader,
  StatCard,
  Field,
  inputClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
} from "@/components/admin/ui";
import { PAGE_SIZE, type ContactMessage, type MessageStatus } from "@/lib/firebase/types";

type StatusFilter = "all" | MessageStatus;
type SortDir = "newest" | "oldest";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as Timestamp).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function formatDate(value: unknown) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleString();
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export default function MessagesAdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortDir, setSortDir] = useState<SortDir>("newest");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({ unread: 0, today: 0, week: 0, total: 0 });

  const loadStats = useCallback(async () => {
    try {
      const db = getClientDb();
      const today = startOfToday();
      const week = startOfWeek();
      const [unread, total, allSnap] = await Promise.all([
        countCollection("messages", [cmsWhere("status", "==", "unread")]),
        countCollection("messages"),
        getDocs(collection(db, "messages")),
      ]);
      let todayCount = 0;
      let weekCount = 0;
      allSnap.forEach((docSnap) => {
        const created = toDate(docSnap.data().createdAt);
        if (!created) return;
        if (created >= today) todayCount += 1;
        if (created >= week) weekCount += 1;
      });
      setStats({ unread, today: todayCount, week: weekCount, total });
    } catch {
      // missing indexes / empty
    }
  }, []);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const constraints: QueryConstraint[] = [];
        if (statusFilter !== "all") {
          constraints.push(where("status", "==", statusFilter));
        }
        constraints.push(orderBy("createdAt", sortDir === "newest" ? "desc" : "asc"));
        constraints.push(limit(PAGE_SIZE));
        if (!reset && cursor) constraints.push(startAfter(cursor));

        const snap = await getDocs(query(collection(getClientDb(), "messages"), ...constraints));
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ContactMessage);
        setItems((prev) => (reset ? next : [...prev, ...next]));
        setCursor(snap.docs[snap.docs.length - 1]);
        setHasMore(next.length === PAGE_SIZE);
      } catch {
        if (reset) setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [cursor, sortDir, statusFilter],
  );

  useEffect(() => {
    setCursor(undefined);
    void load(true);
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortDir]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => {
      const hay = `${m.name} ${m.email} ${m.subject} ${m.message} ${m.company}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  async function setStatus(msg: ContactMessage, status: MessageStatus) {
    await updateItem("messages", msg.id, { status });
    await logActivity(getClientDb(), {
      userId: user?.uid || "",
      userName: user?.displayName || user?.email || "Admin",
      action: "updated",
      resource: "message",
      resourceId: msg.id,
    });
    const updated = { ...msg, status };
    setItems((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
    if (selected?.id === msg.id) setSelected(updated);
    await loadStats();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteItem("messages", deleteId);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "deleted",
        resource: "message",
        resourceId: deleteId,
      });
      setItems((prev) => prev.filter((m) => m.id !== deleteId));
      if (selected?.id === deleteId) setSelected(null);
      setDeleteId(null);
      await loadStats();
    } finally {
      setDeleting(false);
    }
  }

  async function openMessage(msg: ContactMessage) {
    setSelected(msg);
    if (msg.status === "unread") {
      await setStatus(msg, "read");
    }
  }

  return (
    <div>
      <PageHeader title="Messages" description="Contact form inbox." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Unread" value={stats.unread} />
        <StatCard label="Today" value={stats.today} />
        <StatCard label="This week" value={stats.week} />
        <StatCard label="Total" value={stats.total} />
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Field label="Search">
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, subject..."
          />
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field label="Sort">
          <select
            className={inputClass}
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as SortDir)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading && items.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No messages found.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((msg) => (
                <li key={msg.id}>
                  <button
                    type="button"
                    onClick={() => void openMessage(msg)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${
                      selected?.id === msg.id ? "bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{msg.name}</p>
                      <span className="text-xs capitalize text-slate-500">{msg.status}</span>
                    </div>
                    <p className="truncate text-sm text-slate-700">{msg.subject}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(msg.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {hasMore && (
            <div className="border-t border-slate-100 p-3">
              <button type="button" className={btnSecondary} disabled={loading} onClick={() => void load(false)}>
                Load more
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selected ? (
            <p className="text-sm text-slate-500">Select a message to view details.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selected.subject}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  From {selected.name} &lt;{selected.email}&gt;
                </p>
                {selected.company && (
                  <p className="text-sm text-slate-500">Company: {selected.company}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">{formatDate(selected.createdAt)}</p>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-800">{selected.message}</p>
              <div className="flex flex-wrap gap-2">
                {selected.status === "unread" ? (
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => void setStatus(selected, "read")}
                  >
                    Mark read
                  </button>
                ) : (
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => void setStatus(selected, "unread")}
                  >
                    Mark unread
                  </button>
                )}
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => void setStatus(selected, "archived")}
                >
                  Archive
                </button>
                <a
                  className={btnPrimary}
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  onClick={() => void setStatus(selected, "replied")}
                >
                  Reply
                </a>
                <button type="button" className={btnDanger} onClick={() => setDeleteId(selected.id)}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete message"
        message="This message will be permanently removed."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
