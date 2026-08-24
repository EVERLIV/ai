import { CheckCircle2, Loader2, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inferDistrictFromAddress } from "@/lib/irkutskLocations";
import { cn } from "@/lib/utils";
import {
  type GeoHit,
  geocodeAddress,
  suggestAddresses,
} from "@/lib/yandexGeocoder";

export type AddressPick = {
  address: string;
  lat: number | null;
  lng: number | null;
  district?: string;
};

type Props = {
  value: string;
  lat?: number | null;
  lng?: number | null;
  district?: string;
  onChange: (next: AddressPick) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

export default function AddressAutocomplete({
  value,
  lat = null,
  lng = null,
  district,
  onChange,
  className,
  inputClassName,
  placeholder = "Иркутск, ул. Ленина, 10",
  label = "Адрес",
  disabled,
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<GeoHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const skipSuggestRef = useRef(false);

  const hasCoords =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const hits = await suggestAddresses(q);
        if (!cancelled) {
          setSuggestions(hits);
          setOpen(hits.length > 0);
        }
      } catch (e) {
        if (!cancelled) {
          setSuggestions([]);
          setError(
            e instanceof Error ? e.message : "Не удалось загрузить подсказки",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  const applyHit = (hit: GeoHit) => {
    skipSuggestRef.current = true;
    setOpen(false);
    setSuggestions([]);
    onChange({
      address: hit.address,
      lat: hit.lat,
      lng: hit.lng,
      district: inferDistrictFromAddress(hit.address, district || "Кировский"),
    });
  };

  const resolveCoords = async () => {
    const q = value.trim();
    if (q.length < 4 || hasCoords) return;
    setGeocoding(true);
    setError(null);
    try {
      const hit = await geocodeAddress(q);
      if (hit) applyHit(hit);
      else setError("Адрес не найден на карте — уточните улицу и дом");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка геокодера");
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative space-y-1", className)}>
      {label && <Label className="text-xs mb-1 block">{label}</Label>}
      <div className="relative">
        <Input
          className={cn("h-9 bg-background pr-9", inputClassName)}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="street-address"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          onChange={(e) => {
            onChange({
              address: e.target.value,
              lat: null,
              lng: null,
              district,
            });
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              void resolveCoords();
            }, 180);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading || geocoding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasCoords ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </span>
      </div>

      {hasCoords && (
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
          Точка на карте: {lat?.toFixed(5)}, {lng?.toFixed(5)}
        </p>
      )}
      {!hasCoords && value.trim().length >= 4 && !loading && (
        <p className="text-[11px] text-muted-foreground">
          Выберите адрес из списка или дождитесь определения координат — иначе
          объект не появится на карте.
        </p>
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          className="absolute z-50 left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-card shadow-lg"
        >
          {suggestions.map((hit) => (
            <li key={`${hit.address}-${hit.lat}-${hit.lng}`}>
              <button
                type="button"
                role="option"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-start gap-2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyHit(hit)}
              >
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                <span className="leading-snug">{hit.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
