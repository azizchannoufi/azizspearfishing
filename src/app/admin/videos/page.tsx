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
import { PAGE_SIZE, type VideoItem } from "@/lib/firebase/types";

type VideoForm = Omit<VideoItem, "id" | "createdAt" | "updatedAt" | "views" | "clicks">;

const emptyForm = (): VideoForm => ({
  title: "",
  youtubeUrl: "",
  videoUrl: "",
  videoPublicId: "",
  thumbnail: null,
  description: "",
  category: "",
  date: "",
  featured: false,
  published: true,
  visible: true,
  order: 0,
});

export default function VideosAdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<VideoItem[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<VideoForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const result = await listCollection<VideoItem>("videos", {
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

  function set<K extends keyof VideoForm>(key: K, value: VideoForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setStatus("saving");
    try {
      if (editingId) {
        await updateItem("videos", editingId, form);
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "updated",
          resource: "video",
          resourceId: editingId,
        });
      } else {
        const order = form.order || items.length;
        const id = await createItem("videos", { ...form, order, views: 0, clicks: 0 });
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "created",
          resource: "video",
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

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteItem("videos", deleteId);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "deleted",
        resource: "video",
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
      "videos",
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

  function openEdit(item: VideoItem) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      youtubeUrl: item.youtubeUrl || "",
      videoUrl: item.videoUrl || "",
      videoPublicId: item.videoPublicId || "",
      thumbnail: item.thumbnail || null,
      description: item.description || "",
      category: item.category || "",
      date: item.date || "",
      featured: !!item.featured,
      published: !!item.published,
      visible: item.visible !== false,
      order: item.order ?? 0,
    });
    setStatus("idle");
    setShowForm(true);
  }

  return (
    <div>
      <PageHeader
        title="Videos"
        description="Upload video files or paste YouTube links. Add an optional thumbnail."
        actions={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            Add video
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            {editingId ? "Edit video" : "New video"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="YouTube URL (optional)">
              <input
                className={inputClass}
                value={form.youtubeUrl}
                onChange={(e) => set("youtubeUrl", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </Field>
            <Field label="Category">
              <input
                className={inputClass}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </Field>
            <Field label="Date">
              <input
                className={inputClass}
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
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
            kind="video"
            label="Video file"
            folder="videos"
            value={
              form.videoUrl && form.videoPublicId
                ? { secureUrl: form.videoUrl, publicId: form.videoPublicId }
                : null
            }
            onChange={(media) => {
              set("videoUrl", media?.secureUrl || "");
              set("videoPublicId", media?.publicId || "");
            }}
          />
          <ImageUploader
            label="Thumbnail (optional)"
            folder="videos"
            value={(form.thumbnail as UploadedImage) || null}
            onChange={(img) => set("thumbnail", img)}
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
          <p className="p-6 text-sm text-slate-500">No videos yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.category || "—"} · {item.date || "—"} ·{" "}
                    {item.videoUrl
                      ? "Uploaded video"
                      : item.youtubeUrl || "No media"}
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
        title="Delete video"
        message="This video will be permanently removed."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
