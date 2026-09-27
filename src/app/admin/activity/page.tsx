"use client";

import { useCallback, useEffect, useState } from "react";
import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { listCollection } from "@/lib/firebase/cms";
import { PageHeader, btnSecondary } from "@/components/admin/ui";
import { PAGE_SIZE, type ActivityLog } from "@/lib/firebase/types";

function formatTimestamp(value: unknown) {
  if (!value) return "—";
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as Timestamp).toDate().toLocaleString();
    } catch {
      return "—";
    }
  }
  return "—";
}

export default function ActivityAdminPage() {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const result = await listCollection<ActivityLog>("activityLogs", {
          orderField: "timestamp",
          orderDir: "desc",
          pageSize: PAGE_SIZE,
          cursor: reset ? undefined : cursor,
        });
        setItems((prev) => (reset ? result.items : [...prev, ...result.items]));
        setCursor(result.last);
        setHasMore(result.items.length === PAGE_SIZE);
      } catch {
        if (reset) setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [cursor],
  );

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader title="Activity" description="Recent admin actions across the CMS." />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading && items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{item.userName}</span> {item.action}{" "}
                  <span className="text-slate-500">{item.resource}</span>
                  {item.resourceId ? (
                    <span className="text-slate-400"> ({item.resourceId})</span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatTimestamp(item.timestamp)}</p>
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
    </div>
  );
}
