"use client";

import React, { useState, useRef } from "react";
import UserAvatar from "@/components/UserAvatar";
import { uploadPhotoToImgBB } from "@/lib/imgbb";
import { UploadCloud, Loader2, Trash2, CheckCircle2 } from "lucide-react";

interface PhotoDropzoneProps {
  name: string;
  avatarUrl?: string;
  avatarColor?: string;
  apiKey?: string;
  onPhotoChange: (url: string | undefined, statusMessage?: string) => void;
}

export default function PhotoDropzone({
  name,
  avatarUrl,
  avatarColor,
  apiKey,
  onPhotoChange,
}: PhotoDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hostedOnCloud, setHostedOnCloud] = useState(false);

  const processFile = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const result = await uploadPhotoToImgBB(file, apiKey);
      setHostedOnCloud(result.hostedOnImgBB);
      onPhotoChange(
        result.url,
        result.hostedOnImgBB
          ? "Photo uploaded to ImgBB cloud storage."
          : "Photo ready."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not process selected photo.";
      onPhotoChange(undefined, msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    await processFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-3.5 transition-all select-none ${
        isDragging
          ? "border-emerald-500 bg-emerald-50/70"
          : "border-slate-200 bg-slate-50/70 hover:border-emerald-300 hover:bg-emerald-50/30"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => processFile(e.target.files?.[0])}
        className="hidden"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            name={name || "M"}
            avatarUrl={avatarUrl}
            avatarColor={avatarColor}
            size="lg"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-900 truncate">
                {uploading
                  ? "Uploading to ImgBB..."
                  : avatarUrl
                  ? "Profile Photo Attached"
                  : "Upload or Drop Photo"}
              </p>
              {avatarUrl && !uploading && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 truncate">
              {uploading
                ? "Optimizing & syncing..."
                : hostedOnCloud
                ? "Hosted on ImgBB Cloud"
                : "Drag & drop image here, or tap to browse"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {uploading ? (
            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
              <UploadCloud className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Browse</span>
            </span>
          )}

          {avatarUrl && !uploading && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
                setHostedOnCloud(false);
                onPhotoChange(undefined, "Profile photo removed.");
              }}
              title="Remove profile photo"
              aria-label="Remove profile photo"
              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
