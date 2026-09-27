"use client";

import { useRef, useState, type DragEvent } from "react";
import { useAuth } from "./AuthProvider";
import { cloudinaryThumb } from "@/lib/cloudinary/url";
import { btnPrimary, btnSecondary } from "./ui";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/mpeg",
];
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export type UploadedImage = {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
};

type FileProgress = {
  name: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type MediaKind = "image" | "video";

async function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ImageUploader({
  folder = "general",
  value,
  onChange,
  multiple = false,
  onMultipleUploaded,
  label,
  kind = "image",
}: {
  folder?: string;
  value?: UploadedImage | null;
  onChange?: (value: UploadedImage | null) => void;
  multiple?: boolean;
  onMultipleUploaded?: (images: UploadedImage[]) => void;
  label?: string;
  kind?: MediaKind;
}) {
  const { getToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value?.secureUrl || null);
  const [meta, setMeta] = useState<string>("");
  const [progress, setProgress] = useState<FileProgress[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const isVideo = kind === "video";
  const allowed = isVideo ? VIDEO_TYPES : IMAGE_TYPES;
  const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  const title = label || (isVideo ? "Video" : "Image");
  const accept = isVideo ? "video/mp4,video/webm,video/quicktime,video/*" : allowed.join(",");
  const helpText = isVideo
    ? "MP4, WebM, or MOV · max 100MB"
    : "JPEG, PNG, WEBP, or AVIF · max 8MB";

  async function uploadOne(file: File, onProg: (n: number) => void): Promise<UploadedImage> {
    if (!allowed.includes(file.type) && !(isVideo && file.type.startsWith("video/"))) {
      throw new Error(
        isVideo ? "Use MP4, WebM, or MOV." : "Use JPEG, PNG, WEBP, or AVIF.",
      );
    }
    if (file.size > maxBytes) {
      throw new Error(isVideo ? "Video must be under 100MB." : "File must be under 8MB.");
    }

    const token = await getToken();
    if (!token) throw new Error("Your session has expired. Please log in again.");

    const signRes = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folder }),
    });
    if (!signRes.ok) {
      throw new Error(isVideo ? "Video upload failed." : "Image upload failed.");
    }
    const signed = await signRes.json();

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signed.apiKey);
    form.append("timestamp", String(signed.timestamp));
    form.append("signature", signed.signature);
    form.append("folder", signed.folder);

    const cloudName = signed.cloudName as string;
    const endpoint = isVideo ? "video" : "image";
    const xhr = new XMLHttpRequest();
    const result = await new Promise<UploadedImage>((resolve, reject) => {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProg(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve({
            secureUrl: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            format: data.format,
          });
        } else {
          reject(new Error(isVideo ? "Video upload failed." : "Image upload failed."));
        }
      };
      xhr.onerror = () =>
        reject(new Error(isVideo ? "Video upload failed." : "Image upload failed."));
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`);
      xhr.send(form);
    });

    return result;
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    const list = Array.from(files);
    setProgress(
      list.map((f) => ({ name: f.name, progress: 0, status: "pending" as const })),
    );

    const uploaded: UploadedImage[] = [];

    for (let i = 0; i < list.length; i++) {
      const file = list[i]!;
      setProgress((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: "uploading" } : p)),
      );
      try {
        if (!isVideo) {
          const dims = await loadImageDimensions(file);
          setMeta(`${(file.size / 1024).toFixed(0)} KB · ${dims.width}×${dims.height}`);
        } else {
          setMeta(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
        }
        const result = await uploadOne(file, (n) => {
          setProgress((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, progress: n } : p)),
          );
        });
        uploaded.push(result);
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, progress: 100, status: "done" } : p,
          ),
        );
        if (!multiple) {
          setPreview(result.secureUrl);
          onChange?.(result);
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : isVideo
              ? "Video upload failed."
              : "Image upload failed.";
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: "error", error: msg } : p,
          ),
        );
        setError(msg);
      }
    }

    if (multiple && uploaded.length) {
      onMultipleUploaded?.(uploaded);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete() {
    if (!value?.publicId) {
      onChange?.(null);
      setPreview(null);
      return;
    }
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    try {
      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId: value.publicId, resourceType: kind }),
      });
      onChange?.(null);
      setPreview(null);
      setMeta("");
    } catch {
      setError(isVideo ? "Unable to delete video." : "Unable to delete image.");
    } finally {
      setBusy(false);
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
  }

  const previewUrl = value?.secureUrl || preview;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {meta && <p className="text-xs text-slate-500">{meta}</p>}
      </div>

      {previewUrl && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {isVideo ? (
            <video
              src={previewUrl}
              controls
              className="h-48 w-full bg-black object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                value?.publicId
                  ? cloudinaryThumb(value.publicId, 640) || value.secureUrl
                  : previewUrl
              }
              alt="Preview"
              className="h-40 w-full object-cover"
            />
          )}
        </div>
      )}

      <div
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
          dragging
            ? "border-slate-800 bg-white"
            : "border-slate-300 bg-white/60 hover:border-slate-400"
        }`}
      >
        <p className="text-sm text-slate-700">
          {dragging
            ? `Drop ${isVideo ? "video" : "image"} here`
            : `Drag & drop ${isVideo ? "a video" : "an image"}, or`}
        </p>
        <button
          type="button"
          className={btnPrimary + " mt-3"}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {value
            ? isVideo
              ? "Replace video"
              : "Replace image"
            : multiple
              ? "Select files"
              : isVideo
                ? "Upload video"
                : "Upload image"}
        </button>
        <p className="mt-2 text-xs text-slate-500">{helpText}</p>
      </div>

      {value && (
        <button
          type="button"
          className={btnSecondary}
          disabled={busy}
          onClick={() => void handleDelete()}
        >
          {isVideo ? "Delete video" : "Delete image"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {progress.length > 0 && (
        <ul className="space-y-2">
          {progress.map((p) => (
            <li key={p.name} className="text-xs text-slate-600">
              <div className="mb-1 flex justify-between gap-2">
                <span className="truncate">{p.name}</span>
                <span>{p.status === "error" ? p.error : `${p.progress}%`}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-slate-200">
                <div
                  className={`h-full ${p.status === "error" ? "bg-red-500" : "bg-slate-800"}`}
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
