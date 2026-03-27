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
  BarChart3, Eye, MapPin, ArrowLeft, Upload, X, Star, ImageIcon, Search
} from "lucide-react";

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
  features: string;
  manager_id: string;
  client_id: string;
  is_active: boolean;
}

const emptyForm: PropertyForm = {
  type: "Офис", class: "B", area: 0, price: 0, price_per_m2: 0,
  address: "", district: "", floor: "", total_floors: 1,
  ceiling_height: 3, parking: "", condition: "", layout: "",
  deal_type: "Аренда", deposit: "", contract_term: "",
  description: "", features: "", manager_id: "", client_id: "",
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        features: formData.features.split(",").map((f) => f.trim()).filter(Boolean),
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
      features: (prop.features || []).join(", "),
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
                <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-6">
                  <SheetHeader className="mb-4">
                    <SheetTitle>{editId ? "Редактировать объект" : "Новый объект"}</SheetTitle>
                  </SheetHeader>
                  <form
                    onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
                  >
                    <div className="space-y-2">
                      <Label>Тип</Label>
                      <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Офис", "Торговая", "Склад", "Земля", "Производство"].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Класс</Label>
                      <Select value={form.class} onValueChange={(v) => updateField("class", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["A", "A+", "B+", "B", "C", "-"].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Тип сделки</Label>
                      <Select value={form.deal_type} onValueChange={(v) => updateField("deal_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Аренда">Аренда</SelectItem>
                          <SelectItem value="Продажа">Продажа</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Площадь (м²)</Label>
                      <Input type="number" value={form.area || ""} onChange={(e) => updateField("area", Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isSale ? "Цена (₽)" : "Цена (₽/мес)"}</Label>
                      <Input type="number" value={form.price || ""} onChange={(e) => updateField("price", Number(e.target.value))} />
                    </div>
                    {isSale && (
                      <div className="space-y-2">
                        <Label>Цена за м² (₽)</Label>
                        <Input
                          type="number"
                          value={form.area > 0 ? Math.round(form.price / form.area) : ""}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    )}
                    <div className={`space-y-2 ${isSale ? "" : "sm:col-span-2"}`}>
                      <Label>Адрес</Label>
                      <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Район/город</Label>
                      <Input value={form.district} onChange={(e) => updateField("district", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Этаж</Label>
                      <Input value={form.floor} onChange={(e) => updateField("floor", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Всего этажей</Label>
                      <Input type="number" value={form.total_floors || ""} onChange={(e) => updateField("total_floors", Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Высота потолков (м)</Label>
                      <Input type="number" step="0.1" value={form.ceiling_height || ""} onChange={(e) => updateField("ceiling_height", Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Парковка</Label>
                      <Input value={form.parking} onChange={(e) => updateField("parking", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Состояние</Label>
                      <Input value={form.condition} onChange={(e) => updateField("condition", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Планировка</Label>
                      <Input value={form.layout} onChange={(e) => updateField("layout", e.target.value)} />
                    </div>
                    {!isSale && (
                      <>
                        <div className="space-y-2">
                          <Label>Залог</Label>
                          <Input value={form.deposit} onChange={(e) => updateField("deposit", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Срок договора</Label>
                          <Input value={form.contract_term} onChange={(e) => updateField("contract_term", e.target.value)} />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label>Менеджер</Label>
                      <Select value={form.manager_id || "none"} onValueChange={(v) => updateField("manager_id", v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Выберите менеджера" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Не назначен</SelectItem>
                          {users.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Клиент (собственник)</Label>
                      <Select value={form.client_id || "none"} onValueChange={(v) => updateField("client_id", v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Не назначен</SelectItem>
                          {users.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Описание</Label>
                      <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Особенности (через запятую)</Label>
                      <Input value={form.features} onChange={(e) => updateField("features", e.target.value)}
                        placeholder="Кондиционирование, Охрана, Интернет" />
                    </div>

                    {/* Photos Section */}
                    <div className="space-y-3 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> Фотографии ({totalPhotos}/15)
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={totalPhotos >= 15}
                        >
                          <Upload className="w-4 h-4 mr-1" /> Загрузить
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>

                      {totalPhotos === 0 ? (
                        <div
                          className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Нажмите для загрузки фото (до 15 шт.)</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {existingPhotos.map((url, idx) => (
                            <div
                              key={`existing-${idx}`}
                              className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                                coverIndex === idx ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                              }`}
                              onClick={() => setCoverIndex(idx)}
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              {coverIndex === idx && (
                                <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-0.5">
                                  <Star className="w-3 h-3" /> Главное
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeExistingPhoto(idx); }}
                                className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {photoPreviews.map((url, idx) => {
                            const globalIdx = existingPhotos.length + idx;
                            return (
                              <div
                                key={`new-${idx}`}
                                className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                                  coverIndex === globalIdx ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                                }`}
                                onClick={() => setCoverIndex(globalIdx)}
                              >
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                {coverIndex === globalIdx && (
                                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-0.5">
                                    <Star className="w-3 h-3" /> Главное
                                  </div>
                                  )}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeNewPhoto(idx); }}
                                  className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {totalPhotos > 0 && (
                        <p className="text-xs text-muted-foreground">Нажмите на фото, чтобы сделать его главным для карточки</p>
                      )}
                    </div>

                    <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
                      <Button type="submit" disabled={saveMutation.isPending || uploading}>
                        {saveMutation.isPending || uploading ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </div>
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
