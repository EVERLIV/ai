export type CatalogViewMode = "tree" | "table";

export type MetadataFieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "string_list";

export type MetadataFieldDef = {
  key: string;
  label: string;
  type: MetadataFieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export type CatalogCategoryConfig = {
  key: string;
  title: string;
  group: string;
  hasParent: boolean;
  view: CatalogViewMode;
  parentLabel?: string;
  parentOptions?: { value: string; label: string }[];
  metadataFields?: MetadataFieldDef[];
};

export const CATALOG_GROUPS: { id: string; title: string }[] = [
  { id: "locations", title: "Локации" },
  { id: "object", title: "Объект" },
  { id: "deal", title: "Сделка" },
  { id: "residential", title: "Жильё" },
];

const PROPERTY_TYPE_PARENTS = [
  { value: "commercial", label: "Коммерческая" },
  { value: "residential", label: "Жилая" },
  { value: "land", label: "Земля" },
] as const;

const LOCATION_KIND_OPTIONS = [
  { value: "region", label: "Область / регион" },
  { value: "city", label: "Город" },
  { value: "district", label: "Район" },
  { value: "microdistrict", label: "Микрорайон" },
  { value: "settlement", label: "Посёлок / село" },
  { value: "village", label: "Деревня" },
] as const;

const LOCATION_METADATA_FIELDS: MetadataFieldDef[] = [
  {
    key: "kind",
    label: "Тип узла",
    type: "select",
    options: [...LOCATION_KIND_OPTIONS],
  },
  { key: "lat", label: "Широта", type: "number", placeholder: "52.28" },
  { key: "lng", label: "Долгота", type: "number", placeholder: "104.30" },
  {
    key: "aliases",
    label: "Синонимы (через запятую)",
    type: "string_list",
    placeholder: "Иркутск, г. Иркутск",
  },
  { key: "seo_title", label: "SEO заголовок", type: "text" },
  { key: "seo_description", label: "SEO описание", type: "textarea" },
];

const SEO_METADATA_FIELDS: MetadataFieldDef[] = [
  { key: "seo_title", label: "SEO заголовок", type: "text" },
  { key: "seo_description", label: "SEO описание", type: "textarea" },
];

export const CATALOG_CATEGORIES: CatalogCategoryConfig[] = [
  {
    key: "district",
    title: "Районы / Локации",
    group: "locations",
    hasParent: true,
    view: "tree",
    parentLabel: "Родитель",
    metadataFields: LOCATION_METADATA_FIELDS,
  },
  {
    key: "property_type",
    title: "Тип объекта",
    group: "object",
    hasParent: true,
    view: "table",
    parentLabel: "Сегмент",
    parentOptions: [...PROPERTY_TYPE_PARENTS],
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "property_class",
    title: "Класс объекта",
    group: "object",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "purpose",
    title: "Назначение",
    group: "object",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "condition",
    title: "Состояние",
    group: "object",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "layout",
    title: "Планировка",
    group: "object",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "parking",
    title: "Парковка",
    group: "object",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "deal_type",
    title: "Тип сделки",
    group: "deal",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "deposit",
    title: "Залог",
    group: "deal",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "contract_term",
    title: "Срок договора",
    group: "deal",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "utilities",
    title: "Коммунальные",
    group: "deal",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "vat",
    title: "НДС",
    group: "deal",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "landlord_type",
    title: "Тип арендодателя",
    group: "deal",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "rooms",
    title: "Комнаты",
    group: "residential",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "building_type",
    title: "Тип дома",
    group: "residential",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "market",
    title: "Рынок",
    group: "residential",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "balcony",
    title: "Балкон",
    group: "residential",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "furniture",
    title: "Мебель",
    group: "residential",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "bathroom",
    title: "Санузел",
    group: "residential",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "window_view",
    title: "Вид из окон",
    group: "residential",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "residential_condition",
    title: "Состояние (жильё)",
    group: "residential",
    hasParent: false,
    view: "table",
    metadataFields: SEO_METADATA_FIELDS,
  },
  {
    key: "residential_feature",
    title: "Особенности (жильё)",
    group: "residential",
    hasParent: true,
    view: "table",
    parentLabel: "Группа",
    metadataFields: SEO_METADATA_FIELDS,
  },
];

/** @deprecated use CATALOG_CATEGORIES */
export const DICTIONARY_CATEGORIES = CATALOG_CATEGORIES.map((c) => ({
  key: c.key,
  title: c.title,
  hasParent: c.hasParent,
}));

export function getCatalogCategory(key: string): CatalogCategoryConfig | undefined {
  return CATALOG_CATEGORIES.find((c) => c.key === key);
}

export function categoriesInGroup(groupId: string): CatalogCategoryConfig[] {
  return CATALOG_CATEGORIES.filter((c) => c.group === groupId);
}

export function propertyTypeParentLabel(parent: string | null | undefined): string {
  const key = (parent || "").trim().toLowerCase();
  if (key === "residential") return "Жилая";
  if (key === "land" || key === "земля") return "Земля";
  if (key === "commercial" || !key) return "Коммерческая";
  return parent || "—";
}

export function normalizePropertyTypeParent(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (key === "residential" || key === "жилая") return "residential";
  if (key === "land" || key === "земля") return "land";
  return "commercial";
}

export function isPropertyTypeCategory(key: string): boolean {
  return key === "property_type";
}
