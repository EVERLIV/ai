import LocationHierarchyPicker, {
  type LocationHierarchyChange,
} from "@/components/LocationHierarchyPicker";
import type { DictionaryItem } from "@/hooks/useDictionaries";

type Props = {
  value: string;
  onChange: (value: string, meta?: LocationHierarchyChange) => void;
  label?: string;
  className?: string;
  applyCentroid?: boolean;
  hasCoords?: boolean;
  catalogItems?: DictionaryItem[];
};

/**
 * Обёртка над ступенчатым пикером (город → район/село).
 * onChange(leaf) для простой подстановки district; meta — extras.location + centroid.
 */
export default function LocationDistrictSelect({
  value,
  onChange,
  label = "Город / район",
  className,
  applyCentroid = true,
  hasCoords = false,
  catalogItems,
}: Props) {
  return (
    <LocationHierarchyPicker
      value={value}
      label={label}
      className={className}
      applyCentroid={applyCentroid}
      hasCoords={hasCoords}
      catalogItems={catalogItems}
      onChange={(next) => onChange(next.district, next)}
    />
  );
}
