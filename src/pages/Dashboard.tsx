import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Plus, LogOut, Users, Home, Edit, Trash2,
  BarChart3, Eye, MapPin, ArrowLeft, Upload, X, Star, ImageIcon, Search,
  ArrowUpDown, ArrowUp, ArrowDown, Settings2, Check
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// ====== Predefined options ======
const TYPES = ["Офис", "Торговая", "Склад", "Земля", "Производство"];
const CLASSES = ["A", "A+", "B+", "B", "C", "-"];
const DEAL_TYPES = ["Аренда", "Продажа"];

const DISTRICTS = [
  "Кировский", "Октябрьский", "Свердловский", "Ленинский", "Куйбышевский",
  "Ангарск", "Шелехов", "Усолье-Сибирское", "Братск", "Усть-Илимск",
];

const FLOORS = ["-", "Цоколь", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "Мансарда"];
const TOTAL_FLOORS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "14", "16", "18", "20", "25", "30"];
const CEILING_HEIGHTS = ["2.5", "2.7", "2.8", "3.0", "3.2", "3.5", "4.0", "4.2", "4.5", "5.0", "6.0", "7.0", "7.5", "8.0", "10.0", "12.0"];

const PARKING_OPTIONS = ["Нет", "Наземный, 1 м/м", "Наземный, 2 м/м", "Наземный, 3 м/м", "Наземный, 5 м/м", "Наземный, 10 м/м", "Подземный", "Открытая, 5 м/м", "Открытая, 8 м/м", "Открытая, 10 м/м", "Открытая, 20 м/м", "-"];

const CONDITIONS = [
  "Евроремонт", "Хороший ремонт", "Косметический ремонт", "Рабочее состояние",
  "Под чистовую отделку", "Shell & Core", "Требуется ремонт", "Без строений", "Новое",
];

const LAYOUTS = [
  "Open-space", "Open-space + кабинеты", "Кабинетная", "Свободная планировка",
  "2 кабинета + приёмная", "Open-space + 2 кабинета", "Open-space + 3 кабинета",
  "Единое пространство", "Единое пространство + офис", "Прямоугольный участок",
  "Г-образная", "Студия",
];

const DEPOSIT_OPTIONS = ["Нет", "1 месяц", "2 месяца", "3 месяца", "50%", "100%"];
const CONTRACT_TERMS = ["от 1 мес", "от 3 мес", "от 6 мес", "от 1 года", "от 2 лет", "от 3 лет", "от 5 лет", "Бессрочный"];

const FEATURES_LIST = [
  "Кондиционирование", "Охрана", "Интернет", "Переговорная", "Кухня", "Ресепшн",
  "Парковка", "Видеонаблюдение", "Мебель", "Санузел", "Кондиционер", "Пожарная сигнализация",
  "Первая линия", "Отдельный вход", "Витрины", "Высокий трафик", "Вытяжка", "Мокрая точка",
  "Вывеска", "Погрузка", "Рампа", "Отопление", "Грузовой подъезд", "Офисный блок",
  "Фасадное остекление", "Вентиляция", "Лифт", "Охрана территории",
  "Электричество 40 кВт", "Электричество 80 кВт", "Электричество 100 кВт",
  "Водопровод", "Асфальтированный подъезд", "Ровный рельеф", "Коммерческое назначение", "Ограждение",
];

