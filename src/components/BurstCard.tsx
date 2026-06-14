import { useState } from "react";
import { AuthImage } from "./AuthImage";
import { useLightbox } from "./Lightbox";
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
  const lightbox = useLightbox();
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

  const cat = burst.target_catalog;

  return (
    <div className="rounded-lg border border-barnes-ink/15 bg-white shadow-sm overflow-hidden">
      <header className="px-3 py-1.5 border-b border-barnes-ink/10 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
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
          <span className={`ml-auto ${isFinished ? "text-emerald-700" : "text-amber-700"}`}>
            ✔ {burst.vote!.label}
            {burst.vote!.suggest && ` → ${burst.vote!.suggest}`}
            {!isFinished && " (needs suggestion)"}
          </span>
        )}
      </header>

      {/* Horizontal body: proposed target | query frames (fill width) | vote panel */}
      <div className="flex items-start gap-3 p-3">
        {/* proposed target — narrow */}
        <div className="w-36 shrink-0">
          {cat?.cdn_url ? (
            <figure className="text-center">
              <img
                src={cat.cdn_url}
                alt=""
                loading="lazy"
                onClick={() => lightbox.open({ src: cat.cdn_url! }, cat.title ?? "")}
                className="w-full max-h-36 object-contain border-2 border-amber-500 bg-white rounded cursor-zoom-in"
              />
              <figcaption className="text-[11px] text-barnes-ink/70 mt-1 leading-tight">
                <span className="font-mono">{cat.invno ?? burst.best_target ?? "—"}</span>
                {cat.title && <div className="truncate" title={cat.title}>{cat.title}</div>}
                {cat.locations && (
                  <div className="text-barnes-ink/45 truncate" title={cat.locations}>
                    {cat.locations}
                  </div>
                )}
              </figcaption>
            </figure>
          ) : burst.best_target ? (
            <div className="border-2 border-amber-500 rounded p-2 text-[11px] text-barnes-ink/60 bg-barnes-ink/5 text-center">
              proposed<br />
              <span className="font-mono text-barnes-ink/80">{burst.best_target}</span>
            </div>
          ) : (
            <div className="border border-dashed border-barnes-ink/20 rounded p-2 text-[11px] text-barnes-ink/40 text-center h-24 flex items-center justify-center">
              no near-miss target
            </div>
          )}
        </div>

        {/* query frames — fill the wide middle, wrap, click to zoom */}
        <div className="flex-1 flex flex-wrap gap-2 content-start">
          {burst.stems.map((stem) => {
            const p = dashboard.burstFramePath(burst.bid, stem, burst.day);
            return (
              <AuthImage
                key={stem}
                path={p}
                alt={stem}
                onClick={() => lightbox.open({ authPath: p }, stem)}
                className="w-28 h-28 object-cover rounded border border-barnes-ink/10"
                fallbackClassName="w-28 h-28 rounded border border-barnes-ink/10 bg-barnes-ink/5"
              />
            );
          })}
        </div>

        {/* vote panel — fixed right column, 2-col button grid to keep it short */}
        <div className="w-64 shrink-0 flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {LABELS.map(({ key, label, tone }) => {
              const on = activeLabel === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={cast.isPending}
                  onClick={() => onVote(key)}
                  className={`text-xs px-2 py-1.5 rounded border text-left leading-tight ${on ? tone : "border-barnes-ink/20 text-barnes-ink/70 hover:bg-barnes-ink/5"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="invno / target_id — Enter = wrong artwork"
            value={suggest}
            onChange={(e) => setSuggest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggest.trim()) {
                e.preventDefault();
                onVote("wrong_artwork");
              }
            }}
            onBlur={() => {
              if (activeLabel === "wrong_artwork" && suggest.trim()) {
                onVote("wrong_artwork");
              }
            }}
            className="input text-xs"
          />
          {cast.error && (
            <span className="text-[11px] text-red-700">{(cast.error as Error).message}</span>
          )}
        </div>
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
