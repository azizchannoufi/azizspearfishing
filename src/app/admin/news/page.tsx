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
import { RichTextEditor } from "@/components/admin/RichTextEditor";
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
import { PAGE_SIZE, type Article, type ArticleStatus } from "@/lib/firebase/types";

type ArticleForm = Omit<Article, "id" | "createdAt" | "updatedAt" | "views">;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const emptyForm = (): ArticleForm => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: null,
  category: "",
  author: "",
  seoTitle: "",
  seoDescription: "",
  tags: [],
  status: "draft",
  published: false,
  featured: false,
  visible: true,
  publishDate: "",
  order: 0,
});

export default function NewsAdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Article[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ArticleForm>(emptyForm());
  const [tagsText, setTagsText] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const result = await listCollection<Article>("articles", {
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

  function set<K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugManual ? f.slug : slugify(title),
    }));
  }

  function applyStatus(next: ArticleStatus) {
    setForm((f) => ({
      ...f,
      status: next,
      published: next === "published",
      publishDate:
        next === "published" && !f.publishDate
          ? new Date().toISOString().slice(0, 10)
          : f.publishDate,
    }));
  }

  async function save(nextStatus?: ArticleStatus) {
    setStatus("saving");
    try {
      const articleStatus = nextStatus || form.status;
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const slug = form.slug.trim() || slugify(form.title);
      const payload: ArticleForm = {
        ...form,
        slug,
        tags,
        status: articleStatus,
        published: articleStatus === "published",
        publishDate:
          articleStatus === "published" && !form.publishDate
            ? new Date().toISOString().slice(0, 10)
            : form.publishDate,
      };

      if (editingId) {
        await updateItem("articles", editingId, payload);
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "updated",
          resource: "article",
          resourceId: editingId,
        });
      } else {
        const order = form.order || items.length;
        const id = await createItem("articles", { ...payload, order, views: 0 });
        await logActivity(getClientDb(), {
          userId: user?.uid || "",
          userName: user?.displayName || user?.email || "Admin",
          action: "created",
          resource: "article",
          resourceId: id,
        });
      }
      setStatus("success");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      setTagsText("");
      setSlugManual(false);
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
      await deleteItem("articles", deleteId);
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "deleted",
        resource: "article",
        resourceId: deleteId,
      });
      setDeleteId(null);
      setCursor(undefined);
      await load(true);
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setTagsText("");
    setSlugManual(false);
    setStatus("idle");
    setShowForm(true);
  }

  function openEdit(item: Article) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      slug: item.slug || "",
      excerpt: item.excerpt || "",
      content: item.content || "",
      coverImage: item.coverImage || null,
      category: item.category || "",
      author: item.author || "",
      seoTitle: item.seoTitle || "",
      seoDescription: item.seoDescription || "",
      tags: item.tags || [],
      status: item.status || "draft",
      published: !!item.published,
      featured: !!item.featured,
      visible: item.visible !== false,
      publishDate: item.publishDate || "",
      order: item.order ?? 0,
    });
    setTagsText((item.tags || []).join(", "));
    setSlugManual(true);
    setStatus("idle");
    setShowForm(true);
  }

  return (
    <div>
      <PageHeader
        title="News"
        description="Write and publish journal articles."
        actions={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            New article
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            {editingId ? "Edit article" : "New article"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input className={inputClass} value={form.title} onChange={(e) => onTitleChange(e.target.value)} />
            </Field>
            <Field label="Slug" hint="Auto-generated from title when empty">
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  set("slug", e.target.value);
                }}
              />
            </Field>
            <Field label="Category">
              <input
                className={inputClass}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </Field>
            <Field label="Author">
              <input className={inputClass} value={form.author} onChange={(e) => set("author", e.target.value)} />
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => applyStatus(e.target.value as ArticleStatus)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </Field>
            <Field label="Publish date">
              <input
                className={inputClass}
                type="date"
                value={form.publishDate}
                onChange={(e) => set("publishDate", e.target.value)}
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
            <Field label="Tags" hint="Comma-separated">
              <input className={inputClass} value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
            </Field>
          </div>
          <Field label="Excerpt">
            <textarea
              className={inputClass}
              rows={2}
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
            />
          </Field>
          <Field label="Content">
            <RichTextEditor value={form.content} onChange={(html) => set("content", html)} />
          </Field>
          <ImageUploader
            label="Cover image"
            folder="articles"
            value={(form.coverImage as UploadedImage) || null}
            onChange={(img) => set("coverImage", img)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SEO title">
              <input
                className={inputClass}
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
              />
            </Field>
            <Field label="SEO description">
              <input
                className={inputClass}
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} />
              Visible
            </label>
          </div>
          <FormStatus status={status} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={() => void save("draft")}>
              Save Draft
            </button>
            <button type="button" className={btnPrimary} onClick={() => void save("published")}>
              Publish
            </button>
            {form.status === "published" && (
              <button type="button" className={btnSecondary} onClick={() => void save("draft")}>
                Unpublish
              </button>
            )}
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
          <p className="p-6 text-sm text-slate-500">No articles yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.status} · /{item.slug} · {item.category || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
        title="Delete article"
        message="This article will be permanently removed."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
