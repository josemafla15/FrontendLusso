"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadImagen } from "@/lib/api";

export default function ImageUploadSlot({
  label,
  value,
  onChange,
  carpeta = "catalogo",
  aspectRatio = "1 / 1",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  carpeta?: string;
  /** Proporción CSS real, ej. "800 / 750" -- se aplica tal cual como aspect-ratio */
  aspectRatio?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImagen(file, carpeta);
      onChange(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-charcoal/50">{label}</label>
      {value ? (
        <div className="mt-1.5 space-y-2">
          <div
            className="w-full overflow-hidden rounded-lg bg-charcoal/5"
            style={{ aspectRatio }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="size-full object-cover"
            />
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-charcoal/25 px-3 py-1.5 text-sm text-charcoal/60 hover:bg-charcoal/5">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Reemplazar
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
        </div>
      ) : (
        <label
          className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-charcoal/25 text-sm text-charcoal/60 hover:bg-charcoal/5"
          style={{ aspectRatio }}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Upload className="size-5" />
              Subir imagen
            </>
          )}
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      )}
    </div>
  );
}