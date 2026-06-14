import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

interface Props {
  /** Engine API path that requires bearer auth, e.g.
   * `/api/manage/targets/4499/preview.jpg` or
   * `/api/manage/dashboard/bursts/{bid}/frame/{stem}.jpg?day=2026-06-13`. */
  path: string;
  alt?: string;
  className?: string;
  /** Optional fallback className when the preview is still loading or
   * unavailable (e.g. 401 in dev mode without a valid token). */
  fallbackClassName?: string;
  /** When set, the loaded image becomes clickable (zoom cursor) and
   * invokes this on click — used to open the lightbox. */
  onClick?: () => void;
}

/**
 * Auth-bearer-attached <img> for `/api/manage/targets/{id}/preview.jpg`.
 *
 * Browsers do NOT send Authorization headers on plain <img src=…> requests,
 * so when the engine is in OAuth mode that endpoint returns 401 on every
 * image load. This component fetches the JPEG bytes via the engine client
 * (which carries the MSAL bearer), wraps them in a blob URL, and feeds that
 * to a regular <img>. The blob URL is revoked on unmount / targetId change.
 */
export function AuthImage({ path, alt, className, fallbackClassName, onClick }: Props) {
  const { client } = useAuth();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setError(null);
    (async () => {
      try {
        const blob = await client.request<Blob>(path);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, client]);

  if (error) {
    return (
      <div className={fallbackClassName ?? className}>
        <span className="text-xs text-barnes-ink/50">preview unavailable</span>
      </div>
    );
  }
  if (!url) {
    return <div className={fallbackClassName ?? className} aria-busy="true" />;
  }
  return (
    <img
      src={url}
      alt={alt ?? ""}
      className={`${className ?? ""}${onClick ? " cursor-zoom-in" : ""}`}
      onClick={onClick}
    />
  );
}
