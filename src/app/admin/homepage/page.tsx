"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import type { HeroContent } from "@/lib/firebase/types";

const empty: HeroContent = {
  title: "",
  subtitle: "",
  description: "",
  image: null,
  videoUrl: "",
  primaryButtonText: "",
  primaryButtonLink: "",
  secondaryButtonText: "",
  secondaryButtonLink: "",
};

export default function HomepageAdminPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<HeroContent>(empty);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    void getDocData<HeroContent & { id?: string }>("homepage/hero").then((data) => {
      if (data) setForm({ ...empty, ...data });
    });
  }, []);

  function set<K extends keyof HeroContent>(key: K, value: HeroContent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setStatus("saving");
    try {
      const { id: _id, ...payload } = form as HeroContent & { id?: string };
      await setDocData("homepage/hero", payload);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "updated",
        resource: "homepage hero",
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Homepage"
        description="Edit hero content shown on the public site."
        actions={
          <Link href="/admin/homepage/sections" className={btnSecondary}>
            Manage sections
          </Link>
        }
      />

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Hero title">
            <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Hero subtitle">
            <input className={inputClass} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
        </div>
        <Field label="Hero description">
          <textarea
            className={inputClass}
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <ImageUploader
          label="Hero image"
          folder="homepage"
          value={(form.image as UploadedImage) || null}
          onChange={(img) => set("image", img)}
        />
        <Field label="Hero video URL (optional)">
          <input className={inputClass} value={form.videoUrl || ""} onChange={(e) => set("videoUrl", e.target.value)} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Primary button text">
            <input className={inputClass} value={form.primaryButtonText} onChange={(e) => set("primaryButtonText", e.target.value)} />
          </Field>
          <Field label="Primary button link">
            <input className={inputClass} value={form.primaryButtonLink} onChange={(e) => set("primaryButtonLink", e.target.value)} />
          </Field>
          <Field label="Secondary button text">
            <input className={inputClass} value={form.secondaryButtonText} onChange={(e) => set("secondaryButtonText", e.target.value)} />
          </Field>
          <Field label="Secondary button link">
            <input className={inputClass} value={form.secondaryButtonLink} onChange={(e) => set("secondaryButtonLink", e.target.value)} />
          </Field>
        </div>
        <FormStatus status={status} />
        <button type="button" className={btnPrimary} onClick={() => void save()}>
          Save homepage
        </button>
      </div>
    </div>
  );
}
