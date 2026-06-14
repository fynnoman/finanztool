"use client";

import { useState } from "react";
import { uploadLogo, removeLogo } from "./actions";

export function LogoUploader({ existing }: { existing: string | null }) {
  const [preview, setPreview] = useState<string | null>(existing);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <img src={preview} alt="Logo" className="h-20 w-auto rounded-md border border-ink-100 bg-white p-2" />
      ) : (
        <div className="grid h-20 w-32 place-items-center rounded-md border border-dashed border-ink-200 text-xs text-ink-400">
          Kein Logo
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={onFile} className="text-sm" />
        <form
          action={async (fd: FormData) => {
            if (!preview) return;
            fd.set("logoDataUrl", preview);
            await uploadLogo(fd);
          }}
        >
          <button type="submit" className="btn btn-primary" disabled={!preview || preview === existing}>
            Logo speichern
          </button>
        </form>
        {existing && (
          <form action={removeLogo}>
            <button type="submit" className="btn btn-danger">Entfernen</button>
          </form>
        )}
      </div>
      <p className="text-xs text-ink-400">PNG, JPG oder SVG · empfohlen quadratisch, max 3 MB.</p>
    </div>
  );
}
