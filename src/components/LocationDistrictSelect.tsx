import LocationHierarchyPicker, {
  type LocationHierarchyChange,
} from "@/components/LocationHierarchyPicker";

type Props = {
  value: string;
  onChange: (value: string, meta?: LocationHierarchyChange) => void;
  label?: string;
  className?: string;
  applyCentroid?: boolean;
  hasCoords?: boolean;
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
}: Props) {
  return (
    <LocationHierarchyPicker
      value={value}
      label={label}
      className={className}
      applyCentroid={applyCentroid}
      hasCoords={hasCoords}
      onChange={(next) => onChange(next.district, next)}
    />
  );
}
