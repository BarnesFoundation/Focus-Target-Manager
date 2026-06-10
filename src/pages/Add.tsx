import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddTarget } from "../hooks/useTargets";

type Mode = "new" | "variant";

export function AddPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("new");
  const [objectId, setObjectId] = useState("");
  const [name, setName] = useState("");
  const [refLabel, setRefLabel] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const add = useAddTarget();

  const handleFile = (f: File | null) => {
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !objectId.trim()) return;
    const result = await add.mutateAsync({
      imageFile: file,
      objectId: objectId.trim(),
      name: name.trim() || undefined,
      refLabel: mode === "variant" ? (refLabel.trim() || defaultRefLabel()) : undefined,
    });
    navigate(`/detail/${encodeURIComponent(result.target_id)}`);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex rounded-md border border-barnes-ink/20 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`flex-1 py-2.5 ${mode === "new" ? "bg-barnes-ink text-barnes-paper" : ""}`}
        >
          New object
        </button>
        <button
          type="button"
          onClick={() => setMode("variant")}
          className={`flex-1 py-2.5 ${mode === "variant" ? "bg-barnes-ink text-barnes-paper" : ""}`}
        >
          Add variant
        </button>
      </div>

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
        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-full max-h-80 object-contain border border-barnes-ink/10 rounded"
          />
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wide text-barnes-ink/60">
          Object ID
        </label>
        <input
          className="input"
          value={objectId}
          onChange={(e) => setObjectId(e.target.value)}
          placeholder="e.g. 4499"
          required
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {mode === "new" && (
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-barnes-ink/60">
            Display name (optional)
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Defaults to the object ID"
          />
        </div>
      )}

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
            Stored as <code className="font-mono">{objectId || "{object_id}"}__REF_
            {refLabel.trim() || defaultRefLabel()}</code>.
          </p>
        </div>
      )}

      {add.error && (
        <p className="text-sm text-red-700">
          {(add.error as Error).message}
        </p>
      )}

      <button
        type="submit"
        disabled={!file || !objectId.trim() || add.isPending}
        className="btn-primary w-full"
      >
        {add.isPending ? "Uploading…" : mode === "new" ? "Add object" : "Add variant"}
      </button>
    </form>
  );
}

function defaultRefLabel(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
