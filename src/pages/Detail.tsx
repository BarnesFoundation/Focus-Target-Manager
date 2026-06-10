import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useDeleteTarget, useTargetDetail, useTargetList } from "../hooks/useTargets";

export function DetailPage() {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();
  const { targets } = useAuth();
  const detail = useTargetDetail(targetId ?? null);
  const list = useTargetList();
  const del = useDeleteTarget();

  if (!targetId) return <p>Missing target ID.</p>;
  if (detail.isLoading) return <p className="text-barnes-ink/60 text-sm">Loading…</p>;
  if (detail.error) {
    return (
      <p className="text-red-700 text-sm">
        Failed: {(detail.error as Error).message}
      </p>
    );
  }
  if (!detail.data) return null;

  const d = detail.data;
  const group = list.data?.items.find(
    (g) => g.base_target_id === targetId || g.object_id === d.object_id
  );

  const onDelete = async (idToDelete: string) => {
    if (!confirm(`Delete ${idToDelete}? This removes it from the engine immediately.`)) {
      return;
    }
    await del.mutateAsync(idToDelete);
    if (idToDelete === targetId) navigate("/");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">{d.name || d.object_id}</h1>
        <p className="text-xs text-barnes-ink/60 font-mono">{d.target_id}</p>
      </header>

      <img
        src={targets.previewUrl(d.target_id)}
        alt={d.target_id}
        className="w-full max-h-96 object-contain border border-barnes-ink/10 rounded"
      />

      <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        <dt className="text-barnes-ink/60">Object ID</dt>
        <dd className="font-mono">{d.object_id}</dd>
        <dt className="text-barnes-ink/60">Variant?</dt>
        <dd>{d.is_variant ? d.ref_label : "base"}</dd>
        <dt className="text-barnes-ink/60">Descriptors</dt>
        <dd>{d.descriptor_count.toLocaleString()}</dd>
        <dt className="text-barnes-ink/60">Image</dt>
        <dd>
          {d.image_width && d.image_height ? `${d.image_width}×${d.image_height}` : "—"}
        </dd>
        <dt className="text-barnes-ink/60">In FAISS?</dt>
        <dd>{d.faiss_present ? "yes" : "no"}</dd>
      </dl>

      {group && group.ref_variants.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-barnes-ink/60">
            Variants
          </h2>
          <ul className="divide-y divide-barnes-ink/10">
            {group.ref_variants.map((v) => (
              <li key={v.target_id} className="flex items-center justify-between py-2">
                <Link
                  to={`/detail/${encodeURIComponent(v.target_id)}`}
                  className="font-mono text-xs hover:underline"
                >
                  {v.ref_label}
                </Link>
                <button
                  className="text-xs text-red-700 hover:underline disabled:opacity-50"
                  onClick={() => onDelete(v.target_id)}
                  disabled={del.isPending}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-2 pt-4">
        <Link to="/add" className="btn-secondary flex-1 text-center">
          Add variant
        </Link>
        <button
          className="btn-secondary text-red-700 border-red-700/20"
          onClick={() => onDelete(d.target_id)}
          disabled={del.isPending}
        >
          {del.isPending ? "Removing…" : "Remove this"}
        </button>
      </div>
    </div>
  );
}
