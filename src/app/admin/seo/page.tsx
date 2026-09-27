"use client";

import { useEffect, useState } from "react";
import { getDocData, setDocData } from "@/lib/firebase/cms";
import { logActivity } from "@/lib/activity";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/admin/AuthProvider";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import {
  PageHeader,
  Field,
  FormStatus,
  inputClass,
  btnPrimary,
  btnSecondary,
} from "@/components/admin/ui";
import type { SeoPage } from "@/lib/firebase/types";

const PAGE_IDS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "achievements", label: "Achievements" },
] as const;

type PageId = (typeof PAGE_IDS)[number]["id"];

const empty: SeoPage = {
  title: "",
  description: "",
  ogImage: null,
};

export default function SeoAdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<PageId>("home");
  const [forms, setForms] = useState<Record<PageId, SeoPage>>({
    home: { ...empty },
    about: { ...empty },
    achievements: { ...empty },
  });
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    void (async () => {
      const next = { ...forms };
      for (const page of PAGE_IDS) {
        const data = await getDocData<SeoPage & { id?: string }>(`seo/${page.id}`);
        if (data) next[page.id] = { ...empty, ...data };
      }
      setForms(next);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = forms[tab];

  function setField<K extends keyof SeoPage>(key: K, value: SeoPage[K]) {
    setForms((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [key]: value },
    }));
  }

  async function save() {
    setStatus("saving");
    try {
      const { id: _id, ...payload } = form as SeoPage & { id?: string };
      await setDocData(`seo/${tab}`, payload);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "updated",
        resource: `seo ${tab}`,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <PageHeader title="SEO" description="Page metadata and Open Graph images." />

      <div className="mb-4 flex flex-wrap gap-2">
        {PAGE_IDS.map((page) => (
          <button
            key={page.id}
            type="button"
            className={tab === page.id ? btnPrimary : btnSecondary}
            onClick={() => {
              setTab(page.id);
              setStatus("idle");
            }}
          >
            {page.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <Field label="Title">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClass}
            rows={3}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </Field>
        <ImageUploader
          label="OG image"
          folder="seo"
          value={(form.ogImage as UploadedImage) || null}
          onChange={(img) => setField("ogImage", img)}
        />
        <FormStatus status={status} />
        <button type="button" className={btnPrimary} onClick={() => void save()}>
          Save {PAGE_IDS.find((p) => p.id === tab)?.label} SEO
        </button>
      </div>
    </div>
  );
}
