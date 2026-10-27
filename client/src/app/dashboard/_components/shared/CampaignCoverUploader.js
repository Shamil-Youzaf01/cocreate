"use client";

import { useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { InlineSpinner } from "@/components/loading-state";

export default function CampaignCoverUploader({
  coverImage,
  onUpload,
  onRemove,
  isUploading,
  disabled = false,
  error,
  progress = 0,
}) {
  const fileInput = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const unavailable = disabled || isUploading;
  const previewLoading =
    coverImage?.url &&
    loadedUrl !== coverImage.url &&
    failedUrl !== coverImage.url;
  return (
    <section className="rounded-2xl border border-card-border bg-card-background p-6">
      <h2 className="text-lg font-semibold text-text-primary">
        Campaign Cover
      </h2>
      <p className="mt-1 text-sm text-text-tertiary">
        Add an image that creators will see while browsing campaigns.
      </p>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={unavailable}
        aria-label="Choose campaign cover"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!unavailable) onUpload(file);
        }}
      />
      <div
        className="mt-5"
        onDragOver={(event) => {
          event.preventDefault();
          if (!unavailable) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!unavailable) onUpload(event.dataTransfer.files?.[0]);
        }}
      >
        {coverImage?.url ? (
          <div className="space-y-4">
            <div
              className={`relative overflow-hidden rounded-xl border bg-background-gray-secondary ${dragging ? "border-brand-500" : "border-card-border"}`}
            >
              <div className="aspect-[16/10]">
                {failedUrl === coverImage.url ? (
                  <p className="flex h-full items-center justify-center text-sm text-text-tertiary">
                    Image preview unavailable
                  </p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImage.url}
                    alt="Campaign cover preview"
                    onLoad={() => setLoadedUrl(coverImage.url)}
                    onError={() => setFailedUrl(coverImage.url)}
                    className="h-full w-full object-cover"
                  />
                )}
                {previewLoading && (
                  <div
                    role="status"
                    className="absolute inset-0 flex items-center justify-center gap-2 bg-background-gray-secondary text-sm text-text-tertiary"
                  >
                    <InlineSpinner />
                    Loading preview...
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={unavailable}
                onClick={onRemove}
                aria-label="Remove campaign image"
                className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
            <button
              type="button"
              disabled={unavailable}
              onClick={() => fileInput.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-background-gray-primary disabled:opacity-50"
            >
              {isUploading ? <InlineSpinner /> : <Upload size={16} />}
              {isUploading ? "Uploading..." : "Replace image"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={unavailable}
            onClick={() => fileInput.current?.click()}
            className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center transition disabled:opacity-60 ${dragging ? "border-brand-500 bg-brand-500/5" : "border-card-border bg-background-gray-primary/40 hover:border-brand-500"}`}
          >
            <span className="rounded-xl bg-card-background p-3 text-icon-secondary shadow-xs">
              {isUploading ? (
                <InlineSpinner className="size-[22px]" />
              ) : (
                <ImagePlus size={22} />
              )}
            </span>
            <span className="mt-4 text-sm font-medium text-text-primary">
              {isUploading
                ? "Uploading image..."
                : "Upload campaign cover or drop it here"}
            </span>
            <span className="mt-1 text-xs text-text-tertiary">
              JPG, PNG or WebP · Max 5 MB
            </span>
            <span className="mt-1 text-xs text-text-tertiary">
              Recommended: 1600 × 1000 px
            </span>
          </button>
        )}
      </div>
      {isUploading && (
        <div className="mt-4" role="status">
          <p className="text-xs text-text-tertiary">
            {progress === 100
              ? "Processing image..."
              : `Uploading image... ${progress}%`}
          </p>
          <progress
            aria-label="Image upload progress"
            max="100"
            value={progress}
            className="mt-2 h-2 w-full accent-brand-500"
          />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {error}
        </p>
      )}
    </section>
  );
}
