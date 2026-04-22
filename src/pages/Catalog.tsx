import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProperties, type DbProperty } from "@/hooks/useProperties";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AIPropertyWizard from "@/components/AIPropertyWizard";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SlidersHorizontal, X, ChevronDown, MapPin, Maximize2, LayoutGrid, List,
  Building2, Store, Warehouse, TreePine, Factory, ArrowUpDown, Eye, Calendar,
  Sparkles, Send, Phone, PhoneOff, Mic, PanelLeftClose, PanelLeft,
  Search, ChevronUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const typeIcons: Record<string, React.ElementType> = {
  "Офис": Building2, "Торговая": Store, "Склад": Warehouse, "Земля": TreePine, "Производство": Factory,
};

const ELEVENLABS_AGENT_ID = "agent_7301kmyt4jxxf8etgj0av5x43qb4";

// ─── Compact range input ───
function RangeInput({ label, min, max, onMinChange, onMaxChange, suffix }: {
  label: string; min: string; max: string; onMinChange: (v: string) => void; onMaxChange: (v: string) => void; suffix?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <input type="number" placeholder="от" value={min} onChange={(e) => onMinChange(e.target.value)}
            className="w-full px-0 py-1.5 pr-7 bg-transparent text-xs text-foreground border-0 border-b border-border focus:outline-none focus:border-primary transition-colors" />
          {suffix && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>}
        </div>
        <div className="relative flex-1">
          <input type="number" placeholder="до" value={max} onChange={(e) => onMaxChange(e.target.value)}
            className="w-full px-0 py-1.5 pr-7 bg-transparent text-xs text-foreground border-0 border-b border-border focus:outline-none focus:border-primary transition-colors" />
          {suffix && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>}
        </div>
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

// ─── Collapsible section with smooth grid animation ───
function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="group w-full flex items-center justify-between py-2 text-[11px] font-semibold text-foreground uppercase tracking-[0.1em] transition-colors"
      >
        <span className="section-title group-hover:text-primary transition-colors">{title}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-all duration-300 group-hover:text-primary ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`collapse-grid ${open ? "is-open" : ""}`}>
        <div className="collapse-inner">
          <div className="space-y-2.5 pt-1.5">{children}</div>
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
      setMessages((p) => [...p, { role: "assistant", text: "Для полного ИИ подключите Lovable Cloud. Сейчас работаю в демо-режиме. Уточните ваш запрос!" }]);
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

// ─── Main Catalog ───
export default function Catalog() {
  const { data: properties = [], isLoading } = useProperties();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [dealType, setDealType] = useState("Все");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [district, setDistrict] = useState("Все");
  const [propertyClass, setPropertyClass] = useState("Все");
  const [condition, setCondition] = useState("Все");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [sort, setSort] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const districts = useMemo(() => ["Все", ...Array.from(new Set(properties.map((p) => p.district)))], [properties]);
  const conditions = useMemo(() => ["Все", ...Array.from(new Set(properties.map((p) => p.condition).filter(Boolean) as string[]))], [properties]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const activeFiltersCount = [
    dealType !== "Все", selectedTypes.length > 0, district !== "Все",
    propertyClass !== "Все", condition !== "Все",
    priceMin, priceMax, areaMin, areaMax, searchQuery,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDealType("Все"); setSelectedTypes([]); setDistrict("Все");
    setPropertyClass("Все"); setCondition("Все");
    setPriceMin(""); setPriceMax(""); setAreaMin(""); setAreaMax("");
    setSearchQuery("");
  };

  const filtered = useMemo(() => {
    let result = [...properties];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.address.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
    }
    if (dealType !== "Все") result = result.filter((p) => p.deal_type === dealType);
    if (selectedTypes.length > 0) result = result.filter((p) => selectedTypes.includes(p.type));
    if (district !== "Все") result = result.filter((p) => p.district === district);
    if (propertyClass !== "Все") result = result.filter((p) => p.class === propertyClass);
    if (condition !== "Все") result = result.filter((p) => p.condition === condition);
    if (priceMin) result = result.filter((p) => Number(p.price) >= Number(priceMin));
    if (priceMax) result = result.filter((p) => Number(p.price) <= Number(priceMax));
    if (areaMin) result = result.filter((p) => Number(p.area) >= Number(areaMin));
    if (areaMax) result = result.filter((p) => Number(p.area) <= Number(areaMax));

    switch (sort) {
      case "price_asc": result.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case "price_desc": result.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case "area_asc": result.sort((a, b) => Number(a.area) - Number(b.area)); break;
      case "area_desc": result.sort((a, b) => Number(b.area) - Number(a.area)); break;
    }
    return result;
  }, [properties, dealType, selectedTypes, district, propertyClass, condition, priceMin, priceMax, areaMin, areaMax, sort, searchQuery]);

  // Sidebar content (shared between desktop & mobile)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Search */}
        <div className="input-underline relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по адресу, району..."
            className="w-full pl-6 pr-2 py-2 bg-transparent text-xs text-foreground border-0 border-b border-border focus:outline-none transition-colors" />
        </div>

        {/* Deal type */}
        <Section title="Тип сделки">
          <div className="flex gap-1">
            {DEALS.map((d) => (
              <button
                key={d}
                onClick={() => setDealType(d)}
                className={`flex-1 px-2 py-2 text-[11px] font-medium transition-all duration-300 ${
                  dealType === d
                    ? "tab-active-gradient"
                    : "text-muted-foreground tab-hover-gradient hover:text-foreground"
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
              const Icon = typeIcons[t] || Building2;
              const checked = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`chip ${checked ? "is-active" : ""}`}
                  type="button"
                >
                  <Icon className="w-3 h-3" />
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

        {/* Price & Area */}
        <Section title="Цена и площадь">
          <RangeInput label="Цена, ₽" min={priceMin} max={priceMax} onMinChange={setPriceMin} onMaxChange={setPriceMax} suffix="₽" />
          <RangeInput label="Площадь, м²" min={areaMin} max={areaMax} onMinChange={setAreaMin} onMaxChange={setAreaMax} suffix="м²" />
        </Section>

        {/* Class & Condition */}
        <Section title="Параметры" defaultOpen={false}>
          <SelectFilter label="Класс" value={propertyClass} options={CLASSES} onChange={setPropertyClass} />
          <SelectFilter label="Состояние" value={condition} options={conditions} onChange={setCondition} />
        </Section>

        {/* Reset */}
        {activeFiltersCount > 0 && (
          <button onClick={resetFilters} className="w-full flex items-center justify-center gap-1.5 text-xs text-destructive hover:text-destructive/80 py-2 transition-colors">
            <X className="w-3 h-3" /> Сбросить ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* AI chat section at bottom */}
      <div>
        <button onClick={() => setAiOpen(!aiOpen)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="flex-1 text-left">ИИ-помощник</span>
          {aiOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
        {aiOpen && (
          <div className="h-72">
            <SidebarAIChat />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <div className="pt-16 flex-1 flex flex-col">
        {/* Top bar with aurora ambient glow */}
        <div className="aurora-bg">
          <div className="px-4 lg:px-6 py-5 lg:py-7 flex items-center gap-4">
            {/* Toggle sidebar desktop */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            {/* Toggle sidebar mobile */}
            <button onClick={() => setMobileSidebar(true)} className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Фильтры
              {activeFiltersCount > 0 && <span className="count-badge">{activeFiltersCount}</span>}
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                Каталог{" "}
                <span className="bg-gradient-to-r from-primary via-primary to-gold bg-clip-text text-transparent">объектов</span>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:flex items-center gap-2 mt-0.5">
                <span className="inline-block w-1 h-1 bg-primary animate-pulse" />
                Коммерческая недвижимость в Иркутске и области
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="input-underline relative hidden sm:block">
                <ArrowUpDown className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <select value={sort} onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pl-5 pr-5 py-1.5 bg-transparent text-[11px] font-medium text-foreground border-0 border-b border-border focus:outline-none cursor-pointer">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-all duration-300 ${viewMode === "grid" ? "tab-active-gradient" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-all duration-300 ${viewMode === "list" ? "tab-active-gradient" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area with sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar */}
          {sidebarOpen && (
            <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col overflow-hidden">
              {sidebarContent}
            </aside>
          )}

          {/* Mobile sidebar overlay */}
          {mobileSidebar && (
            <>
              <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileSidebar(false)} />
              <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-card flex flex-col lg:hidden animate-fade-in-up">
                <div className="flex items-center justify-between px-3 py-3">
                  <span className="text-sm font-semibold text-foreground">Фильтры и поиск</span>
                  <button onClick={() => setMobileSidebar(false)} className="p-1.5 hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {sidebarContent}
              </aside>
            </>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 lg:px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="result-count">
                  {isLoading ? (
                    <span className="inline-flex gap-1">
                      <span className="w-1 h-1 bg-primary animate-bounce" />
                      <span className="w-1 h-1 bg-primary animate-bounce [animation-delay:120ms]" />
                      <span className="w-1 h-1 bg-primary animate-bounce [animation-delay:240ms]" />
                    </span>
                  ) : (
                    <>Найдено <strong>{filtered.length}</strong> объектов</>
                  )}
                </div>
                {/* Mobile sort */}
                <div className="relative sm:hidden">
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
                    <Building2 className="w-7 h-7 text-muted-foreground" />
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
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

// ─── Cards ───

function GridCard({ property: p }: { property: DbProperty }) {
  const Icon = typeIcons[p.type] || Building2;
  return (
    <Link to={`/property/${p.id}`}
      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300">
      <div className="relative h-44 bg-gradient-to-br from-muted to-muted/60 overflow-hidden">
        {p.cover_photo ? (
          <img src={p.cover_photo} alt={p.address} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">{p.deal_type}</span>
          <span className="px-2 py-0.5 rounded-md bg-card/90 backdrop-blur text-foreground text-[10px] font-semibold">{p.type}</span>
          {p.class !== "-" && (
            <span className="px-2 py-0.5 rounded-md bg-accent/90 text-accent-foreground text-[10px] font-semibold">Класс {p.class}</span>
          )}
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-card/80 backdrop-blur text-[10px] text-muted-foreground">
          <Eye className="w-3 h-3" /> {p.views_count || 0}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {Number(p.price).toLocaleString("ru-RU")} ₽{p.deal_type === "Аренда" && <span className="text-xs font-normal text-muted-foreground">/мес</span>}
            </div>
            <div className="text-xs text-muted-foreground">{Number(p.price_per_m2).toLocaleString("ru-RU")} ₽/м²</div>
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
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.published_date ? new Date(p.published_date).toLocaleDateString("ru-RU") : "—"}</span>
          <span>{p.district}</span>
        </div>
      </div>
    </Link>
  );
}

function ListCard({ property: p }: { property: DbProperty }) {
  const Icon = typeIcons[p.type] || Building2;
  return (
    <Link to={`/property/${p.id}`}
      className="group flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300">
      <div className="relative w-48 shrink-0 bg-gradient-to-br from-muted to-muted/60 hidden sm:flex items-center justify-center overflow-hidden">
        {p.cover_photo ? (
          <img src={p.cover_photo} alt={p.address} className="w-full h-full object-cover" />
        ) : (
          <Icon className="w-10 h-10 text-muted-foreground/30" />
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">{p.deal_type}</span>
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {Number(p.price).toLocaleString("ru-RU")} ₽{p.deal_type === "Аренда" && <span className="text-xs font-normal text-muted-foreground">/мес</span>}
              </div>
              <div className="text-xs text-muted-foreground">{Number(p.price_per_m2).toLocaleString("ru-RU")} ₽/м² · {p.type} {p.class !== "-" ? `класса ${p.class}` : ""}</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
