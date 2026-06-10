import { useState } from "react";
import { Link } from "react-router-dom";
import { useTargetList } from "../hooks/useTargets";

export function BrowsePage() {
  const [q, setQ] = useState("");
  const [hasRefsFilter, setHasRefsFilter] = useState<"any" | "with" | "without">("any");
  const { data, isLoading, error } = useTargetList({
    q: q.trim() || undefined,
    hasRefs:
      hasRefsFilter === "with" ? true : hasRefsFilter === "without" ? false : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          type="search"
          inputMode="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search object_id or name"
          className="input"
        />
        <div className="flex gap-2 text-xs">
          {(["any", "with", "without"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setHasRefsFilter(opt)}
              className={`px-3 py-1.5 rounded-full border ${
                hasRefsFilter === opt
                  ? "bg-barnes-ink text-barnes-paper border-barnes-ink"
                  : "border-barnes-ink/20 text-barnes-ink/70"
              }`}
            >
              {opt === "any" ? "all" : opt === "with" ? "with refs" : "no refs"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-barnes-ink/60 text-sm">Loading…</p>}
      {error && (
        <p className="text-red-700 text-sm">
          Failed to load: {(error as Error).message}
        </p>
      )}
      {data && (
        <p className="text-xs text-barnes-ink/50">
          {data.items.length} of {data.total} object{data.total === 1 ? "" : "s"}
        </p>
      )}

      <ul className="divide-y divide-barnes-ink/10">
        {data?.items.map((item) => (
          <li key={item.object_id}>
            <Link
              to={`/detail/${encodeURIComponent(item.base_target_id ?? item.object_id)}`}
              className="flex items-center justify-between py-3 hover:bg-barnes-ink/5 -mx-2 px-2 rounded"
            >
              <div>
                <div className="font-medium text-sm">{item.name || item.object_id}</div>
                <div className="text-xs text-barnes-ink/60">
                  {item.object_id}
                  {item.ref_variants.length > 0 && (
                    <span className="ml-2">
                      · {item.ref_variants.length} variant
                      {item.ref_variants.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-barnes-ink/40">
                {item.descriptor_count_total.toLocaleString()} desc
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
