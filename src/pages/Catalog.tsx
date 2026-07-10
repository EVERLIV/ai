import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProperties, type DbProperty } from "@/hooks/useProperties";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NewsSidebar from "@/components/NewsSidebar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SlidersHorizontal, X, ChevronDown, MapPin, Maximize2, LayoutGrid, List,
  ArrowUpDown, Eye, Calendar,
  Sparkles, Send, Phone, PhoneOff, Mic, PanelLeftClose, PanelLeft,
  Search, ChevronUp, Map as MapIcon, Banknote, Ruler, Tag, Building, Settings2,
} from "lucide-react";
import {
  Buildings as PhBuildings,
  Storefront as PhStorefront,
  Warehouse as PhWarehouse,
  Tree as PhTree,
  Factory as PhFactory,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import CatalogMap from "@/components/CatalogMap";
import PropertyImage from "@/components/PropertyImage";
import { getLandCadastral, getLandUse, isLandProperty } from "@/lib/propertyLand";

const TYPES = ["Офис", "Торговая", "Склад", "Земля", "Производство"];
const DEALS = ["Все", "Аренда", "Продажа"];
const CLASSES = ["Все", "A", "A+", "B+", "B", "C"];
const SORT_OPTIONS = [
  { label: "Сначала новые", value: "date" },
  { label: "Цена ↑", value: "price_asc" },
  { label: "Цена ↓", value: "price_desc" },
  { label: "Площадь ↑", value: "area_asc" },
  { label: "Площадь ↓", value: "area_desc" },
];
const CEILING_OPTIONS = [
  { label: "от 3 м", value: 3 },
  { label: "от 4 м", value: 4 },
  { label: "от 5 м", value: 5 },
];

const SIDEBAR_W_OPEN = 280;
const SIDEBAR_W_COLLAPSED = 52;

const typeIcons: Record<string, React.ElementType> = {
  "Офис": PhBuildings, "Торговая": PhStorefront, "Склад": PhWarehouse, "Земля": PhTree, "Производство": PhFactory,
};

const ELEVENLABS_AGENT_ID = "agent_7301kmyt4jxxf8etgj0av5x43qb4";

// ─── Double Range Slider ───
function RangeSlider({ min, max, valueMin, valueMax, step, onChangeMin, onChangeMax, format }: {
  min: number; max: number; valueMin: number; valueMax: number; step: number;
  onChangeMin: (v: number) => void; onChangeMax: (v: number) => void;
  format: (v: number) => string;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const left = pct(valueMin);
  const right = pct(valueMax);
  return (
    <div className="w-full min-w-0">
      <div className="relative h-6 flex items-center mx-1.5">
        <div className="absolute inset-x-0 h-1 rounded-full bg-muted" />
        <div
          className="absolute h-1 rounded-full bg-primary"
          style={{ left: `${left}%`, right: `${100 - right}%` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={valueMin}
          onChange={(e) => { const v = Number(e.target.value); if (v <= valueMax) onChangeMin(v); }}
          className="range-thumb absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: valueMin > max - step ? 5 : 3 }}
        />
        <input
          type="range" min={min} max={max} step={step} value={valueMax}
          onChange={(e) => { const v = Number(e.target.value); if (v >= valueMin) onChangeMax(v); }}
          className="range-thumb absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 4 }}
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-background border-2 border-primary shadow-sm pointer-events-none -translate-x-1/2"
          style={{ left: `${left}%` }}
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-background border-2 border-primary shadow-sm pointer-events-none -translate-x-1/2"
          style={{ left: `${right}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[11px] tabular-nums text-muted-foreground">
        <span className="truncate">{format(valueMin)}</span>
        <span className="truncate">{format(valueMax)}</span>
      </div>
    </div>
  );
}

// ─── Modern select ───
function SelectFilter({ label, ariaLabel, value, options, onChange }: {
  label?: string; ariaLabel?: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-0">
      {label && <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{label}</label>}
      <div className="relative rounded-lg border border-border/70 bg-muted/30 hover:border-border transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel ?? label}
          className="w-full min-w-0 appearance-none px-3 py-2 pr-8 bg-transparent text-xs text-foreground focus:outline-none cursor-pointer truncate"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Filter section header ───
function FilterSectionHeader({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3 min-w-0">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className={`text-xs font-semibold truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
    </div>
  );
}

// ─── Collapsed rail icon ───
function RailIcon({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`relative w-9 h-9 mx-auto flex items-center justify-center rounded-lg transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary" />}
    </button>
  );
}

// ─── Collapsible section ───
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="group w-full flex items-center justify-between py-1.5 text-[11px] font-semibold text-foreground uppercase tracking-[0.1em] transition-colors"
      >
        <span className="section-title group-hover:text-primary transition-colors">{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-all duration-300 group-hover:text-primary ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`collapse-grid ${open ? "is-open" : ""}`}>
        <div className="collapse-inner">
          <div className="space-y-2.5 pt-1.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Active filter chip ───
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium max-w-full">
      <span className="truncate">{label}</span>
      <button onClick={onRemove} aria-label={`Убрать фильтр ${label}`} className="hover:text-primary/70 transition-colors shrink-0">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ─── Unified filter panel footer ───
function FilterPanelFooter({
  count, isLoading, activeFiltersCount, activeChips, onReset, onClose, showCloseButton,
}: {
  count: number;
  isLoading: boolean;
  activeFiltersCount: number;
  activeChips: { label: string; onRemove: () => void }[];
  onReset: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}) {
  return (
    <div className="shrink-0 border-t border-border/40 bg-muted/30">
      {activeChips.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-1.5">
          {activeChips.map((c, i) => <Chip key={i} label={c.label} onRemove={c.onRemove} />)}
        </div>
      )}
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="inline-flex gap-1 items-center">
              <span className="w-1 h-1 bg-muted-foreground animate-bounce" />
              <span className="w-1 h-1 bg-muted-foreground animate-bounce [animation-delay:120ms]" />
              <span className="w-1 h-1 bg-muted-foreground animate-bounce [animation-delay:240ms]" />
            </span>
          ) : (
            <>Найдено <span className="font-semibold text-foreground tabular-nums">{count}</span> объектов</>
          )}
        </p>
        <div className={`flex gap-2 ${showCloseButton ? "" : ""}`}>
          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors ${showCloseButton ? "flex-1" : "w-full"}`}
            >
              <X className="w-3.5 h-3.5 shrink-0" />
              Сбросить
            </button>
          )}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Показать {isLoading ? "…" : count}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mini AI Chat in sidebar ───
function SidebarAIChat() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVoice, setIsVoice] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => { setConnecting(false); setTranscripts([]); },
    onDisconnect: () => setIsVoice(false),
    onMessage: (msg: any) => {
      if (msg.type === "agent_response") {
        const t = msg.agent_response_event?.agent_response;
        if (t) setTranscripts((p) => [...p, `🤖 ${t}`]);
      }
      if (msg.type === "user_transcript") {
        const t = msg.user_transcription_event?.user_transcript;
        if (t) setTranscripts((p) => [...p, `👤 ${t}`]);
      }
    },
    onError: () => {
      toast({ title: "Ошибка голосового агента", variant: "destructive" });
      setConnecting(false); setIsVoice(false);
    },
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, transcripts, loading]);

  const startVoice = useCallback(async () => {
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agent_id: ELEVENLABS_AGENT_ID },
      });
      if (error || !data?.token) throw new Error("Нет токена");
      await conversation.startSession({ conversationToken: data.token, connectionType: "webrtc" });
      setIsVoice(true);
    } catch {
      toast({ title: "Не удалось начать звонок", variant: "destructive" });
      setConnecting(false);
    }
  }, [conversation, toast]);

  const endVoice = useCallback(async () => {
    await conversation.endSession();
    setIsVoice(false);
  }, [conversation]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    setMessages((p) => [...p, { role: "user", text: text.trim() }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((p) => [...p, { role: "assistant", text: "ИИ работает в демо-режиме. Уточните ваш запрос!" }]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isVoice ? "bg-primary/15" : "bg-accent"}`}>
          {isVoice ? <Phone className="w-3 h-3 text-primary" /> : <Sparkles className="w-3 h-3 text-primary" />}
        </div>
        <span className="text-xs font-semibold text-foreground flex-1">
          {isVoice ? "Голосовой звонок" : "ИИ-помощник"}
        </span>
        {isVoice && (
          <span className="text-[10px] text-primary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {conversation.isSpeaking ? "говорит" : "слушает"}
          </span>
        )}
      </div>

      {isVoice ? (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
            {transcripts.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Mic className={`w-8 h-8 mx-auto mb-2 text-primary ${!conversation.isSpeaking ? "animate-pulse" : ""}`} />
                <p className="text-[11px]">Говорите — агент слушает</p>
              </div>
            )}
            {transcripts.map((t, i) => (
              <div key={i} className={`text-[11px] px-2.5 py-1.5 rounded-lg ${t.startsWith("👤") ? "bg-primary/10 ml-4" : "bg-muted mr-4"}`}>
                {t.slice(2)}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="px-3 py-2 border-t border-border">
            <button onClick={endVoice} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity">
              <PhoneOff className="w-3.5 h-3.5" /> Завершить
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
            {messages.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-4">Задайте вопрос о недвижимости</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-[11px] px-2.5 py-1.5 rounded-lg leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground ml-4 rounded-br-sm" : "bg-muted text-foreground mr-4 rounded-bl-sm"}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="bg-muted px-3 py-2 rounded-lg rounded-bl-sm flex gap-1 mr-4">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="px-3 py-2 border-t border-border space-y-1.5">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-1.5">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Поиск объектов..."
                className="flex-1 px-2.5 py-1.5 rounded-md bg-background text-xs text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
              <button type="submit" disabled={!input.trim() || loading}
                className="p-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <button onClick={startVoice} disabled={connecting}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-[11px] font-medium disabled:opacity-50">
              <Phone className="w-3 h-3" />
              {connecting ? "Подключение..." : "Позвонить ИИ"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── useDebounce ───
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Main Catalog ───
export default function Catalog() {
  const { data: properties = [], isLoading } = useProperties();
  const [searchParams, setSearchParams] = useSearchParams();

  // Init state from URL
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [dealType, setDealType] = useState(() => searchParams.get("deal") || "Все");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const t = searchParams.get("types");
    return t ? t.split(",").filter(Boolean) : [];
  });
  const [district, setDistrict] = useState(() => searchParams.get("district") || "Все");
  const [propertyClass, setPropertyClass] = useState(() => searchParams.get("cls") || "Все");
  const [condition, setCondition] = useState(() => searchParams.get("cond") || "Все");
  const [sort, setSort] = useState(() => searchParams.get("sort") || "date");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");

  // Range sliders: price 0–500000, area 0–10000
  const [priceMin, setPriceMin] = useState(() => Number(searchParams.get("priceMin") || 0));
  const [priceMax, setPriceMax] = useState(() => Number(searchParams.get("priceMax") || 500000));
  const [areaMin, setAreaMin] = useState(() => Number(searchParams.get("areaMin") || 0));
  const [areaMax, setAreaMax] = useState(() => Number(searchParams.get("areaMax") || 10000));

  // New filters
  const [ceilingMin, setCeilingMin] = useState(() => Number(searchParams.get("ceil") || 0));
  const [parkingOnly, setParkingOnly] = useState(() => searchParams.get("parking") === "1");
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>(() => {
    const l = searchParams.get("layouts");
    return l ? l.split(",").filter(Boolean) : [];
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  const districts = useMemo(() => ["Все", ...Array.from(new Set(properties.map((p) => p.district).filter(Boolean)))], [properties]);
  const conditions = useMemo(() => ["Все", ...Array.from(new Set(properties.map((p) => p.condition).filter(Boolean) as string[]))], [properties]);
  const layouts = useMemo(() => Array.from(new Set(
    properties.flatMap((p) => {
      if (isLandProperty(p.type)) {
        const landUse = getLandUse(p);
        return landUse ? [landUse] : [];
      }
      return (p as any).layout ? [(p as any).layout] : [];
    })
  )), [properties]);

  // Sync filters → URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (dealType !== "Все") params.deal = dealType;
    if (selectedTypes.length > 0) params.types = selectedTypes.join(",");
    if (district !== "Все") params.district = district;
    if (propertyClass !== "Все") params.cls = propertyClass;
    if (condition !== "Все") params.cond = condition;
    if (sort !== "date") params.sort = sort;
    if (debouncedSearch) params.q = debouncedSearch;
    if (priceMin > 0) params.priceMin = String(priceMin);
    if (priceMax < 500000) params.priceMax = String(priceMax);
    if (areaMin > 0) params.areaMin = String(areaMin);
    if (areaMax < 10000) params.areaMax = String(areaMax);
    if (ceilingMin > 0) params.ceil = String(ceilingMin);
    if (parkingOnly) params.parking = "1";
    if (selectedLayouts.length > 0) params.layouts = selectedLayouts.join(",");
    setSearchParams(params, { replace: true });
  }, [dealType, selectedTypes, district, propertyClass, condition, sort, debouncedSearch, priceMin, priceMax, areaMin, areaMax, ceilingMin, parkingOnly, selectedLayouts]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const toggleLayout = (l: string) => {
    setSelectedLayouts((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
  };

  const isPriceFiltered = priceMin > 0 || priceMax < 500000;
  const isAreaFiltered = areaMin > 0 || areaMax < 10000;

  const activeFiltersCount = [
    dealType !== "Все",
    selectedTypes.length > 0,
    district !== "Все",
    propertyClass !== "Все",
    condition !== "Все",
    isPriceFiltered,
    isAreaFiltered,
    debouncedSearch,
    ceilingMin > 0,
    parkingOnly,
    selectedLayouts.length > 0,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDealType("Все"); setSelectedTypes([]); setDistrict("Все");
    setPropertyClass("Все"); setCondition("Все");
    setPriceMin(0); setPriceMax(500000); setAreaMin(0); setAreaMax(10000);
    setSearchQuery(""); setCeilingMin(0); setParkingOnly(false); setSelectedLayouts([]);
  };

  const filtered = useMemo(() => {
    let result = [...properties];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((p) =>
        p.address.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }
    if (dealType !== "Все") result = result.filter((p) => p.deal_type === dealType);
    if (selectedTypes.length > 0) result = result.filter((p) => selectedTypes.includes(p.type));
    if (district !== "Все") result = result.filter((p) => p.district === district);
    if (propertyClass !== "Все") result = result.filter((p) => p.class === propertyClass);
    if (condition !== "Все") result = result.filter((p) => p.condition === condition);
    if (isPriceFiltered) {
      if (priceMin > 0) result = result.filter((p) => Number(p.price) >= priceMin || Number(p.price) === 0);
      if (priceMax < 500000) result = result.filter((p) => Number(p.price) <= priceMax || Number(p.price) === 0);
    }
    if (areaMin > 0) result = result.filter((p) => Number(p.area) >= areaMin);
    if (areaMax < 10000) result = result.filter((p) => Number(p.area) <= areaMax);
    if (ceilingMin > 0) result = result.filter((p) => isLandProperty(p.type) || Number(p.ceiling_height) >= ceilingMin);
    if (parkingOnly) result = result.filter((p) => isLandProperty(p.type) || (p.parking && p.parking !== "Нет" && p.parking !== "-"));
    if (selectedLayouts.length > 0) result = result.filter((p) => {
      if (isLandProperty(p.type)) {
        const landUse = getLandUse(p);
        return landUse ? selectedLayouts.includes(landUse) : false;
      }
      return selectedLayouts.includes((p as any).layout);
    });

    switch (sort) {
      case "price_asc": result.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case "price_desc": result.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case "area_asc": result.sort((a, b) => Number(a.area) - Number(b.area)); break;
      case "area_desc": result.sort((a, b) => Number(b.area) - Number(a.area)); break;
    }
    return result;
  }, [properties, dealType, selectedTypes, district, propertyClass, condition, priceMin, priceMax, areaMin, areaMax, sort, debouncedSearch, ceilingMin, parkingOnly, selectedLayouts, isPriceFiltered]);

  // Active filter chips data
  const activeChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    if (dealType !== "Все") chips.push({ label: dealType, onRemove: () => setDealType("Все") });
    selectedTypes.forEach((t) => chips.push({ label: t, onRemove: () => toggleType(t) }));
    if (district !== "Все") chips.push({ label: district, onRemove: () => setDistrict("Все") });
    if (propertyClass !== "Все") chips.push({ label: `Класс ${propertyClass}`, onRemove: () => setPropertyClass("Все") });
    if (condition !== "Все") chips.push({ label: condition, onRemove: () => setCondition("Все") });
    if (isPriceFiltered) chips.push({ label: `${priceMin > 0 ? `от ${(priceMin / 1000).toFixed(0)}к` : ""}${priceMax < 500000 ? ` до ${(priceMax / 1000).toFixed(0)}к ₽` : " ₽"}`.trim(), onRemove: () => { setPriceMin(0); setPriceMax(500000); } });
    if (isAreaFiltered) chips.push({ label: `${areaMin > 0 ? `от ${areaMin}` : ""}${areaMax < 10000 ? ` до ${areaMax} м²` : " м²"}`.trim(), onRemove: () => { setAreaMin(0); setAreaMax(10000); } });
    if (ceilingMin > 0) chips.push({ label: `Потолки от ${ceilingMin} м`, onRemove: () => setCeilingMin(0) });
    if (parkingOnly) chips.push({ label: "Парковка", onRemove: () => setParkingOnly(false) });
    selectedLayouts.forEach((l) => chips.push({ label: l, onRemove: () => toggleLayout(l) }));
    if (debouncedSearch) chips.push({ label: `"${debouncedSearch}"`, onRemove: () => setSearchQuery("") });
    return chips;
  }, [dealType, selectedTypes, district, propertyClass, condition, isPriceFiltered, isAreaFiltered, priceMin, priceMax, areaMin, areaMax, ceilingMin, parkingOnly, selectedLayouts, debouncedSearch]);

  const formatPrice = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}к` : String(v);
  const formatArea = (v: number) => `${v} м²`;

  const paramsActive = propertyClass !== "Все" || condition !== "Все" || ceilingMin > 0 || parkingOnly || selectedLayouts.length > 0;

  const filterFields = (
    <div className="min-w-0 divide-y divide-border/40">
      {/* Поиск */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Адрес, район..."
            className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} aria-label="Очистить поиск" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Тип сделки */}
      <div className="px-4 py-4">
        <FilterSectionHeader icon={Tag} label="Тип сделки" active={dealType !== "Все"} />
        <div className="flex rounded-lg bg-muted/50 p-1 gap-0.5">
          {DEALS.map((d) => (
            <button
              key={d}
              onClick={() => setDealType(d)}
              className={`flex-1 min-w-0 py-2 rounded-md text-xs font-medium transition-all ${
                dealType === d
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Тип объекта */}
      <div className="px-4 py-4">
        <FilterSectionHeader icon={Building} label="Тип объекта" active={selectedTypes.length > 0} />
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => {
            const Icon = typeIcons[t] || PhBuildings;
            const active = selectedTypes.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`inline-flex items-center gap-1.5 max-w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground bg-background"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" weight="duotone" />
                <span className="truncate">{t}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Локация */}
      <div className="px-4 py-4">
        <FilterSectionHeader icon={MapPin} label="Район" active={district !== "Все"} />
        <SelectFilter ariaLabel="Район" value={district} options={districts} onChange={setDistrict} />
      </div>

      {/* Цена и площадь */}
      <div className="px-4 py-4 space-y-5">
        <div>
          <FilterSectionHeader icon={Banknote} label="Цена, ₽/мес" active={isPriceFiltered} />
          <RangeSlider
            min={0} max={500000} step={5000}
            valueMin={priceMin} valueMax={priceMax}
            onChangeMin={setPriceMin} onChangeMax={setPriceMax}
            format={formatPrice}
          />
        </div>
        <div>
          <FilterSectionHeader icon={Ruler} label="Площадь, м²" active={isAreaFiltered} />
          <RangeSlider
            min={0} max={10000} step={10}
            valueMin={areaMin} valueMax={areaMax}
            onChangeMin={setAreaMin} onChangeMax={setAreaMax}
            format={formatArea}
          />
        </div>
      </div>

      {/* Параметры */}
      <div className="px-4 py-4">
        <FilterSectionHeader icon={Settings2} label="Параметры" active={paramsActive} />
        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <SelectFilter label="Класс" value={propertyClass} options={CLASSES} onChange={setPropertyClass} />
            <SelectFilter label="Состояние" value={condition} options={conditions} onChange={setCondition} />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground mb-2">Высота потолков</p>
            <div className="flex flex-wrap gap-1.5">
              {CEILING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCeilingMin(ceilingMin === opt.value ? 0 : opt.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
                    ceilingMin === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground bg-background"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-lg border border-border/60 px-3 py-2.5 hover:bg-muted/40 transition-colors">
            <Checkbox checked={parkingOnly} onCheckedChange={(v) => setParkingOnly(!!v)} className="shrink-0" />
            <span className="text-sm text-foreground">Есть парковка</span>
          </label>

          {layouts.length > 0 && (
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground mb-2">Планировка</p>
              <div className="space-y-1 max-h-40 overflow-y-auto overflow-x-hidden pr-1 -mr-1">
                {layouts.map((l) => (
                  <label
                    key={l}
                    className="flex items-start gap-2.5 cursor-pointer select-none rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors min-w-0"
                  >
                    <Checkbox
                      checked={selectedLayouts.includes(l)}
                      onCheckedChange={() => toggleLayout(l)}
                      className="shrink-0 mt-0.5"
                    />
                    <span className="text-xs leading-snug text-foreground break-words min-w-0">{l}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const filterFooter = (
    <FilterPanelFooter
      count={filtered.length}
      isLoading={isLoading}
      activeFiltersCount={activeFiltersCount}
      activeChips={activeChips}
      onReset={resetFilters}
      onClose={() => setMobileSidebar(false)}
      showCloseButton={mobileSidebar}
    />
  );

  const collapsedRail = (
    <div className="flex flex-col h-full min-w-0 w-full overflow-hidden">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        title="Показать фильтры"
        className="flex flex-col items-center gap-1 w-full py-3 border-b border-border/40 hover:bg-muted/40 transition-colors shrink-0"
      >
        <PanelLeft className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-medium text-foreground leading-none">Фильтры</span>
        {activeFiltersCount > 0 && (
          <span className="count-badge mt-0.5">{activeFiltersCount}</span>
        )}
      </button>
      <div className="flex-1 flex flex-col items-center gap-1 py-2 min-h-0 overflow-y-auto overflow-x-hidden">
        <RailIcon icon={Search} label="Поиск" active={!!searchQuery} onClick={() => setSidebarOpen(true)} />
        <RailIcon icon={Tag} label="Тип сделки" active={dealType !== "Все"} onClick={() => setSidebarOpen(true)} />
        <RailIcon icon={Building} label="Тип объекта" active={selectedTypes.length > 0} onClick={() => setSidebarOpen(true)} />
        <RailIcon icon={MapPin} label="Район" active={district !== "Все"} onClick={() => setSidebarOpen(true)} />
        <RailIcon icon={Banknote} label="Цена" active={isPriceFiltered} onClick={() => setSidebarOpen(true)} />
        <RailIcon icon={Ruler} label="Площадь" active={isAreaFiltered} onClick={() => setSidebarOpen(true)} />
        <RailIcon icon={Settings2} label="Параметры" active={paramsActive} onClick={() => setSidebarOpen(true)} />
      </div>
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        title={`Найдено ${filtered.length} объектов`}
        className="shrink-0 w-full py-3 border-t border-border/40 hover:bg-muted/40 transition-colors text-center"
      >
        <span className="text-sm font-semibold text-foreground tabular-nums">{isLoading ? "…" : filtered.length}</span>
        <span className="block text-[9px] text-muted-foreground mt-0.5">объектов</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <SiteHeader />

      <div className="pt-[100px] flex-1 flex flex-col">

        {/* Хлебные крошки */}
        <div>
          <div className="px-6 lg:px-12 xl:px-20 h-9 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
            <span className="opacity-40">/</span>
            <span className="text-foreground">Каталог объектов</span>
          </div>
        </div>

        {/* Топ-бар — сортировка и вид */}
        <div className="sticky top-[100px] z-20 bg-background border-b border-border/30">
          <div className="px-6 lg:px-12 xl:px-20 h-12 flex items-center gap-3">

            {/* Кнопка фильтров — только мобайл */}
            <button
              onClick={() => setMobileSidebar(true)}
              className="lg:hidden inline-flex items-center gap-2 h-8 px-3 text-xs font-medium border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Фильтры
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-sm bg-primary text-primary-foreground">{activeFiltersCount}</span>
              )}
            </button>

            {/* Мобильный счётчик */}
            <div className="lg:hidden text-xs text-muted-foreground mr-auto">
              {isLoading ? (
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1 h-1 bg-muted-foreground animate-bounce" />
                  <span className="w-1 h-1 bg-muted-foreground animate-bounce [animation-delay:120ms]" />
                  <span className="w-1 h-1 bg-muted-foreground animate-bounce [animation-delay:240ms]" />
                </span>
              ) : <><strong className="text-foreground font-semibold">{filtered.length}</strong> объектов</>}
            </div>

            <div className="hidden lg:block flex-1" />

            {/* Сортировка */}
            <div className="hidden sm:flex items-center gap-0 mr-1">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setSort(o.value)}
                  className={`h-7 px-3 text-[11px] font-medium transition-all whitespace-nowrap ${
                    sort === o.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Вид: сетка / список / карта */}
            <div className="flex items-center border border-border/40 shrink-0">
              {([
                { mode: "grid" as const, icon: LayoutGrid, label: "Сетка" },
                { mode: "list" as const, icon: List, label: "Список" },
                { mode: "map" as const, icon: MapIcon, label: "Карта" },
              ]).map(({ mode, icon: Icon, label }, i) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${
                    viewMode === mode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  } ${i > 0 ? "border-l border-border/40" : ""}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Контент: сайдбар + карточки + правый сайдбар */}
        <div className="flex-1 flex min-h-0">

          {/* Левый сайдбар — единое пространство фильтров */}
          <aside
            className="hidden lg:flex flex-col shrink-0 overflow-hidden catalog-filter-sidebar bg-muted/10"
            style={{
              width: sidebarOpen ? SIDEBAR_W_OPEN : SIDEBAR_W_COLLAPSED,
              borderRight: "1px solid hsl(var(--border) / 0.3)",
              transition: "width 280ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {sidebarOpen ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground">Фильтры</span>
                    {activeFiltersCount > 0 && <span className="count-badge">{activeFiltersCount}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                    <span>Скрыть</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">{filterFields}</div>
                {filterFooter}
              </>
            ) : (
              collapsedRail
            )}
          </aside>

          {/* Мобильный сайдбар */}
          {mobileSidebar && (
            <div className="fixed inset-0 z-50 bg-background flex flex-col lg:hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Фильтры</span>
                  {activeFiltersCount > 0 && <span className="count-badge">{activeFiltersCount}</span>}
                </div>
                <button type="button" onClick={() => setMobileSidebar(false)} aria-label="Закрыть фильтры">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">{filterFields}</div>
              {filterFooter}
            </div>
          )}

          {/* Результаты */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {viewMode === "map" ? (
              <CatalogMap properties={filtered} />
            ) : (
              <div className="px-6 py-5">
                {isLoading ? (
                  <div className={`grid gap-4 sm:grid-cols-2 ${sidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
                    {Array.from({ length: 6 }).map((_, i) => <GridCardSkeleton key={i} />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-14 h-14 bg-muted flex items-center justify-center mx-auto mb-4">
                      <PhBuildings className="w-7 h-7 text-muted-foreground" weight="duotone" />
                    </div>
                    <h3 className="font-display text-base font-semibold mb-1">Объекты не найдены</h3>
                    <p className="text-xs text-muted-foreground mb-4">Попробуйте изменить параметры фильтрации</p>
                    <button onClick={resetFilters} className="text-xs text-primary font-medium hover:underline">Сбросить фильтры</button>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className={`grid gap-4 sm:grid-cols-2 ${sidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
                    {filtered.map((p) => <GridCard key={p.id} property={p} />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((p) => <ListCard key={p.id} property={p} />)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Правый сайдбар */}
          <div className="hidden xl:flex shrink-0 w-[280px] flex-col overflow-y-auto overflow-x-hidden border-l border-border/30 pl-5 pr-5 py-5">
            <NewsSidebar />
          </div>
        </div>
      </div>
      <SiteFooter />

      <style>{`
        .range-thumb { -webkit-appearance: none; pointer-events: all; }
        .range-thumb::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; pointer-events: all; cursor: pointer; }
        .range-thumb::-moz-range-thumb { width: 16px; height: 16px; pointer-events: all; cursor: pointer; border: none; background: transparent; }
        .catalog-filter-sidebar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) transparent;
        }
        .catalog-filter-sidebar::-webkit-scrollbar { width: 4px; height: 0; }
        .catalog-filter-sidebar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ─── Cards ───

function GridCard({ property: p }: { property: DbProperty }) {
  const land = isLandProperty(p.type);
  const landUse = getLandUse(p);
  const cadastral = getLandCadastral(p.extras as Record<string, unknown> | null);
  return (
    <Link to={`/property/${p.id}`}
      className="group bg-card overflow-hidden hover:shadow-md transition-shadow duration-200 border border-border/50">
      <div className="relative h-44 bg-muted overflow-hidden">
        <PropertyImage src={p.cover_photo} alt={p.address} imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">{p.deal_type}</span>
          <span className="px-2 py-0.5 rounded-md bg-card/90 backdrop-blur text-foreground text-[10px] font-semibold">{p.type}</span>
          {p.class !== "-" && <span className="px-2 py-0.5 rounded-md bg-accent/90 text-accent-foreground text-[10px] font-semibold">Класс {p.class}</span>}
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-card/80 backdrop-blur text-[10px] text-muted-foreground">
          <Eye className="w-3 h-3" /> {p.views_count || 0}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            {Number(p.price) > 0 ? (
              <>
                <div className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {Number(p.price).toLocaleString("ru-RU")} ₽{p.deal_type === "Аренда" && <span className="text-xs font-normal text-muted-foreground">/мес</span>}
                </div>
                <div className="text-xs text-muted-foreground">{Number(p.price_per_m2).toLocaleString("ru-RU")} ₽/м²</div>
              </>
            ) : (
              <div className="font-display text-lg font-bold text-muted-foreground">Уточнить у менеджера</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{p.address}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground">
          <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3 text-muted-foreground" />{p.area} м²</span>
          {land ? (
            <>
              {landUse && <span>Участок под: {landUse}</span>}
              {cadastral && <span className="truncate">к/н {cadastral}</span>}
            </>
          ) : (
            <>
              {p.floor && p.floor !== "-" && <span>Этаж {p.floor}/{p.total_floors}</span>}
              {p.ceiling_height && Number(p.ceiling_height) > 0 && <span>Потолки {p.ceiling_height} м</span>}
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {(p.features || []).slice(0, 3).map((f) => (
            <span key={f} className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">{f}</span>
          ))}
          {(p.features || []).length > 3 && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">+{(p.features || []).length - 3}</span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.published_date ? new Date(p.published_date).toLocaleDateString("ru-RU") : "—"}</span>
          <span>{p.district}</span>
        </div>
      </div>
    </Link>
  );
}

function ListCard({ property: p }: { property: DbProperty }) {
  const land = isLandProperty(p.type);
  const landUse = getLandUse(p);
  const cadastral = getLandCadastral(p.extras as Record<string, unknown> | null);
  return (
    <Link to={`/property/${p.id}`}
      className="group flex bg-card overflow-hidden hover:shadow-md transition-shadow duration-200 border border-border/50">
      <div className="relative w-48 shrink-0 bg-muted hidden sm:block overflow-hidden">
        <PropertyImage src={p.cover_photo} alt={p.address} imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">{p.deal_type}</span>
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {Number(p.price) > 0 ? (
                <>
                  <div className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {Number(p.price).toLocaleString("ru-RU")} ₽{p.deal_type === "Аренда" && <span className="text-xs font-normal text-muted-foreground">/мес</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{Number(p.price_per_m2).toLocaleString("ru-RU")} ₽/м² · {p.type} {p.class !== "-" ? `класса ${p.class}` : ""}</div>
                </>
              ) : (
                <>
                  <div className="font-display text-lg font-bold text-muted-foreground">Уточнить у менеджера</div>
                  <div className="text-xs text-muted-foreground">{p.type} {p.class !== "-" ? `класса ${p.class}` : ""}</div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views_count || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
            <MapPin className="w-3 h-3 shrink-0" /> {p.address} · {p.district}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-foreground mt-2">
            <span>{p.area} м²</span>
            {land ? (
              <>
                {landUse && <span>Участок под: {landUse}</span>}
                {cadastral && <span>к/н {cadastral}</span>}
              </>
            ) : (
              <>
                {p.floor && p.floor !== "-" && <span>Этаж {p.floor}/{p.total_floors}</span>}
                {p.ceiling_height && Number(p.ceiling_height) > 0 && <span>Потолки {p.ceiling_height} м</span>}
                {p.condition && <span>{p.condition}</span>}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {(p.features || []).slice(0, 5).map((f) => (
            <span key={f} className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">{f}</span>
          ))}
          {(p.features || []).length > 5 && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">+{(p.features || []).length - 5}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Skeletons ───

function GridCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden border border-border/50">
      <div className="relative h-44 overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <div className="pt-3 flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="flex bg-card overflow-hidden border border-border/50">
      <div className="relative w-48 shrink-0 hidden sm:block">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

