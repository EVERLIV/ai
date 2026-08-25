import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getWoodenHouseConfig,
  WOOD_FINISH_OPTIONS,
  WOOD_FLOORS_OPTIONS,
  WOOD_FOUNDATION_OPTIONS,
  WOOD_ROOF_OPTIONS,
  WOOD_WALL_OPTIONS,
  WOODEN_HOUSE_CONFIGS,
  WOODEN_HOUSE_GROUPS,
  type WoodenHouseConfig,
} from "@/lib/woodenHouses";

export type WoodenHouseFormSlice = {
  wood_config: string;
  building_type: string;
  wood_wall: string;
  wood_floors: string;
  wood_foundation: string;
  wood_roof: string;
  wood_finish: string;
  description: string;
};

type Props = {
  value: WoodenHouseFormSlice;
  onChange: (patch: Partial<WoodenHouseFormSlice>) => void;
  compact?: boolean;
};

export default function WoodenHouseConfigFields({
  value,
  onChange,
  compact,
}: Props) {
  const selected = getWoodenHouseConfig(value.wood_config);

  const applyConfig = (cfg: WoodenHouseConfig) => {
    const fillDescription = !value.description.trim();
    onChange({
      wood_config: cfg.id,
      building_type: cfg.buildingType,
      wood_wall: cfg.defaults?.wall || "",
      wood_floors: cfg.defaults?.floors || "",
      wood_foundation: cfg.defaults?.foundation || "",
      wood_roof: cfg.defaults?.roof || "",
      wood_finish: cfg.defaults?.finish || "",
      description: fillDescription
        ? `${cfg.listingHint}\n\n${cfg.description}`
        : value.description,
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1.5 block">
          Конфигурация деревянного дома
        </Label>
        <p className="text-[11px] text-muted-foreground mb-2">
          Выберите технологию — подставятся тип стен, описание и типовые поля.
        </p>
        <div className="space-y-3">
          {WOODEN_HOUSE_GROUPS.map((g) => {
            const items = WOODEN_HOUSE_CONFIGS.filter((c) => c.group === g.id);
            return (
              <div key={g.id}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {g.label}
                </div>
                <div
                  className={cn(
                    "grid gap-1.5",
                    compact ? "grid-cols-1" : "sm:grid-cols-2",
                  )}
                >
                  {items.map((cfg) => {
                    const active = value.wood_config === cfg.id;
                    return (
                      <button
                        key={cfg.id}
                        type="button"
                        onClick={() => applyConfig(cfg)}
                        className={cn(
                          "text-left rounded-lg border px-3 py-2 transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border/70 bg-background hover:border-border hover:bg-muted/30",
                        )}
                      >
                        <div className="text-xs font-semibold text-foreground">
                          {cfg.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {cfg.summary}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <p className="text-[11px] text-muted-foreground leading-relaxed rounded-md bg-muted/40 px-3 py-2">
          {selected.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <FieldSelect
          label="Стены / сечение"
          value={value.wood_wall}
          options={WOOD_WALL_OPTIONS}
          onChange={(v) => onChange({ wood_wall: v })}
        />
        <FieldSelect
          label="Этажность"
          value={value.wood_floors}
          options={WOOD_FLOORS_OPTIONS}
          onChange={(v) => onChange({ wood_floors: v })}
        />
        <FieldSelect
          label="Фундамент"
          value={value.wood_foundation}
          options={WOOD_FOUNDATION_OPTIONS}
          onChange={(v) => onChange({ wood_foundation: v })}
        />
        <FieldSelect
          label="Кровля"
          value={value.wood_roof}
          options={WOOD_ROOF_OPTIONS}
          onChange={(v) => onChange({ wood_roof: v })}
        />
        <FieldSelect
          label="Готовность"
          value={value.wood_finish}
          options={WOOD_FINISH_OPTIONS}
          onChange={(v) => onChange({ wood_finish: v })}
        />
      </div>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const items = Array.from(new Set([value, ...options].filter(Boolean)));
  return (
    <div>
      <Label className="text-xs mb-1 block">{label}</Label>
      <Select
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" ? "" : v)}
      >
        <SelectTrigger className="h-8 text-xs bg-background">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">—</SelectItem>
          {items.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
