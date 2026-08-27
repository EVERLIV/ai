import { Check, ImageIcon, Loader2 } from "lucide-react";
import {
  buildPropertyDisplayTitle,
  formatPropertyAddressShort,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import type { PropertyFormState } from "@/lib/propertyFormMapper";
import { listingMissingFieldLabels } from "@/lib/listingAiDraft";
import { cn } from "@/lib/utils";

type Props = {
  form: PropertyFormState;
  photoUrls: string[];
  missingFields: string[];
  enhanceBadge?: boolean;
  className?: string;
  /** Компактная полоса под шапкой на мобиле */
  variant?: "full" | "compact";
};

export default function SmartListingPreview({
  form,
  photoUrls,
  missingFields,
  enhanceBadge,
  className,
  variant = "full",
}: Props) {
  const titleSource = {
    segment: form.segment,
    type: form.types[0] || null,
    area: form.area,
    district: form.district,
    address: form.address,
    layout: form.layout,
    class: form.class,
    extras: {
      rooms: form.rooms || undefined,
      land_use: form.land_use || undefined,
      purpose: form.purpose || undefined,
      property_types: form.types,
    },
  };
  const title = buildPropertyDisplayTitle(titleSource);
  const price =
    formatPropertyPrice({ price: form.price, deal_type: form.deal_type }) ||
    "цена по запросу";
  const address = formatPropertyAddressShort(form.address);
  const missingLabels = listingMissingFieldLabels(missingFields);
  const ready = missingLabels.length === 0;

  if (variant === "compact") {
    return (
      <aside
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2",
          className,
        )}
      >
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
          {photoUrls[0] ? (
            <img
              src={photoUrls[0]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ImageIcon className="w-5 h-5 opacity-50" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {title || "Новый объект"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {price}
            {address ? ` · ${address}` : ""}
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 text-[10px] font-medium px-2 py-1 rounded-full",
            ready
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {ready ? "Готово" : `${missingLabels.length}`}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "rounded-2xl border border-border bg-card overflow-hidden w-full",
        className,
      )}
    >
      <div className="px-4 py-3 border-b border-border/60">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Так выглядит объявление
        </p>
      </div>

      <div className="relative aspect-[16/10] bg-muted">
        {photoUrls[0] ? (
          <img
            src={photoUrls[0]}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-50" />
            <span className="text-xs">Фото появится здесь</span>
          </div>
        )}
        {enhanceBadge && (
          <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wide bg-background/90 text-foreground px-2 py-1 rounded">
            Улучшение скоро
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-display text-base font-bold text-foreground leading-snug">
          {title || "Новый объект"}
        </h3>
        <p className="text-sm font-semibold text-foreground">{price}</p>
        {address ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{address}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Адрес не указан</p>
        )}
        {form.description ? (
          <p className="text-xs text-muted-foreground line-clamp-3 pt-1">
            {form.description}
          </p>
        ) : null}

        {photoUrls.length > 1 && (
          <div className="flex gap-1.5 pt-2 overflow-x-auto">
            {photoUrls.slice(0, 5).map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="w-12 h-12 rounded object-cover shrink-0"
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">
          Заполнено
        </p>
        {ready ? (
          <div className="flex items-center gap-1.5 text-xs text-foreground">
            <Check className="w-3.5 h-3.5 text-primary" />
            Основные поля готовы
          </div>
        ) : (
          <ul className="space-y-1">
            {missingLabels.slice(0, 6).map((label) => (
              <li
                key={label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Loader2 className="w-3 h-3 shrink-0 opacity-60" />
                Ещё нужно: {label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
