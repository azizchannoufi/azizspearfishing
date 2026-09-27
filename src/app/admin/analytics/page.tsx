"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getClientDb } from "@/lib/firebase/client";
import { PageHeader, StatCard, Field, inputClass, btnPrimary, btnSecondary } from "@/components/admin/ui";
import type { DailyAnalytics } from "@/lib/firebase/types";

type Period =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "6m"
  | "1y"
  | "custom";

type DailyRow = DailyAnalytics & { id: string };

type PageRow = { id: string; path: string; views: number };
type ContentRow = { id: string; title: string; views: number; clicks?: number };

function formatNum(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function rangeForPeriod(period: Period, customFrom: string, customTo: string) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let from = today;
  let to = today;

  switch (period) {
    case "today":
      from = today;
      break;
    case "7d":
      from = addDays(today, -6);
      break;
    case "30d":
      from = addDays(today, -29);
      break;
    case "90d":
      from = addDays(today, -89);
      break;
    case "6m":
      from = addDays(today, -182);
      break;
    case "1y":
      from = addDays(today, -364);
      break;
    case "custom":
      from = customFrom ? new Date(customFrom + "T12:00:00") : addDays(today, -29);
      to = customTo ? new Date(customTo + "T12:00:00") : today;
      break;
  }

  return { from: toISODate(from), to: toISODate(to) };
}

const PERIODS: Array<{ id: Period; label: string }> = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "6m", label: "6 months" },
  { id: "1y", label: "1 year" },
  { id: "custom", label: "Custom" },
];

export default function AnalyticsAdminPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [gallery, setGallery] = useState<ContentRow[]>([]);
  const [articles, setArticles] = useState<ContentRow[]>([]);
  const [videos, setVideos] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const { from, to } = useMemo(
    () => rangeForPeriod(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = getClientDb();
      const [
        dailySnap,
        pagesSnap,
        gallerySnap,
        articlesSnap,
        videosSnap,
        galleryDocs,
        articleDocs,
        videoDocs,
      ] = await Promise.all([
        getDocs(collection(db, "analyticsDaily")),
        getDocs(collection(db, "analyticsPages")),
        getDocs(collection(db, "analyticsGallery")),
        getDocs(collection(db, "analyticsArticles")),
        getDocs(collection(db, "analyticsVideos")),
        getDocs(collection(db, "gallery")),
        getDocs(collection(db, "articles")),
        getDocs(collection(db, "videos")),
      ]);

      const galleryTitles = new Map(
        galleryDocs.docs.map((d) => [d.id, String(d.data().title || d.id)]),
      );
      const articleTitles = new Map(
        articleDocs.docs.map((d) => [d.id, String(d.data().title || d.id)]),
      );
      const videoTitles = new Map(
        videoDocs.docs.map((d) => [d.id, String(d.data().title || d.id)]),
      );

      const dailyRows: DailyRow[] = dailySnap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            visitors: Number(data.visitors || 0),
            pageViews: Number(data.pageViews || 0),
            galleryViews: Number(data.galleryViews || 0),
            videoClicks: Number(data.videoClicks || 0),
            messages: Number(data.messages || 0),
          };
        })
        .filter((row) => row.id >= from && row.id <= to)
        .sort((a, b) => a.id.localeCompare(b.id));

      setDaily(dailyRows);

      setPages(
        pagesSnap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              path: String(data.path || d.id),
              views: Number(data.views || 0),
            };
          })
          .sort((a, b) => b.views - a.views)
          .slice(0, 20),
      );

      setGallery(
        gallerySnap.docs
          .map((d) => ({
            id: d.id,
            title: galleryTitles.get(d.id) || d.id,
            views: Number(d.data().views || 0),
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 20),
      );

      setArticles(
        articlesSnap.docs
          .map((d) => ({
            id: d.id,
            title: articleTitles.get(d.id) || d.id,
            views: Number(d.data().views || 0),
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 20),
      );

      setVideos(
        videosSnap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: videoTitles.get(d.id) || d.id,
              views: Number(data.views || 0),
              clicks: Number(data.clicks || 0),
            };
          })
          .sort((a, b) => (b.clicks || 0) + b.views - ((a.clicks || 0) + a.views))
          .slice(0, 20),
      );
    } catch {
      setDaily([]);
      setPages([]);
      setGallery([]);
      setArticles([]);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    return daily.reduce(
      (acc, row) => {
        acc.visitors += row.visitors;
        acc.pageViews += row.pageViews;
        return acc;
      },
      { visitors: 0, pageViews: 0 },
    );
  }, [daily]);

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="Traffic and content performance." />

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={period === p.id ? btnPrimary : btnSecondary}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From">
            <input
              className={inputClass}
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </Field>
          <Field label="To">
            <input
              className={inputClass}
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </Field>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading analytics...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Visitors" value={formatNum(totals.visitors)} />
            <StatCard label="Page views" value={formatNum(totals.pageViews)} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Traffic over time</h2>
            {daily.length === 0 ? (
              <p className="text-sm text-slate-500">No data for this period.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="id" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="visitors" stroke="#0f172a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pageViews" stroke="#64748b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RankTable title="Most visited pages" rows={pages.map((p) => ({ label: p.path, value: p.views }))} />
            <RankTable
              title="Top gallery"
              rows={gallery.map((g) => ({ label: g.title, value: g.views }))}
            />
            <RankTable
              title="Top articles"
              rows={articles.map((a) => ({ label: a.title, value: a.views }))}
            />
            <RankTable
              title="Video performance"
              rows={videos.map((v) => ({
                label: v.title,
                value: `${formatNum(v.views)} views · ${formatNum(v.clicks || 0)} clicks`,
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

function RankTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No data yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 py-2">
              <span className="truncate text-sm text-slate-700">{row.label}</span>
              <span className="shrink-0 text-sm font-medium text-slate-900">
                {typeof row.value === "number" ? formatNum(row.value) : row.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
