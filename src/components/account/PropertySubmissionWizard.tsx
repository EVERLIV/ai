import { useState, useRef } from "react";
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
  Upload, X, Star, Megaphone, Settings2,
} from "lucide-react";
import type { RequestType } from "@/lib/propertyModeration";
import { isSaleDeal } from "@/lib/propertyDeal";

const TYPES = ["Офис", "Торговая", "Склад", "Земля", "Производство"];
const DEAL_TYPES = ["Аренда", "Продажа"];
const DISTRICTS = [
  "Кировский", "Октябрьский", "Свердловский", "Ленинский", "Куйбышевский",
  "Ангарск", "Шелехов", "Усолье-Сибирское", "Братск", "Усть-Илимск",
];
const CONDITIONS = ["Евроремонт", "Хороший ремонт", "Косметический ремонт", "Рабочее состояние", "Под чистовую отделку", "Shell & Core"];
const FEATURES = ["Кондиционирование", "Охрана", "Интернет", "Парковка", "Отдельный вход", "Мебель", "Лифт", "Витрины"];

const STEPS = [
  { key: "basic", label: "Основное", icon: Building2 },
  { key: "location", label: "Локация", icon: MapPin },
  { key: "media", label: "Фото и описание", icon: ImageIcon },
  { key: "submit", label: "Размещение", icon: Send },
] as const;

type StepKey = typeof STEPS[number]["key"];

interface FormState {
  type: string;
  deal_type: string;
  area: number;
  price: number;
  address: string;
  district: string;
  floor: string;
  condition: string;
  description: string;
  features: string[];
  request_type: RequestType;
}

const emptyForm: FormState = {
  type: "Офис",
  deal_type: "Аренда",
  area: 0,
  price: 0,
  address: "",
  district: "Кировский",
  floor: "1",
  condition: "Хороший ремонт",
  description: "",
  features: [],
  request_type: "free_listing",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PropertySubmissionWizard({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<StepKey>("basic");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const isSale = isSaleDeal(form.deal_type);

  const reset = () => {
    setStep("basic");
    setForm(emptyForm);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setCoverIndex(0);
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
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
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    if (coverIndex >= index && coverIndex > 0) setCoverIndex((i) => i - 1);
  };

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
    const urls: string[] = [];
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

      const payload = {
        type: form.type,
        class: "B",
        area: form.area,
        price: form.price,
        price_per_m2: form.area > 0 ? Math.round(form.price / form.area) : 0,
        address: form.address.trim(),
        district: form.district,
        floor: form.floor,
        total_floors: 1,
        ceiling_height: 3,
        parking: "Нет",
        condition: form.condition,
        layout: "Open-space",
        deal_type: form.deal_type,
        deposit: isSale ? null : "1 месяц",
        contract_term: isSale ? null : "от 1 года",
        description: form.description,
        features: form.features,
        is_active: false,
        moderation_status: "on_moderation" as const,
        request_type: form.request_type,
        submitted_by: user.id,
        client_id: user.id,
        extras: {},
      };

      const { data, error } = await supabase.from("properties").insert(payload).select("id").single();
      if (error) throw error;

      if (photoFiles.length > 0) {
        const { urls, cover } = await uploadPhotos(data.id);
        await supabase.from("properties").update({
          photos: urls,
          cover_photo: cover,
          photos_count: urls.length,
        }).eq("id", data.id);
      }

      setUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      onOpenChange(false);
      reset();
      toast({
        title: "Объект отправлен на модерацию",
        description: "Мы проверим данные и опубликуем объект или свяжемся с вами.",
      });
    },
    onError: (err: Error) => {
      setUploading(false);
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const canNext = () => {
    if (step === "basic") return form.area > 0;
    if (step === "location") return form.address.trim().length > 3;
    return true;
  };

  const goNext = () => {
    const idx = stepIndex + 1;
    if (idx < STEPS.length) setStep(STEPS[idx].key);
  };

  const goBack = () => {
    const idx = stepIndex - 1;
    if (idx >= 0) setStep(STEPS[idx].key);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 z-10 bg-card border-b px-4 py-3">
          <SheetTitle className="text-base font-semibold">Добавить объект за 0 ₽</SheetTitle>
          <div className="flex gap-1 mt-2">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`flex-1 h-1 rounded-full transition-colors ${i <= stepIndex ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{STEPS[stepIndex].label}</p>
        </SheetHeader>

        <div className="p-4 space-y-4">
          {step === "basic" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Тип объекта</Label>
                  <Select value={form.type} onValueChange={(v) => update("type", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Категория</Label>
                  <Select value={form.deal_type} onValueChange={(v) => update("deal_type", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{DEAL_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Площадь, м²</Label>
                  <Input type="number" className="h-9" value={form.area || ""} onChange={(e) => update("area", Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">{isSale ? "Цена, ₽" : "Цена, ₽/мес"}</Label>
                  <Input type="number" className="h-9" value={form.price || ""} onChange={(e) => update("price", Number(e.target.value))} />
                </div>
              </div>
            </>
          )}

          {step === "location" && (
            <>
              <div>
                <Label className="text-xs mb-1 block">Адрес</Label>
                <Input className="h-9" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Иркутск, ул. ..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Район</Label>
                  <Select value={form.district} onValueChange={(v) => update("district", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Этаж</Label>
                  <Input className="h-9" value={form.floor} onChange={(e) => update("floor", e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Состояние</Label>
                <Select value={form.condition} onValueChange={(v) => update("condition", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-2 block">Особенности</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map((f) => (
                    <label key={f} className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox checked={form.features.includes(f)} onCheckedChange={() => toggleFeature(f)} />
                      {f}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "media" && (
            <>
              <div>
                <Label className="text-xs mb-2 block">Фотографии</Label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Загрузить фото
                </Button>
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {photoPreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square bg-muted overflow-hidden group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
              <div>
                <Label className="text-xs mb-1 block">Описание</Label>
                <Textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Опишите объект, преимущества, условия..." />
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

        <div className="sticky bottom-0 bg-card border-t px-4 py-3 flex justify-between gap-2">
          {stepIndex > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={goBack}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Назад
            </Button>
          ) : <div />}
          {step !== "submit" ? (
            <Button type="button" size="sm" onClick={goNext} disabled={!canNext()}>
              Далее <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || uploading}>
              {submitMutation.isPending || uploading ? "Отправка…" : "Отправить на модерацию"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
