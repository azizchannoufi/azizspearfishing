"use client";

import { useEffect, useState } from "react";
import { getDocData, setDocData } from "@/lib/firebase/cms";
import { useAuth } from "@/components/admin/AuthProvider";
import { logActivity } from "@/lib/activity";
import { getClientDb } from "@/lib/firebase/client";
import type { SocialLinks } from "@/lib/firebase/types";
import { PageHeader, Field, FormStatus, inputClass, btnPrimary } from "@/components/admin/ui";

const empty: SocialLinks = {
  instagram: "",
  youtube: "",
  tiktok: "",
  facebook: "",
  linkedin: "",
  x: "",
  email: "",
  instagramFollowers: "",
  instagramViews: "",
  youtubeSubscribers: "",
  youtubeViews: "",
  tiktokFollowers: "",
  tiktokViews: "",
  facebookFollowers: "",
  facebookViews: "",
};

const LINK_KEYS = [
  "instagram",
  "youtube",
  "tiktok",
  "facebook",
  "linkedin",
  "x",
  "email",
] as const;

const STAT_FIELDS: Array<{ key: keyof SocialLinks; label: string; placeholder: string }> = [
  { key: "instagramFollowers", label: "Instagram — Followers / subscribers", placeholder: "e.g. 12.4K" },
  { key: "instagramViews", label: "Instagram — Views", placeholder: "e.g. 1.2M" },
  { key: "youtubeSubscribers", label: "YouTube — Subscribers", placeholder: "e.g. 8.1K" },
  { key: "youtubeViews", label: "YouTube — Views", placeholder: "e.g. 450K" },
  { key: "tiktokFollowers", label: "TikTok — Followers", placeholder: "e.g. 25K" },
  { key: "tiktokViews", label: "TikTok — Views", placeholder: "e.g. 3.5M" },
  { key: "facebookFollowers", label: "Facebook — Followers", placeholder: "e.g. 10K" },
  { key: "facebookViews", label: "Facebook — Views", placeholder: "e.g. 500K" },
];

export default function SocialMediaPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SocialLinks>(empty);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    void getDocData<SocialLinks>("socialLinks/main").then((data) => {
      if (data) setForm({ ...empty, ...data });
    });
  }, []);

  async function save() {
    setStatus("saving");
    try {
      await setDocData("socialLinks/main", form);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "updated",
        resource: "social links",
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Social Media"
        description="Profile URLs and manual reach stats shown on the public site."
      />

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Profile links</h2>
        {LINK_KEYS.map((key) => (
          <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
            <input
              className={inputClass}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={key === "email" ? "hello@example.com" : "https://..."}
            />
          </Field>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Reach stats (manual)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Shown on the homepage. Use plain numbers or short labels like 12K / 1.2M. Leave blank to hide.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {STAT_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <input
                className={inputClass}
                value={form[field.key]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <FormStatus status={status} />
        <button type="button" className={btnPrimary} onClick={() => void save()}>
          Save social media
        </button>
      </div>
    </div>
  );
}
