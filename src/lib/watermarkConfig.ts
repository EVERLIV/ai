/** Property photo processing & watermark settings */
export const WATERMARK_CONFIG = {
  /** Max longest side after resize (px) */
  maxSide: 1600,
  /** JPEG quality 0–1 */
  jpegQuality: 0.82,
  /** Watermark width as fraction of min(canvas width, height) */
  /** Horizontal logo — wider than square mark */
  widthRatio: 0.42,
  /** Opacity when baking watermark into uploaded JPEG */
  opacity: 0.4,
} as const;
