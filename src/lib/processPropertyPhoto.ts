import watermarkSrc from "@/assets/watermark-arendacity.png";
import { WATERMARK_CONFIG } from "@/lib/watermarkConfig";

let watermarkImage: HTMLImageElement | null = null;
let watermarkLoadPromise: Promise<HTMLImageElement> | null = null;

function loadWatermarkImage(): Promise<HTMLImageElement> {
  if (watermarkImage) return Promise.resolve(watermarkImage);
  if (watermarkLoadPromise) return watermarkLoadPromise;

  watermarkLoadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      watermarkImage = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error("Не удалось загрузить водяной знак"));
    img.src = watermarkSrc;
  });

  return watermarkLoadPromise;
}

function loadFileImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать изображение"));
    };
    img.src = url;
  });
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  watermark: HTMLImageElement,
) {
  const minSide = Math.min(canvasW, canvasH);
  const targetW = minSide * WATERMARK_CONFIG.widthRatio;
  const scale = targetW / watermark.width;
  const wmW = Math.round(watermark.width * scale);
  const wmH = Math.round(watermark.height * scale);
  const x = Math.round((canvasW - wmW) / 2);
  const y = Math.round((canvasH - wmH) / 2);

  ctx.save();
  ctx.globalAlpha = WATERMARK_CONFIG.opacity;
  ctx.drawImage(watermark, x, y, wmW, wmH);
  ctx.restore();
}

/**
 * Resize, apply center watermark, export JPEG for property photo upload.
 */
export async function processPropertyPhotoFile(file: File): Promise<File> {
  const [source, watermark] = await Promise.all([
    loadFileImage(file),
    loadWatermarkImage(),
  ]);

  const { maxSide, jpegQuality } = WATERMARK_CONFIG;
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvasW = Math.max(1, Math.round(source.width * scale));
  const canvasH = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(source, 0, 0, canvasW, canvasH);
  drawWatermark(ctx, canvasW, canvasH, watermark);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        resolve(
          new File(
            [blob],
            file.name.replace(/\.\w+$/i, "") + ".jpg",
            { type: "image/jpeg" },
          ),
        );
      },
      "image/jpeg",
      jpegQuality,
    );
  });
}
