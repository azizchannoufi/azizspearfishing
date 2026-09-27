"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { countCollection } from "@/lib/firebase/cms";
import { PageHeader, StatCard } from "@/components/admin/ui";
import Link from "next/link";

function formatNum(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    visitors: 0,
    pageViews: 0,
    galleryViews: 0,
    videoClicks: 0,
    messages: 0,
    articles: 0,
    sponsors: 0,
    achievements: 0,
  });
  const [recent, setRecent] = useState<
    Array<{ id: string; action: string; userName: string; resource: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const db = getClientDb();
        const dailySnap = await getDocs(collection(db, "analyticsDaily"));
        let visitors = 0;
        let pageViews = 0;
        let galleryViews = 0;
        let videoClicks = 0;
        dailySnap.forEach((d) => {
          const data = d.data();
          visitors += Number(data.visitors || 0);
          pageViews += Number(data.pageViews || 0);
          galleryViews += Number(data.galleryViews || 0);
          videoClicks += Number(data.videoClicks || 0);
        });

        const [messages, articles, sponsors, achievements, activitySnap] =
          await Promise.all([
            countCollection("messages"),
            countCollection("articles"),
            countCollection("sponsors"),
            countCollection("achievements"),
            getDocs(
              query(collection(db, "activityLogs"), orderBy("timestamp", "desc"), limit(8)),
            ),
          ]);

        setStats({
          visitors,
          pageViews,
          galleryViews,
          videoClicks,
          messages,
          articles,
          sponsors,
          achievements,
        });
        setRecent(
          activitySnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              action: String(data.action || ""),
              userName: String(data.userName || "Admin"),
              resource: String(data.resource || ""),
            };
          }),
        );
      } catch {
        // empty CMS / missing indexes
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your athlete website performance and content."
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Visitors" value={formatNum(stats.visitors)} />
            <StatCard label="Page Views" value={formatNum(stats.pageViews)} />
            <StatCard label="Gallery Views" value={formatNum(stats.galleryViews)} />
            <StatCard label="Video Clicks" value={formatNum(stats.videoClicks)} />
            <StatCard label="Contact Messages" value={formatNum(stats.messages)} />
            <StatCard label="Articles" value={formatNum(stats.articles)} />
            <StatCard label="Sponsors" value={formatNum(stats.sponsors)} />
            <StatCard label="Achievements" value={formatNum(stats.achievements)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Recent activity</h2>
                <Link href="/admin/activity" className="text-sm text-slate-500 hover:text-slate-800">
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="text-sm text-slate-500">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recent.map((item) => (
                    <li key={item.id} className="text-sm text-slate-700">
                      <span className="font-medium">{item.userName}</span> {item.action}{" "}
                      <span className="text-slate-500">{item.resource}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-900">Quick links</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["/admin/messages", "Messages"],
                  ["/admin/gallery", "Gallery"],
                  ["/admin/news", "News"],
                  ["/admin/sponsors", "Sponsors"],
                  ["/admin/analytics", "Analytics"],
                  ["/admin/settings", "Settings"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
