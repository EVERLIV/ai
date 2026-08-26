import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bath,
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  Home,
  ImageIcon,
  Layers,
  LayoutGrid,
  type LucideIcon,
  MapPin,
  MapPinned,
  Megaphone,
  ScrollText,
  Send,
  Settings2,
  Shield,
  SlidersHorizontal,
  Sofa,
  Sparkles,
  Star,
  Store,
  TreePine,
  Upload,
  UserCircle,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import WoodenHouseConfigFields from "@/components/admin/WoodenHouseConfigFields";
import LocationDistrictSelect from "@/components/LocationDistrictSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultTypeForSegment,
  isLandSegment,
  LAND_DEAL_TYPES,
  type PropertySegment,
} from "@/config/propertySegments";
import { useToast } from "@/hooks/use-toast";
import { useAgencyManagers, useMyAgency } from "@/hooks/useAgency";
import { useAuth } from "@/hooks/useAuth";
import { useMyDeveloper, useMyDeveloperProjects, useProjectUnitTypes } from "@/hooks/useDeveloper";
import { useAllDictionaryValues } from "@/hooks/useDictionaries";
import type { MyProperty } from "@/hooks/useMyProperties";
import { buildDeveloperListingExtras } from "@/lib/developerListing";
import {
  allowedPropertyTypesForSubtype,
  assertDeveloperListingPayload,
  defaultMarketForSubtype,
  defaultPropertyTypeForSubtype,
  filterTypesForDeveloperSubtype,
} from "@/lib/developerListingRules";
import { normalizeDeveloperSubtype } from "@/lib/developerTypes";
import { notifyPropertyEmail } from "@/lib/notifyPropertyEmail";
import { isDailyDeal, isLongTermRent, isSaleDeal } from "@/lib/propertyDeal";
import {
  buildPropertyPayload,
  type PropertyFormState,
  propertyToFormState,
} from "@/lib/propertyFormMapper";
import { LAND_TYPE_LABEL, LAND_USE_OPTIONS } from "@/lib/propertyLand";
import type { RequestType } from "@/lib/propertyModeration";
import {
  BALCONY_OPTIONS,
  BATHROOM_OPTIONS,
  BUILDING_TYPES,
  CEILING_HEIGHTS,
  CONDITIONS,
  CONTRACT_FORM_OPTIONS,
  CONTRACT_TERMS,
  DAILY_DEPOSIT_OPTIONS,
  DAILY_TERM_OPTIONS,
  DEAL_TYPES,
  DEPOSIT_OPTIONS,
  ENTRANCE_OPTIONS,
  FLOORS,
  FURNITURE_OPTIONS,
  getFeatureGroupsFor,
  INDEXATION_OPTIONS,
  LANDLORD_TYPES,
  LAYOUTS,
  MARKET_OPTIONS,
  PARKING_OPTIONS,
  PEDESTRIAN_TRAFFIC_LEVELS,
  PROPERTY_CLASSES,
  PURPOSE_OPTIONS,
  RESIDENTIAL_CONDITIONS,
  RESIDENTIAL_DEAL_TYPES,
  ROOMS_OPTIONS,
  SUBLEASE_OPTIONS,
  TOTAL_FLOORS_OPTIONS,
  TRANSPORT_HUB_OPTIONS,
  UTILITIES_OPTIONS,
  VAT_OPTIONS,
  WINDOW_VIEW_OPTIONS,
} from "@/lib/propertyOptions";
import {
  isAnyLand,
  isDwellingLike,
  isFlatLike,
  isHouseLike,
  isParkingLike,
} from "@/lib/propertyTypeFamilies";
import {
  getWoodenHouseConfigByBuildingType,
  houseBuildingTypeOptions,
  isWoodenBuildingType,
} from "@/lib/woodenHouses";
import { togglePropertyType } from "@/lib/propertyTypes";
import {
  insertMyPropertyApi,
  updateMyPropertyApi,
  uploadMyPropertyPhotoApi,
} from "@/lib/userPropertyApi";
import { cn } from "@/lib/utils";
import { buildMediaExtrasPatch, planTabLabel } from "@/lib/propertyMedia";
import { isValidVkVideoUrl } from "@/lib/vkVideo";
import { geocodeAddress } from "@/lib/yandexGeocoder";

function dealDefaults(
  dealType: string,
): Pick<
  PropertyFormState,
  | "deposit"
  | "contract_term"
  | "min_term"
  | "mortgage"
  | "pets_allowed"
  | "children_allowed"
> {
  if (isDailyDeal(dealType)) {
    return {
      deposit: "По договорённости",
      contract_term: "от 1 суток",
      min_term: "от 1 суток",
      mortgage: false,
      pets_allowed: false,
      children_allowed: false,
    };
  }
  if (isSaleDeal(dealType)) {
    return {
      deposit: "",
      contract_term: "",
      min_term: "",
      mortgage: false,
      pets_allowed: false,
      children_allowed: false,
    };
  }
  return {
    deposit: "1 месяц",
    contract_term: "1 год",
    min_term: "",
    mortgage: false,
    pets_allowed: false,
    children_allowed: false,
  };
}

const emptyForm: PropertyFormState = {
  segment: "commercial",
  types: ["Офис"],
  class: "B",
  deal_type: "Аренда",
  area: 0,
  price: 0,
  description: "",
  address: "",
  district: "Кировский",
  lat: null,
  lng: null,
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
  rooms: "",
  building_type: "",
  year_built: "",
  balcony: "",
  furniture: "",
  bathroom: "",
  market: "",
  window_view: "",
  living_area: "",
  kitchen_area: "",
  mortgage: false,
  pets_allowed: false,
  children_allowed: false,
  listing_manager_id: "",
  wood_config: "",
  wood_wall: "",
  wood_floors: "",
  wood_foundation: "",
  wood_roof: "",
  wood_finish: "",
  video_urls: [],
  plan_image_url: "",
  developer_project_id: "",
  developer_unit_type_id: "",
};

