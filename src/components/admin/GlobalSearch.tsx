"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";

type Hit = { type: string; id: string; title: string; href: string };

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const term = q.trim().toLowerCase();
    let cancelled = false;

    async function run() {
      const db = getClientDb();
      const results: Hit[] = [];

      const searches: Array<{
        col: string;
        field: string;
        type: string;
        path: (id: string) => string;
      }> = [
        { col: "sponsors", field: "name", type: "Sponsor", path: () => "/admin/sponsors" },
        {
          col: "achievements",
          field: "competitionName",
          type: "Achievement",
          path: () => "/admin/achievements",
        },
        { col: "gallery", field: "title", type: "Gallery", path: () => "/admin/gallery" },
        { col: "videos", field: "title", type: "Video", path: () => "/admin/videos" },
        { col: "articles", field: "title", type: "Article", path: () => "/admin/news" },
        { col: "messages", field: "subject", type: "Message", path: () => "/admin/messages" },
      ];

      for (const s of searches) {
        const snap = await getDocs(
          query(collection(db, s.col), orderBy(s.field), limit(40)),
        );
        for (const doc of snap.docs) {
          const data = doc.data();
          const title = String(data[s.field] || "");
          if (title.toLowerCase().includes(term)) {
            results.push({
              type: s.type,
              id: doc.id,
              title,
              href: s.path(doc.id),
            });
          }
        }
      }

      if (!cancelled) setHits(results.slice(0, 12));
    }

    void run().catch(() => setHits([]));
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div className="relative max-w-md">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search anything..."
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-400 focus:bg-white focus:ring-2"
      />
      {open && hits.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {hits.map((hit) => (
            <li key={`${hit.type}-${hit.id}`}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                onMouseDown={() => {
                  router.push(hit.href);
                  setOpen(false);
                  setQ("");
                }}
              >
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                  {hit.type}
                </span>
                <span className="truncate text-slate-800">{hit.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
