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
import {
  PAGE_SIZE,
  sponsorTierSchema,
  type Sponsor,
  type SponsorTier,
} from "@/lib/firebase/types";

type SponsorForm = Omit<Sponsor, "id" | "createdAt" | "updatedAt">;

const TIERS = sponsorTierSchema.options;

const emptyForm = (): SponsorForm => ({
  name: "",
  logoUrl: "",
  cloudinaryPublicId: "",
  description: "",
  website: "",
  instagram: "",
  category: "",
  tier: "Supporter",
  featured: false,
  active: true,
  visible: true,
  order: 0,
});

export default function SponsorsAdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Sponsor[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SponsorForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const result = await listCollection<Sponsor>("sponsors", {
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

  function set<K extends keyof SponsorForm>(key: K, value: SponsorForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function logoValue(): UploadedImage | null {
    if (!form.logoUrl || !form.cloudinaryPublicId) return null;
    return { secureUrl: form.logoUrl, publicId: form.cloudinaryPublicId };
  }

  async function save() {
    setStatus("saving");
    try {
      if (editingId) {
        await updateItem("sponsors", editingId, form);
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "updated",
          resource: "sponsor",
          resourceId: editingId,
        });
      } else {
        const order = form.order || items.length;
        const id = await createItem("sponsors", { ...form, order });
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "created",
          resource: "sponsor",
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

  async function duplicate(item: Sponsor) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = item;
    const id = await createItem("sponsors", {
      ...rest,
      name: `${rest.name} (copy)`,
      order: items.length,
    });
    await logActivity(getClientDb(), {
      userId: user?.uid || "",
      userName: user?.displayName || user?.email || "Admin",
      action: "created",
      resource: "sponsor",
      resourceId: id,
    });
    setCursor(undefined);
    await load(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteItem("sponsors", deleteId);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "deleted",
        resource: "sponsor",
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
      "sponsors",
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

  function openEdit(item: Sponsor) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      logoUrl: item.logoUrl || "",
      cloudinaryPublicId: item.cloudinaryPublicId || "",
      description: item.description || "",
      website: item.website || "",
      instagram: item.instagram || "",
      category: item.category || "",
      tier: item.tier || "Supporter",
      featured: !!item.featured,
      active: item.active !== false,
      visible: item.visible !== false,
      order: item.order ?? 0,
    });
    setStatus("idle");
    setShowForm(true);
  }

  return (
    <div>
      <PageHeader
        title="Sponsors"
        description="Manage partners and sponsor logos."
        actions={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            Add sponsor
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            {editingId ? "Edit sponsor" : "New sponsor"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Tier">
              <select
                className={inputClass}
                value={form.tier}
                onChange={(e) => set("tier", e.target.value as SponsorTier)}
              >
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <input
                className={inputClass}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </Field>
            <Field label="Website">
              <input
                className={inputClass}
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </Field>
            <Field label="Instagram">
              <input
                className={inputClass}
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
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
            label="Logo"
            folder="sponsors"
            value={logoValue()}
            onChange={(img) => {
              setForm((f) => ({
                ...f,
                logoUrl: img?.secureUrl || "",
                cloudinaryPublicId: img?.publicId || "",
              }));
            }}
          />
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
              Active
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
          <p className="p-6 text-sm text-slate-500">No sponsors yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                {item.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.logoUrl} alt="" className="h-10 w-10 rounded object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.tier} · {item.category || "—"}
                    {!item.active ? " · Inactive" : ""}
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
        title="Delete sponsor"
        message="This sponsor will be permanently removed."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
