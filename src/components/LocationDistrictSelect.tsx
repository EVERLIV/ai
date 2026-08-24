import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISTRICTS, LOCATION_GROUPS } from "@/lib/irkutskLocations";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

export default function LocationDistrictSelect({
  value,
  onChange,
  label = "Город / район",
  className,
}: Props) {
  const known = DISTRICTS.includes(value);
  const current = value || "Кировский";

  return (
    <div className={className}>
      {label && <Label className="text-xs mb-1 block">{label}</Label>}
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm bg-background">
          <SelectValue placeholder="Выберите локацию" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {!known && current && (
            <SelectGroup>
              <SelectLabel>Текущее значение</SelectLabel>
              <SelectItem value={current}>{current}</SelectItem>
            </SelectGroup>
          )}
          {LOCATION_GROUPS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.items.map((item) => (
                <SelectItem key={`${group.label}-${item}`} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
