"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "./AuthProvider";
import { GlobalSearch } from "./GlobalSearch";

export function AdminHeader({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const q = query(
        collection(getClientDb(), "messages"),
        where("status", "==", "unread"),
        orderBy("createdAt", "desc"),
        limit(20),
      );
      return onSnapshot(q, (snap) => {
        const prev = unread;
        setUnread(snap.size);
        if (snap.size > prev && prev > 0) {
          setToast("New message received");
          setTimeout(() => setToast(null), 4000);
        }
      });
    } catch {
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = useMemo(() => {
    const name = user?.displayName || user?.email || "A";
    return name.slice(0, 1).toUpperCase();
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 lg:hidden"
        aria-label="Open menu"
      >
        Menu
      </button>
      <div className="hidden flex-1 md:block">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/admin/messages"
          className="relative rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Inbox
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
              {unread}
            </span>
          )}
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
              {initials}
            </span>
            <span className="hidden sm:inline">Admin</span>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
              <Link
                href="/admin/profile"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </header>
  );
}
