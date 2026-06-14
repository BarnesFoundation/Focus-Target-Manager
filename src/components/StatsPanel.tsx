import type { DashboardStats } from "../api/types";

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function clsx(...parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function StatsPanel({
  stats,
  loading,
}: {
  stats: DashboardStats | undefined;
  loading: boolean;
}) {
  if (loading && !stats) {
    return (
      <div className="rounded-lg border border-barnes-ink/15 bg-barnes-ink/5 p-4 text-sm text-barnes-ink/60">
        Loading stats…
      </div>
    );
  }
  if (!stats) return null;
  const t = stats.totals;
  const v = stats.votes;
  const a = stats.accuracy;

  return (
    <div className="rounded-lg border border-barnes-ink/15 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-barnes-ink/10 border-b border-barnes-ink/10">
        <Metric label="Raw" value={pct(a.raw_rate)}
                hint={`${t.matched.toLocaleString()} of ${t.bursts.toLocaleString()} bursts`} />
        <Metric label="Intent-adjusted" value={pct(a.intent_adjusted_rate)}
                hint={`removes ${v.non_attempts} non-attempts`} />
        <Metric label="Ceiling" value={pct(a.arithmetic_ceiling)}
                hint={`if all ${v.finished_recoverable} recoverables land`} />
        <Metric label="Vote progress" value={`${v.progress_pct.toFixed(1)}%`}
                hint={`${v.voted_failed}/${t.failed} failed adjudicated`} />
      </div>
      <div className="p-3 text-xs text-barnes-ink/60 flex flex-wrap gap-3 border-b border-barnes-ink/10">
        <span><b>{t.bursts.toLocaleString()}</b> bursts</span>
        <span><b>{t.frames.toLocaleString()}</b> frames</span>
        <span className="text-emerald-700"><b>{t.matched.toLocaleString()}</b> matched</span>
        <span className="text-red-700"><b>{t.failed.toLocaleString()}</b> failed</span>
        <span><b>{v.total}</b> votes recorded</span>
      </div>
      {Object.keys(stats.buckets).length > 0 && (
        <div className="p-3 text-xs flex flex-wrap gap-2">
          {Object.entries(stats.buckets).map(([bucket, count]) => (
            <span key={bucket} className={clsx(
              "px-2 py-1 rounded border border-barnes-ink/15",
              count === 0 && "opacity-40"
            )}>
              <span className="font-mono">{bucket}</span>
              <span className="ml-1 text-barnes-ink/60">{count}</span>
            </span>
          ))}
        </div>
      )}
      <div className="px-3 pb-3 text-[11px] text-barnes-ink/40 italic">
        {a.ceiling_caveat}
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="p-3">
      <div className="text-xs uppercase tracking-wide text-barnes-ink/50">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-barnes-ink/50 mt-0.5">{hint}</div>}
    </div>
  );
}
