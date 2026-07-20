import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2, MapPin, ImageIcon, Send, ChevronLeft, ChevronRight,
  Upload, X, Star, Megaphone, Settings2, SlidersHorizontal, ScrollText,
} from "lucide-react";
import type { RequestType } from "@/lib/propertyModeration";
import { isSaleDeal } from "@/lib/propertyDeal";
import { isLandProperty, LAND_USE_OPTIONS, LAND_TYPE_LABEL } from "@/lib/propertyLand";
import type { MyProperty } from "@/hooks/useMyProperties";
import { propertyToFormState, buildPropertyPayload, type PropertyFormState } from "@/lib/propertyFormMapper";
import {
  PROPERTY_TYPES,
  PROPERTY_CLASSES,
  DEAL_TYPES,
  DISTRICTS,
  FLOORS,
  TOTAL_FLOORS_OPTIONS,
  CEILING_HEIGHTS,
  CONDITIONS,
  LAYOUTS,
  PARKING_OPTIONS,
  DEPOSIT_OPTIONS,
  CONTRACT_TERMS,
  FEATURE_GROUPS,
  UTILITIES_OPTIONS,
  VAT_OPTIONS,
  INDEXATION_OPTIONS,
  CONTRACT_FORM_OPTIONS,
  LANDLORD_TYPES,
  SUBLEASE_OPTIONS,
  PEDESTRIAN_TRAFFIC_LEVELS,
  TRANSPORT_HUB_OPTIONS,
  ENTRANCE_OPTIONS,
  PURPOSE_OPTIONS,
} from "@/lib/propertyOptions";

const emptyForm: PropertyFormState = {
  type: "Офис",
  class: "B",
  deal_type: "Аренда",
  area: 0,
  price: 0,
  description: "",
  address: "",
  district: "Кировский",
  floor: "1",
  total_floors: 1,
  ceiling_height: 3,
  parking: "Нет",
  condition: "Хороший ремонт",
  layout: "Open-space",
  deposit: "1 месяц",
  contract_term: "1 год",
  cadastral_number: "",
  land_use: "",
  features: [],
  request_type: "free_listing",
  utilities_included: "",
  vat: "",
  indexation: "",
  min_term: "",
  contract_form: "",
  landlord_type: "Собственник",
  sublease: "",
  pedestrian_traffic: undefined,
  metro_minutes: "",
  transport_hub: "",
  entrance_group: "",
  purpose: "",
};

const STEPS = [
  { key: "basic", label: "Основное", icon: Building2 },
  { key: "details", label: "Характеристики", icon: SlidersHorizontal },
  { key: "conditions", label: "Условия аренды", icon: ScrollText },
  { key: "location", label: "Локация", icon: MapPin },
  { key: "media", label: "Фото", icon: ImageIcon },
  { key: "submit", label: "Размещение", icon: Send },
] as const;

type StepKey = typeof STEPS[number]["key"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProperty?: MyProperty | null;
}