// Address suggestions for Irkutsk region
const ADDRESS_SUGGESTIONS = [
  "Иркутск, ул. Ленина,", "Иркутск, ул. Карла Маркса,", "Иркутск, ул. Байкальская,",
  "Иркутск, ул. Советская,", "Иркутск, ул. Декабрьских Событий,", "Иркутск, ул. Литвинова,",
  "Иркутск, ул. Трактовая,", "Иркутск, ул. Партизанская,", "Иркутск, ул. Дзержинского,",
  "Иркутск, ул. Горького,", "Иркутск, ул. Красноармейская,", "Иркутск, ул. Сухэ-Батора,",
  "Иркутск, ул. Чкалова,", "Иркутск, ул. Лермонтова,", "Иркутск, ул. Свердлова,",
  "Иркутск, ул. Седова,", "Иркутск, ул. Ширямова,", "Иркутск, ул. Рабочая,",
  "Иркутск, бул. Гагарина,", "Иркутск, бул. Рябикова,",
  "Иркутск, мкр. Солнечный,", "Иркутск, мкр. Университетский,",
  "Ангарск, ул. Карла Маркса,", "Ангарск, ул. Ленина,", "Ангарск, мкр. 12-й,",
  "Шелехов, ул. Ленина,", "Шелехов, ул. Привокзальная,",
  "Усолье-Сибирское, ул. Ленина,", "Братск, ул. Мира,",
];

interface PropertyForm {
  type: string;
  class: string;
  area: number;
  price: number;
  price_per_m2: number;
  address: string;
  district: string;
  floor: string;
  total_floors: number;
  ceiling_height: number;
  parking: string;
  condition: string;
  layout: string;
  deal_type: string;
  deposit: string;
  contract_term: string;
  description: string;
  features: string[];
  manager_id: string;
  client_id: string;
  is_active: boolean;
}

