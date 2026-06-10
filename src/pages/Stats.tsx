import { useAuth } from "../auth/AuthContext";
import { useIndexStats } from "../hooks/useTargets";

export function StatsPage() {
  const { targets } = useAuth();
  const { data, error, isLoading, refetch } = useIndexStats();

  const onReindex = async () => {
    if (!confirm("Trigger a full reindex? This runs in the background; queries keep working.")) {
      return;
    }
    await targets.reindex();
    refetch();
  };

  if (isLoading) return <p className="text-barnes-ink/60 text-sm">Loading…</p>;
  if (error) {
    return (
      <p className="text-red-700 text-sm">
        Failed: {(error as Error).message}
      </p>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        <dt className="text-barnes-ink/60">Engine</dt>
        <dd>{data.engine_version}</dd>
        <dt className="text-barnes-ink/60">Targets</dt>
        <dd>{data.target_count.toLocaleString()}</dd>
        <dt className="text-barnes-ink/60">Variants</dt>
        <dd>{data.ref_variant_count.toLocaleString()}</dd>
        <dt className="text-barnes-ink/60">Descriptors</dt>
        <dd>{data.descriptor_count_total.toLocaleString()}</dd>
        <dt className="text-barnes-ink/60">FAISS index</dt>
        <dd>{data.faiss_index_size ?? "—"}</dd>
        <dt className="text-barnes-ink/60">GPU VRAM</dt>
        <dd>{data.gpu_vram_mb != null ? `${data.gpu_vram_mb.toFixed(0)} MB` : "—"}</dd>
        <dt className="text-barnes-ink/60">Uptime</dt>
        <dd>{data.uptime_sec != null ? `${(data.uptime_sec / 60).toFixed(1)} min` : "—"}</dd>
      </dl>

      <section className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-barnes-ink/60">
          Auth
        </h2>
        <dl className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm">
          <dt className="text-barnes-ink/60">Mode</dt>
          <dd className="font-mono">{data.auth.mode}</dd>
          <dt className="text-barnes-ink/60">Tenant configured</dt>
          <dd>{data.auth.tenant_configured ? "yes" : "no"}</dd>
          <dt className="text-barnes-ink/60">Client configured</dt>
          <dd>{data.auth.client_configured ? "yes" : "no"}</dd>
          <dt className="text-barnes-ink/60">Extra audiences</dt>
          <dd>{data.auth.extra_audiences_count}</dd>
        </dl>
      </section>

      <div className="pt-2">
        <button className="btn-secondary" onClick={onReindex}>
          Trigger full reindex
        </button>
      </div>
    </div>
  );
}