const STEPS = [
  { key: "basic", label: "Основное", icon: Building2 },
  { key: "details", label: "Характеристики", icon: SlidersHorizontal },
  { key: "conditions", label: "Условия аренды", icon: ScrollText },
  { key: "location", label: "Локация", icon: MapPin },
  { key: "media", label: "Фото", icon: ImageIcon },
  { key: "submit", label: "Размещение", icon: Send },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const FEATURE_GROUP_ICONS: Record<string, LucideIcon> = {
  "Инженерия и коммуникации": Zap,
  Безопасность: Shield,
  "Парковка и доступ": Car,
  "Локация и трафик": MapPinned,
  "Планировка и отделка": LayoutGrid,
  "Торговля и общепит": Store,
  "Склад и производство": Warehouse,
  "Земельный участок": TreePine,
  Комфорт: Sofa,
  Техника: Zap,
  "Дом и двор": Home,
  Санузел: Bath,
};

function WizardSection({
  icon: Icon,
  title,
  hint,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/80 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground leading-tight">
            {title}
          </h3>
          {hint ? (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProperty?: MyProperty | null;
  segment?: PropertySegment;
  initialRequestType?: RequestType;
  /** Prefill при создании объявления из проекта застройщика */
  initialProjectId?: string | null;
  initialUnitTypeId?: string | null;
}

export default function PropertySubmissionWizard({
  open,
  onOpenChange,
  editProperty = null,
  segment = "commercial",
  initialRequestType,
  initialProjectId = null,
  initialUnitTypeId = null,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const planInputRef = useRef<HTMLInputElement>(null);
  const { data: myAgency } = useMyAgency();
  const agencyId = myAgency?.agency.id;
  const { data: agencyManagers = [] } = useAgencyManagers(agencyId, true);
  const { data: myDeveloper } = useMyDeveloper();
  const developerId = myDeveloper?.id;
  const developerSubtype = myDeveloper
    ? normalizeDeveloperSubtype(myDeveloper.subtype)
    : null;
  const isDeveloperMode = !!myDeveloper && !agencyId;
  const { data: developerProjects = [] } = useMyDeveloperProjects();
  const { propertyTypes } = useAllDictionaryValues();

  const [step, setStep] = useState<StepKey>("basic");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyFormState>(emptyForm);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [planPreview, setPlanPreview] = useState("");
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [locationGeocoding, setLocationGeocoding] = useState(false);
  const wasRejected = editProperty?.moderation_status === "rejected";

  const { data: unitTypes = [] } = useProjectUnitTypes(
    form.developer_project_id || undefined,
  );

  useEffect(() => {
    if (!open) return;
    if (editProperty) {
      setEditId(editProperty.id);
      setForm(propertyToFormState(editProperty));
      const photos = editProperty.photos || [];
      setExistingPhotos(photos);
      setPhotoPreviews([]);
      setPhotoFiles([]);
      const coverIdx = editProperty.cover_photo
        ? photos.indexOf(editProperty.cover_photo)
        : 0;
      setCoverIndex(coverIdx >= 0 ? coverIdx : 0);
      setPlanFile(null);
      const media = (editProperty.extras || {}) as Record<string, unknown>;
      setPlanPreview(
        typeof media.plan_image_url === "string" ? media.plan_image_url : "",
      );
      setVideoUrlDraft("");
      setStep("basic");
    } else if (isDeveloperMode && developerSubtype) {
      setEditId(null);
      setForm({
        ...emptyForm,
        segment: "residential",
        types: [defaultPropertyTypeForSubtype(developerSubtype)],
        class: "-",
        deal_type: "Продажа",
        market: defaultMarketForSubtype(developerSubtype),
        landlord_type: "Застройщик",
        condition: "-",
        layout: "-",
        request_type: initialRequestType || "free_listing",
        developer_project_id: initialProjectId || "",
        developer_unit_type_id: initialUnitTypeId || "",
      });
      setExistingPhotos([]);
      setPhotoPreviews([]);
      setPhotoFiles([]);
      setCoverIndex(0);
      setPlanFile(null);
      setPlanPreview("");
      setVideoUrlDraft("");
      setStep("basic");
    } else {
      setEditId(null);
      setForm({
        ...emptyForm,
        segment,
        types: [defaultTypeForSegment(segment)],
        request_type: initialRequestType || "free_listing",
        ...(segment === "land" ? { land_use: "ИЖС" } : {}),
      });
      setExistingPhotos([]);
      setPhotoPreviews([]);
      setPhotoFiles([]);
      setCoverIndex(0);
      setPlanFile(null);
      setPlanPreview("");
      setVideoUrlDraft("");
      setStep("basic");
    }
  }, [
    open,
    editProperty,
    segment,
    initialRequestType,
    isDeveloperMode,
    developerSubtype,
    initialProjectId,
    initialUnitTypeId,
  ]);

  const isSale = isSaleDeal(form.deal_type);
  const isDaily = isDailyDeal(form.deal_type);
  const isLongRent = isLongTermRent(form.deal_type);
  const isResidential = form.segment === "residential";
  const typesSource = {
    type: form.types[0],
    extras: { property_types: form.types },
  };
  const isLand = form.segment === "land" || isAnyLand(typesSource);
  const dealTypeOptions = isResidential
    ? RESIDENTIAL_DEAL_TYPES
    : isLandSegment(form.segment)
      ? LAND_DEAL_TYPES
      : DEAL_TYPES;
  const dwelling = isDwellingLike(typesSource);
  const flatLike = isFlatLike(typesSource);
  const houseLike = isHouseLike(typesSource);
  const parkingLike = isParkingLike(typesSource);
  const rawTypeOptions = propertyTypes(form.segment);
  const typeOptions =
    isDeveloperMode && developerSubtype
      ? filterTypesForDeveloperSubtype(
          developerSubtype,
          rawTypeOptions.length
            ? rawTypeOptions
            : [...allowedPropertyTypesForSubtype(developerSubtype)],
        )
      : rawTypeOptions;
  const conditionOptions = isResidential ? RESIDENTIAL_CONDITIONS : CONDITIONS;
  const featureGroups = getFeatureGroupsFor(form.segment, form.types);
  const depositOptions = isDaily ? DAILY_DEPOSIT_OPTIONS : DEPOSIT_OPTIONS;
  const termOptions = isDaily ? DAILY_TERM_OPTIONS : CONTRACT_TERMS;
  const activeSteps = STEPS.filter((s) => s.key !== "conditions" || !isSale);
  const stepIndex = activeSteps.findIndex((s) => s.key === step);
  const currentStep = activeSteps[stepIndex] ?? activeSteps[0];

  useEffect(() => {
    if (isSale && step === "conditions") setStep("location");
  }, [isSale, step]);

  const reset = () => {
    setStep("basic");
    setEditId(null);
    if (isDeveloperMode && developerSubtype) {
      setForm({
        ...emptyForm,
        segment: "residential",
        types: [defaultPropertyTypeForSubtype(developerSubtype)],
        class: "-",
        deal_type: "Продажа",
        market: defaultMarketForSubtype(developerSubtype),
        landlord_type: "Застройщик",
        condition: "-",
        layout: "-",
        request_type: "free_listing",
        developer_project_id: "",
        developer_unit_type_id: "",
      });
    } else {
      setForm({
        ...emptyForm,
        segment,
        types: [defaultTypeForSegment(segment)],
        ...dealDefaults("Аренда"),
      });
    }
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setExistingPhotos([]);
    setCoverIndex(0);
  };

  const update = <K extends keyof PropertyFormState>(
    key: K,
    value: PropertyFormState[K],
  ) => {
    setForm((prev) => {
      if (key === "deal_type" && typeof value === "string") {
        return { ...prev, deal_type: value, ...dealDefaults(value) };
      }
      return { ...prev, [key]: value };
    });
  };

  const setTypes = (types: string[]) => {
    setForm((prev) => {
      const next = { ...prev, types };
      const land = isAnyLand(types);
      if (land) {
        next.floor = "-";
        next.total_floors = 1;
        next.rooms = "";
        next.balcony = "";
        next.bathroom = "";
        next.layout = prev.land_use || "";
      }
      // Drop features that no longer belong to groups for this type
      const allowed = new Set(
        getFeatureGroupsFor(prev.segment, types).flatMap((g) => g.items),
      );
      next.features = prev.features.filter((f) => allowed.has(f));
      return next;
    });
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
      reader.onload = (ev) =>
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
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

  const compressImage = (
    file: File,
    maxWidth = 1920,
    quality = 0.82,
  ): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas
          .getContext("2d")
          ?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) =>
            resolve(
              blob
                ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                    type: "image/jpeg",
                  })
                : file,
            ),
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });

  const uploadPhotos = async (propertyId: string) => {
    const urls: string[] = [...existingPhotos];

    for (const file of photoFiles) {
      const compressed = await compressImage(file);
      urls.push(await uploadMyPropertyPhotoApi(propertyId, compressed));
    }
    const cover = urls[coverIndex] || urls[0] || "";
    return { urls, cover };
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Необходима авторизация");
      if (!form.address.trim()) throw new Error("Укажите адрес");
      if (form.types.length === 0)
        throw new Error("Выберите хотя бы один тип объекта");

      if (isDeveloperMode && developerSubtype) {
        assertDeveloperListingPayload({
          subtype: developerSubtype,
          segment: form.segment,
          types: form.types,
          developer_project_id: form.developer_project_id,
          developer_unit_type_id: form.developer_unit_type_id,
        });
      }

      setUploading(true);

      let formWithCoords = form;
      if (form.lat == null || form.lng == null) {
        try {
          const hit = await geocodeAddress(form.address);
          if (hit) {
            formWithCoords = {
              ...form,
              address: hit.address || form.address,
              lat: hit.lat,
              lng: hit.lng,
            };
            setForm(formWithCoords);
          }
        } catch {
          // сохраняем без координат — модератор сможет проставить в админке
        }
      }

      const payload = buildPropertyPayload(formWithCoords, user.id, {
        isSale,
        isLand,
        isEdit: !!editId,
        resubmit: !!editId && wasRejected,
      });

      const selectedManager = agencyManagers.find(
        (m) => m.id === form.listing_manager_id,
      );
      let extras = {
        ...((payload.extras as Record<string, unknown>) || {}),
      };
      if (selectedManager || agencyId) {
        extras = {
          ...extras,
          ...(selectedManager
            ? {
                agent_name: selectedManager.full_name,
                agent_phone: selectedManager.phone,
                agent_avatar_url: selectedManager.photo_url || "",
                listing_manager_id: selectedManager.id,
              }
            : { listing_manager_id: "" }),
          ...(agencyId
            ? {
                agency_id: agencyId,
                agent_account_type: "agency",
                agent_company: myAgency?.agency.name || "",
              }
            : {}),
        };
      }
      if (myDeveloper && !agencyId) {
        extras = {
          ...extras,
          ...buildDeveloperListingExtras(myDeveloper, {
            ownerUserId: user.id,
          }),
        };
      }
      (payload as { extras: Record<string, unknown> }).extras = extras;

      let propertyId = editId;
      let publicId = editProperty?.public_id || null;

      if (editId) {
        const { urls, cover } = await uploadPhotos(editId);
        let planUrl = formWithCoords.plan_image_url;
        if (planFile) {
          planUrl = await uploadMyPropertyPhotoApi(
            editId,
            await compressImage(planFile),
          );
        }
        extras = {
          ...extras,
          ...buildMediaExtrasPatch({
            videoUrls: formWithCoords.video_urls,
            planImageUrl: planUrl || null,
          }),
        };
        await updateMyPropertyApi(
          user.id,
          editId,
          {
            ...payload,
            photos: urls,
            cover_photo: cover || null,
            photos_count: urls.length,
            extras,
            ...(agencyId ? { agency_id: agencyId } : {}),
            ...(developerId && !agencyId ? { developer_id: developerId } : {}),
          },
          agencyId,
          developerId && !agencyId ? developerId : null,
        );
      } else {
        const data = await insertMyPropertyApi(
          user.id,
          payload,
          agencyId,
          developerId && !agencyId ? developerId : null,
        );

        propertyId = data.id;
        publicId = data.public_id;

        const { urls, cover } = await uploadPhotos(data.id);
        let planUrl = formWithCoords.plan_image_url;
        if (planFile) {
          planUrl = await uploadMyPropertyPhotoApi(
            data.id,
            await compressImage(planFile),
          );
        }
        const nextExtras = {
          ...extras,
          ...buildMediaExtrasPatch({
            videoUrls: formWithCoords.video_urls,
            planImageUrl: planUrl || null,
          }),
        };
        await updateMyPropertyApi(
          user.id,
          data.id,
          {
            photos: urls,
            cover_photo: cover || null,
            photos_count: urls.length,
            extras: nextExtras,
          },
          agencyId,
          developerId && !agencyId ? developerId : null,
        );
      }

      const shouldNotify = !editId || wasRejected;
      if (shouldNotify && user.email && propertyId) {
        await notifyPropertyEmail({
          event: "submitted",
          to: user.email,
          name:
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : "",
          property: {
            id: propertyId,
            public_id: publicId,
            address: form.address.trim(),
            district: form.district,
            type: form.types.join(", "),
            deal_type: form.deal_type,
            area: form.area,
            price: form.price,
            floor: isLand ? null : form.floor,
            deposit: isSale ? null : form.deposit,
            contract_term: isSale ? null : form.contract_term,
            request_type: form.request_type,
            description: form.description,
          },
        });
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
      toast({
        title: "Ошибка",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const canNext = () => {
    if (step === "basic")
      return form.area > 0 && form.description.trim().length >= 10;
    if (step === "location") {
      return form.address.trim().length >= 4 && !locationGeocoding;
    }
    return true;
  };

  const goNext = async () => {
    if (step === "location" && (form.lat == null || form.lng == null)) {
      setLocationGeocoding(true);
      try {
        const hit = await geocodeAddress(form.address);
        if (!hit) {
          toast({
            title: "Адрес не найден",
            description:
              "Выберите адрес из подсказок или уточните улицу и номер дома",
            variant: "destructive",
          });
          return;
        }
        setForm((prev) => ({
          ...prev,
          address: hit.address || prev.address,
          lat: hit.lat,
          lng: hit.lng,
        }));
      } catch (e) {
        toast({
          title: "Геокодер недоступен",
          description:
            e instanceof Error ? e.message : "Проверьте ключ Яндекс.Карт",
          variant: "destructive",
        });
        return;
      } finally {
        setLocationGeocoding(false);
      }
    }

    const idx = stepIndex + 1;
    if (idx < activeSteps.length) setStep(activeSteps[idx].key);
  };

  const goBack = () => {
    const idx = stepIndex - 1;
    if (idx >= 0) setStep(activeSteps[idx].key);
  };

  const selectedManager = agencyManagers.find(
    (m) => m.id === form.listing_manager_id,
  );

  const managerSection = agencyId ? (
    <WizardSection
      icon={UserCircle}
      title="За кем закреплён объект"
      hint="Номер менеджера попадёт на карточку; заявки в кабинете будут с его пометкой."
    >
      {agencyManagers.length === 0 ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Пока нет менеджеров.{" "}
          <Link
            to="/account?tab=managers"
            className="text-primary underline underline-offset-2"
          >
            Добавьте в разделе «Менеджеры»
          </Link>
          , затем выберите здесь.
        </p>
      ) : (
        <div className="space-y-2">
          <Select
            value={form.listing_manager_id || "none"}
            onValueChange={(v) =>
              update("listing_manager_id", v === "none" ? "" : v)
            }
          >
            <SelectTrigger className="h-7 text-sm bg-background">
              <SelectValue placeholder="Выберите менеджера" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Не закреплён</SelectItem>
              {agencyManagers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name} · {m.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedManager && (
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5">
              <div className="h-9 w-9 rounded-full overflow-hidden bg-muted shrink-0">
                {selectedManager.photo_url ? (
                  <img
                    src={selectedManager.photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {selectedManager.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {selectedManager.full_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedManager.phone}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </WizardSection>
  ) : null;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <SheetContent
        side="right"
        className="w-full max-w-none sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col h-[100dvh] gap-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <SheetHeader className="shrink-0 bg-card border-b px-4 py-3 pr-12 text-left">
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
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <currentStep.icon className="w-3.5 h-3.5 text-primary shrink-0" />
            {currentStep.label}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-6">
          {step === "basic" && (
            <>
              <WizardSection
                icon={Layers}
                title="Тип и сегмент"
                hint={
                  isDeveloperMode
                    ? developerSubtype === "frame_house_builder"
                      ? "Деревянный застройщик: только дома в серии проектов."
                      : "Застройщик МКД: только квартиры в ваших ЖК."
                    : "Выберите сегмент и один или несколько типов объекта."
                }
              >
                {!isDeveloperMode && (
                <div>
                  <Label className="text-xs mb-1 block">Сегмент</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "commercial", label: "Коммерческая" },
                        { value: "residential", label: "Жилая" },
                        { value: "land", label: "Земля" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          const nextSegment = item.value;
                          const nextTypes = [
                            defaultTypeForSegment(nextSegment),
                          ];
                          setForm((prev) => {
                            const allowed = new Set(
                              getFeatureGroupsFor(
                                nextSegment,
                                nextTypes,
                              ).flatMap((g) => g.items),
                            );
                            return {
                              ...prev,
                              segment: nextSegment,
                              types: nextTypes,
                              class:
                                nextSegment === "residential" ||
                                nextSegment === "land"
                                  ? "-"
                                  : "B",
                              condition:
                                nextSegment === "land"
                                  ? "-"
                                  : "Хороший ремонт",
                              layout:
                                nextSegment === "residential" ||
                                nextSegment === "land"
                                  ? "-"
                                  : "Open-space",
                              land_use:
                                nextSegment === "land" ? "ИЖС" : prev.land_use,
                              features: prev.features.filter((f) =>
                                allowed.has(f),
                              ),
                              deal_type: "Аренда",
                              ...dealDefaults("Аренда"),
                            };
                          });
                        }}
                        className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                          form.segment === item.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                )}
                {isDeveloperMode && (
                  <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    Сегмент: жилая ·{" "}
                    {developerSubtype === "frame_house_builder"
                      ? "дома на заказ"
                      : "квартиры в ЖК"}
                  </div>
                )}
                {isDeveloperMode && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs mb-1 block">
                        {developerSubtype === "frame_house_builder"
                          ? "Серия домов *"
                          : "Проект (ЖК) *"}
                      </Label>
                      <Select
                        value={form.developer_project_id || "none"}
                        onValueChange={(v) => {
                          const projectId = v === "none" ? "" : v;
                          const project = developerProjects.find(
                            (p) => p.id === projectId,
                          );
                          setForm((prev) => ({
                            ...prev,
                            developer_project_id: projectId,
                            developer_unit_type_id: "",
                            address:
                              prev.address.trim() ||
                              project?.address ||
                              prev.address,
                            district:
                              project?.district?.trim() || prev.district,
                            ...(developerSubtype === "frame_house_builder" &&
                            project?.material
                              ? {
                                  building_type: project.material,
                                }
                              : {}),
                          }));
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {developerProjects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {developerProjects.length === 0 && (
                        <p className="text-[11px] text-amber-700 mt-1">
                          Сначала создайте проект во вкладке «Проекты».
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        {developerSubtype === "frame_house_builder"
                          ? "Модель / планировка *"
                          : "Планировка *"}
                      </Label>
                      <Select
                        value={form.developer_unit_type_id || "none"}
                        onValueChange={(v) => {
                          const unitId = v === "none" ? "" : v;
                          const unit = unitTypes.find((u) => u.id === unitId);
                          setForm((prev) => ({
                            ...prev,
                            developer_unit_type_id: unitId,
                            ...(unit
                              ? {
                                  rooms: unit.rooms || prev.rooms,
                                  area:
                                    unit.area_from != null
                                      ? Number(unit.area_from)
                                      : prev.area,
                                  price:
                                    unit.price_from != null
                                      ? Number(unit.price_from)
                                      : prev.price,
                                  total_floors: (() => {
                                    const f = String(unit.floors || "").trim();
                                    const n = Number.parseInt(f, 10);
                                    return Number.isFinite(n) && n > 0
                                      ? n
                                      : prev.total_floors;
                                  })(),
                                  plan_image_url:
                                    unit.plan_image_url || prev.plan_image_url,
                                }
                              : {}),
                          }));
                          if (unit?.plan_image_url) {
                            setPlanPreview(unit.plan_image_url);
                          }
                        }}
                        disabled={!form.developer_project_id}
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {unitTypes.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.title}
                              {u.area_from != null
                                ? ` · от ${u.area_from} м²`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-xs mb-1 block">Тип объекта</Label>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md border border-border/60 bg-background p-3">
                    {typeOptions.map((t) => {
                      const checked = form.types.includes(t);
                      return (
                        <label
                          key={t}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              setTypes(togglePropertyType(form.types, t, !!v));
                            }}
                          />
                          <span>{t}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {isDeveloperMode
                      ? developerSubtype === "frame_house_builder"
                        ? "«Дом на заказ» — объекта ещё нет, строят по проекту на участке."
                        : "Доступны только типы по профилю застройщика."
                      : isResidential
                        ? "Можно выбрать несколько жилых типов для одного объявления."
                        : "Можно выбрать несколько типов. «Земля» — только отдельно."}
                  </p>
                </div>
              </WizardSection>

              <WizardSection icon={Building2} title="Параметры и цена">
                <div
                  className={`grid gap-3 ${isResidential ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  <div>
                    <Label className="text-xs mb-1 block">Категория</Label>
                    <Select
                      value={form.deal_type}
                      onValueChange={(v) => {
                        update("deal_type", v);
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dealTypeOptions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isResidential && isSale && (
                    <div>
                      <Label className="text-xs mb-1 block">Рынок</Label>
                      <Select
                        value={form.market || "none"}
                        onValueChange={(v) =>
                          update("market", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {MARKET_OPTIONS.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item === "На заказ"
                                ? "На заказ (индивидуальная сборка)"
                                : item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.market === "На заказ" && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Дома ещё нет — строят под заказ на участке клиента.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className={`grid gap-3 ${isResidential ? "grid-cols-2" : "grid-cols-3"}`}
                >
                  {!isResidential && (
                    <div>
                      <Label className="text-xs mb-1 block">Класс</Label>
                      <Select
                        value={form.class}
                        onValueChange={(v) => update("class", v)}
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_CLASSES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs mb-1 block">Площадь, м²</Label>
                    <Input
                      type="number"
                      className="h-9 bg-background"
                      value={form.area || ""}
                      onChange={(e) => update("area", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">
                      {isSale
                        ? "Цена, ₽"
                        : form.deal_type === "Посуточно"
                          ? "Цена, ₽/сут"
                          : "Цена, ₽/мес"}
                    </Label>
                    <Input
                      type="number"
                      className="h-9 bg-background"
                      value={form.price || ""}
                      onChange={(e) => update("price", Number(e.target.value))}
                    />
                  </div>
                </div>
                {form.area > 0 && form.price > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round(form.price / form.area).toLocaleString("ru-RU")}{" "}
                    ₽/м²
                  </p>
                )}
              </WizardSection>

              <WizardSection icon={ScrollText} title="Описание">
                <Textarea
                  rows={5}
                  className="bg-background"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Опишите объект: расположение, состояние, преимущества, условия сделки, что включено в аренду…"
                />
                <p className="text-[10px] text-muted-foreground">
                  Минимум 10 символов
                </p>
              </WizardSection>
            </>
          )}

          {step === "details" && (
            <>
              <WizardSection
                icon={SlidersHorizontal}
                title={isLand ? "Земельный участок" : "Характеристики"}
                hint="Основные параметры помещения или участка."
              >
                {isLand ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">
                        Кадастровый номер
                      </Label>
                      <Input
                        className="h-9 bg-background"
                        placeholder="38:36:0000000:12345"
                        value={form.cadastral_number}
                        onChange={(e) =>
                          update("cadastral_number", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        {LAND_TYPE_LABEL}
                      </Label>
                      <Select
                        value={form.land_use || "none"}
                        onValueChange={(v) =>
                          update("land_use", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {LAND_USE_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : dwelling ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">Комнат</Label>
                        <Select
                          value={form.rooms || "none"}
                          onValueChange={(v) =>
                            update("rooms", v === "none" ? "" : v)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue placeholder="Выберите" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {ROOMS_OPTIONS.map((room) => (
                              <SelectItem key={room} value={room}>
                                {room}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Тип дома</Label>
                        <Select
                          value={form.building_type || "none"}
                          onValueChange={(v) => {
                            const next = v === "none" ? "" : v;
                            const cfg =
                              getWoodenHouseConfigByBuildingType(next);
                            if (cfg) {
                              const fillDescription = !form.description.trim();
                              setForm((prev) => ({
                                ...prev,
                                wood_config: cfg.id,
                                building_type: cfg.buildingType,
                                wood_wall: cfg.defaults?.wall || "",
                                wood_floors: cfg.defaults?.floors || "",
                                wood_foundation: cfg.defaults?.foundation || "",
                                wood_roof: cfg.defaults?.roof || "",
                                wood_finish: cfg.defaults?.finish || "",
                                description: fillDescription
                                  ? `${cfg.listingHint}\n\n${cfg.description}`
                                  : prev.description,
                              }));
                              return;
                            }
                            setForm((prev) => ({
                              ...prev,
                              building_type: next,
                              wood_config: isWoodenBuildingType(next)
                                ? prev.wood_config
                                : "",
                            }));
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue placeholder="Выберите" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {(houseLike
                              ? houseBuildingTypeOptions(BUILDING_TYPES)
                              : BUILDING_TYPES
                            ).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {houseLike &&
                      (!isDeveloperMode ||
                        developerSubtype === "frame_house_builder") && (
                      <WoodenHouseConfigFields
                        compact
                        value={{
                          wood_config: form.wood_config,
                          building_type: form.building_type,
                          wood_wall: form.wood_wall,
                          wood_floors: form.wood_floors,
                          wood_foundation: form.wood_foundation,
                          wood_roof: form.wood_roof,
                          wood_finish: form.wood_finish,
                          description: form.description,
                        }}
                        onChange={(patch) =>
                          setForm((prev) => ({ ...prev, ...patch }))
                        }
                      />
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">
                          {flatLike ? "Этаж" : "Этажей"}
                        </Label>
                        <Select
                          value={form.floor}
                          onValueChange={(v) => update("floor", v)}
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FLOORS.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">
                          Этажей в доме
                        </Label>
                        <Select
                          value={String(form.total_floors)}
                          onValueChange={(v) =>
                            update("total_floors", Number(v))
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TOTAL_FLOORS_OPTIONS.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">Состояние</Label>
                        <Select
                          value={form.condition}
                          onValueChange={(v) => update("condition", v)}
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionOptions.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">
                          Год постройки
                        </Label>
                        <Input
                          className="h-9 bg-background"
                          value={form.year_built}
                          onChange={(e) => update("year_built", e.target.value)}
                          placeholder="например, 2018"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(flatLike || houseLike) && (
                        <div>
                          <Label className="text-xs mb-1 block">Балкон</Label>
                          <Select
                            value={form.balcony || "none"}
                            onValueChange={(v) =>
                              update("balcony", v === "none" ? "" : v)
                            }
                          >
                            <SelectTrigger className="h-9 text-sm bg-background">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {BALCONY_OPTIONS.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs mb-1 block">Мебель</Label>
                        <Select
                          value={form.furniture || "none"}
                          onValueChange={(v) =>
                            update("furniture", v === "none" ? "" : v)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {FURNITURE_OPTIONS.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Санузел</Label>
                        <Select
                          value={form.bathroom || "none"}
                          onValueChange={(v) =>
                            update("bathroom", v === "none" ? "" : v)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {BATHROOM_OPTIONS.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">
                          Вид из окон
                        </Label>
                        <Select
                          value={form.window_view || "none"}
                          onValueChange={(v) =>
                            update("window_view", v === "none" ? "" : v)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {WINDOW_VIEW_OPTIONS.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">
                          Жилая площадь, м²
                        </Label>
                        <Input
                          className="h-9 bg-background"
                          type="number"
                          value={form.living_area}
                          onChange={(e) =>
                            update("living_area", e.target.value)
                          }
                          placeholder="—"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">
                          Площадь кухни, м²
                        </Label>
                        <Input
                          className="h-9 bg-background"
                          type="number"
                          value={form.kitchen_area}
                          onChange={(e) =>
                            update("kitchen_area", e.target.value)
                          }
                          placeholder="—"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isSale && (
                        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer bg-background">
                          <Checkbox
                            checked={form.mortgage}
                            onCheckedChange={(v) => update("mortgage", !!v)}
                          />
                          <span className="text-xs">Ипотека</span>
                        </label>
                      )}
                      {!isSale && (
                        <>
                          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer bg-background">
                            <Checkbox
                              checked={form.pets_allowed}
                              onCheckedChange={(v) =>
                                update("pets_allowed", !!v)
                              }
                            />
                            <span className="text-xs">Можно с животными</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer bg-background">
                            <Checkbox
                              checked={form.children_allowed}
                              onCheckedChange={(v) =>
                                update("children_allowed", !!v)
                              }
                            />
                            <span className="text-xs">Можно с детьми</span>
                          </label>
                        </>
                      )}
                    </div>
                  </>
                ) : parkingLike ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Этаж</Label>
                      <Select
                        value={form.floor}
                        onValueChange={(v) => update("floor", v)}
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FLOORS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Состояние</Label>
                      <Select
                        value={form.condition}
                        onValueChange={(v) => update("condition", v)}
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionOptions.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">Этаж</Label>
                        <Select
                          value={form.floor}
                          onValueChange={(v) => update("floor", v)}
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FLOORS.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">
                          Этажей в здании
                        </Label>
                        <Select
                          value={String(form.total_floors)}
                          onValueChange={(v) =>
                            update("total_floors", Number(v))
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TOTAL_FLOORS_OPTIONS.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">
                          Высота потолков, м
                        </Label>
                        <Select
                          value={String(form.ceiling_height)}
                          onValueChange={(v) =>
                            update("ceiling_height", Number(v))
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CEILING_HEIGHTS.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Парковка</Label>
                        <Select
                          value={form.parking}
                          onValueChange={(v) => update("parking", v)}
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PARKING_OPTIONS.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">Состояние</Label>
                        <Select
                          value={form.condition}
                          onValueChange={(v) => update("condition", v)}
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionOptions.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Планировка</Label>
                        <Select
                          value={form.layout}
                          onValueChange={(v) => update("layout", v)}
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LAYOUTS.map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </WizardSection>
              <div className="space-y-3">
                <WizardSection
                  icon={Sparkles}
                  title={`Особенности и инфраструктура (${form.features.length})`}
                  hint="Нажимайте пункты — выбранные подсветятся. Можно отметить несколько."
                >
                  {featureGroups.map((group) => {
                    const GroupIcon =
                      FEATURE_GROUP_ICONS[group.title] || Sparkles;
                    return (
                      <div
                        key={group.title}
                        className="rounded-lg border border-border/70 bg-background p-3"
                      >
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                          <GroupIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                          {group.title}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.items.map((f) => {
                            const on = form.features.includes(f);
                            return (
                              <button
                                key={f}
                                type="button"
                                onClick={() => toggleFeature(f)}
                                className={cn(
                                  "text-left text-[11px] leading-snug px-2.5 py-1.5 rounded-md border transition-colors",
                                  on
                                    ? "border-primary/50 bg-primary/10 text-foreground font-medium"
                                    : "border-border/70 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground",
                                )}
                              >
                                {f}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </WizardSection>
              </div>
              {managerSection}
            </>
          )}

          {step === "conditions" && !isSale && (
            <WizardSection
              icon={ScrollText}
              title={isDaily ? "Условия посуточной аренды" : "Условия аренды"}
              hint={
                isDaily
                  ? "Краткосрочная сдача: залог в сутках, без договора на год."
                  : isResidential
                    ? "Условия для жилой аренды."
                    : "Финансовые и юридические условия коммерческой аренды."
              }
            >
              {isDaily ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Мин. срок</Label>
                    <Select
                      value={form.contract_term || "none"}
                      onValueChange={(v) => {
                        const val = v === "none" ? "" : v;
                        setForm((prev) => ({
                          ...prev,
                          contract_term: val,
                          min_term: val,
                        }));
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm bg-background">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {termOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Залог</Label>
                    <Select
                      value={form.deposit || "none"}
                      onValueChange={(v) =>
                        update("deposit", v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {depositOptions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">
                      Коммунальные / услуги
                    </Label>
                    <Select
                      value={form.utilities_included || "none"}
                      onValueChange={(v) =>
                        update("utilities_included", v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm bg-background">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {UTILITIES_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Арендодатель</Label>
                    <Select
                      value={form.landlord_type}
                      onValueChange={(v) => update("landlord_type", v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANDLORD_TYPES.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : isResidential || isLand ? (
                <div className="grid grid-cols-2 gap-3">
                  {!isLand && (
                    <>
                      <div>
                        <Label className="text-xs mb-1 block">
                          Срок договора
                        </Label>
                        <Select
                          value={form.contract_term}
                          onValueChange={(v) => update("contract_term", v)}
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {termOptions.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Мин. срок</Label>
                        <Select
                          value={form.min_term || "none"}
                          onValueChange={(v) =>
                            update("min_term", v === "none" ? "" : v)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-background">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {termOptions.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div>
                    <Label className="text-xs mb-1 block">Залог</Label>
                    <Select
                      value={form.deposit}
                      onValueChange={(v) => update("deposit", v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {depositOptions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">
                      Коммунальные платежи
                    </Label>
                    <Select
                      value={form.utilities_included || "none"}
                      onValueChange={(v) =>
                        update("utilities_included", v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm bg-background">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {UTILITIES_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Арендодатель</Label>
                    <Select
                      value={form.landlord_type}
                      onValueChange={(v) => update("landlord_type", v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANDLORD_TYPES.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isLongRent && !isLand && (
                    <div>
                      <Label className="text-xs mb-1 block">
                        Форма договора
                      </Label>
                      <Select
                        value={form.contract_form || "none"}
                        onValueChange={(v) =>
                          update("contract_form", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {CONTRACT_FORM_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">
                        Срок контракта
                      </Label>
                      <Select
                        value={form.contract_term}
                        onValueChange={(v) => update("contract_term", v)}
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {termOptions.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        Мин. срок аренды
                      </Label>
                      <Select
                        value={form.min_term || "none"}
                        onValueChange={(v) =>
                          update("min_term", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {termOptions.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Залог</Label>
                      <Select
                        value={form.deposit}
                        onValueChange={(v) => update("deposit", v)}
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {depositOptions.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        Форма договора
                      </Label>
                      <Select
                        value={form.contract_form || "none"}
                        onValueChange={(v) =>
                          update("contract_form", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {CONTRACT_FORM_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">
                        Коммунальные платежи
                      </Label>
                      <Select
                        value={form.utilities_included || "none"}
                        onValueChange={(v) =>
                          update("utilities_included", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {UTILITIES_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">НДС</Label>
                      <Select
                        value={form.vat || "none"}
                        onValueChange={(v) =>
                          update("vat", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {VAT_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Индексация</Label>
                      <Select
                        value={form.indexation || "none"}
                        onValueChange={(v) =>
                          update("indexation", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {INDEXATION_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Субаренда</Label>
                      <Select
                        value={form.sublease || "none"}
                        onValueChange={(v) =>
                          update("sublease", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {SUBLEASE_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">
                        Арендодатель / собственник
                      </Label>
                      <Select
                        value={form.landlord_type}
                        onValueChange={(v) => update("landlord_type", v)}
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANDLORD_TYPES.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Назначение</Label>
                      <Select
                        value={form.purpose || "none"}
                        onValueChange={(v) =>
                          update("purpose", v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm bg-background">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {PURPOSE_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {!isLand && (
                    <>
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-1">
                        Трафик и локация
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1 block">
                            Пешеходная проходимость
                          </Label>
                          <Select
                            value={
                              form.pedestrian_traffic
                                ? String(form.pedestrian_traffic)
                                : "none"
                            }
                            onValueChange={(v) =>
                              update(
                                "pedestrian_traffic",
                                v === "none" ? undefined : Number(v),
                              )
                            }
                          >
                            <SelectTrigger className="h-9 text-sm bg-background">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {PEDESTRIAN_TRAFFIC_LEVELS.map((l) => (
                                <SelectItem
                                  key={l.value}
                                  value={String(l.value)}
                                >
                                  {l.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">
                            Транспортный узел
                          </Label>
                          <Select
                            value={form.transport_hub || "none"}
                            onValueChange={(v) =>
                              update("transport_hub", v === "none" ? "" : v)
                            }
                          >
                            <SelectTrigger className="h-9 text-sm bg-background">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {TRANSPORT_HUB_OPTIONS.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1 block">
                            До метро / центра
                          </Label>
                          <Input
                            className="h-9 bg-background"
                            placeholder="5 мин. пешком"
                            value={form.metro_minutes}
                            onChange={(e) =>
                              update("metro_minutes", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">
                            Входная группа
                          </Label>
                          <Select
                            value={form.entrance_group || "none"}
                            onValueChange={(v) =>
                              update("entrance_group", v === "none" ? "" : v)
                            }
                          >
                            <SelectTrigger className="h-9 text-sm bg-background">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {ENTRANCE_OPTIONS.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </WizardSection>
          )}

          {step === "location" && (
            <WizardSection
              icon={MapPin}
              title="Адрес объекта"
              hint="Выберите адрес из подсказок — так объект появится на карте после публикации."
            >
              <AddressAutocomplete
                value={form.address}
                lat={form.lat}
                lng={form.lng}
                district={form.district}
                onChange={({ address, lat, lng, district }) => {
                  setForm((prev) => ({
                    ...prev,
                    address,
                    lat,
                    lng,
                    ...(district ? { district } : {}),
                  }));
                }}
              />
              <LocationDistrictSelect
                value={form.district}
                hasCoords={form.lat != null && form.lng != null}
                onChange={(v, meta) => {
                  setForm((prev) => ({
                    ...prev,
                    district: v,
                    ...(meta?.lat != null && meta?.lng != null
                      ? { lat: meta.lat, lng: meta.lng }
                      : {}),
                  }));
                }}
              />
            </WizardSection>
          )}

          {step === "media" && (
            <WizardSection
              icon={ImageIcon}
              title="Медиа"
              hint="Фото, ссылка VK Video и планировка (для новостроек и домов)."
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <input
                ref={planInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPlanFile(file);
                  const reader = new FileReader();
                  reader.onload = (ev) =>
                    setPlanPreview(String(ev.target?.result || ""));
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" /> Загрузить фото
              </Button>
              {allPhotoUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
                  {allPhotoUrls.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-square bg-muted overflow-hidden group rounded-md border border-border/60"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverIndex(i)}
                        className={`absolute bottom-1 left-1 w-5 h-5 flex items-center justify-center ${coverIndex === i ? "text-amber-400" : "text-white/60 opacity-0 group-hover:opacity-100"}`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${coverIndex === i ? "fill-amber-400" : ""}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-3 border-t border-border/50">
                <Label className="text-xs">Видео VK (ссылка)</Label>
                <div className="flex gap-2">
                  <Input
                    value={videoUrlDraft}
                    onChange={(e) => setVideoUrlDraft(e.target.value)}
                    placeholder="https://vk.com/video-…_…"
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      const url = videoUrlDraft.trim();
                      if (!url) return;
                      if (!isValidVkVideoUrl(url)) {
                        toast({
                          title: "Неверная ссылка VK Video",
                          variant: "destructive",
                        });
                        return;
                      }
                      setForm((prev) => ({
                        ...prev,
                        video_urls: [...prev.video_urls, url],
                      }));
                      setVideoUrlDraft("");
                    }}
                  >
                    Добавить
                  </Button>
                </div>
                {form.video_urls.length > 0 && (
                  <ul className="space-y-1">
                    {form.video_urls.map((url) => (
                      <li
                        key={url}
                        className="flex items-center gap-2 text-[11px] text-muted-foreground"
                      >
                        <span className="truncate flex-1">{url}</span>
                        <button
                          type="button"
                          className="text-destructive"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              video_urls: prev.video_urls.filter(
                                (u) => u !== url,
                              ),
                            }))
                          }
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {(houseLike ||
                form.types.includes("Новостройка") ||
                form.types.includes("Квартира") ||
                !!myDeveloper) && (
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <Label className="text-xs">{planTabLabel(form)}</Label>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => planInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-1" /> Загрузить план
                    </Button>
                    {(planPreview || form.plan_image_url) && (
                      <button
                        type="button"
                        className="text-xs text-destructive"
                        onClick={() => {
                          setPlanFile(null);
                          setPlanPreview("");
                          setForm((prev) => ({ ...prev, plan_image_url: "" }));
                        }}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                  {(planPreview || form.plan_image_url) && (
                    <img
                      src={planPreview || form.plan_image_url}
                      alt=""
                      className="max-h-40 rounded-md border border-border object-contain bg-muted"
                    />
                  )}
                </div>
              )}
            </WizardSection>
          )}

          {step === "submit" && (
            <div className="space-y-3.5">
              {managerSection}
              <WizardSection icon={Send} title="Способ размещения">
                <p className="text-sm text-muted-foreground">
                  Выберите, как вы хотите разместить объект:
                </p>
                <button
                  type="button"
                  onClick={() => update("request_type", "free_listing")}
                  className={`w-full text-left p-4 border rounded-lg transition-all bg-background ${
                    form.request_type === "free_listing"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Megaphone
                      className={`w-5 h-5 mt-0.5 ${form.request_type === "free_listing" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Разместить бесплатно
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Объект появится в публичном каталоге после модерации
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => update("request_type", "management")}
                  className={`w-full text-left p-4 border rounded-lg transition-all bg-background ${
                    form.request_type === "management"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Settings2
                      className={`w-5 h-5 mt-0.5 ${form.request_type === "management" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Передать в управление
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        АрендаСити возьмёт объект на полное управление
                      </div>
                    </div>
                  </div>
                </button>
              </WizardSection>
            </div>
          )}
        </div>

        <div
          className="shrink-0 bg-card border-t px-4 py-3 flex justify-between gap-2"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="shrink-0"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Назад
            </Button>
          ) : (
            <div />
          )}
          {step !== "submit" ? (
            <Button
              type="button"
              onClick={() => void goNext()}
              disabled={!canNext()}
              className="min-w-[110px] sm:min-w-[120px]"
            >
              {locationGeocoding ? "Проверка…" : "Далее"}{" "}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || uploading}
              className="min-w-0 flex-1 sm:flex-none sm:min-w-[180px]"
            >
              {submitMutation.isPending || uploading
                ? "Сохранение…"
                : editId
                  ? "Сохранить"
                  : "На модерацию"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
