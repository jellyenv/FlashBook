"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

/** Drag-and-drop image uploader. Sends the file through /api/upload (Clerk-auth
 * proxy → backend → R2/local) and returns the stored URL. */
export function ImageUpload({
  onUploaded,
  currentUrl,
  label = "Drop an image or click to upload",
  className,
}: {
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(
    currentUrl ?? undefined,
  );

  async function upload(files: File[]) {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Upload failed");
      }
      setPreview(data.url);
      onUploaded(data.url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: upload,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/gif": [],
    },
    maxFiles: 1,
    disabled: busy,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius)] border-2 border-dashed border-input bg-muted/30 p-4 text-center transition-colors hover:border-brand hover:bg-brand-soft/30",
        isDragActive && "border-brand bg-brand-soft/50",
        className,
      )}
    >
      <input {...getInputProps()} aria-label="Upload image" />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Upload preview"
          className="max-h-40 w-full rounded-md object-cover"
        />
      ) : (
        <>
          <UploadCloud
            className="h-7 w-7 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, GIF · up to 10MB
          </p>
        </>
      )}
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius)] bg-background/70">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      )}
      {preview && !busy && (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-brand">
          <ImagePlus className="h-3 w-3" /> Replace
        </span>
      )}
    </div>
  );
}
