import { useMemo, useState } from "react";
import { BurstCard } from "../components/BurstCard";
import { StatsPanel } from "../components/StatsPanel";
import {
  useDashboardBuckets,
  useDashboardBursts,
  useDashboardStats,
} from "../hooks/useDashboard";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function DashboardPage() {
  const [start, setStart] = useState(daysAgo(0));
  const [end, setEnd] = useState(todayIso());
  const [bucket, setBucket] = useState<string | null>(null);
  const [hideVoted, setHideVoted] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 25;

  const statsQ = useDashboardStats(start, end);
  const bucketsQ = useDashboardBuckets(start, end);
  const burstsQ = useDashboardBursts({
    start, end, bucket, hide_voted: hideVoted, page, limit,
  });

  const totalPages = burstsQ.data?.pagination.pages ?? 0;
  const items = burstsQ.data?.items ?? [];

  const setRange = (s: string, e: string) => {
    setStart(s); setEnd(e); setPage(1);
  };

  const bucketChips = useMemo(() => {
    const items = bucketsQ.data?.buckets ?? [];
    return [
      { bucket: null as string | null, count: items.reduce((a, b) => a + b.count, 0) },
      ...items.map((b) => ({ bucket: b.bucket, count: b.count })),
    ];
  }, [bucketsQ.data]);

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <h1 className="text-lg font-semibold mr-auto">Accuracy dashboard</h1>
          <Quick label="Today" onClick={() => setRange(todayIso(), todayIso())} />
          <Quick label="Last 7d" onClick={() => setRange(daysAgo(6), todayIso())} />
          <Quick label="Last 30d" onClick={() => setRange(daysAgo(29), todayIso())} />
        </div>
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <DateInput label="Start" value={start} onChange={(v) => { setStart(v); setPage(1); }} />
          <DateInput label="End" value={end} onChange={(v) => { setEnd(v); setPage(1); }} />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={hideVoted}
              onChange={(e) => { setHideVoted(e.target.checked); setPage(1); }}
            />
            Hide already-voted
          </label>
        </div>
      </header>

      <StatsPanel stats={statsQ.data} loading={statsQ.isLoading} />

      <section className="space-y-2">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {bucketChips.map((b) => {
            const active = bucket === b.bucket;
            return (
              <button
                key={b.bucket ?? "__all__"}
                type="button"
                onClick={() => { setBucket(b.bucket); setPage(1); }}
                className={`px-2.5 py-1 rounded-full border ${
                  active
                    ? "bg-barnes-ink text-barnes-paper border-barnes-ink"
                    : "border-barnes-ink/20 text-barnes-ink/70 hover:bg-barnes-ink/5"
                }`}
              >
                {b.bucket ?? "all failed"}{" "}
                <span className={active ? "text-barnes-paper/70" : "text-barnes-ink/50"}>
                  {b.count}
                </span>
              </button>
            );
          })}
        </div>

        {burstsQ.isLoading && <p className="text-sm text-barnes-ink/60">Loading bursts…</p>}
        {burstsQ.error && (
          <p className="text-sm text-red-700">Failed: {(burstsQ.error as Error).message}</p>
        )}
        {!burstsQ.isLoading && items.length === 0 && (
          <p className="text-sm text-barnes-ink/60">
            No failed bursts in this view.
            {hideVoted && " (Toggle “Hide already-voted” off to include adjudicated ones.)"}
          </p>
        )}

        <div className="space-y-3">
          {items.map((b) => (
            <BurstCard key={`${b.day}:${b.bid}`} burst={b} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-3 text-xs">
            <button
              type="button"
              disabled={page <= 1 || burstsQ.isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary"
            >
              ← prev
            </button>
            <span className="text-barnes-ink/70">
              page {page} of {totalPages}
              {burstsQ.data && (
                <span className="text-barnes-ink/40 ml-2">
                  ({burstsQ.data.pagination.total} bursts)
                </span>
              )}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || burstsQ.isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-secondary"
            >
              next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col">
      <span className="text-xs text-barnes-ink/60 mb-1">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </label>
  );
}

function Quick({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-secondary text-xs">
      {label}
    </button>
  );
}
