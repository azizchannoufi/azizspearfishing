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
};

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
    <div>
      <PageHeader title="Social Media" description="Update public social profile URLs." />
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {(Object.keys(empty) as Array<keyof SocialLinks>).map((key) => (
          <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
            <input
              className={inputClass}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </Field>
        ))}
        <FormStatus status={status} />
        <button type="button" className={btnPrimary} onClick={() => void save()}>
          Save social links
        </button>
      </div>
    </div>
  );
}
