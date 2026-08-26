import { useState, type ReactNode } from "react";
import { publicStorageUrl } from "@/lib/storageUrl";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
};

/**
 * Картинка из Supabase Storage: всегда /object/public/…,
 * иначе self-hosted отдаёт 401 без CORS.
 */
export default function StorageImage({
  src,
  alt = "",
  className,
  fallback = null,
}: Props) {
  const url = publicStorageUrl(src);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={url}
      alt={alt}
      className={cn(className)}
      onError={() => setFailed(true)}
    />
  );
}