export default function PropertySubmissionWizard({ open, onOpenChange, editProperty = null }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<StepKey>("basic");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyFormState>(emptyForm);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const wasRejected = editProperty?.moderation_status === "rejected";

  useEffect(() => {
    if (!open) return;
    if (editProperty) {
      setEditId(editProperty.id);
      setForm(propertyToFormState(editProperty));
      const photos = editProperty.photos || [];
      setExistingPhotos(photos);
      setPhotoPreviews([]);
      setPhotoFiles([]);
      const coverIdx = editProperty.cover_photo ? photos.indexOf(editProperty.cover_photo) : 0;
      setCoverIndex(coverIdx >= 0 ? coverIdx : 0);
      setStep("basic");
    } else {
      setEditId(null);
      setForm(emptyForm);
      setExistingPhotos([]);
      setPhotoPreviews([]);
      setPhotoFiles([]);
      setCoverIndex(0);
      setStep("basic");
    }
  }, [open, editProperty]);

  const isSale = isSaleDeal(form.deal_type);
  const isLand = isLandProperty(form.type);
  const activeSteps = STEPS.filter((s) => s.key !== "conditions" || !isSale);
  const stepIndex = activeSteps.findIndex((s) => s.key === step);
  const currentStep = activeSteps[stepIndex] ?? activeSteps[0];

  const reset = () => {
    setStep("basic");
    setEditId(null);
    setForm(emptyForm);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setExistingPhotos([]);
    setCoverIndex(0);
  };

  const update = <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (feature: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    if (index < existingPhotos.length) {
      setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      const fileIdx = index - existingPhotos.length;
      setPhotoFiles((prev) => prev.filter((_, i) => i !== fileIdx));
      setPhotoPreviews((prev) => prev.filter((_, i) => i !== fileIdx));
    }
    if (coverIndex >= index && coverIndex > 0) setCoverIndex((i) => i - 1);
  };

  const allPhotoUrls = [...existingPhotos, ...photoPreviews];

  const compressImage = (file: File, maxWidth = 1920, quality = 0.82): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file),
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

  const uploadPhotos = async (propertyId: string) => {
    const urls: string[] = [...existingPhotos];

    for (const file of photoFiles) {
      const compressed = await compressImage(file);
      const path = `${propertyId}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("property-photos").upload(path, compressed);
      if (error) throw error;
      const { data } = supabase.storage.from("property-photos").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    const cover = urls[coverIndex] || urls[0] || "";
    return { urls, cover };
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Необходима авторизация");
      if (!form.address.trim()) throw new Error("Укажите адрес");
      if (form.area <= 0) throw new Error("Укажите площадь");

      setUploading(true);

      const payload = buildPropertyPayload(form, user.id, {
        isSale,
        isLand,
        isEdit: !!editId,
        resubmit: !!editId && wasRejected,
      });

      if (editId) {
        const { urls, cover } = await uploadPhotos(editId);
        const { error } = await supabase.from("properties").update({
          ...payload,
          photos: urls,
          cover_photo: cover || null,
          photos_count: urls.length,
        }).eq("id", editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("properties").insert(payload).select("id").single();
        if (error) throw error;

        if (photoFiles.length > 0 || existingPhotos.length > 0) {
          const { urls, cover } = await uploadPhotos(data.id);
          await supabase.from("properties").update({
            photos: urls,
            cover_photo: cover,
            photos_count: urls.length,
          }).eq("id", data.id);
        }
      }

      setUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      onOpenChange(false);
      reset();
      toast({
        title: editId ? "Объект обновлён" : "Объект отправлен на модерацию",
        description: editId
          ? wasRejected
            ? "Заявка снова отправлена на модерацию."
            : "Изменения сохранены."
          : "Мы проверим данные и опубликуем объект или свяжемся с вами.",
      });
    },
    onError: (err: Error) => {
      setUploading(false);
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const canNext = () => {
    if (step === "basic") return form.area > 0 && form.description.trim().length >= 10;
    if (step === "location") return form.address.trim().length > 3;
    return true;
  };

  const goNext = () => {
    const idx = stepIndex + 1;
    if (idx < activeSteps.length) setStep(activeSteps[idx].key);
  };

  const goBack = () => {
    const idx = stepIndex - 1;
    if (idx >= 0) setStep(activeSteps[idx].key);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full gap-0 overflow-hidden">
        <SheetHeader className="shrink-0 bg-card border-b px-4 py-3">
          <SheetTitle className="text-base font-semibold">
            {editId ? "Редактировать объект" : "Добавить объект за 0 ₽"}
          </SheetTitle>
          <div className="flex gap-1 mt-2">
            {activeSteps.map((s, i) => (
              <div
                key={s.key}
                className={`flex-1 h-1 rounded-full transition-colors ${i <= stepIndex ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{currentStep.label}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6">
          {step === "basic" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Тип объекта</Label>
                  <Select value={form.type} onValueChange={(v) => update("type", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Категория</Label>
                  <Select value={form.deal_type} onValueChange={(v) => {
                    update("deal_type", v);
                    if (isSaleDeal(v) && step === "conditions") setStep("location");
                  }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{DEAL_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Класс</Label>
                  <Select value={form.class} onValueChange={(v) => update("class", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{PROPERTY_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Площадь, м²</Label>
                  <Input type="number" className="h-9" value={form.area || ""} onChange={(e) => update("area", Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">{isSale ? "Цена, ₽" : "Цена, ₽/мес"}</Label>
                  <Input type="number" className="h-9" value={form.price || ""} onChange={(e) => update("price", Number(e.target.value))} />
                </div>
              </div>
              {form.area > 0 && form.price > 0 && (
                <p className="text-xs text-muted-foreground">
                  {Math.round(form.price / form.area).toLocaleString("ru-RU")} ₽/м²
                </p>
              )}
              <div>
                <Label className="text-xs mb-1 block">Описание объекта</Label>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Опишите объект: расположение, состояние, преимущества, условия сделки, что включено в аренду…"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Минимум 10 символов</p>
              </div>
            </>
          )}

          {step === "details" && (
            <>
              {isLand ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Кадастровый номер</Label>
                    <Input
                      className="h-9"
                      placeholder="38:36:0000000:12345"
                      value={form.cadastral_number}
                      onChange={(e) => update("cadastral_number", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">{LAND_TYPE_LABEL}</Label>
                    <Select value={form.land_use || "none"} onValueChange={(v) => update("land_use", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {LAND_USE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Этаж</Label>
                      <Select value={form.floor} onValueChange={(v) => update("floor", v)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{FLOORS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Этажей в здании</Label>
                      <Select value={String(form.total_floors)} onValueChange={(v) => update("total_floors", Number(v))}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{TOTAL_FLOORS_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Высота потолков, м</Label>
                      <Select value={String(form.ceiling_height)} onValueChange={(v) => update("ceiling_height", Number(v))}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{CEILING_HEIGHTS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Парковка</Label>
                      <Select value={form.parking} onValueChange={(v) => update("parking", v)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{PARKING_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Состояние</Label>
                      <Select value={form.condition} onValueChange={(v) => update("condition", v)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Планировка</Label>
                      <Select value={form.layout} onValueChange={(v) => update("layout", v)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{LAYOUTS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-4">
                <Label className="text-xs block">Особенности и инфраструктура ({form.features.length})</Label>
                {FEATURE_GROUPS.map((group) => (
                  <div key={group.title} className="border border-border rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group.title}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.items.map((f) => (
                        <label key={f} className="flex items-start gap-2 text-[11px] cursor-pointer leading-tight">
                          <Checkbox className="mt-0.5" checked={form.features.includes(f)} onCheckedChange={() => toggleFeature(f)} />
                          {f}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "conditions" && !isSale && (
            <>
              <p className="text-xs text-muted-foreground">Финансовые и юридические условия аренды</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Срок контракта</Label>
                  <Select value={form.contract_term} onValueChange={(v) => update("contract_term", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{CONTRACT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Мин. срок аренды</Label>
                  <Select value={form.min_term || "none"} onValueChange={(v) => update("min_term", v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {CONTRACT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Залог</Label>
                  <Select value={form.deposit} onValueChange={(v) => update("deposit", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{DEPOSIT_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Форма договора</Label>
                  <Select value={form.contract_form || "none"} onValueChange={(v) => update("contract_form", v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {CONTRACT_FORM_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Коммунальные платежи</Label>
                  <Select value={form.utilities_included || "none"} onValueChange={(v) => update("utilities_included", v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {UTILITIES_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">НДС</Label>
                  <Select value={form.vat || "none"} onValueChange={(v) => update("vat", v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {VAT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Индексация</Label>
                  <Select value={form.indexation || "none"} onValueChange={(v) => update("indexation", v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {INDEXATION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Субаренда</Label>
                  <Select value={form.sublease || "none"} onValueChange={(v) => update("sublease", v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {SUBLEASE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Арендодатель / собственник</Label>
                  <Select value={form.landlord_type} onValueChange={(v) => update("landlord_type", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{LANDLORD_TYPES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Назначение</Label>
                  <Select value={form.purpose || "none"} onValueChange={(v) => update("purpose", v === "none" ? "" : v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {PURPOSE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!isLand && (
                <>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-1">Трафик и локация</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Пешеходная проходимость</Label>
                      <Select
                        value={form.pedestrian_traffic ? String(form.pedestrian_traffic) : "none"}
                        onValueChange={(v) => update("pedestrian_traffic", v === "none" ? undefined : Number(v))}
                      >
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {PEDESTRIAN_TRAFFIC_LEVELS.map((l) => (
                            <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Транспортный узел</Label>
                      <Select value={form.transport_hub || "none"} onValueChange={(v) => update("transport_hub", v === "none" ? "" : v)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {TRANSPORT_HUB_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">До метро / центра</Label>
                      <Input className="h-9" placeholder="5 мин. пешком" value={form.metro_minutes} onChange={(e) => update("metro_minutes", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Входная группа</Label>
                      <Select value={form.entrance_group || "none"} onValueChange={(v) => update("entrance_group", v === "none" ? "" : v)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {ENTRANCE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {step === "location" && (
            <>
              <div>
                <Label className="text-xs mb-1 block">Адрес</Label>
                <Input
                  className="h-9"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Иркутск, ул. Ленина, 10"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Район</Label>
                <Select value={form.district} onValueChange={(v) => update("district", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === "media" && (
            <>
              <div>
                <Label className="text-xs mb-2 block">Фотографии объекта</Label>
                <p className="text-xs text-muted-foreground mb-3">Загрузите фото помещения, фасада и планировки. Нажмите ★, чтобы выбрать обложку.</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Загрузить фото
                </Button>
                {allPhotoUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {allPhotoUrls.map((src, i) => (
                      <div key={i} className="relative aspect-square bg-muted overflow-hidden group rounded-md">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                          <X className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => setCoverIndex(i)} className={`absolute bottom-1 left-1 w-5 h-5 flex items-center justify-center ${coverIndex === i ? "text-amber-400" : "text-white/60 opacity-0 group-hover:opacity-100"}`}>
                          <Star className={`w-3.5 h-3.5 ${coverIndex === i ? "fill-amber-400" : ""}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === "submit" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Выберите, как вы хотите разместить объект:</p>
              <button
                type="button"
                onClick={() => update("request_type", "free_listing")}
                className={`w-full text-left p-4 border rounded-lg transition-all ${
                  form.request_type === "free_listing"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Megaphone className={`w-5 h-5 mt-0.5 ${form.request_type === "free_listing" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Разместить бесплатно</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Объект появится в публичном каталоге после модерации</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => update("request_type", "management")}
                className={`w-full text-left p-4 border rounded-lg transition-all ${
                  form.request_type === "management"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Settings2 className={`w-5 h-5 mt-0.5 ${form.request_type === "management" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Передать в управление</div>
                    <div className="text-xs text-muted-foreground mt-0.5">АрендаСити возьмёт объект на полное управление</div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 bg-card border-t px-4 py-3 flex justify-between gap-2" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          {stepIndex > 0 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Назад
            </Button>
          ) : <div />}
          {step !== "submit" ? (
            <Button type="button" onClick={goNext} disabled={!canNext()} className="min-w-[120px]">
              Далее <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || uploading} className="min-w-[180px]">
              {submitMutation.isPending || uploading ? "Сохранение…" : editId ? "Сохранить изменения" : "Отправить на модерацию"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
