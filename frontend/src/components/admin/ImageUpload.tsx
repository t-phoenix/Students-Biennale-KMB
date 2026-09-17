import { useCallback, useState, useRef } from "react";
import { requireSupabase } from "../../lib/supabase";
import "./admin-shared.css";

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** Public web-derivative bucket (default). */
  bucket?: string;
  /** Private originals bucket. */
  originalBucket?: string;
  folder?: string;
  /** Max edge length for the public derivative. */
  maxEdge?: number;
  /** JPEG quality for the public derivative. */
  quality?: number;
}

/** Build a web-ready JPEG/WebP blob in the browser before uploading. */
async function buildWebDerivative(
  file: File,
  maxEdge: number,
  quality: number,
): Promise<{ blob: Blob; ext: string; contentType: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
      "image/jpeg",
      quality,
    );
  });
  return { blob, ext: "jpg", contentType: "image/jpeg" };
}

export function ImageUpload({
  value,
  onChange,
  bucket = "sb-assets-public",
  originalBucket = "sb-assets-original",
  folder = "cms",
  maxEdge = 2048,
  quality = 0.82,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const sb = requireSupabase();
        const stamp = Date.now();
        const originalExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const originalPath = `${folder}/${stamp}.${originalExt}`;

        // 1) Keep the HD master in the private originals bucket
        const { error: originalErr } = await sb.storage
          .from(originalBucket)
          .upload(originalPath, file, {
            cacheControl: "31536000",
            upsert: false,
            contentType: file.type || "application/octet-stream",
          });
        if (originalErr) throw originalErr;

        // 2) Upload a compressed public derivative (same basename, .jpg)
        const derivative = await buildWebDerivative(file, maxEdge, quality);
        const publicPath = `${folder}/${stamp}.${derivative.ext}`;
        const { error: publicErr } = await sb.storage.from(bucket).upload(publicPath, derivative.blob, {
          cacheControl: "31536000",
          upsert: false,
          contentType: derivative.contentType,
        });
        if (publicErr) throw publicErr;

        const {
          data: { publicUrl },
        } = sb.storage.from(bucket).getPublicUrl(publicPath);
        onChange(publicUrl);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [bucket, originalBucket, folder, maxEdge, quality, onChange],
  );

  return (
    <div className="adm-upload">
      {value && (
        <img src={value} alt="" className="adm-upload__preview" />
      )}
      <button
        type="button"
        className="adm-btn adm-btn--secondary"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : value ? "Replace Image" : "Upload Image"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      {value && (
        <input
          className="adm-field__input adm-upload__url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL"
        />
      )}
      {error ? <p className="adm-field__error">{error}</p> : null}
    </div>
  );
}
