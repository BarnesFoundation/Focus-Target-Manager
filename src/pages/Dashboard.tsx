import { useEffect, useMemo, useRef, useState } from "react";
import { BurstCard } from "../components/BurstCard";
import { StatsPanel } from "../components/StatsPanel";
import {
  useDashboardBuckets,
  useDashboardStats,
  useInfiniteBursts,
  useReplayStatus,
  useTriggerReplay,
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
  const [replayJobId, setReplayJobId] = useState<string | null>(null);

  const statsQ = useDashboardStats(start, end);
  const bucketsQ = useDashboardBuckets(start, end);
  const burstsQ = useInfiniteBursts({
    start, end, bucket, hide_voted: hideVoted, limit: 25,
  });
  const triggerReplay = useTriggerReplay();
  const replayQ = useReplayStatus(replayJobId);

  const items = useMemo(
    () => burstsQ.data?.pages.flatMap((p) => p.items) ?? [],
    [burstsQ.data]
  );
  const total = burstsQ.data?.pages[0]?.pagination.total ?? 0;

  const setRange = (s: string, e: string) => { setStart(s); setEnd(e); };

  // Infinite-scroll sentinel.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && burstsQ.hasNextPage && !burstsQ.isFetchingNextPage) {
          burstsQ.fetchNextPage();
        }
      },
      { rootMargin: "800px 0px" } // prefetch well before the sentinel is visible
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [burstsQ.hasNextPage, burstsQ.isFetchingNextPage, burstsQ.fetchNextPage]);

  const onRunChecker = async () => {
    const job = await triggerReplay.mutateAsync({ start, end });
    setReplayJobId(job.job_id);
  };

  const replayBusy =
    triggerReplay.isPending ||
    (!!replayQ.data && replayQ.data.status !== "succeeded" && replayQ.data.status !== "failed");

  const bucketChips = useMemo(() => {
    const list = bucketsQ.data?.buckets ?? [];
    return [
      { bucket: null as string | null, count: list.reduce((a, b) => a + b.count, 0) },
      ...list.map((b) => ({ bucket: b.bucket, count: b.count })),
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
          <DateInput label="Start" value={start} onChange={setStart} />
          <DateInput label="End" value={end} onChange={setEnd} />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={hideVoted}
              onChange={(e) => setHideVoted(e.target.checked)}
            />
            Hide already-voted
          </label>
          <div className="ml-auto flex items-center gap-2">
            {replayQ.data && (
              <span className="text-xs text-barnes-ink/60">
                checker: {replayQ.data.status}
                {replayQ.data.done_days && replayQ.data.days &&
                  ` (${replayQ.data.done_days.length}/${replayQ.data.days.length} days)`}
              </span>
            )}
            <button
              type="button"
              onClick={onRunChecker}
              disabled={replayBusy}
              className="btn-secondary text-xs"
              title="Re-run the near-miss funnel replay for the selected range so failed bursts get a bucket + proposed target. The cron job lags one day."
            >
              {replayBusy ? "Running near-miss checker…" : "Run near-miss checker"}
            </button>
          </div>
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
                onClick={() => setBucket(b.bucket)}
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
            {hideVoted && " (Everything here is adjudicated — toggle “Hide already-voted” off to review decisions.)"}
          </p>
        )}
        {items.length > 0 && (
          <p className="text-xs text-barnes-ink/40">
            showing {items.length} of {total} {hideVoted ? "un-adjudicated " : ""}bursts
          </p>
        )}

        <div className="space-y-3">
          {items.map((b) => (
            <BurstCard key={`${b.day}:${b.bid}`} burst={b} />
          ))}
        </div>

        {/* infinite-scroll sentinel */}
        <div ref={sentinelRef} className="h-8" />
        {burstsQ.isFetchingNextPage && (
          <p className="text-center text-sm text-barnes-ink/50 py-2">Loading more…</p>
        )}
        {!burstsQ.hasNextPage && items.length > 0 && (
          <p className="text-center text-xs text-barnes-ink/40 py-2">— end of queue —</p>
        )}
      </section>
    </div>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col">
      <span className="text-xs text-barnes-ink/60 mb-1">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="input" />
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
