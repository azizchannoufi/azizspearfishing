"use client";

import { useEffect, useState } from "react";
import {
  createItem,
  deleteItem,
  getDocData,
  listCollection,
  reorderItems,
  setDocData,
  updateItem,
} from "@/lib/firebase/cms";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAuth } from "@/components/admin/AuthProvider";
import { logActivity } from "@/lib/activity";
import { getClientDb } from "@/lib/firebase/client";
import type { AthleteProfile, AthleteStat } from "@/lib/firebase/types";
import {
  PageHeader,
  Field,
  FormStatus,
  inputClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
} from "@/components/admin/ui";

const emptyProfile: AthleteProfile = {
  name: "",
  professionalTitle: "",
  shortBiography: "",
  fullBiography: "",
  nationality: "",
  yearsActive: "",
  maximumDepth: "",
  competitionsCount: "",
  podiumsCount: "",
  countriesVisited: "",
  profileImage: null,
};

const emptyStat = () => ({
  number: "",
  label: "",
  icon: "",
  order: 0,
  visible: true,
});

export default function AthleteAdminPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AthleteProfile>(emptyProfile);
  const [stats, setStats] = useState<AthleteStat[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [statStatus, setStatStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [statForm, setStatForm] = useState(emptyStat());
  const [editingStat, setEditingStat] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function reloadStats() {
    const res = await listCollection<AthleteStat>("athleteStats", {
      orderField: "order",
      orderDir: "asc",
      pageSize: 100,
    });
    setStats(res.items);
  }

  useEffect(() => {
    void getDocData<AthleteProfile>("athlete/profile").then((data) => {
      if (data) setProfile({ ...emptyProfile, ...data });
    });
    void reloadStats();
  }, []);

  async function saveProfile() {
    setStatus("saving");
    try {
      await setDocData("athlete/profile", profile);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "updated",
        resource: "athlete profile",
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  async function saveStat() {
    setStatStatus("saving");
    try {
      if (editingStat) {
        await updateItem("athleteStats", editingStat, statForm);
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "updated",
          resource: "athlete stat",
          resourceId: editingStat,
        });
      } else {
        const id = await createItem("athleteStats", {
          ...statForm,
          order: stats.length,
        });
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "created",
          resource: "athlete stat",
          resourceId: id,
        });
      }
      setEditingStat(null);
      setStatForm(emptyStat());
      await reloadStats();
      setStatStatus("success");
    } catch {
      setStatStatus("error");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteItem("athleteStats", deleteId);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "deleted",
        resource: "athlete stat",
        resourceId: deleteId,
      });
      setDeleteId(null);
      await reloadStats();
    } catch {
      setStatStatus("error");
    } finally {
      setDeleting(false);
    }
  }

  async function moveStat(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= stats.length) return;
    const ordered = [...stats];
    const a = ordered[index]!;
    const b = ordered[next]!;
    ordered[index] = b;
    ordered[next] = a;
    await reorderItems(
      "athleteStats",
      ordered.map((s) => s.id),
    );
    await reloadStats();
  }

  async function toggleVisible(stat: AthleteStat) {
    await updateItem("athleteStats", stat.id, { visible: !stat.visible });
    await reloadStats();
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Athlete" description="Edit athlete profile and statistics." />

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input
              className={inputClass}
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </Field>
          <Field label="Professional title">
            <input
              className={inputClass}
              value={profile.professionalTitle}
              onChange={(e) => setProfile((p) => ({ ...p, professionalTitle: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Short biography">
          <textarea
            className={inputClass}
            rows={3}
            value={profile.shortBiography}
            onChange={(e) => setProfile((p) => ({ ...p, shortBiography: e.target.value }))}
          />
        </Field>
        <Field label="Full biography">
          <RichTextEditor
            value={profile.fullBiography}
            onChange={(html) => setProfile((p) => ({ ...p, fullBiography: html }))}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["nationality", "Nationality"],
              ["yearsActive", "Years active"],
              ["maximumDepth", "Maximum depth"],
              ["competitionsCount", "Competitions count"],
              ["podiumsCount", "Podiums count"],
              ["countriesVisited", "Countries visited"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputClass}
                value={profile[key]}
                onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
              />
            </Field>
          ))}
        </div>
        <ImageUploader
          label="Profile image"
          folder="athlete"
          value={(profile.profileImage as UploadedImage) || null}
          onChange={(img) => setProfile((p) => ({ ...p, profileImage: img }))}
        />
        <FormStatus status={status} />
        <button type="button" className={btnPrimary} onClick={() => void saveProfile()}>
          Save profile
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Statistics</h2>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {stats.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">No stats yet.</li>
          )}
          {stats.map((s, index) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-900">{s.number}</span>
              <span className="min-w-0 flex-1 text-slate-600">{s.label}</span>
              <span className="text-xs text-slate-400">{s.visible ? "Visible" : "Hidden"}</span>
              <button type="button" className={btnSecondary} onClick={() => void moveStat(index, -1)}>
                Up
              </button>
              <button type="button" className={btnSecondary} onClick={() => void moveStat(index, 1)}>
                Down
              </button>
              <button type="button" className={btnSecondary} onClick={() => void toggleVisible(s)}>
                {s.visible ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setEditingStat(s.id);
                  setStatForm({
                    number: s.number,
                    label: s.label,
                    icon: s.icon,
                    order: s.order,
                    visible: s.visible,
                  });
                }}
              >
                Edit
              </button>
              <button type="button" className={btnDanger} onClick={() => setDeleteId(s.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Number">
            <input
              className={inputClass}
              value={statForm.number}
              onChange={(e) => setStatForm((f) => ({ ...f, number: e.target.value }))}
            />
          </Field>
          <Field label="Label">
            <input
              className={inputClass}
              value={statForm.label}
              onChange={(e) => setStatForm((f) => ({ ...f, label: e.target.value }))}
            />
          </Field>
          <Field label="Icon" hint="Optional icon key">
            <input
              className={inputClass}
              value={statForm.icon}
              onChange={(e) => setStatForm((f) => ({ ...f, icon: e.target.value }))}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={statForm.visible}
            onChange={(e) => setStatForm((f) => ({ ...f, visible: e.target.checked }))}
          />
          Visible
        </label>
        <FormStatus status={statStatus} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={() => void saveStat()}>
            {editingStat ? "Update statistic" : "Add statistic"}
          </button>
          {editingStat && (
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                setEditingStat(null);
                setStatForm(emptyStat());
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete statistic"
        message="This statistic will be permanently removed."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        loading={deleting}
      />
    </div>
  );
}
