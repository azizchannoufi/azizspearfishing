"use client";

import { useCallback, useEffect, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import {
  createItem,
  deleteItem,
  listCollection,
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
import { PAGE_SIZE, type GalleryImage } from "@/lib/firebase/types";
import { cloudinaryThumb } from "@/lib/cloudinary/url";

export default function GalleryAdminPage() {
  const { user, getToken } = useAuth();
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const result = await listCollection<GalleryImage>("gallery", {
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

  async function onMultipleUploaded(images: UploadedImage[]) {
    const startOrder = items.length;
    for (let i = 0; i < images.length; i++) {
      const img = images[i]!;
      const id = await createItem("gallery", {
        title: "",
        category: "",
        date: new Date().toISOString().slice(0, 10),
        secureUrl: img.secureUrl,
        publicId: img.publicId,
        width: img.width,
        height: img.height,
        format: img.format,
        views: 0,
        featured: false,
        published: true,
        visible: true,
        order: startOrder + i,
      });
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "created",
        resource: "gallery image",
        resourceId: id,
      });
    }
    setCursor(undefined);
    await load(true);
  }

  async function saveEdit() {
    if (!editing) return;
    setStatus("saving");
    try {
      const { id, createdAt: _c, updatedAt: _u, ...payload } = editing;
      await updateItem("gallery", id, payload);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "updated",
        resource: "gallery image",
        resourceId: id,
      });
      setStatus("success");
      setEditing(null);
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
      const item = items.find((i) => i.id === deleteId);
      const token = await getToken();
      if (item?.publicId && token) {
        await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publicId: item.publicId }),
        });
      }
      await deleteItem("gallery", deleteId);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "deleted",
        resource: "gallery image",
        resourceId: deleteId,
      });
      setDeleteId(null);
      setCursor(undefined);
      await load(true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Gallery" description="Upload and manage gallery images." />

      <div className="mb-6">
        <ImageUploader
          label="Upload images"
          folder="gallery"
          multiple
          onMultipleUploaded={(imgs) => void onMultipleUploaded(imgs)}
        />
      </div>

      {editing && (
        <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Edit image</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                className={inputClass}
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <input
                className={inputClass}
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <input
                className={inputClass}
                type="date"
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
              />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              />
              Published
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.visible}
                onChange={(e) => setEditing({ ...editing, visible: e.target.checked })}
              />
              Visible
            </label>
          </div>
          <FormStatus status={status} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => void saveEdit()}>
              Save
            </button>
            <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && items.length === 0 ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No gallery images yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudinaryThumb(item.publicId, 480) || item.secureUrl}
                alt={item.title || "Gallery"}
                className="h-40 w-full object-cover"
              />
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.title || "Untitled"}
                </p>
                <p className="text-xs text-slate-500">
                  {item.category || "Uncategorized"} · {item.date || "—"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => {
                      setStatus("idle");
                      setEditing(item);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className={btnDanger} onClick={() => setDeleteId(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-4">
          <button type="button" className={btnSecondary} disabled={loading} onClick={() => void load(false)}>
            Load more
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete gallery image"
        message="This will remove the image from Cloudinary and the gallery."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
