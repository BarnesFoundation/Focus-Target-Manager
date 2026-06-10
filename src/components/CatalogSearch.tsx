import { useState } from "react";
import type { CatalogEntry } from "../api/types";
import { useCatalogLookup } from "../hooks/useTargets";

interface Props {
  onSelect: (entry: CatalogEntry) => void;
  placeholder?: string;
  initialQuery?: string;
}

export function CatalogSearch({ onSelect, placeholder, initialQuery }: Props) {
  const [q, setQ] = useState(initialQuery ?? "");
  const lookup = useCatalogLookup(q, 10);
  const items = lookup.data?.items ?? [];
  const queryActive = q.trim().length >= 1;

  return (
    <div className="space-y-2">
      <input
        type="search"
        inputMode="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? "Type invno (e.g. A305) or title"}
        className="input"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {queryActive && lookup.isLoading && (
        <p className="text-xs text-barnes-ink/50 px-2">Searching…</p>
      )}
      {queryActive && !lookup.isLoading && items.length === 0 && (
        <p className="text-xs text-barnes-ink/60 px-2">
          No catalog matches for {JSON.stringify(q.trim())}.
        </p>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-barnes-ink/10 border border-barnes-ink/10 rounded-md overflow-hidden">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onSelect(it)}
                className="w-full text-left flex items-center gap-3 p-2 hover:bg-barnes-ink/5"
              >
                {it.cdn_url ? (
                  <img
                    src={it.cdn_url}
                    alt=""
                    loading="lazy"
                    className="w-14 h-14 object-cover rounded bg-barnes-ink/5 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded bg-barnes-ink/5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-barnes-ink/60">
                      {it.invno ?? "—"}
                    </span>
                    <span className="text-xs text-barnes-ink/40">id {it.id}</span>
                  </div>
                  <div className="text-sm font-medium truncate">
                    {it.title ?? "(untitled)"}
                  </div>
                  <div className="text-xs text-barnes-ink/60 truncate">
                    {[it.people, it.classification, it.culture]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
