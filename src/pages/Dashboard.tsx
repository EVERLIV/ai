import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Building2,
  CheckSquare,
  Edit,
  Eye,
  Globe,
  Home,
  ImageIcon,
  Inbox,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Newspaper,
  Plus,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import AdPlacementsManager from "@/components/admin/AdPlacementsManager";
import AdPlacementsTab from "@/components/admin/AdPlacementsTab";
import CrmLeadsTab from "@/components/admin/CrmLeadsTab";
import SeekersCatalogTab from "@/components/admin/SeekersCatalogTab";
import AdminSiteAnalyticsTab from "@/components/admin/AdminSiteAnalyticsTab";
import PropertiesAdminTable from "@/components/admin/PropertiesAdminTable";
import PropertySeoFields from "@/components/admin/PropertySeoFields";
import UsersRolesTab from "@/components/admin/UsersRolesTab";
import DictionariesTab from "@/components/admin/DictionariesTab";
import ModerationQueue from "@/components/admin/ModerationQueue";
import AgencyReviewsModeration from "@/components/admin/AgencyReviewsModeration";
import PropertyUnitsManager from "@/components/admin/PropertyUnitsManager";
import VerificationUsersTab from "@/components/admin/VerificationUsersTab";
import DevelopersAdminTab from "@/components/admin/DevelopersAdminTab";
import WoodenHouseConfigFields from "@/components/admin/WoodenHouseConfigFields";
import LocationDistrictSelect from "@/components/LocationDistrictSelect";
import NewsAdminPanel from "@/components/NewsAdminPanel";
import SeoHead from "@/components/SeoHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type PropertySegment,
} from "@/config/propertySegments";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAllDictionaryValues } from "@/hooks/useDictionaries";
import { useListScrollRestore } from "@/hooks/useListScrollRestore";
import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  supabaseAdmin,
} from "@/integrations/supabase/adminClient";
import { isSaleDeal } from "@/lib/propertyDeal";
import {
  formatCoord,
  isValidCoordPair,
  parseCoordInput,
  parseCoordPair,
} from "@/lib/propertyGeo";
import { processPropertyPhotoFile } from "@/lib/processPropertyPhoto";
import {
  isLandProperty,
  LAND_BUILDING_FIELD_DEFAULTS,
  LAND_TYPE_LABEL,
  LAND_USE_OPTIONS,
} from "@/lib/propertyLand";
import {
  CEILING_HEIGHTS,
  CONTRACT_FORM_OPTIONS,
  PROPERTY_CLASSES as FALLBACK_CLASSES,
  CONDITIONS as FALLBACK_CONDITIONS,
  CONTRACT_TERMS as FALLBACK_CONTRACT_TERMS,
  DEAL_TYPES as FALLBACK_DEAL_TYPES,
  DEPOSIT_OPTIONS as FALLBACK_DEPOSIT,
  LANDLORD_TYPES as FALLBACK_LANDLORD_TYPES,
  LAYOUTS as FALLBACK_LAYOUTS,
  PARKING_OPTIONS as FALLBACK_PARKING,
  PURPOSE_OPTIONS as FALLBACK_PURPOSE,
  UTILITIES_OPTIONS as FALLBACK_UTILITIES,
  VAT_OPTIONS as FALLBACK_VAT,
  FEATURES_LIST,
  FLOORS,
  INDEXATION_OPTIONS,
  BUILDING_TYPES,
  PEDESTRIAN_TRAFFIC_LEVELS,
  SUBLEASE_OPTIONS,
  TOTAL_FLOORS_OPTIONS,
  TRANSPORT_HUB_OPTIONS,
} from "@/lib/propertyOptions";
import {
  getSidebarVisibility,
  type PropertySidebarExtras,
  sanitizeSidebarExtras,
} from "@/lib/propertySidebar";
import {
  getPropertySegment,
  getPropertyTypes,
  normalizePropertyTypes,
  syncPropertyTypesPayload,
  togglePropertyType,
} from "@/lib/propertyTypes";
import { syncLocationExtras } from "@/lib/propertyFormMapper";
import { cn } from "@/lib/utils";
import { isHouseLike } from "@/lib/propertyTypeFamilies";
import {
  getResidentialBuildingType,
  getWoodConfigId,
  getWoodFinish,
  getWoodFloors,
  getWoodFoundation,
  getWoodRoof,
  getWoodWall,
} from "@/lib/propertyResidential";
import {
  getWoodenHouseConfigByBuildingType,
  houseBuildingTypeOptions,
  isWoodenBuildingType,
} from "@/lib/woodenHouses";
import { geocodeAddress, reverseGeocode } from "@/lib/yandexGeocoder";

// Address autocomplete via Yandex Geocoder (AddressAutocomplete)

interface PropertyExtras extends PropertySidebarExtras {
  building_type?: string;
  wood_config?: string;
  wood_wall?: string;
  wood_floors?: string;
  wood_foundation?: string;
  wood_roof?: string;
  wood_finish?: string;
  seo_title?: string;
  seo_description?: string;
}

interface PropertyForm {
  segment: PropertySegment;
  types: string[];
  class: string;
  area: number;
  price: number;
  price_per_m2: number;
  address: string;
  lat: number | null;
  lng: number | null;
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
  extras: PropertyExtras;
}

const emptyExtras: PropertyExtras = {
  entrance_group: "",
  utilities_included: "",
  vat: "",
  indexation: "",
  min_term: "",
  pedestrian_traffic: undefined,
  metro_minutes: "",
  transport_hub: "",
  contract_form: "",
  sublease: "",
  landlord_type: "",
  purpose: "",
  agent_name: "",
  agent_company: "",
  agent_objects_count: undefined,
  agent_rating: undefined,
  agent_response_min: undefined,
  agent_verified: false,
};

const emptyForm: PropertyForm = {
  segment: "commercial",
  types: ["Офис"],
  class: "B",
  area: 0,
  price: 0,
  price_per_m2: 0,
  address: "",
  lat: null,
  lng: null,
  district: "Кировский",
  floor: "1",
  total_floors: 1,
  ceiling_height: 3,
  parking: "Нет",
  condition: "Хороший ремонт",
  layout: "Open-space",
  deal_type: "Аренда",
  deposit: "1 месяц",
  contract_term: "от 1 года",
  description: "",
  features: [],
  manager_id: "",
  client_id: "",
  is_active: true,
  extras: { ...emptyExtras },
};

const propertyFormSection = "border border-border rounded-lg p-3";
const sidebarSubBlock = "rounded-md p-2.5";

type AdminSection = "objects" | "site";

type AdminNavItem = {
  value: string;
  label: string;
  icon: typeof Home;
};

type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

