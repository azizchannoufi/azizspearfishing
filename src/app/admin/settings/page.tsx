"use client";

import { useEffect, useState } from "react";
import { getDocData, setDocData } from "@/lib/firebase/cms";
import { logActivity } from "@/lib/activity";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/admin/AuthProvider";
import {
  PageHeader,
  Field,
  FormStatus,
  inputClass,
  btnPrimary,
  btnSecondary,
} from "@/components/admin/ui";
import type { SiteSettings } from "@/lib/firebase/types";

const empty: SiteSettings = {
  websiteName: "",
  athleteName: "",
  email: "",
  phone: "",
  location: "",
  defaultLanguage: "en",
  timezone: "UTC",
  copyright: "",
  maintenanceMode: false,
};

export default function SettingsAdminPage() {
  const { user, getToken } = useAuth();
  const [form, setForm] = useState<SiteSettings>(empty);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    void getDocData<SiteSettings & { id?: string }>("siteSettings/general").then((data) => {
      if (data) setForm({ ...empty, ...data });
    });
  }, []);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setStatus("saving");
    try {
      const { id: _id, ...payload } = form as SiteSettings & { id?: string };
      await setDocData("siteSettings/general", payload);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "updated",
        resource: "site settings",
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  async function exportContent() {
    setExporting(true);
    setExportError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Session expired");
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aziz-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Unable to export content. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="General site configuration."
        actions={
          <button
            type="button"
            className={btnSecondary}
            disabled={exporting}
            onClick={() => void exportContent()}
          >
            {exporting ? "Exporting..." : "Export Content"}
          </button>
        }
      />

      {exportError && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{exportError}</div>
      )}

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Website name">
            <input
              className={inputClass}
              value={form.websiteName}
              onChange={(e) => set("websiteName", e.target.value)}
            />
          </Field>
          <Field label="Athlete name">
            <input
              className={inputClass}
              value={form.athleteName}
              onChange={(e) => set("athleteName", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Location">
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </Field>
          <Field label="Default language">
            <input
              className={inputClass}
              value={form.defaultLanguage}
              onChange={(e) => set("defaultLanguage", e.target.value)}
            />
          </Field>
          <Field label="Timezone">
            <input
              className={inputClass}
              value={form.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            />
          </Field>
          <Field label="Copyright">
            <input
              className={inputClass}
              value={form.copyright}
              onChange={(e) => set("copyright", e.target.value)}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.maintenanceMode}
            onChange={(e) => set("maintenanceMode", e.target.checked)}
          />
          Maintenance mode
        </label>
        <FormStatus status={status} />
        <button type="button" className={btnPrimary} onClick={() => void save()}>
          Save settings
        </button>
      </div>
    </div>
  );
}
