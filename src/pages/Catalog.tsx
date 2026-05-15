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
  Search, ChevronUp, Map as MapIcon,
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
  const THUMB = 7; // half of thumb width px
  return (
    <div className="px-2">
      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-0.5 bg-border" />
        <div
          className="absolute h-0.5 bg-primary"
          style={{
            left: `calc(${left}% + ${THUMB * (1 - left / 50)}px)`,
            right: `calc(${100 - right}% + ${THUMB * (right / 50 - 1)}px)`,
          }}
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
        {/* Thumb dots */}
        <div className="absolute w-3.5 h-3.5 bg-background border-2 border-primary pointer-events-none"
          style={{ left: `calc(${left}% - ${THUMB}px)` }} />
        <div className="absolute w-3.5 h-3.5 bg-background border-2 border-primary pointer-events-none"
          style={{ left: `calc(${right}% - ${THUMB}px)` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
        <span>{format(valueMin)}</span>
        <span>{format(valueMax)}</span>
      </div>
    </div>
  );
}

// ─── Compact select ───
function SelectFilter({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-0 py-1.5 pr-7 bg-transparent text-xs text-foreground border-0 border-b border-border focus:outline-none focus:border-primary transition-colors">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Collapsible section ───
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="group w-full flex items-center justify-between py-2 text-[11px] font-semibold text-foreground uppercase tracking-[0.1em] transition-colors"
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-primary/70 transition-colors ml-0.5">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
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
  const layouts = useMemo(() => Array.from(new Set(properties.map((p) => (p as any).layout).filter(Boolean) as string[])), [properties]);

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
    if (ceilingMin > 0) result = result.filter((p) => Number(p.ceiling_height) >= ceilingMin);
    if (parkingOnly) result = result.filter((p) => p.parking && p.parking !== "Нет" && p.parking !== "-");
    if (selectedLayouts.length > 0) result = result.filter((p) => selectedLayouts.includes((p as any).layout));

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

  // Sidebar content (shared between desktop & mobile)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Search */}
        <div className="input-underline relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по адресу, районе..."
            className="w-full pl-6 pr-2 py-2 bg-transparent text-xs text-foreground border-0 border-b border-border focus:outline-none transition-colors" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Deal type */}
        <Section title="Тип сделки">
          <div className="flex gap-1">
            {DEALS.map((d) => (
              <button
                key={d}
                onClick={() => setDealType(d)}
                className={`flex-1 px-2 py-2 text-[11px] font-medium transition-all duration-300 ${
                  dealType === d ? "tab-active-gradient" : "text-muted-foreground tab-hover-gradient hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Section>

        {/* Property types as chip pills */}
        <Section title="Тип объекта">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => {
              const Icon = typeIcons[t] || PhBuildings;
              const checked = selectedTypes.includes(t);
              return (
                <button key={t} onClick={() => toggleType(t)} className={`chip ${checked ? "is-active" : ""}`} type="button">
                  <Icon className="w-3.5 h-3.5" weight="duotone" />
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Location */}
        <Section title="Локация">
          <SelectFilter label="Район / Город" value={district} options={districts} onChange={setDistrict} />
        </Section>

        {/* Price slider */}
        <Section title="Цена, ₽/мес">
          <RangeSlider
            min={0} max={500000} step={5000}
            valueMin={priceMin} valueMax={priceMax}
            onChangeMin={setPriceMin} onChangeMax={setPriceMax}
            format={formatPrice}
          />
        </Section>

        {/* Area slider */}
        <Section title="Площадь, м²">
          <RangeSlider
            min={0} max={10000} step={10}
            valueMin={areaMin} valueMax={areaMax}
            onChangeMin={setAreaMin} onChangeMax={setAreaMax}
            format={formatArea}
          />
        </Section>

        {/* Class & Condition */}
        <Section title="Параметры" defaultOpen={false}>
          <SelectFilter label="Класс" value={propertyClass} options={CLASSES} onChange={setPropertyClass} />
          <SelectFilter label="Состояние" value={condition} options={conditions} onChange={setCondition} />
        </Section>

        {/* Ceiling, Parking, Layout */}
        <Section title="Дополнительно" defaultOpen={false}>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Высота потолков</label>
            <div className="flex gap-1.5 flex-wrap">
              {CEILING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCeilingMin(ceilingMin === opt.value ? 0 : opt.value)}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-all border ${
                    ceilingMin === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={parkingOnly}
              onCheckedChange={(v) => setParkingOnly(!!v)}
              className="w-3.5 h-3.5"
            />
            <span className="text-xs text-foreground">Есть парковка</span>
          </label>
          {layouts.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Планировка</label>
              <div className="space-y-1.5">
                {layouts.map((l) => (
                  <label key={l} className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={selectedLayouts.includes(l)}
                      onCheckedChange={() => toggleLayout(l)}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-xs text-foreground">{l}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Reset */}
        {activeFiltersCount > 0 && (
          <button onClick={resetFilters} className="w-full flex items-center justify-center gap-1.5 text-xs text-destructive hover:text-destructive/80 py-2 transition-colors">
            <X className="w-3 h-3" /> Сбросить все ({activeFiltersCount})
          </button>
        )}

      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <div className="pt-[100px] flex-1 flex flex-col">
        {/* Breadcrumbs */}
        <div className="border-b border-border/40 bg-card/60">
          <div className="px-3 lg:px-6 h-9 flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
            <Link to="/" className="hover:text-foreground transition-colors shrink-0">Главная</Link>
            <span className="shrink-0 opacity-50">/</span>
            <span className="text-foreground truncate">Каталог объектов</span>
          </div>
        </div>

        {/* Top bar */}
        <div className="border-b border-border/40">
          <div className="px-3 lg:px-6 py-2.5 lg:py-3 flex items-center gap-2 lg:gap-4">
            {/* Toggle sidebar desktop */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            {/* Toggle sidebar mobile */}
            <button onClick={() => setMobileSidebar(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground border border-border hover:border-primary hover:text-primary transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Фильтры
              {activeFiltersCount > 0 && <span className="count-badge">{activeFiltersCount}</span>}
            </button>

            {/* Result count */}
            <div className="flex-1 min-w-0 text-xs text-muted-foreground truncate">
              {isLoading ? (
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1 h-1 bg-primary animate-bounce" />
                  <span className="w-1 h-1 bg-primary animate-bounce [animation-delay:120ms]" />
                  <span className="w-1 h-1 bg-primary animate-bounce [animation-delay:240ms]" />
                </span>
              ) : (
                <>Найдено <strong className="text-foreground">{filtered.length}</strong> объектов</>
              )}
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <div className="input-underline relative hidden sm:block">
                <ArrowUpDown className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <select value={sort} onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pl-5 pr-5 py-1.5 bg-transparent text-[11px] font-medium text-foreground border-0 border-b border-border focus:outline-none cursor-pointer">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex">
                <button onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-all duration-300 ${viewMode === "grid" ? "tab-active-gradient" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="Grid view">
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-all duration-300 ${viewMode === "list" ? "tab-active-gradient" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="List view">
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("map")}
                  className={`p-1.5 transition-all duration-300 ${viewMode === "map" ? "tab-active-gradient" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="Map view">
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter chips row */}
          {activeChips.length > 0 && (
            <div className="px-3 lg:px-6 pb-2 flex flex-wrap gap-1.5 items-center">
              {activeChips.map((c, i) => <Chip key={i} label={c.label} onRemove={c.onRemove} />)}
              <button onClick={resetFilters} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors ml-1">
                Сбросить всё
              </button>
            </div>
          )}
        </div>

        {/* Main content area with sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar */}
          <aside
            className="hidden lg:flex shrink-0 flex-col overflow-hidden"
            style={{
              width: sidebarOpen ? "272px" : "0px",
              opacity: sidebarOpen ? 1 : 0,
              transition: "width 300ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
              pointerEvents: sidebarOpen ? "auto" : "none",
            }}
          >
            <div className="w-64 xl:w-[272px] flex-1 overflow-hidden flex flex-col">
              {sidebarContent}
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          {mobileSidebar && (
            <aside className="fixed inset-0 z-50 bg-background flex flex-col lg:hidden animate-fade-in-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Фильтры</span>
                  {activeFiltersCount > 0 && <span className="count-badge">{activeFiltersCount}</span>}
                </div>
                <button onClick={() => setMobileSidebar(false)}
                  className="p-2 -mr-2 rounded-lg text-foreground hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">{sidebarContent}</div>
              <div className="px-4 py-3 border-t border-border/40 shrink-0">
                <button onClick={() => setMobileSidebar(false)}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  Показать {filtered.length} объектов
                </button>
              </div>
            </aside>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {viewMode === "map" ? (
              <CatalogMap properties={filtered} />
            ) : (
              <div className="px-4 lg:px-6 py-3 lg:py-4">
                {/* Mobile sort row */}
                <div className="flex items-center justify-end mb-3 sm:hidden">
                  <div className="relative">
                    <select value={sort} onChange={(e) => setSort(e.target.value)}
                      className="appearance-none pl-6 pr-5 py-1.5 bg-transparent text-[11px] font-medium text-foreground border-0 border-b border-border focus:outline-none focus:border-primary">
                      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ArrowUpDown className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {isLoading ? (
                  viewMode === "grid" ? (
                    <div className={`grid gap-4 sm:grid-cols-2 ${sidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
                      {Array.from({ length: 6 }).map((_, i) => <GridCardSkeleton key={i} />)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => <ListCardSkeleton key={i} />)}
                    </div>
                  )
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <PhBuildings className="w-7 h-7 text-muted-foreground" weight="duotone" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-foreground mb-1">Объекты не найдены</h3>
                    <p className="text-xs text-muted-foreground mb-3">Попробуйте изменить параметры фильтрации</p>
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

          {/* News sidebar — right column, desktop only */}
          <div className="hidden xl:block shrink-0 w-[280px] overflow-y-auto border-l border-border/40">
            <NewsSidebar />
          </div>
        </div>
      </div>
      <SiteFooter />

      <style>{`
        .range-thumb { -webkit-appearance: none; pointer-events: all; }
        .range-thumb::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; pointer-events: all; cursor: pointer; }
        .range-thumb::-moz-range-thumb { width: 14px; height: 14px; pointer-events: all; cursor: pointer; border: none; background: transparent; }
      `}</style>
    </div>
  );
}

// ─── Cards ───

function GridCard({ property: p }: { property: DbProperty }) {
  return (
    <Link to={`/property/${p.id}`}
      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300">
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
          {p.floor && p.floor !== "-" && <span>Этаж {p.floor}/{p.total_floors}</span>}
          {p.ceiling_height && Number(p.ceiling_height) > 0 && <span>Потолки {p.ceiling_height} м</span>}
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
  return (
    <Link to={`/property/${p.id}`}
      className="group flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300">
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
            {p.floor && p.floor !== "-" && <span>Этаж {p.floor}/{p.total_floors}</span>}
            {p.ceiling_height && Number(p.ceiling_height) > 0 && <span>Потолки {p.ceiling_height} м</span>}
            {p.condition && <span>{p.condition}</span>}
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
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="flex bg-card rounded-xl border border-border overflow-hidden">
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
