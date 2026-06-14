import { useState } from "react";
import { AuthImage } from "./AuthImage";
import { useAuth } from "../auth/AuthContext";
import { useCastVote } from "../hooks/useDashboard";
import type { BurstSummary, VoteLabel } from "../api/types";

const LABELS: { key: VoteLabel; label: string; tone: string }[] = [
  { key: "false_negative", label: "👍 would've matched", tone: "bg-emerald-700 text-white border-emerald-700" },
  { key: "wrong_artwork", label: "↪ wrong artwork", tone: "bg-amber-600 text-white border-amber-600" },
  { key: "true_negative", label: "✓ correct reject", tone: "bg-barnes-ink text-barnes-paper border-barnes-ink" },
  { key: "non_attempt", label: "🚫 no intent", tone: "bg-zinc-500 text-white border-zinc-500" },
];

export function BurstCard({ burst }: { burst: BurstSummary }) {
  const { dashboard } = useAuth();
  const cast = useCastVote();
  const [suggest, setSuggest] = useState(burst.vote?.suggest ?? "");
  const [activeLabel, setActiveLabel] = useState<VoteLabel | null>(
    burst.vote?.label ?? null
  );
  const isVoted = !!burst.vote;
  const isFinished = !!burst.vote?.is_finished;

  const onVote = async (label: VoteLabel) => {
    setActiveLabel(label);
    await cast.mutateAsync({
      day: burst.day,
      bid: burst.bid,
      label,
      suggest: suggest.trim() || undefined,
    });
  };

  return (
    <div className="rounded-lg border border-barnes-ink/15 bg-white shadow-sm overflow-hidden">
      <header className="px-3 py-2 border-b border-barnes-ink/10 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        <span className={`px-2 py-0.5 rounded-full font-mono ${bucketTone(burst.bucket)}`}>
          {burst.bucket}
        </span>
        <span className="font-mono text-barnes-ink/40">{burst.bid.slice(0, 12)}</span>
        <span className="text-barnes-ink/50">{burst.frame_count} frames</span>
        <span className="text-barnes-ink/50">{new Date(burst.ts_first).toLocaleString()}</span>
        {burst.top1_cos != null && (
          <span className="text-barnes-ink/50">cos {burst.top1_cos.toFixed(2)}</span>
        )}
        {(burst.best_mean_score > 0 || burst.best_inliers > 0) && (
          <span className="text-barnes-ink/50">
            mean {burst.best_mean_score.toFixed(2)} · {burst.best_inliers} inliers
            {burst.consensus_count > 0 && ` · ${burst.consensus_count}/${burst.frame_count} agree`}
          </span>
        )}
        {isVoted && (
          <span className={`ml-auto text-xs ${isFinished ? "text-emerald-700" : "text-amber-700"}`}>
            ✔ {burst.vote!.label}
            {burst.vote!.suggest && ` → ${burst.vote!.suggest}`}
            {!isFinished && " (needs suggestion)"}
          </span>
        )}
      </header>

      <div className="p-3 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-3">
        <div>
          {burst.target_catalog?.cdn_url ? (
            <figure className="text-center">
              <img
                src={burst.target_catalog.cdn_url}
                alt=""
                loading="lazy"
                className="w-full max-h-56 object-contain border-2 border-amber-500 bg-white rounded"
              />
              <figcaption className="text-xs text-barnes-ink/70 mt-1">
                <span className="font-mono">{burst.target_catalog.invno ?? burst.best_target ?? "—"}</span>
                {burst.target_catalog.title && <> · {burst.target_catalog.title}</>}
                {burst.target_catalog.locations && (
                  <div className="text-[11px] text-barnes-ink/50 truncate" title={burst.target_catalog.locations}>
                    {burst.target_catalog.locations}
                  </div>
                )}
              </figcaption>
            </figure>
          ) : burst.best_target ? (
            <div className="border-2 border-amber-500 rounded p-3 text-xs text-barnes-ink/60 bg-barnes-ink/5 text-center">
              proposed target<br />
              <span className="font-mono text-barnes-ink/80">{burst.best_target}</span>
              <div className="text-[11px] text-barnes-ink/40 mt-1">no catalog enrichment</div>
            </div>
          ) : (
            <div className="border border-dashed border-barnes-ink/20 rounded p-3 text-xs text-barnes-ink/40 text-center">
              no near-miss target
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {burst.stems.map((stem) => (
            <AuthImage
              key={stem}
              path={dashboard.burstFramePath(burst.bid, stem, burst.day)}
              alt={stem}
              className="w-32 h-32 object-cover rounded border border-barnes-ink/10"
              fallbackClassName="w-32 h-32 rounded border border-barnes-ink/10 bg-barnes-ink/5"
            />
          ))}
        </div>
      </div>

      <div className="px-3 py-2 border-t border-barnes-ink/10 flex flex-col md:flex-row md:items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {LABELS.map(({ key, label, tone }) => {
            const on = activeLabel === key;
            return (
              <button
                key={key}
                type="button"
                disabled={cast.isPending}
                onClick={() => onVote(key)}
                className={`text-xs px-2 py-1 rounded border ${on ? tone : "border-barnes-ink/20 text-barnes-ink/70 hover:bg-barnes-ink/5"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="suggest invno or target_id (for wrong artwork)"
          value={suggest}
          onChange={(e) => setSuggest(e.target.value)}
          onBlur={() => {
            if (activeLabel === "wrong_artwork" && suggest.trim()) {
              onVote("wrong_artwork");
            }
          }}
          className="input md:max-w-xs text-xs"
        />
        {cast.error && (
          <span className="text-xs text-red-700">{(cast.error as Error).message}</span>
        )}
      </div>
    </div>
  );
}

function bucketTone(bucket: string): string {
  if (bucket === "would_match_live") return "bg-red-600 text-white";
  if (bucket === "would_match_wider_recall") return "bg-blue-600 text-white";
  if (bucket === "corner_gated") return "bg-amber-500 text-white";
  if (bucket === "lg_weak") return "bg-purple-600 text-white";
  if (bucket === "ransac_fail") return "bg-rose-700 text-white";
  if (bucket === "recall_only") return "bg-zinc-600 text-white";
  if (bucket === "no_recall_signal") return "bg-zinc-400 text-white";
  if (bucket === "matched") return "bg-emerald-700 text-white";
  return "bg-barnes-ink/10 text-barnes-ink/70";
}