function buildAdminNav(isAdmin: boolean): {
  objects: AdminNavGroup[];
  site: AdminNavGroup[];
} {
  return {
    objects: [
      {
        title: "Каталог",
        items: [
          { value: "properties", label: "Объекты", icon: Home },
          { value: "moderation", label: "Модерация", icon: Shield },
        ],
      },
      {
        title: "CRM",
        items: [
          {
            value: "clients",
            label: "Собственники и агентства",
            icon: UserCircle,
          },
          { value: "leads", label: "Заявки", icon: Inbox },
          { value: "seekers", label: "Ищут недвижимость", icon: Search },
          ...(isAdmin
            ? [{ value: "tasks", label: "Задачи", icon: CheckSquare }]
            : []),
        ],
      },
    ],
    site: [
      {
        title: "Контент и реклама",
        items: [
          { value: "news", label: "Новости", icon: Newspaper },
          { value: "ads", label: "Реклама", icon: Megaphone },
        ],
      },
      {
        title: "Система",
        items: [
          { value: "users", label: "Пользователи", icon: Users },
          { value: "analytics", label: "Аналитика", icon: BarChart3 },
          { value: "dictionaries", label: "Справочники", icon: Settings2 },
        ],
      },
    ],
  };
}

function sectionForTab(
  tab: string,
  nav: ReturnType<typeof buildAdminNav>,
): AdminSection {
  const inObjects = nav.objects.some((g) =>
    g.items.some((i) => i.value === tab),
  );
  return inObjects ? "objects" : "site";
}

function firstTabInSection(
  section: AdminSection,
  nav: ReturnType<typeof buildAdminNav>,
): string {
  const groups = section === "objects" ? nav.objects : nav.site;
  return groups[0]?.items[0]?.value ?? "properties";
}

const sidebarNavButtonClass = (active: boolean) =>
  cn(
    "w-full flex items-start gap-2.5 rounded-md px-3 py-2 text-left text-xs leading-snug transition-colors",
    active
      ? "bg-primary text-primary-foreground font-medium"
      : "text-foreground hover:bg-muted",
  );

