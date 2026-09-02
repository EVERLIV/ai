const LOGO_MAX_SIDE = 1200;
const LOGO_JPEG_QUALITY = 0.85;
/** Держим ниже 1 МБ — лимит nginx по умолчанию до правки на VPS */
const LOGO_TARGET_MAX_BYTES = 900 * 1024;

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

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Не удалось сжать изображение"));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

/** Сжимает логотип/аватар перед upload в Storage (PNG/JPEG/WebP → JPEG). */
export async function prepareLogoUploadFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= 400 * 1024 && !/heic|heif|bmp|tiff/i.test(file.type)) {
    return file;
  }

  const source = await loadFileImage(file);
  const longest = Math.max(source.width, source.height);
  const scale = longest > LOGO_MAX_SIDE ? LOGO_MAX_SIDE / longest : 1;
  const canvasW = Math.max(1, Math.round(source.width * scale));
  const canvasH = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas недоступен");
  ctx.drawImage(source, 0, 0, canvasW, canvasH);

  let quality = LOGO_JPEG_QUALITY;
  let blob = await canvasToBlob(canvas, "image/jpeg", quality);
  while (blob.size > LOGO_TARGET_MAX_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "logo";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/** @deprecated Use processPropertyPhotoFile for property uploads */
export { processPropertyPhotoFile as compressImageFile } from "@/lib/processPropertyPhoto";
