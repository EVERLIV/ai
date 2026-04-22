import {
  Megaphone, Paintbrush, Tv2, Building, Flag, StickyNote,
  Columns3, Brush, Signpost, Monitor, Flag as FlagIcon, type LucideIcon,
} from "lucide-react";

export type AdTypeKey =
  | "billboard"
  | "pavilion_paint"
  | "led_running_line"
  | "roof_sign"
  | "facade_banner"
  | "window_sticker"
  | "pillar_wrap"
  | "wall_mural"
  | "sidewalk_stand"
  | "digital_screen"
  | "flag_pole";

export type TrafficKey = "low" | "medium" | "high";
export type AvailabilityKey = "available" | "occupied" | "reserved";

export interface AdTypeMeta {
  key: AdTypeKey;
  label: string;
  short: string;
  icon: LucideIcon;
  description: string;
}

export const AD_TYPES: AdTypeMeta[] = [
  { key: "billboard", label: "Билборд 3×6", short: "Билборд", icon: Megaphone,
    description: "Классический рекламный щит на территории объекта" },
  { key: "pavilion_paint", label: "Фирменная покраска павильона", short: "Покраска павильона", icon: Paintbrush,
    description: "Брендирование всего фасада павильона в фирменных цветах" },
  { key: "led_running_line", label: "Бегущая LED-строка", short: "Бегущая строка", icon: Tv2,
    description: "Светодиодная бегущая строка на фасаде" },
  { key: "roof_sign", label: "Крышная установка", short: "Крышная", icon: Building,
    description: "Объёмная вывеска на крыше здания" },
  { key: "facade_banner", label: "Фасадный баннер", short: "Баннер", icon: Flag,
    description: "Большеформатный баннер на фасаде" },
  { key: "window_sticker", label: "Брендирование витрин", short: "Витрины", icon: StickyNote,
    description: "Оклейка витрин виниловой плёнкой" },
  { key: "pillar_wrap", label: "Брендирование колонн", short: "Колонны", icon: Columns3,
    description: "Оклейка несущих колонн внутри помещения" },
  { key: "wall_mural", label: "Граффити на стене", short: "Граффити", icon: Brush,
    description: "Художественная роспись или мурал на боковой стене" },
  { key: "sidewalk_stand", label: "Штендер у входа", short: "Штендер", icon: Signpost,
    description: "Двусторонний штендер на тротуаре у входной группы" },
  { key: "digital_screen", label: "Цифровой экран", short: "Цифровой экран", icon: Monitor,
    description: "LED-экран высокого разрешения" },
  { key: "flag_pole", label: "Флагшток", short: "Флагшток", icon: FlagIcon,
    description: "Флаг с логотипом на флагштоке у входа" },
];

export const AD_TYPE_MAP: Record<AdTypeKey, AdTypeMeta> = AD_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {} as Record<AdTypeKey, AdTypeMeta>
);

export const TRAFFIC_LABELS: Record<TrafficKey, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export const TRAFFIC_BADGE: Record<TrafficKey, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/15 text-primary",
  high: "bg-destructive/15 text-destructive",
};

export const AVAILABILITY_LABELS: Record<AvailabilityKey, string> = {
  available: "Свободно",
  occupied: "Занято",
  reserved: "Бронь",
};

export const AVAILABILITY_BADGE: Record<AvailabilityKey, string> = {
  available: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  occupied: "bg-destructive/15 text-destructive",
  reserved: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

export const LIGHTING_OPTIONS = [
  { value: "day", label: "Дневное" },
  { value: "24/7", label: "Круглосуточно" },
];

export const SIDE_OPTIONS = [
  "Фасад", "Торец", "Крыша", "Входная группа", "Внутри",
];