const emptyForm: PropertyForm = {
  type: "Офис", class: "B", area: 0, price: 0, price_per_m2: 0,
  address: "", district: "Кировский", floor: "1", total_floors: 1,
  ceiling_height: 3, parking: "Нет", condition: "Хороший ремонт", layout: "Open-space",
  deal_type: "Аренда", deposit: "1 месяц", contract_term: "от 1 года",
  description: "", features: [], manager_id: "", client_id: "",
  is_active: true,
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAddresses = useMemo(() => {
    if (!addressQuery || addressQuery.length < 2) return [];
    const q = addressQuery.toLowerCase();
    return ADDRESS_SUGGESTIONS.filter((a) => a.toLowerCase().includes(q)).slice(0, 6);
  }, [addressQuery]);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["dashboard-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, manager:profiles!properties_manager_id_fkey(id, full_name), client:profiles!properties_client_id_fkey(id, full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const uploadPhotos = async (propertyId: string): Promise<{ urls: string[]; cover: string }> => {
    const urls: string[] = [...existingPhotos];

    for (const file of photoFiles) {
      const ext = file.name.split(".").pop();
      const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("property-photos").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("property-photos").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }

    // Calculate cover: if coverIndex points to existing photos, use that; otherwise offset
    const cover = urls[coverIndex] || urls[0] || "";
    return { urls, cover };
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: PropertyForm) => {
      // Create property first to get ID, then upload photos
      const payload: any = {
        type: formData.type,
        class: formData.class,
        area: formData.area,
        price: formData.price,
        price_per_m2: formData.area > 0 ? Math.round(formData.price / formData.area) : 0,
        address: formData.address,
        district: formData.district,
        floor: formData.floor,
        total_floors: formData.total_floors,
        ceiling_height: formData.ceiling_height,
        parking: formData.parking,
        condition: formData.condition,
        layout: formData.layout,
        deal_type: formData.deal_type,
        deposit: formData.deposit,
        contract_term: formData.contract_term,
        description: formData.description,
        features: formData.features,
        manager_id: formData.manager_id || null,
        client_id: formData.client_id || null,
        is_active: formData.is_active,
      };

      setUploading(true);

      if (editId) {
        // Upload photos
        if (photoFiles.length > 0 || existingPhotos.length > 0) {
          const { urls, cover } = await uploadPhotos(editId);
          payload.photos = urls;
          payload.cover_photo = cover;
          payload.photos_count = urls.length;
        }
        const { error } = await supabase.from("properties").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("properties").insert(payload).select("id").single();
        if (error) throw error;
        // Upload photos for new property
        if (photoFiles.length > 0) {
          const { urls, cover } = await uploadPhotos(data.id);
          await supabase.from("properties").update({
            photos: urls, cover_photo: cover, photos_count: urls.length,
          }).eq("id", data.id);
        }
      }
      setUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editId ? "Объект обновлён" : "Объект добавлен" });
    },
    onError: (err: Error) => {
      setUploading(false);
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] });
      toast({ title: "Объект удалён" });
    },
  });

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setExistingPhotos([]);
    setCoverIndex(0);
  };

  const openEdit = (prop: any) => {
    setEditId(prop.id);
    setForm({
      type: prop.type, class: prop.class, area: prop.area, price: prop.price,
      price_per_m2: prop.price_per_m2, address: prop.address, district: prop.district,
      floor: prop.floor || "", total_floors: prop.total_floors || 1,
      ceiling_height: prop.ceiling_height || 3, parking: prop.parking || "",
      condition: prop.condition || "", layout: prop.layout || "",
      deal_type: prop.deal_type, deposit: prop.deposit || "",
      contract_term: prop.contract_term || "", description: prop.description || "",
      features: prop.features || [],
      manager_id: prop.manager_id || "", client_id: prop.client_id || "",
      is_active: prop.is_active,
    });
    const existing = prop.photos || [];
    setExistingPhotos(existing);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    const ci = existing.indexOf(prop.cover_photo);
    setCoverIndex(ci >= 0 ? ci : 0);
    setDialogOpen(true);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const updateField = (key: keyof PropertyForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCount = existingPhotos.length + photoFiles.length + files.length;
    if (totalCount > 15) {
      toast({ title: "Максимум 15 фото", variant: "destructive" });
      return;
    }
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPhotoFiles((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    if (e.target) e.target.value = "";
  };

  const removeExistingPhoto = (idx: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== idx));
    if (coverIndex === idx) setCoverIndex(0);
    else if (coverIndex > idx) setCoverIndex((prev) => prev - 1);
  };

  const removeNewPhoto = (idx: number) => {
    const globalIdx = existingPhotos.length + idx;
    URL.revokeObjectURL(photoPreviews[idx]);
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (coverIndex === globalIdx) setCoverIndex(0);
    else if (coverIndex > globalIdx) setCoverIndex((prev) => prev - 1);
  };

  const allPhotos = [...existingPhotos, ...photoPreviews];
  const totalPhotos = allPhotos.length;

  const stats = {
    total: properties.length,
    active: properties.filter((p: any) => p.is_active).length,
    totalArea: properties.reduce((s: number, p: any) => s + Number(p.area), 0),
    totalViews: properties.reduce((s: number, p: any) => s + (p.views_count || 0), 0),
  };

  const isSale = form.deal_type === "Продажа";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              Панель управления
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4 mr-1" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Всего объектов", value: stats.total, icon: Home, color: "text-primary" },
            { label: "Активных", value: stats.active, icon: Eye, color: "text-green-600" },
            { label: "Общая площадь", value: `${stats.totalArea.toLocaleString()} м²`, icon: MapPin, color: "text-blue-600" },
            { label: "Просмотры", value: stats.totalViews, icon: BarChart3, color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="properties">
          <TabsList>
            <TabsTrigger value="properties"><Home className="w-4 h-4 mr-1" /> Объекты</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Пользователи</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Объекты недвижимости</h2>
              <Sheet open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <SheetTrigger asChild>
                  <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Добавить объект</Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
                  <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
                    <SheetTitle className="text-base font-semibold">{editId ? "Редактировать объект" : "Новый объект"}</SheetTitle>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Отмена</Button>
                      <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || uploading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {saveMutation.isPending || uploading ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </div>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="p-4 space-y-4">
                    {/* Section: Основное */}
                    <fieldset className="border border-border rounded-lg p-3 space-y-3">
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Основное</legend>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">Тип</Label>
                          <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Класс</Label>
                          <Select value={form.class} onValueChange={(v) => updateField("class", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Сделка</Label>
                          <Select value={form.deal_type} onValueChange={(v) => updateField("deal_type", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{DEAL_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">Площадь, м²</Label>
                          <Input className="h-8 text-xs" type="number" value={form.area || ""} onChange={(e) => updateField("area", Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">{isSale ? "Цена, ₽" : "Цена, ₽/мес"}</Label>
                          <Input className="h-8 text-xs" type="number" value={form.price || ""} onChange={(e) => updateField("price", Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">₽/м²</Label>
                          <Input className="h-8 text-xs bg-muted" type="number" value={form.area > 0 ? Math.round(form.price / form.area) : ""} disabled />
                        </div>
                      </div>
                    </fieldset>

                    {/* Section: Локация */}
                    <fieldset className="border border-border rounded-lg p-3 space-y-3">
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Локация</legend>
                      <div className="relative">
                        <Label className="text-xs mb-1 block">Адрес</Label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input className="h-8 text-xs pl-8" value={form.address}
                            onChange={(e) => { updateField("address", e.target.value); setAddressQuery(e.target.value); setShowAddressSuggestions(true); }}
                            onFocus={() => setShowAddressSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                            placeholder="Начните вводить адрес..." required />
                        </div>
                        {showAddressSuggestions && filteredAddresses.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                            {filteredAddresses.map((addr) => (
                              <button key={addr} type="button"
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-1.5"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { updateField("address", addr); setAddressQuery(addr); setShowAddressSuggestions(false); }}>
                                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />{addr}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">Район</Label>
                          <Select value={form.district || "none"} onValueChange={(v) => updateField("district", v === "none" ? "" : v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Район" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">—</SelectItem>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Этаж</Label>
                          <Select value={form.floor || "none"} onValueChange={(v) => updateField("floor", v === "none" ? "" : v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">—</SelectItem>{FLOORS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Этажей</Label>
                          <Select value={String(form.total_floors)} onValueChange={(v) => updateField("total_floors", Number(v))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{TOTAL_FLOORS_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                    </fieldset>

                    {/* Section: Характеристики */}
                    <fieldset className="border border-border rounded-lg p-3 space-y-3">
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Характеристики</legend>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">Потолки, м</Label>
                          <Select value={String(form.ceiling_height)} onValueChange={(v) => updateField("ceiling_height", Number(v))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{CEILING_HEIGHTS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Парковка</Label>
                          <Select value={form.parking || "none"} onValueChange={(v) => updateField("parking", v === "none" ? "" : v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">—</SelectItem>{PARKING_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Состояние</Label>
                          <Select value={form.condition || "none"} onValueChange={(v) => updateField("condition", v === "none" ? "" : v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">—</SelectItem>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">Планировка</Label>
                          <Select value={form.layout || "none"} onValueChange={(v) => updateField("layout", v === "none" ? "" : v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">—</SelectItem>{LAYOUTS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {!isSale && (
                          <>
                            <div>
                              <Label className="text-xs mb-1 block">Залог</Label>
                              <Select value={form.deposit || "none"} onValueChange={(v) => updateField("deposit", v === "none" ? "" : v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent><SelectItem value="none">—</SelectItem>{DEPOSIT_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Срок</Label>
                              <Select value={form.contract_term || "none"} onValueChange={(v) => updateField("contract_term", v === "none" ? "" : v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent><SelectItem value="none">—</SelectItem>{CONTRACT_TERMS.map((ct) => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                    </fieldset>

                    {/* Section: Назначение */}
                    <fieldset className="border border-border rounded-lg p-3 space-y-3">
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Назначение</legend>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">Менеджер</Label>
                          <Select value={form.manager_id || "none"} onValueChange={(v) => updateField("manager_id", v === "none" ? "" : v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">—</SelectItem>{users.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Клиент</Label>
                          <Select value={form.client_id || "none"} onValueChange={(v) => updateField("client_id", v === "none" ? "" : v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">—</SelectItem>{users.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Описание</Label>
                        <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={2} className="text-xs min-h-[60px]" />
                      </div>
                    </fieldset>

                    {/* Section: Особенности */}
                    <fieldset className="border border-border rounded-lg p-3 space-y-2">
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Особенности ({form.features.length})</legend>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 max-h-32 overflow-y-auto">
                        {FEATURES_LIST.map((feature) => {
                          const checked = form.features.includes(feature);
                          return (
                            <label key={feature} className="flex items-center gap-1.5 text-[11px] cursor-pointer py-0.5 hover:text-foreground transition-colors">
                              <Checkbox className="h-3.5 w-3.5" checked={checked}
                                onCheckedChange={(v) => {
                                  if (v) updateField("features", [...form.features, feature]);
                                  else updateField("features", form.features.filter((f) => f !== feature));
                                }} />
                              <span className={checked ? "text-foreground" : "text-muted-foreground"}>{feature}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* Section: Фото */}
                    <fieldset className="border border-border rounded-lg p-3 space-y-2">
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Фото ({totalPhotos}/15)</legend>
                      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                      {totalPhotos === 0 ? (
                        <div className="border border-dashed rounded p-4 text-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">Загрузить фото (до 15)</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                            {existingPhotos.map((url, idx) => (
                              <div key={`existing-${idx}`}
                                className={`relative group aspect-square rounded overflow-hidden border cursor-pointer transition-all ${coverIndex === idx ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
                                onClick={() => setCoverIndex(idx)}>
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                {coverIndex === idx && <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground rounded px-1 py-px text-[8px] font-medium"><Star className="w-2 h-2 inline" /></div>}
                                <button type="button" onClick={(e) => { e.stopPropagation(); removeExistingPhoto(idx); }}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                            {photoPreviews.map((url, idx) => {
                              const globalIdx = existingPhotos.length + idx;
                              return (
                                <div key={`new-${idx}`}
                                  className={`relative group aspect-square rounded overflow-hidden border cursor-pointer transition-all ${coverIndex === globalIdx ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
                                  onClick={() => setCoverIndex(globalIdx)}>
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  {coverIndex === globalIdx && <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground rounded px-1 py-px text-[8px] font-medium"><Star className="w-2 h-2 inline" /></div>}
                                  <button type="button" onClick={(e) => { e.stopPropagation(); removeNewPhoto(idx); }}
                                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              );
                            })}
                            {totalPhotos < 15 && (
                              <div className="aspect-square rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}>
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">Клик — главное фото</p>
                        </>
                      )}
                    </fieldset>
                  </form>
                </SheetContent>
              </Sheet>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Фото</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Адрес</TableHead>
                        <TableHead>Площадь</TableHead>
                        <TableHead>Цена</TableHead>
                        <TableHead>Сделка</TableHead>
                        <TableHead>Менеджер</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Загрузка...</TableCell></TableRow>
                      ) : properties.length === 0 ? (
                        <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Нет объектов</TableCell></TableRow>
                      ) : (
                        properties.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              {p.cover_photo ? (
                                <img src={p.cover_photo} alt="" className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{p.type}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{p.address}</TableCell>
                            <TableCell>{p.area} м²</TableCell>
                            <TableCell className="font-medium">
                              {Number(p.price).toLocaleString()} ₽{p.deal_type === "Аренда" ? "/мес" : ""}
                            </TableCell>
                            <TableCell>{p.deal_type}</TableCell>
                            <TableCell className="text-sm">{p.manager?.full_name || "—"}</TableCell>
                            <TableCell className="text-sm">{p.client?.full_name || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={p.is_active ? "default" : "outline"}>
                                {p.is_active ? "Активен" : "Скрыт"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon"
                                  onClick={() => { if (confirm("Удалить объект?")) deleteMutation.mutate(p.id); }}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Пользователи системы</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}...</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
