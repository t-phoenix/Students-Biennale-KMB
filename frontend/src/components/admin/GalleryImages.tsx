import { useRef, useState } from "react";
import { uploadCmsImage } from "./ImageUpload";
import "./admin-shared.css";

type Props = {
  urls: string[];
  onChange: (urls: string[]) => void;
};

/** One add control. Each click uploads a single image into the gallery list. */
export function GalleryImages({ urls, onChange }: Props) {
  const frames = urls.filter(Boolean);
  const framesRef = useRef(frames);
  framesRef.current = frames;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCmsImage(file);
      const next = [...framesRef.current, url];
      framesRef.current = next;
      onChange(next);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="adm-gallery">
      <span className="adm-field__label">Gallery</span>
      {frames.length ? (
        <ul className="adm-gallery__list">
          {frames.map((url, index) => (
            <li key={`${url}-${index}`} className="adm-gallery__item">
              <img src={url} alt="" />
              <button
                type="button"
                className="adm-btn adm-btn--ghost adm-btn--small adm-gallery__remove"
                onClick={() => onChange(frames.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        className="adm-btn adm-btn--secondary"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "+ Add gallery image"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void add(file);
        }}
      />
      {error ? <p className="adm-field__error">{error}</p> : null}
    </div>
  );
}
