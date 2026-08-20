import { useCallback, useState, useRef } from "react";
import { requireSupabase } from "../../lib/supabase";
import "./admin-shared.css";

interface Props {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  bucket = "sb-assets-public",
  folder = "cms",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const sb = requireSupabase();
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${folder}/${Date.now()}.${ext}`;
        const { error } = await sb.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        const {
          data: { publicUrl },
        } = sb.storage.from(bucket).getPublicUrl(path);
        onChange(publicUrl);
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, onChange],
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
    </div>
  );
}
