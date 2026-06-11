import { useCallback, useRef } from "react";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

import type { CropBox } from "../api/types";

interface Props {
  /** Object URL or data URL of the photo to crop. */
  src: string;
  /** Fires whenever the user finishes adjusting the crop box. Coords
   * are in the original image's natural pixel space — feed straight
   * into the engine's `crop_x/y/w/h` fields. */
  onCropChange: (crop: CropBox | null) => void;
  /** Optional initial crop. Omit for free-form. */
  initialCrop?: CropBox;
}

/**
 * Wraps react-cropper for the Add page. Returns crop coordinates in the
 * NATURAL (original) image pixel space via `cropper.getData(true)` — the
 * `true` flag tells cropperjs to round to integer pixels and report in
 * untransformed image coordinates, which is exactly what the engine's
 * crop_x/y/w/h fields expect.
 *
 * The engine validates crop bounds server-side (target_writer.py rejects
 * crops that escape the decoded image), so we don't need to bounds-check
 * here — but cropperjs already clamps the box to the image rect by
 * default, so it's a moot point in practice.
 */
export function PhotoCropper({ src, onCropChange, initialCrop }: Props) {
  const cropperRef = useRef<ReactCropperElement>(null);

  const handleCropEnd = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const data = cropper.getData(true);
    onCropChange({
      x: Math.max(0, Math.round(data.x)),
      y: Math.max(0, Math.round(data.y)),
      w: Math.max(1, Math.round(data.width)),
      h: Math.max(1, Math.round(data.height)),
    });
  }, [onCropChange]);

  return (
    <div className="border border-barnes-ink/15 rounded-md overflow-hidden bg-barnes-ink/5">
      <Cropper
        ref={cropperRef}
        src={src}
        style={{ height: 360, width: "100%" }}
        autoCropArea={initialCrop ? 0 : 0.9}
        viewMode={1}
        dragMode="move"
        responsive
        background={false}
        guides
        center
        movable
        zoomable
        scalable={false}
        rotatable={false}
        toggleDragModeOnDblclick={false}
        checkOrientation
        cropend={handleCropEnd}
        ready={() => {
          const cropper = cropperRef.current?.cropper;
          if (!cropper) return;
          if (initialCrop) {
            cropper.setData({
              x: initialCrop.x,
              y: initialCrop.y,
              width: initialCrop.w,
              height: initialCrop.h,
            });
          }
          handleCropEnd();
        }}
      />
    </div>
  );
}
