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
import { PAGE_SIZE, type Competition } from "@/lib/firebase/types";

type CompetitionForm = Omit<Competition, "id" | "createdAt" | "updatedAt">;

const emptyForm = (): CompetitionForm => ({
  name: "",
  date: "",
  location: "",
  country: "",
  description: "",
  position: "",
  score: "",
  participants: "",
  image: null,
  galleryIds: [],
  videoId: null,
  achievementId: null,
  featured: false,
  published: true,
  visible: true,
  order: 0,
});

export default function CompetitionsAdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Competition[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CompetitionForm>(emptyForm());
  const [galleryIdsText, setGalleryIdsText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const result = await listCollection<Competition>("competitions", {
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
    },
    [cursor],
  );

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof CompetitionForm>(key: K, value: CompetitionForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setStatus("saving");
    try {
      const galleryIds = galleryIdsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        ...form,
        galleryIds,
        videoId: form.videoId || null,
        achievementId: form.achievementId || null,
      };
      if (editingId) {
        await updateItem("competitions", editingId, payload);
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "updated",
          resource: "competition",
          resourceId: editingId,
        });
      } else {
        const order = form.order || items.length;
        const id = await createItem("competitions", { ...payload, order });
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "created",
          resource: "competition",
          resourceId: id,
        });
      }
      setStatus("success");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      setGalleryIdsText("");
      setCursor(undefined);
      await load(true);
    } catch {
      setStatus("error");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteItem("competitions", deleteId);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "deleted",
        resource: "competition",
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
      "competitions",
      ordered.map((i) => i.id),
    );
    setItems(ordered.map((item, order) => ({ ...item, order })));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setGalleryIdsText("");
    setStatus("idle");
    setShowForm(true);
  }

  function openEdit(item: Competition) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      date: item.date || "",
      location: item.location || "",
      country: item.country || "",
      description: item.description || "",
      position: item.position || "",
      score: item.score || "",
      participants: item.participants || "",
      image: item.image || null,
      galleryIds: item.galleryIds || [],
      videoId: item.videoId || null,
      achievementId: item.achievementId || null,
      featured: !!item.featured,
      published: !!item.published,
      visible: item.visible !== false,
      order: item.order ?? 0,
    });
    setGalleryIdsText((item.galleryIds || []).join(", "));
    setStatus("idle");
    setShowForm(true);
  }

  return (
    <div>
      <PageHeader
        title="Competitions"
        description="Manage competition entries linked to gallery and videos."
        actions={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            Add competition
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            {editingId ? "Edit competition" : "New competition"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Date">
              <input
                className={inputClass}
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
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
            <Field label="Participants">
              <input
                className={inputClass}
                value={form.participants}
                onChange={(e) => set("participants", e.target.value)}
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
            <Field label="Video ID">
              <input
                className={inputClass}
                value={form.videoId || ""}
                onChange={(e) => set("videoId", e.target.value || null)}
              />
            </Field>
            <Field label="Achievement ID">
              <input
                className={inputClass}
                value={form.achievementId || ""}
                onChange={(e) => set("achievementId", e.target.value || null)}
              />
            </Field>
          </div>
          <Field label="Gallery IDs" hint="Comma-separated gallery document IDs">
            <input
              className={inputClass}
              value={galleryIdsText}
              onChange={(e) => setGalleryIdsText(e.target.value)}
            />
          </Field>
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
            folder="competitions"
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
          <p className="p-6 text-sm text-slate-500">No competitions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.date || "—"} · {item.location || "—"} · {item.position || "—"}
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
        title="Delete competition"
        message="This competition will be permanently removed."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
