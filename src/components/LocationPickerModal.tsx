import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAllDictionaryValues } from "@/hooks/useDictionaries";
import {
  buildLocationTree,
  groupLocationsByLetter,
  IRKUTSK_REGION_LABEL,
} from "@/lib/locationPicker";
import {
  findLocationByName,
  toPropertyLocationExtras,
} from "@/lib/locations";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Текущий выбранный город/район (фильтр district) */
  value?: string;
  onSelect: (location: string) => void;
  /** Поверх другого модала (например, Умный подбор z-9999) */
  elevated?: boolean;
  /** Районы с объявлений (дополнение к справочнику) */
  extraLocations?: string[];
};

function selectionBreadcrumb(selected: string): string[] {
  if (!selected) return [];
  const node = findLocationByName(selected);
  if (!node) return [selected];
  const extras = toPropertyLocationExtras(node);
  const parts = [extras.city];
  if (extras.locality) parts.push(extras.locality);
  else if (extras.city !== selected && node.kind !== "city") {
    parts.push(selected);
  }
  return parts.length ? parts : [selected];
}

export default function LocationPickerModal({
  open,
  onOpenChange,
  value = "",
  onSelect,
  elevated = false,
  extraLocations = [],
}: Props) {
  const { all } = useAllDictionaryValues();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(value);

  const tree = useMemo(
    () => buildLocationTree(all, extraLocations),
    [all, extraLocations],
  );
  const groups = useMemo(
    () => groupLocationsByLetter(tree, query),
    [tree, query],
  );

  const selected = draft && draft !== "Все" ? draft : "";
  const crumbs = selectionBreadcrumb(selected);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(value && value !== "Все" ? value : "");
      setQuery("");
    }
    onOpenChange(next);
  };

  const pick = (location: string) => {
    setDraft(location);
  };

  const confirm = () => {
    onSelect(selected || "Все");
    onOpenChange(false);
  };

  const clear = () => {
    setDraft("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName={elevated ? "z-[10040]" : undefined}
        className={cn(
          "max-w-3xl w-[calc(100%-1.5rem)] sm:w-full p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col",
          elevated && "z-[10050]",
        )}
      >
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border shrink-0 space-y-3 text-left">
          <DialogTitle className="text-base font-semibold pr-8">
            Город и район
          </DialogTitle>
          <DialogDescription className="sr-only">
            Выберите город, затем район или село Иркутской области
          </DialogDescription>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Город, район или село"
              className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Россия</span>
            <span className="text-muted-foreground/50">›</span>
            <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {IRKUTSK_REGION_LABEL}
            </span>
            {crumbs.map((part, i) => (
              <span key={`${part}-${i}`} className="contents">
                <span className="text-muted-foreground/50">›</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full text-xs font-semibold",
                    i === crumbs.length - 1
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-foreground",
                  )}
                >
                  {part}
                  {i === crumbs.length - 1 && (
                    <button
                      type="button"
                      aria-label="Сбросить локацию"
                      onClick={clear}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-primary/15"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              </span>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Ничего не найдено
            </p>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-8 [column-fill:_balance]">
              {groups.map((group) => (
                <div key={group.letter} className="break-inside-avoid mb-5">
                  <div className="text-lg font-bold text-foreground mb-1.5 leading-none">
                    {group.letter}
                  </div>
                  <ul className="space-y-0.5">
                    {group.cities.map((node) => {
                      const citySelected = selected === node.city;
                      const childSelected = node.districts.includes(selected);
                      return (
                        <li key={node.city}>
                          <button
                            type="button"
                            onClick={() => pick(node.city)}
                            className={cn(
                              "text-left text-sm py-0.5 transition-colors w-full",
                              citySelected
                                ? "text-primary font-semibold"
                                : childSelected
                                  ? "text-foreground font-medium"
                                  : "text-foreground hover:text-primary",
                            )}
                          >
                            {node.city}
                            {node.districts.length > 0 && (
                              <span className="text-muted-foreground font-normal text-[11px] ml-1">
                                +{node.districts.length}
                              </span>
                            )}
                          </button>
                          {node.districts.length > 0 && (
                            <ul className="pl-3 border-l border-border/70 ml-1 mt-0.5 mb-1.5 space-y-0.5">
                              {node.districts.map((district) => {
                                const active = selected === district;
                                return (
                                  <li key={`${node.city}-${district}`}>
                                    <button
                                      type="button"
                                      onClick={() => pick(district)}
                                      className={cn(
                                        "text-left text-[13px] py-0.5 transition-colors w-full",
                                        active
                                          ? "text-primary font-semibold"
                                          : "text-muted-foreground hover:text-primary",
                                      )}
                                    >
                                      {district}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-4 py-3 bg-card">
          <button
            type="button"
            onClick={confirm}
            className="w-full h-7 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {selected
              ? `Показать: ${crumbs.join(" → ")}`
              : "Показать все объекты области"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
