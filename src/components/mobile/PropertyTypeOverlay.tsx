import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import MobileFullScreenPicker from "@/components/mobile/MobileFullScreenPicker";
import {
  COMMERCIAL_PROPERTY_TYPES,
  type PropertySegment,
  RESIDENTIAL_PROPERTY_TYPES,
} from "@/config/propertySegments";
import { cn } from "@/lib/utils";

type Category = { title: string; items: readonly string[] };

const RESIDENTIAL_CATEGORIES: Category[] = [
  {
    title: "Квартиры и комнаты",
    items: ["Квартира", "Комната", "Апартаменты", "Доля"],
  },
  {
    title: "Дома и участки",
    items: ["Дом", "Дача", "Коттедж", "Таунхаус", "Участок"],
  },
  {
    title: "Гаражи",
    items: ["Гараж", "Машиноместо"],
  },
];

const COMMERCIAL_CATEGORIES: Category[] = [
  { title: "Офисы", items: ["Офис"] },
  { title: "Торговля", items: ["Торговая"] },
  { title: "Склад и производство", items: ["Склад", "Производство"] },
  { title: "Земля", items: ["Земля"] },
];

/** Все типы сегмента — для fallback, если тип не в категориях */
function allTypes(segment: PropertySegment): string[] {
  return segment === "residential"
    ? [...RESIDENTIAL_PROPERTY_TYPES]
    : [...COMMERCIAL_PROPERTY_TYPES];
}

export function propertyTypeAccusative(type: string): string {
  const map: Record<string, string> = {
    Квартира: "Квартиру",
    Комната: "Комнату",
    Апартаменты: "Апартаменты",
    Доля: "Долю",
  };
  return map[type] ?? type;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: PropertySegment;
  value: string;
  onChange: (value: string) => void;
};

export default function PropertyTypeOverlay({
  open,
  onOpenChange,
  segment,
  value,
  onChange,
}: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const categories =
    segment === "residential" ? RESIDENTIAL_CATEGORIES : COMMERCIAL_CATEGORIES;
  const known = new Set(categories.flatMap((c) => c.items));
  const extras = allTypes(segment).filter((t) => !known.has(t));
  const displayCategories = extras.length
    ? [...categories, { title: "Прочее", items: extras }]
    : categories;

  return (
    <MobileFullScreenPicker
      open={open}
      onClose={() => onOpenChange(false)}
      title="Тип недвижимости"
      onApply={() => onChange(draft)}
    >
      <div className="py-2">
        {displayCategories.map((cat) => (
          <div key={cat.title} className="mb-1">
            <p className="px-4 py-2 text-sm font-bold text-foreground">
              {cat.title}
            </p>
            <ul>
              {cat.items.map((item) => {
                const selected = draft === item;
                return (
                  <li key={item} className="border-b border-border/40">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-foreground hover:bg-muted/40 transition-colors"
                      onClick={() => setDraft(item)}
                    >
                      {item}
                      <span
                        className={cn(
                          "w-5 h-5 flex items-center justify-center shrink-0",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "border border-border/80",
                        )}
                      >
                        {selected && (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </MobileFullScreenPicker>
  );
}
