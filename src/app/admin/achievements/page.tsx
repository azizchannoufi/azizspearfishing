"use client";

import { useCallback, useEffect, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import {
  createItem,
  deleteItem,
  listCollection,
  reorderItems,
  updateItem,
} from "@/lib/firebase/cms";
import { logActivity } from "@/lib/activity";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/admin/AuthProvider";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  PageHeader,
  Field,
  FormStatus,
  inputClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
} from "@/components/admin/ui";
import { PAGE_SIZE, type Achievement } from "@/lib/firebase/types";

type AchievementForm = Omit<Achievement, "id" | "createdAt" | "updatedAt">;

const emptyForm = (): AchievementForm => ({
  competitionName: "",
  year: "",
  location: "",
  country: "",
  position: "",
  score: "",
  category: "",
  description: "",
  image: null,
  featured: false,
  order: 0,
  published: true,
  visible: true,
});

export default function AchievementsAdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Achievement[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AchievementForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const result = await listCollection<Achievement>("achievements", {
        orderField: "order",
        orderDir: "asc",
        pageSize: PAGE_SIZE,
        cursor: reset ? undefined : cursor,
      });
      setItems((prev) => (reset ? result.items : [...prev, ...result.items]));
      setCursor(result.last);
      setHasMore(result.items.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof AchievementForm>(key: K, value: AchievementForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setStatus("saving");
    try {
      if (editingId) {
        await updateItem("achievements", editingId, form);
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "updated",
          resource: "achievement",
          resourceId: editingId,
        });
      } else {
        const order = form.order || items.length;
        const id = await createItem("achievements", { ...form, order });
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "created",
          resource: "achievement",
          resourceId: id,
        });
      }
      setStatus("success");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      setCursor(undefined);
      await load(true);
    } catch {
      setStatus("error");
    }
  }

  async function duplicate(item: Achievement) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = item;
    const id = await createItem("achievements", {
      ...rest,
      competitionName: `${rest.competitionName} (copy)`,
      order: items.length,
    });
    await logActivity(getClientDb(), {
      userId: user?.uid || "",
      userName: user?.displayName || user?.email || "Admin",
      action: "created",
      resource: "achievement",
      resourceId: id,
    });
    setCursor(undefined);
    await load(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteItem("achievements", deleteId);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "deleted",
        resource: "achievement",
        resourceId: deleteId,
      });
      setDeleteId(null);
      setCursor(undefined);
      await load(true);
    } finally {
      setDeleting(false);
    }
  }

  async function moveItem(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const ordered = [...items];
    const a = ordered[index]!;
    const b = ordered[next]!;
    ordered[index] = b;
    ordered[next] = a;
    await reorderItems(
      "achievements",
      ordered.map((i) => i.id),
    );
    setItems(ordered.map((item, order) => ({ ...item, order })));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setStatus("idle");
    setShowForm(true);
  }

  function openEdit(item: Achievement) {
    setEditingId(item.id);
    setForm({
      competitionName: item.competitionName || "",
      year: item.year || "",
      location: item.location || "",
      country: item.country || "",
      position: item.position || "",
      score: item.score || "",
      category: item.category || "",
      description: item.description || "",
      image: item.image || null,
      featured: !!item.featured,
      order: item.order ?? 0,
      published: !!item.published,
      visible: item.visible !== false,
    });
    setStatus("idle");
    setShowForm(true);
  }

  return (
    <div>
      <PageHeader
        title="Achievements"
        description="Manage competition results and accolades."
        actions={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            Add achievement
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            {editingId ? "Edit achievement" : "New achievement"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Competition name">
              <input
                className={inputClass}
                value={form.competitionName}
                onChange={(e) => set("competitionName", e.target.value)}
              />
            </Field>
            <Field label="Year">
              <input className={inputClass} value={form.year} onChange={(e) => set("year", e.target.value)} />
            </Field>
            <Field label="Location">
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </Field>
            <Field label="Country">
              <input
                className={inputClass}
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </Field>
            <Field label="Position">
              <input
                className={inputClass}
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
              />
            </Field>
            <Field label="Score">
              <input className={inputClass} value={form.score} onChange={(e) => set("score", e.target.value)} />
            </Field>
            <Field label="Category">
              <input
                className={inputClass}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </Field>
            <Field label="Order">
              <input
                className={inputClass}
                type="number"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              className={inputClass}
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <ImageUploader
            label="Image"
            folder="achievements"
            value={(form.image as UploadedImage) || null}
            onChange={(img) => set("image", img)}
          />
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
              Published
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} />
              Visible
            </label>
          </div>
          <FormStatus status={status} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => void save()}>
              Save
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading && items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No achievements yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {item.competitionName}{" "}
                    <span className="font-normal text-slate-500">({item.year})</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.position || "—"} · {item.location || "—"} · order {item.order}
                    {item.featured ? " · Featured" : ""}
                    {!item.published ? " · Draft" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnSecondary} onClick={() => void moveItem(index, -1)}>
                    Up
                  </button>
                  <button type="button" className={btnSecondary} onClick={() => void moveItem(index, 1)}>
                    Down
                  </button>
                  <button type="button" className={btnSecondary} onClick={() => openEdit(item)}>
                    Edit
                  </button>
                  <button type="button" className={btnSecondary} onClick={() => void duplicate(item)}>
                    Duplicate
                  </button>
                  <button type="button" className={btnDanger} onClick={() => setDeleteId(item.id)}>
                    Delete
                  </button>
                </div>
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

      <ConfirmDialog
        open={!!deleteId}
        title="Delete achievement"
        message="This achievement will be permanently removed."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
