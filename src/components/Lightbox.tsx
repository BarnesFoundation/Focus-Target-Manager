import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AuthImage } from "./AuthImage";

/**
 * App-wide image lightbox. Any image can open a full-size, viewport-scaled
 * overlay by calling `useLightbox().open(...)`. Two source modes:
 *   - {src}      a plain URL (e.g. the catalog CDN thumbnail)
 *   - {authPath} an engine API path that needs the bearer token (query
 *                frames, target previews) — rendered via AuthImage so the
 *                full bytes are fetched with auth. This re-fetches rather
 *                than reusing the thumbnail's blob URL, which sidesteps the
 *                revoke-on-unmount race entirely (query JPEGs are tiny).
 * Close: click the backdrop, click the X, or press Escape.
 */

type LightboxSource = { src: string } | { authPath: string };

interface LightboxApi {
  open: (source: LightboxSource, alt?: string) => void;
}

const LightboxCtx = createContext<LightboxApi>({ open: () => {} });

export function useLightbox(): LightboxApi {
  return useContext(LightboxCtx);
}

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<LightboxSource | null>(null);
  const [alt, setAlt] = useState<string>("");

  const open = useCallback((s: LightboxSource, a?: string) => {
    setSource(s);
    setAlt(a ?? "");
  }, []);

  const close = useCallback(() => setSource(null), []);

  useEffect(() => {
    if (!source) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [source, close]);

  return (
    <LightboxCtx.Provider value={{ open }}>
      {children}
      {source && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 cursor-zoom-out"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 text-white text-2xl leading-none hover:bg-white/20"
          >
            ×
          </button>
          <div className="max-h-[95vh] max-w-[95vw]">
            {"src" in source ? (
              <img
                src={source.src}
                alt={alt}
                className="max-h-[95vh] max-w-[95vw] object-contain rounded shadow-2xl"
              />
            ) : (
              <AuthImage
                path={source.authPath}
                alt={alt}
                className="max-h-[95vh] max-w-[95vw] object-contain rounded shadow-2xl"
                fallbackClassName="h-[60vh] w-[60vw] bg-white/10 rounded flex items-center justify-center text-white/60"
              />
            )}
          </div>
        </div>
      )}
    </LightboxCtx.Provider>
  );
}
