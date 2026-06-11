import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CatalogSearch } from "../components/CatalogSearch";
import { PhotoCropper } from "../components/PhotoCropper";
import { useAddTarget } from "../hooks/useTargets";
import type { CatalogEntry, CropBox } from "../api/types";

type Mode = "new" | "variant";

export function AddPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("variant");
  const [picked, setPicked] = useState<CatalogEntry | null>(null);
  const [refLabel, setRefLabel] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<CropBox | null>(null);
  const [showCropper, setShowCropper] = useState(true);

  const add = useAddTarget();

  const handleFile = (f: File | null) => {
    setFile(f);
    setCrop(null);
    setShowCropper(true);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  };

  const onPickEntry = (entry: CatalogEntry) => {
    setPicked(entry);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !picked || !picked.invno) return;
    const label = mode === "variant" ? (refLabel.trim() || defaultRefLabel()) : undefined;
    const result = await add.mutateAsync({
      imageFile: file,
      invno: picked.invno,
      refLabel: label,
      crop: showCropper && crop ? crop : undefined,
    });
    navigate(`/detail/${encodeURIComponent(result.target_id)}`);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex rounded-md border border-barnes-ink/20 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setMode("variant")}
          className={`flex-1 py-2.5 ${mode === "variant" ? "bg-barnes-ink text-barnes-paper" : ""}`}
        >
          Add variant
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`flex-1 py-2.5 ${mode === "new" ? "bg-barnes-ink text-barnes-paper" : ""}`}
        >
          New object
        </button>
      </div>

      {mode === "variant" ? (
        <p className="text-xs text-barnes-ink/60">
          Pick the artwork by inventory number (e.g. <code className="font-mono">A305</code>) or
          title, then upload a gallery-angle photo. Existing object stays untouched; this lands
          as a <code className="font-mono">__REF_</code> variant.
        </p>
      ) : (
        <p className="text-xs text-barnes-ink/60">
          New objects are unusual in the staff app — most adds are variants of existing catalog
          entries. Use this when registering an object that doesn't have a catalog id yet.
        </p>
      )}

      {!picked ? (
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-barnes-ink/60">
            Find object
          </label>
          <CatalogSearch onSelect={onPickEntry} />
        </div>
      ) : (
        <div className="space-y-2 border border-barnes-ink/15 rounded-md p-3 bg-barnes-ink/5">
          <div className="flex items-start gap-3">
            {picked.cdn_url && (
              <img
                src={picked.cdn_url}
                alt=""
                className="w-20 h-20 object-cover rounded bg-white shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-barnes-ink/60">{picked.invno}</span>
                <span className="text-xs text-barnes-ink/40">id {picked.id}</span>
              </div>
              <div className="font-medium">{picked.title ?? "(untitled)"}</div>
              <div className="text-xs text-barnes-ink/70">
                {[picked.people, picked.classification, picked.culture]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {picked.locations && (
                <div className="text-xs text-barnes-ink/50 truncate mt-1">
                  {picked.locations}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="text-xs text-barnes-ink/60 hover:text-barnes-ink underline shrink-0"
            >
              change
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wide text-barnes-ink/60">
          Photo
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        {preview && showCropper && (
          <>
            <PhotoCropper src={preview} onCropChange={setCrop} />
            <div className="flex items-center justify-between text-xs text-barnes-ink/60">
              <span>
                Drag inside the box to move; drag the edges to resize. Server crops on upload.
                {crop ? (
                  <span className="ml-2 font-mono text-barnes-ink/50">
                    {crop.w}×{crop.h} at ({crop.x}, {crop.y})
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => setShowCropper(false)}
                className="underline hover:text-barnes-ink"
              >
                use full image
              </button>
            </div>
          </>
        )}
        {preview && !showCropper && (
          <>
            <img
              src={preview}
              alt="preview"
              className="w-full max-h-80 object-contain border border-barnes-ink/10 rounded"
            />
            <div className="flex items-center justify-between text-xs text-barnes-ink/60">
              <span>Uploading full image as-is, no crop.</span>
              <button
                type="button"
                onClick={() => setShowCropper(true)}
                className="underline hover:text-barnes-ink"
              >
                crop instead
              </button>
            </div>
          </>
        )}
      </div>

      {mode === "variant" && (
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-barnes-ink/60">
            Variant label (optional)
          </label>
          <input
            className="input"
            value={refLabel}
            onChange={(e) => setRefLabel(e.target.value)}
            placeholder={defaultRefLabel()}
          />
          <p className="text-xs text-barnes-ink/50">
            Stored as{" "}
            <code className="font-mono">
              {picked?.id ?? "{id}"}__REF_{refLabel.trim() || defaultRefLabel()}
            </code>
            .
          </p>
        </div>
      )}

      {add.error && (
        <p className="text-sm text-red-700">{(add.error as Error).message}</p>
      )}

      <button
        type="submit"
        disabled={!file || !picked || !picked.invno || add.isPending}
        className="btn-primary w-full"
      >
        {add.isPending
          ? "Uploading…"
          : mode === "variant"
          ? `Add variant for ${picked?.invno ?? "…"}`
          : "Add object"}
      </button>

      {mode === "new" && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          New objects require a catalog entry that maps inv_no to an id. If
          the object isn't in the catalog yet, get it added there first (TMS
          / focus-collection.json) before adding here.
        </p>
      )}
    </form>
  );
}

function defaultRefLabel(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