export default function Dashboard() {
  const { user, loading, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { byCategory, propertyTypes, all: dictionaryAll } = useAllDictionaryValues();
  const catalogDistricts = useMemo(
    () => dictionaryAll.filter((i) => i.category === "district"),
    [dictionaryAll],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminTab, setAdminTab] = useState("properties");
  const [adminSection, setAdminSection] = useState<AdminSection>("objects");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [latText, setLatText] = useState("");
  const [lngText, setLngText] = useState("");
  const scrollRestore = useListScrollRestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TYPES = propertyTypes(form.segment);
  const _CLASSES =
    byCategory("property_class").length > 0
      ? byCategory("property_class")
      : [...FALLBACK_CLASSES];
  const DEAL_TYPES =
    byCategory("deal_type").length > 0
      ? byCategory("deal_type")
      : [...FALLBACK_DEAL_TYPES];
  const CONDITIONS =
    byCategory("condition").length > 0
      ? byCategory("condition")
      : [...FALLBACK_CONDITIONS];
  const LAYOUTS =
    byCategory("layout").length > 0
      ? byCategory("layout")
      : [...FALLBACK_LAYOUTS];
  const PARKING_OPTIONS =
    byCategory("parking").length > 0
      ? byCategory("parking")
      : [...FALLBACK_PARKING];
  const DEPOSIT_OPTIONS =
    byCategory("deposit").length > 0
      ? byCategory("deposit")
      : [...FALLBACK_DEPOSIT];
  const CONTRACT_TERMS =
    byCategory("contract_term").length > 0
      ? byCategory("contract_term")
      : [...FALLBACK_CONTRACT_TERMS];
  const UTILITIES_OPTIONS =
    byCategory("utilities").length > 0
      ? byCategory("utilities")
      : [...FALLBACK_UTILITIES];
  const VAT_OPTIONS =
    byCategory("vat").length > 0 ? byCategory("vat") : [...FALLBACK_VAT];
  const LANDLORD_TYPES =
    byCategory("landlord_type").length > 0
      ? byCategory("landlord_type")
      : [...FALLBACK_LANDLORD_TYPES];
  const PURPOSE_OPTIONS =
    byCategory("purpose").length > 0
      ? byCategory("purpose")
      : [...FALLBACK_PURPOSE];

  const { data: properties = [], isLoading, isFetching } = useQuery({
    queryKey: ["dashboard-properties"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.db.select(
        "properties",
        "select=*,manager:profiles!properties_manager_id_fkey(id,full_name),client:profiles!properties_client_id_fkey(id,full_name)&order=created_at.desc",
      );
      if (error)
        throw new Error(error.message || "Не удалось загрузить объекты");
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.db.select(
        "profiles",
        "select=id,full_name,email",
      );
      if (error)
        throw new Error(error.message || "Не удалось загрузить профили");
      return data;
    },
  });

  const uploadPhotos = async (
    propertyId: string,
  ): Promise<{ urls: string[]; cover: string }> => {
    const urls: string[] = [...existingPhotos];

    for (const file of photoFiles) {
      const processed = await processPropertyPhotoFile(file);
      const path = `${propertyId}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabaseAdmin.storage.upload(
        "property-photos",
        path,
        processed,
      );
      if (error) throw new Error(error);
      urls.push(supabaseAdmin.storage.getPublicUrl("property-photos", path));
    }

    // Calculate cover: if coverIndex points to existing photos, use that; otherwise offset
    const cover = urls[coverIndex] || urls[0] || "";
    return { urls, cover };
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: PropertyForm) => {
      const types = normalizePropertyTypes(formData.types);
      if (types.length === 0)
        throw new Error("Выберите хотя бы один тип объекта");
      const { type: primaryType, extras: typesExtras } =
        syncPropertyTypesPayload(
          types,
          formData.extras as Record<string, unknown>,
          formData.segment,
        );
      const { district: leafDistrict, location: locationExtras } =
        syncLocationExtras(
          formData.district,
          formData.extras as Record<string, unknown>,
        );
      const isLand = isLandProperty(primaryType);
      const isSale = isSaleDeal(formData.deal_type);
      // Create property first to get ID, then upload photos
      const payload: any = {
        segment: formData.segment,
        type: primaryType,
        class: formData.class,
        area: formData.area,
        price: formData.price,
        price_per_m2:
          formData.area > 0 ? Math.round(formData.price / formData.area) : 0,
        address: formData.address,
        lat: parseCoordInput(latText) ?? formData.lat,
        lng: parseCoordInput(lngText) ?? formData.lng,
        district: leafDistrict,
        floor: isLand ? LAND_BUILDING_FIELD_DEFAULTS.floor : formData.floor,
        total_floors: isLand
          ? LAND_BUILDING_FIELD_DEFAULTS.total_floors
          : formData.total_floors,
        ceiling_height: isLand ? null : formData.ceiling_height,
        parking: isLand
          ? LAND_BUILDING_FIELD_DEFAULTS.parking
          : formData.parking,
        condition: isLand ? null : formData.condition || null,
        layout: isLand ? null : formData.layout || null,
        deal_type: formData.deal_type,
        deposit: isSale ? null : formData.deposit || null,
        contract_term: isSale ? null : formData.contract_term || null,
        description: formData.description,
        features: formData.features,
        manager_id: formData.manager_id || null,
        client_id: formData.client_id || null,
        is_active: formData.is_active,
        extras: sanitizeSidebarExtras(
          {
            ...(typesExtras as PropertyExtras),
            ...(locationExtras ? { location: locationExtras } : {}),
            seo_title: formData.extras.seo_title?.trim() || undefined,
            seo_description:
              formData.extras.seo_description?.trim() || undefined,
          },
          primaryType,
          formData.deal_type,
        ),
      };

      setUploading(true);
      const savedEditId = editId;

      if (editId) {
        // Always update photos when editing (handles deletions too)
        const { urls, cover } = await uploadPhotos(editId);
        payload.photos = urls;
        payload.cover_photo = cover;
        payload.photos_count = urls.length;
        const { error } = await supabaseAdmin.db.update(
          "properties",
          `id=eq.${editId}`,
          payload,
        );
        if (error)
          throw new Error(error.message || "Не удалось обновить объект");
      } else {
        const { data, error } = await supabaseAdmin.db.insert(
          "properties",
          payload,
        );
        if (error)
          throw new Error(error.message || "Не удалось добавить объект");
        if (photoFiles.length > 0) {
          const { urls, cover } = await uploadPhotos(data.id);
          await supabaseAdmin.db.update("properties", `id=eq.${data.id}`, {
            photos: urls,
            cover_photo: cover,
            photos_count: urls.length,
          });
        }
      }
      setUploading(false);
      return { isEdit: !!savedEditId, id: savedEditId || null, payload };
    },
    onSuccess: (result) => {
      if (result?.isEdit && result.id) {
        queryClient.setQueryData(["dashboard-properties"], (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.map((p: { id: string }) =>
            p.id === result.id ? { ...p, ...result.payload } : p,
          );
        });
        void queryClient.invalidateQueries({
          queryKey: ["dashboard-properties"],
        });
        scrollRestore.restore();
        toast({ title: "Сохранено" });
      } else {
        void queryClient.invalidateQueries({
          queryKey: ["dashboard-properties"],
        });
        setDialogOpen(false);
        resetForm();
        toast({ title: "Объект добавлен" });
      }
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.db.delete(
        "properties",
        `id=eq.${id}`,
      );
      if (error) throw new Error(error.message || "Не удалось удалить объект");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] });
      toast({ title: "Объект удалён" });
    },
  });

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
    setLatText("");
    setLngText("");
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setExistingPhotos([]);
    setCoverIndex(0);
  };

  const openEdit = (prop: any) => {
    setEditId(prop.id);
    setForm({
      segment: getPropertySegment(prop),
      types: getPropertyTypes(prop),
      class: prop.class,
      area: prop.area,
      price: prop.price,
      price_per_m2: prop.price_per_m2,
      address: prop.address,
      lat: typeof prop.lat === "number" ? prop.lat : null,
      lng: typeof prop.lng === "number" ? prop.lng : null,
      district: prop.district,
      floor: prop.floor || "",
      total_floors: prop.total_floors || 1,
      ceiling_height: prop.ceiling_height || 3,
      parking: prop.parking || "",
      condition: prop.condition || "",
      layout: prop.layout || "",
      deal_type: prop.deal_type,
      deposit: prop.deposit || "",
      contract_term: prop.contract_term || "",
      description: prop.description || "",
      features: prop.features || [],
      manager_id: prop.manager_id || "",
      client_id: prop.client_id || "",
      is_active: prop.is_active,
      extras: {
        ...emptyExtras,
        ...(prop.extras || {}),
        ...(isLandProperty(prop)
          ? {
              land_use:
                (prop.extras as PropertyExtras)?.land_use || prop.layout || "",
              cadastral_number:
                (prop.extras as PropertyExtras)?.cadastral_number || "",
            }
          : {}),
      },
    });
    setLatText(formatCoord(typeof prop.lat === "number" ? prop.lat : null));
    setLngText(formatCoord(typeof prop.lng === "number" ? prop.lng : null));
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

  const handleGeocodeFromAddress = async () => {
    if (!form.address.trim()) {
      toast({
        title: "Укажите адрес в блоке «Локация»",
        variant: "destructive",
      });
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress(form.address);
      if (!result) {
        toast({
          title: "Координаты не найдены",
          description: "Проверьте адрес или введите широту и долготу вручную",
          variant: "destructive",
        });
        return;
      }
      setForm((prev) => ({
        ...prev,
        lat: result.lat,
        lng: result.lng,
        address: result.address || prev.address,
      }));
      setLatText(formatCoord(result.lat));
      setLngText(formatCoord(result.lng));
      toast({ title: "Координаты определены" });
    } catch (err) {
      toast({
        title: "Ошибка геокодирования",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setGeocoding(false);
    }
  };

  const applyCoordTexts = (nextLat: string, nextLng: string) => {
    const pair =
      parseCoordPair(`${nextLat} ${nextLng}`) ||
      parseCoordPair(nextLat) ||
      parseCoordPair(nextLng);
    if (pair) {
      setLatText(formatCoord(pair.lat));
      setLngText(formatCoord(pair.lng));
      setForm((prev) => ({ ...prev, lat: pair.lat, lng: pair.lng }));
      return;
    }
    setLatText(nextLat);
    setLngText(nextLng);
    setForm((prev) => ({
      ...prev,
      lat: parseCoordInput(nextLat),
      lng: parseCoordInput(nextLng),
    }));
  };

  const handleReverseGeocodeFromCoords = async () => {
    const lat = parseCoordInput(latText) ?? form.lat;
    const lng = parseCoordInput(lngText) ?? form.lng;
    if (!isValidCoordPair(lat, lng)) {
      toast({ title: "Укажите корректные координаты", variant: "destructive" });
      return;
    }
    setGeocoding(true);
    try {
      const result = await reverseGeocode(lat, lng);
      if (!result?.address) {
        toast({
          title: "Адрес не найден",
          description: "Координаты сохранены, адрес можно указать вручную",
          variant: "destructive",
        });
        return;
      }
      setForm((prev) => ({ ...prev, address: result.address }));
      toast({ title: "Адрес определён по координатам" });
    } catch (err) {
      toast({
        title: "Ошибка геокодирования",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setGeocoding(false);
    }
  };

  const handleDealTypeChange = (dealType: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        deal_type: dealType,
        deposit: isSaleDeal(dealType) ? "" : prev.deposit || "1 месяц",
        contract_term: isSaleDeal(dealType)
          ? ""
          : prev.contract_term || "от 1 года",
        extras: sanitizeSidebarExtras(
          prev.extras,
          prev.types[0] || "Офис",
          dealType,
        ),
      };
      return next;
    });
  };

  const handleTypeToggle = (type: string, checked: boolean) => {
    setForm((prev) => {
      const types = togglePropertyType(prev.types, type, checked);
      const primaryType = types[0] || "Офис";
      if (isLandProperty(primaryType)) {
        return {
          ...prev,
          types,
          class: "-",
          ...LAND_BUILDING_FIELD_DEFAULTS,
          extras: sanitizeSidebarExtras(
            {
              ...prev.extras,
              land_use: prev.extras.land_use || prev.layout || "",
              property_types: types,
            },
            primaryType,
            prev.deal_type,
          ),
        };
      }
      return {
        ...prev,
        types,
        class: prev.class === "-" ? "B" : prev.class,
        floor: prev.floor === "-" ? "1" : prev.floor,
        total_floors: prev.total_floors || 1,
        ceiling_height: prev.ceiling_height || 3,
        parking: prev.parking === "-" ? "Нет" : prev.parking,
        condition: prev.condition || "Хороший ремонт",
        layout: prev.layout || "Open-space",
        extras: sanitizeSidebarExtras(
          { ...prev.extras, property_types: types },
          primaryType,
          prev.deal_type,
        ),
      };
    });
  };

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
    totalViews: properties.reduce(
      (s: number, p: any) => s + (p.views_count || 0),
      0,
    ),
  };

  const isSale = isSaleDeal(form.deal_type);
  const isLandForm = isLandProperty({
    type: form.types[0],
    extras: { property_types: form.types },
  });
  const isHouseForm = isHouseLike(form.types);
  const houseBuildingTypes = houseBuildingTypeOptions(
    byCategory("building_type").length > 0
      ? byCategory("building_type")
      : BUILDING_TYPES,
  );
  const sidebarVis = getSidebarVisibility(
    form.types[0] || "Офис",
    form.deal_type,
  );

  const isAdminUser = hasRole("admin");
  const adminNav = useMemo(
    () => buildAdminNav(isAdminUser),
    [isAdminUser],
  );
  const sectionNav =
    adminSection === "objects" ? adminNav.objects : adminNav.site;

  const selectAdminTab = (value: string) => {
    setAdminTab(value);
    setAdminSection(sectionForTab(value, adminNav));
  };

  const selectAdminSection = (section: AdminSection) => {
    setAdminSection(section);
    const allowed = new Set(
      (section === "objects" ? adminNav.objects : adminNav.site).flatMap((g) =>
        g.items.map((i) => i.value),
      ),
    );
    if (!allowed.has(adminTab)) {
      setAdminTab(firstTabInSection(section, adminNav));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground">
        Загрузка...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Панель управления"
        description="Административная панель АрендаСити."
        noindex
      />
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0 hidden sm:inline-flex"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Building2 className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <span
                className="font-semibold text-base truncate block leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {adminSection === "objects"
                  ? "Объекты"
                  : "Администрирование сайта"}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block truncate">
                Панель управления
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden md:block">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                signOut();
                navigate("/");
              }}
            >
              <LogOut className="w-4 h-4 mr-1" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <Tabs
        value={adminTab}
        onValueChange={selectAdminTab}
        className="flex-1 flex flex-col lg:flex-row min-h-0"
      >
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-3 pb-0">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => selectAdminSection("objects")}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                  adminSection === "objects"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                Объекты
              </button>
              <button
                type="button"
                onClick={() => selectAdminSection("site")}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                  adminSection === "site"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Сайт
              </button>
            </div>
          </div>
          <nav className="p-3 space-y-4">
            {sectionNav.map((group) => (
              <div key={group.title}>
                <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((t) => {
                    const Icon = t.icon;
                    const active = adminTab === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => selectAdminTab(t.value)}
                        className={sidebarNavButtonClass(active)}
                      >
                        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="flex-1 min-w-0">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile nav sheet */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle className="text-base">Разделы</SheetTitle>
            </SheetHeader>
            <div className="p-3 pb-0">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => selectAdminSection("objects")}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold ${
                    adminSection === "objects"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  Объекты
                </button>
                <button
                  type="button"
                  onClick={() => selectAdminSection("site")}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold ${
                    adminSection === "site"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Сайт
                </button>
              </div>
            </div>
            <nav className="p-3 space-y-4">
              {sectionNav.map((group) => (
                <div key={group.title}>
                  <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            selectAdminTab(t.value);
                            setMobileNavOpen(false);
                          }}
                          className={sidebarNavButtonClass(adminTab === t.value)}
                        >
                          <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="flex-1 min-w-0">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 space-y-6 overflow-x-hidden">
          {adminSection === "objects" && (
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {[
              {
                label: "Объектов",
                value: stats.total,
                icon: Home,
                color: "text-primary",
              },
              {
                label: "Активных",
                value: stats.active,
                icon: Eye,
                color: "text-green-600",
              },
              {
                label: "Площадь",
                value: `${stats.totalArea.toLocaleString()} м²`,
                icon: MapPin,
                color: "text-blue-600",
              },
              {
                label: "Просмотры",
                value: stats.totalViews,
                icon: BarChart3,
                color: "text-amber-600",
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-2 sm:pt-5 sm:pb-4 sm:px-6 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1 sm:gap-3 overflow-hidden">
                  <div
                    className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center ${s.color} shrink-0`}
                  >
                    <s.icon className="w-3 h-3 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-sm sm:text-2xl font-bold truncate leading-tight">
                      {s.value}
                    </p>
                    <p className="text-[9px] sm:text-xs text-muted-foreground truncate leading-tight">
                      {s.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {/* Keep TabsList visually hidden for a11y / radix — navigation via sidebar */}
          <TabsList className="sr-only">
            <TabsTrigger value="properties">Объекты</TabsTrigger>
            <TabsTrigger value="leads">Заявки</TabsTrigger>
            <TabsTrigger value="moderation">Модерация</TabsTrigger>
            <TabsTrigger value="clients">Клиенты</TabsTrigger>
            <TabsTrigger value="verification">Верификация</TabsTrigger>
            <TabsTrigger value="ads">Реклама</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="dictionaries">Справочники</TabsTrigger>
            <TabsTrigger value="tasks">Задачи</TabsTrigger>
            <TabsTrigger value="news">Новости</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h2 className="text-lg font-semibold">Объекты недвижимости</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline">
                  <Link to="/list-property/ai">
                    <Sparkles className="w-4 h-4 mr-1" /> Размещение с ИИ
                  </Link>
                </Button>
              <Sheet
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <SheetTrigger asChild>
                  <Button onClick={openNew}>
                    <Plus className="w-4 h-4 mr-1" /> Добавить объект
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-3xl overflow-y-auto p-0"
                >
                  <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
                    <SheetTitle className="text-base font-semibold">
                      {editId ? "Редактировать объект" : "Новый объект"}
                    </SheetTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialogOpen(false)}
                      >
                        Отмена
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (editId) scrollRestore.capture(editId);
                          saveMutation.mutate(form);
                        }}
                        disabled={saveMutation.isPending || uploading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {saveMutation.isPending || uploading
                          ? "Сохранение..."
                          : "Сохранить"}
                      </Button>
                    </div>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveMutation.mutate(form);
                    }}
                    className="p-4 space-y-4"
                  >
                    {/* Section: Основное */}
                    <fieldset
                      className={`${propertyFormSection} space-y-3 bg-sky-500/10`}
                    >
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Основное
                      </legend>
                      <div className="space-y-2">
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
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    segment: item.value,
                                    types: [
                                      item.value === "residential"
                                        ? "Квартира"
                                        : item.value === "land"
                                          ? "Земля"
                                          : "Офис",
                                    ],
                                  }))
                                }
                                className={`h-8 rounded-md border text-xs font-semibold transition-colors ${
                                  form.segment === item.value
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border bg-background text-foreground"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">
                            Тип объекта
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1.5 rounded-md border border-border/60 bg-background/40 p-2">
                            {TYPES.map((t) => {
                              const checked = form.types.includes(t);
                              return (
                                <label
                                  key={t}
                                  className="flex items-center gap-1.5 text-[11px] cursor-pointer py-0.5"
                                >
                                  <Checkbox
                                    className="h-3.5 w-3.5"
                                    checked={checked}
                                    onCheckedChange={(v) =>
                                      handleTypeToggle(t, !!v)
                                    }
                                  />
                                  <span
                                    className={
                                      checked
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground"
                                    }
                                  >
                                    {t}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Можно выбрать несколько: офис + склад + торговая.
                            «Земля» — только отдельно.
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Сделка</Label>
                          <Select
                            value={form.deal_type}
                            onValueChange={handleDealTypeChange}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DEAL_TYPES.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {d}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">
                            Площадь, м²
                          </Label>
                          <Input
                            className="h-8 text-xs"
                            type="number"
                            value={form.area || ""}
                            onChange={(e) =>
                              updateField("area", Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">
                            {isSale ? "Цена, ₽" : "Цена, ₽/мес"}
                          </Label>
                          <Input
                            className="h-8 text-xs"
                            type="number"
                            value={form.price || ""}
                            onChange={(e) =>
                              updateField("price", Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">₽/м²</Label>
                          <Input
                            className="h-8 text-xs bg-muted"
                            type="number"
                            value={
                              form.area > 0
                                ? Math.round(form.price / form.area)
                                : ""
                            }
                            disabled
                          />
                        </div>
                      </div>
                    </fieldset>

                    {/* Section: Локация */}
                    <fieldset
                      className={`${propertyFormSection} space-y-3 bg-emerald-500/10`}
                    >
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Локация
                      </legend>
                      <AddressAutocomplete
                        value={form.address}
                        lat={form.lat}
                        lng={form.lng}
                        district={form.district}
                        inputClassName="h-8 text-xs"
                        onChange={({ address, lat, lng, district }) => {
                          setForm((prev) => ({
                            ...prev,
                            address,
                            lat,
                            lng,
                            ...(district ? { district } : {}),
                          }));
                          setLatText(lat != null ? formatCoord(lat) : "");
                          setLngText(lng != null ? formatCoord(lng) : "");
                        }}
                      />
                      <div
                        className={`grid gap-2 ${isLandForm ? "grid-cols-1" : "grid-cols-3"}`}
                      >
                      <LocationDistrictSelect
                          value={form.district}
                          hasCoords={form.lat != null && form.lng != null}
                          catalogItems={catalogDistricts}
                          onChange={(v, meta) => {
                            setForm((prev) => ({
                              ...prev,
                              district: v,
                              ...(meta?.lat != null && meta?.lng != null
                                ? { lat: meta.lat, lng: meta.lng }
                                : {}),
                              extras: {
                                ...prev.extras,
                                ...(meta?.location
                                  ? { location: meta.location }
                                  : {}),
                              },
                            }));
                            if (meta?.lat != null && meta?.lng != null) {
                              setLatText(formatCoord(meta.lat));
                              setLngText(formatCoord(meta.lng));
                            }
                          }}
                        />
                        {!isLandForm && (
                          <>
                            <div>
                              <Label className="text-xs mb-1 block">Этаж</Label>
                              <Select
                                value={form.floor || "none"}
                                onValueChange={(v) =>
                                  updateField("floor", v === "none" ? "" : v)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
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
                                Этажей
                              </Label>
                              <Select
                                value={String(form.total_floors)}
                                onValueChange={(v) =>
                                  updateField("total_floors", Number(v))
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
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
                          </>
                        )}
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/40 p-2.5 space-y-2">
                        <div className="text-[11px] font-semibold text-muted-foreground">
                          Координаты (Яндекс)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs mb-1 block">Широта</Label>
                            <Input
                              className="h-8 text-xs"
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              placeholder="52.2869"
                              value={latText}
                              onChange={(e) =>
                                applyCoordTexts(e.target.value, lngText)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">
                              Долгота
                            </Label>
                            <Input
                              className="h-8 text-xs"
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              placeholder="104.2807"
                              value={lngText}
                              onChange={(e) =>
                                applyCoordTexts(latText, e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={geocoding}
                            onClick={handleGeocodeFromAddress}
                          >
                            {geocoding
                              ? "Определение..."
                              : "Координаты по адресу"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={geocoding}
                            onClick={handleReverseGeocodeFromCoords}
                          >
                            Адрес по координатам
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug">
                          Можно вписать широту и долготу вручную или вставить
                          пару «52.28, 104.28». Кнопки дергают Яндекс.Гео.
                        </p>
                      </div>
                    </fieldset>

                    {/* Section: Характеристики */}
                    <fieldset
                      className={`${propertyFormSection} space-y-3 bg-amber-500/10`}
                    >
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        {isLandForm ? "Земельный участок" : "Характеристики"}
                      </legend>
                      {isLandForm ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs mb-1 block">
                                Кадастровый номер
                              </Label>
                              <Input
                                className="h-8 text-xs"
                                placeholder="38:36:0000000:12345"
                                value={form.extras.cadastral_number || ""}
                                onChange={(e) =>
                                  updateField("extras", {
                                    ...form.extras,
                                    cadastral_number: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">
                                {LAND_TYPE_LABEL}
                              </Label>
                              <Select
                                value={form.extras.land_use || "none"}
                                onValueChange={(v) =>
                                  updateField("extras", {
                                    ...form.extras,
                                    land_use: v === "none" ? "" : v,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
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
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs mb-1 block">
                                Потолки, м
                              </Label>
                              <Select
                                value={String(form.ceiling_height)}
                                onValueChange={(v) =>
                                  updateField("ceiling_height", Number(v))
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
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
                              <Label className="text-xs mb-1 block">
                                Парковка
                              </Label>
                              <Select
                                value={form.parking || "none"}
                                onValueChange={(v) =>
                                  updateField("parking", v === "none" ? "" : v)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
                                  {PARKING_OPTIONS.map((p) => (
                                    <SelectItem key={p} value={p}>
                                      {p}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">
                                Состояние
                              </Label>
                              <Select
                                value={form.condition || "none"}
                                onValueChange={(v) =>
                                  updateField(
                                    "condition",
                                    v === "none" ? "" : v,
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
                                  {CONDITIONS.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs mb-1 block">
                                Планировка
                              </Label>
                              <Select
                                value={form.layout || "none"}
                                onValueChange={(v) =>
                                  updateField("layout", v === "none" ? "" : v)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
                                  {LAYOUTS.map((l) => (
                                    <SelectItem key={l} value={l}>
                                      {l}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {!isSale && (
                              <>
                                <div>
                                  <Label className="text-xs mb-1 block">
                                    Залог
                                  </Label>
                                  <Select
                                    value={form.deposit || "none"}
                                    onValueChange={(v) =>
                                      updateField(
                                        "deposit",
                                        v === "none" ? "" : v,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="—" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">—</SelectItem>
                                      {DEPOSIT_OPTIONS.map((d) => (
                                        <SelectItem key={d} value={d}>
                                          {d}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs mb-1 block">
                                    Срок
                                  </Label>
                                  <Select
                                    value={form.contract_term || "none"}
                                    onValueChange={(v) =>
                                      updateField(
                                        "contract_term",
                                        v === "none" ? "" : v,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="—" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">—</SelectItem>
                                      {CONTRACT_TERMS.map((ct) => (
                                        <SelectItem key={ct} value={ct}>
                                          {ct}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                          </div>
                          {isHouseForm && (
                            <div className="space-y-3 pt-1">
                              <div>
                                <Label className="text-xs mb-1 block">
                                  Тип дома
                                </Label>
                                <Select
                                  value={
                                    form.extras.building_type || "none"
                                  }
                                  onValueChange={(v) => {
                                    const next = v === "none" ? "" : v;
                                    const cfg =
                                      getWoodenHouseConfigByBuildingType(
                                        next,
                                      );
                                    if (cfg) {
                                      const fillDescription =
                                        !form.description.trim();
                                      setForm((prev) => ({
                                        ...prev,
                                        description: fillDescription
                                          ? `${cfg.listingHint}\n\n${cfg.description}`
                                          : prev.description,
                                        extras: {
                                          ...prev.extras,
                                          wood_config: cfg.id,
                                          building_type: cfg.buildingType,
                                          wood_wall: cfg.defaults?.wall || "",
                                          wood_floors:
                                            cfg.defaults?.floors || "",
                                          wood_foundation:
                                            cfg.defaults?.foundation || "",
                                          wood_roof: cfg.defaults?.roof || "",
                                          wood_finish:
                                            cfg.defaults?.finish || "",
                                        },
                                      }));
                                      return;
                                    }
                                    updateField("extras", {
                                      ...form.extras,
                                      building_type: next,
                                      wood_config: isWoodenBuildingType(next)
                                        ? form.extras.wood_config
                                        : "",
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Кирпич, каркас, брус…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">—</SelectItem>
                                    {houseBuildingTypes.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <WoodenHouseConfigFields
                                compact
                                value={{
                                  wood_config: getWoodConfigId({
                                    extras: form.extras,
                                  }),
                                  building_type: getResidentialBuildingType({
                                    extras: form.extras,
                                  }),
                                  wood_wall: getWoodWall({
                                    extras: form.extras,
                                  }),
                                  wood_floors: getWoodFloors({
                                    extras: form.extras,
                                  }),
                                  wood_foundation: getWoodFoundation({
                                    extras: form.extras,
                                  }),
                                  wood_roof: getWoodRoof({
                                    extras: form.extras,
                                  }),
                                  wood_finish: getWoodFinish({
                                    extras: form.extras,
                                  }),
                                  description: form.description,
                                }}
                                onChange={(patch) => {
                                  const { description, ...extraPatch } =
                                    patch;
                                  setForm((prev) => ({
                                    ...prev,
                                    ...(description !== undefined
                                      ? { description }
                                      : {}),
                                    extras: {
                                      ...prev.extras,
                                      ...extraPatch,
                                    },
                                  }));
                                }}
                              />
                            </div>
                          )}
                        </>
                      )}
                      {isLandForm && !isSale && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs mb-1 block">Залог</Label>
                            <Select
                              value={form.deposit || "none"}
                              onValueChange={(v) =>
                                updateField("deposit", v === "none" ? "" : v)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">—</SelectItem>
                                {DEPOSIT_OPTIONS.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {d}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">Срок</Label>
                            <Select
                              value={form.contract_term || "none"}
                              onValueChange={(v) =>
                                updateField(
                                  "contract_term",
                                  v === "none" ? "" : v,
                                )
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">—</SelectItem>
                                {CONTRACT_TERMS.map((ct) => (
                                  <SelectItem key={ct} value={ct}>
                                    {ct}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </fieldset>

                    {/* Section: Назначение */}
                    <fieldset
                      className={`${propertyFormSection} space-y-3 bg-violet-500/10`}
                    >
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Назначение
                      </legend>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">Менеджер</Label>
                          <Select
                            value={form.manager_id || "none"}
                            onValueChange={(v) =>
                              updateField("manager_id", v === "none" ? "" : v)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {users.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.full_name || u.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Клиент</Label>
                          <Select
                            value={form.client_id || "none"}
                            onValueChange={(v) =>
                              updateField("client_id", v === "none" ? "" : v)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {users.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.full_name || u.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Описание</Label>
                        <Textarea
                          value={form.description}
                          onChange={(e) =>
                            updateField("description", e.target.value)
                          }
                          rows={10}
                          className="text-xs min-h-[200px] whitespace-pre-wrap leading-relaxed"
                        />
                      </div>
                      <PropertySeoFields
                        property={{
                          deal_type: form.deal_type,
                          type: form.types[0],
                          extras: {
                            property_types: form.types,
                            seo_title: form.extras.seo_title,
                            seo_description: form.extras.seo_description,
                          },
                          address: form.address,
                          district: form.district,
                          price: form.price,
                          area: form.area,
                          description: form.description,
                        }}
                        seoTitle={form.extras.seo_title || ""}
                        seoDescription={form.extras.seo_description || ""}
                        onSeoTitleChange={(v) =>
                          updateField("extras", {
                            ...form.extras,
                            seo_title: v,
                          })
                        }
                        onSeoDescriptionChange={(v) =>
                          updateField("extras", {
                            ...form.extras,
                            seo_description: v,
                          })
                        }
                      />
                    </fieldset>

                    {/* Section: Особенности */}
                    <fieldset
                      className={`${propertyFormSection} space-y-2 bg-rose-500/10`}
                    >
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Особенности ({form.features.length})
                      </legend>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 max-h-32 overflow-y-auto">
                        {FEATURES_LIST.map((feature) => {
                          const checked = form.features.includes(feature);
                          return (
                            <label
                              key={feature}
                              className="flex items-center gap-1.5 text-[11px] cursor-pointer py-0.5 hover:text-foreground transition-colors"
                            >
                              <Checkbox
                                className="h-3.5 w-3.5"
                                checked={checked}
                                onCheckedChange={(v) => {
                                  if (v)
                                    updateField("features", [
                                      ...form.features,
                                      feature,
                                    ]);
                                  else
                                    updateField(
                                      "features",
                                      form.features.filter(
                                        (f) => f !== feature,
                                      ),
                                    );
                                }}
                              />
                              <span
                                className={
                                  checked
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                {feature}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* Section: Сайдбар на странице объекта */}
                    <fieldset
                      className={`${propertyFormSection} space-y-4 bg-indigo-500/10`}
                    >
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Сайдбар на странице объекта
                      </legend>
                      <p className="text-[11px] text-muted-foreground -mt-1">
                        Блоки справа на карточке объекта. Поля скрываются
                        автоматически для земли и продажи.
                      </p>

                      {sidebarVis.entrance && (
                        <div className={`${sidebarSubBlock} bg-sky-500/10`}>
                          <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                            Вход
                          </div>
                          <Select
                            value={form.extras.entrance_group || "none"}
                            onValueChange={(v) =>
                              updateField("extras", {
                                ...form.extras,
                                entrance_group: v === "none" ? "" : v,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Не указано" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              <SelectItem value="Отдельный">
                                Отдельный
                              </SelectItem>
                              <SelectItem value="Общий">Общий</SelectItem>
                              <SelectItem value="С улицы">С улицы</SelectItem>
                              <SelectItem value="Со двора">Со двора</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className={`${sidebarSubBlock} bg-emerald-500/10`}>
                        <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                          Финансовые условия
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs mb-1 block">
                              Коммунальные
                            </Label>
                            <Select
                              value={form.extras.utilities_included || "none"}
                              onValueChange={(v) =>
                                updateField("extras", {
                                  ...form.extras,
                                  utilities_included: v === "none" ? "" : v,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
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
                              value={form.extras.vat || "none"}
                              onValueChange={(v) =>
                                updateField("extras", {
                                  ...form.extras,
                                  vat: v === "none" ? "" : v,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
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
                          {sidebarVis.indexation && (
                            <div>
                              <Label className="text-xs mb-1 block">
                                Индексация
                              </Label>
                              <Select
                                value={form.extras.indexation || "none"}
                                onValueChange={(v) =>
                                  updateField("extras", {
                                    ...form.extras,
                                    indexation: v === "none" ? "" : v,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
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
                          )}
                          {sidebarVis.minTerm && (
                            <div>
                              <Label className="text-xs mb-1 block">
                                Мин. срок аренды
                              </Label>
                              <Select
                                value={form.extras.min_term || "none"}
                                onValueChange={(v) =>
                                  updateField("extras", {
                                    ...form.extras,
                                    min_term: v === "none" ? "" : v,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
                                  {CONTRACT_TERMS.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {t}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`${sidebarSubBlock} bg-amber-500/10`}>
                        <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                          Трафик и локация
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {sidebarVis.pedestrianTraffic && (
                            <div>
                              <Label className="text-xs mb-1 block">
                                Пеш. трафик
                              </Label>
                              <Select
                                value={
                                  form.extras.pedestrian_traffic
                                    ? String(form.extras.pedestrian_traffic)
                                    : "none"
                                }
                                onValueChange={(v) =>
                                  updateField("extras", {
                                    ...form.extras,
                                    pedestrian_traffic:
                                      v === "none"
                                        ? undefined
                                        : (Number(v) as 1 | 2 | 3 | 4),
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
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
                          )}
                          <div>
                            <Label className="text-xs mb-1 block">
                              До метро / центра
                            </Label>
                            <Input
                              className="h-8 text-xs"
                              placeholder="5 мин."
                              value={form.extras.metro_minutes || ""}
                              onChange={(e) =>
                                updateField("extras", {
                                  ...form.extras,
                                  metro_minutes: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">
                              Транспортный узел
                            </Label>
                            <Select
                              value={form.extras.transport_hub || "none"}
                              onValueChange={(v) =>
                                updateField("extras", {
                                  ...form.extras,
                                  transport_hub: v === "none" ? "" : v,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
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
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          Район берётся из поля «Локация» выше.
                        </p>
                      </div>

                      <div className={`${sidebarSubBlock} bg-violet-500/10`}>
                        <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                          Юридические условия
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {sidebarVis.contractForm && (
                            <div>
                              <Label className="text-xs mb-1 block">
                                Форма договора
                              </Label>
                              <Select
                                value={form.extras.contract_form || "none"}
                                onValueChange={(v) =>
                                  updateField("extras", {
                                    ...form.extras,
                                    contract_form: v === "none" ? "" : v,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
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
                          <div>
                            <Label className="text-xs mb-1 block">
                              {sidebarVis.landlordLabel}
                            </Label>
                            <Select
                              value={form.extras.landlord_type || "none"}
                              onValueChange={(v) =>
                                updateField("extras", {
                                  ...form.extras,
                                  landlord_type: v === "none" ? "" : v,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">—</SelectItem>
                                {LANDLORD_TYPES.map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {sidebarVis.sublease && (
                            <div>
                              <Label className="text-xs mb-1 block">
                                Субаренда
                              </Label>
                              <Select
                                value={form.extras.sublease || "none"}
                                onValueChange={(v) =>
                                  updateField("extras", {
                                    ...form.extras,
                                    sublease: v === "none" ? "" : v,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
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
                          )}
                          {!isLandForm && (
                            <div className="sm:col-span-2">
                              <Label className="text-xs mb-1 block">
                                Назначение
                              </Label>
                              <Select
                                value={form.extras.purpose || "none"}
                                onValueChange={(v) =>
                                  updateField("extras", {
                                    ...form.extras,
                                    purpose: v === "none" ? "" : v,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
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
                          )}
                        </div>
                        {isLandForm && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            «Тип» участка заполняется в блоке «Земельный
                            участок» выше.
                          </p>
                        )}
                      </div>

                      <div className={`${sidebarSubBlock} bg-rose-500/10`}>
                        <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                          Карточка агента
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs mb-1 block">Имя</Label>
                            <Input
                              className="h-8 text-xs"
                              value={form.extras.agent_name || ""}
                              onChange={(e) =>
                                updateField("extras", {
                                  ...form.extras,
                                  agent_name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">
                              Компания
                            </Label>
                            <Input
                              className="h-8 text-xs"
                              value={form.extras.agent_company || ""}
                              onChange={(e) =>
                                updateField("extras", {
                                  ...form.extras,
                                  agent_company: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">
                              Кол-во объектов
                            </Label>
                            <Input
                              className="h-8 text-xs"
                              type="number"
                              value={form.extras.agent_objects_count ?? ""}
                              onChange={(e) =>
                                updateField("extras", {
                                  ...form.extras,
                                  agent_objects_count: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">
                              Рейтинг (0–5)
                            </Label>
                            <Input
                              className="h-8 text-xs"
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={form.extras.agent_rating ?? ""}
                              onChange={(e) =>
                                updateField("extras", {
                                  ...form.extras,
                                  agent_rating: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">
                              Ответ ~ мин
                            </Label>
                            <Input
                              className="h-8 text-xs"
                              type="number"
                              value={form.extras.agent_response_min ?? ""}
                              onChange={(e) =>
                                updateField("extras", {
                                  ...form.extras,
                                  agent_response_min: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                })
                              }
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs mt-5 cursor-pointer">
                            <Checkbox
                              className="h-4 w-4"
                              checked={!!form.extras.agent_verified}
                              onCheckedChange={(v) =>
                                updateField("extras", {
                                  ...form.extras,
                                  agent_verified: !!v,
                                })
                              }
                            />
                            <span>Верифицирован</span>
                          </label>
                        </div>
                      </div>
                    </fieldset>

                    <fieldset
                      className={`${propertyFormSection} space-y-2 bg-cyan-500/10`}
                    >
                      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Фото ({totalPhotos}/15)
                      </legend>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {totalPhotos === 0 ? (
                        <div
                          className="border border-dashed rounded p-4 text-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">Загрузить фото (до 15)</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                            {existingPhotos.map((url, idx) => (
                              <div
                                key={`existing-${idx}`}
                                className={`relative group aspect-square rounded overflow-hidden border cursor-pointer transition-all ${coverIndex === idx ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
                                onClick={() => setCoverIndex(idx)}
                              >
                                <img
                                  src={url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                {coverIndex === idx && (
                                  <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground rounded px-1 py-px text-[8px] font-medium">
                                    <Star className="w-2 h-2 inline" />
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeExistingPhoto(idx);
                                  }}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                            {photoPreviews.map((url, idx) => {
                              const globalIdx = existingPhotos.length + idx;
                              return (
                                <div
                                  key={`new-${idx}`}
                                  className={`relative group aspect-square rounded overflow-hidden border cursor-pointer transition-all ${coverIndex === globalIdx ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
                                  onClick={() => setCoverIndex(globalIdx)}
                                >
                                  <img
                                    src={url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  {coverIndex === globalIdx && (
                                    <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground rounded px-1 py-px text-[8px] font-medium">
                                      <Star className="w-2 h-2 inline" />
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeNewPhoto(idx);
                                    }}
                                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              );
                            })}
                            {totalPhotos < 15 && (
                              <div
                                className="aspect-square rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Клик — главное фото
                          </p>
                        </>
                      )}
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <Label className="text-[11px]">VK Video (ссылки через запятую)</Label>
                        <Input
                          className="h-8 text-xs"
                          placeholder="https://vk.com/video-…_…"
                          value={(form.extras.video_urls || []).join(", ")}
                          onChange={(e) => {
                            const parts = e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            updateField("extras", {
                              ...form.extras,
                              video_urls: parts,
                            });
                          }}
                        />
                        <Label className="text-[11px]">URL планировки / плана дома</Label>
                        <Input
                          className="h-8 text-xs"
                          placeholder="https://…"
                          value={form.extras.plan_image_url || ""}
                          onChange={(e) =>
                            updateField("extras", {
                              ...form.extras,
                              plan_image_url: e.target.value.trim(),
                            })
                          }
                        />
                      </div>
                    </fieldset>

                    {/* Section: Помещения внутри объекта */}
                    {editId && (
                      <fieldset
                        className={`${propertyFormSection} bg-orange-500/10`}
                      >
                        <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                          Помещения внутри объекта
                        </legend>
                        <PropertyUnitsManager propertyId={editId} />
                      </fieldset>
                    )}

                    {/* Section: Реклама — только для уже сохранённых объектов */}
                    {editId && (
                      <fieldset
                        className={`${propertyFormSection} bg-pink-500/10`}
                      >
                        <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                          Реклама на объекте
                        </legend>
                        <AdPlacementsManager propertyId={editId} />
                      </fieldset>
                    )}
                  </form>
                </SheetContent>
              </Sheet>
              </div>
            </div>

            <PropertiesAdminTable
              properties={properties}
              isLoading={isLoading}
              isFetching={isFetching}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <CrmLeadsTab />
          </TabsContent>

          <TabsContent value="seekers" className="space-y-4">
            <SeekersCatalogTab />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AdminSiteAnalyticsTab />
          </TabsContent>

          <TabsContent value="moderation" className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Объекты</h2>
              <ModerationQueue />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Отзывы</h2>
              <AgencyReviewsModeration />
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <VerificationUsersTab />
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <VerificationUsersTab />
            <div className="pt-6 border-t border-border">
              <h3 className="text-sm font-semibold mb-3">Застройщики</h3>
              <DevelopersAdminTab />
            </div>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-4">
            <AdPlacementsTab />
          </TabsContent>

          {/* Users / Staff Tab */}
          <TabsContent value="users">
            <UsersRolesTab
              isAdmin={hasRole("admin")}
              currentUserId={user?.id}
            />
          </TabsContent>

          <TabsContent value="dictionaries" className="space-y-4">
            <DictionariesTab />
          </TabsContent>

          {/* Tasks shortcut Tab */}
          {hasRole("admin") && (
            <TabsContent value="tasks">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                  <CheckSquare className="w-12 h-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Система задач</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Управляйте задачами сотрудников в отдельной панели с
                    Kanban-доской и отчётами.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => navigate("/tasks")}>
                      <CheckSquare className="w-4 h-4 mr-2" /> Открыть задачи
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/reports")}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" /> Отчёты
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="news">
            <Card>
              <CardContent className="p-4">
                <NewsAdminPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
