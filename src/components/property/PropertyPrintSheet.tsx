import { createPortal } from "react-dom";
import ProtectedImage from "@/components/ProtectedImage";
import BrandMark from "@/components/BrandMark";
import { DEFAULT_AGENT } from "@/config/defaultAgent";
import { SITE, SITE_URL, absoluteUrl } from "@/config/site";
import { ACCOUNT_TYPE_LABELS } from "@/hooks/useProfile";
import {
  isAgencyListing,
  isDeveloperListing,
  isOwnerListing,
} from "@/lib/listingSource";
import {
  buildPropertyDisplayTitle,
  formatPropertyAddressShort,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import { getLandUse, isAnyLand, LAND_TYPE_LABEL } from "@/lib/propertyLand";
import {
  formatPropertyTypesLabel,
  getPropertyTypes,
} from "@/lib/propertyTypes";
import { getResidentialRooms } from "@/lib/propertyResidential";
import {
  getListingAgentDisplay,
  type PropertySidebarExtras,
} from "@/lib/propertySidebar";

type PrintProperty = {
  id: string;
  type?: string | null;
  deal_type?: string | null;
  segment?: string | null;
  area?: number | null;
  price?: number | null;
  price_per_m2?: number | null;
  address?: string | null;
  district?: string | null;
  floor?: string | null;
  total_floors?: number | string | null;
  ceiling_height?: number | null;
  condition?: string | null;
  description?: string | null;
  cover_photo?: string | null;
  photos?: string[] | null;
  agency_id?: string | null;
  developer_id?: string | null;
  listing_manager_id?: string | null;
  submitted_by?: string | null;
  extras?: Record<string, unknown> | null;
};

type Props = {
  property: PrintProperty;
  pageUrl?: string;
};

const MAX_PHOTOS = 6;

function sellerRoleLabel(property: PrintProperty): string {
  if (isDeveloperListing(property)) return ACCOUNT_TYPE_LABELS.developer;
  if (isAgencyListing(property)) {
    const t = (property.extras as PropertySidebarExtras | null)
      ?.agent_account_type;
    if (t === "realtor") return ACCOUNT_TYPE_LABELS.realtor;
    return ACCOUNT_TYPE_LABELS.agency;
  }
  if (isOwnerListing(property)) return ACCOUNT_TYPE_LABELS.owner;
  return "Продавец";
}

function resolvePrintSeller(property: PrintProperty) {
  const extras = (property.extras || {}) as PropertySidebarExtras;
  const agent = getListingAgentDisplay(extras);
  const phoneFromExtras = extras.agent_phone?.trim() || "";

  if (!agent) {
    return {
      role: ACCOUNT_TYPE_LABELS.agency,
      name: DEFAULT_AGENT.agencyName,
      person: DEFAULT_AGENT.name,
      phone: DEFAULT_AGENT.phone,
      verified: DEFAULT_AGENT.isVerified,
    };
  }

  const role = sellerRoleLabel(property);
  const name = agent.primaryLabel;
  let person = "";
  if (agent.isAgency || agent.isRealtor) {
    const agentName = extras.agent_name?.trim() || "";
    if (agentName && agentName !== name) person = agentName;
  }

  const phone =
    phoneFromExtras ||
    (agent.isAgency || agent.isRealtor ? DEFAULT_AGENT.phone : "");

  return {
    role,
    name,
    person,
    phone,
    verified: agent.isVerified,
  };
}

/** Печатный лист объявления — виден только при window.print(). */
export default function PropertyPrintSheet({ property, pageUrl }: Props) {
  const title = buildPropertyDisplayTitle(property);
  const address = formatPropertyAddressShort(property.address);
  const price = formatPropertyPrice(property);
  const typesLabel = formatPropertyTypesLabel(getPropertyTypes(property));
  const rooms = getResidentialRooms(property);
  const land = isAnyLand(property);
  const landUse = land ? getLandUse(property) : null;
  const url =
    pageUrl?.trim() || absoluteUrl(`/property/${property.id}`);
  const seller = resolvePrintSeller(property);

  const photos = (() => {
    const list = (property.photos || []).filter(Boolean);
    if (property.cover_photo && !list.includes(property.cover_photo)) {
      return [property.cover_photo, ...list].slice(0, MAX_PHOTOS);
    }
    if (list.length) return list.slice(0, MAX_PHOTOS);
    if (property.cover_photo) return [property.cover_photo];
    return [] as string[];
  })();

  const specs: { label: string; value: string }[] = [];
  if (typesLabel) specs.push({ label: "Тип", value: typesLabel });
  if (property.deal_type)
    specs.push({ label: "Сделка", value: property.deal_type });
  if (rooms) specs.push({ label: "Комнаты", value: rooms });
  if (Number(property.area) > 0) {
    specs.push({
      label: "Площадь",
      value: `${Number(property.area).toLocaleString("ru-RU")} м²`,
    });
  }
  if (land && landUse) {
    specs.push({ label: LAND_TYPE_LABEL, value: landUse });
  }
  if (property.floor && property.floor !== "-") {
    const floors = property.total_floors
      ? `${property.floor}/${property.total_floors}`
      : String(property.floor);
    specs.push({ label: "Этаж", value: floors });
  }
  if (Number(property.ceiling_height) > 0) {
    specs.push({
      label: "Потолки",
      value: `${property.ceiling_height} м`,
    });
  }
  if (property.condition?.trim()) {
    specs.push({ label: "Состояние", value: property.condition.trim() });
  }
  if (property.district?.trim()) {
    specs.push({ label: "Район", value: property.district.trim() });
  }

  const printedAt = new Date().toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const description = (property.description || "").trim();
  const host = SITE_URL.replace(/^https?:\/\//, "");

  const sheet = (
    <div
      id="property-print-sheet"
      className="print-only-sheet"
      aria-hidden
    >
      <header className="flex items-center justify-between gap-4 pb-5 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <BrandMark className="h-10 w-10" />
          <div className="min-w-0">
            <div className="font-bold text-lg tracking-tight leading-none">
              АРЕНДА<span className="text-[#8B0015]">СИТИ</span>
            </div>
            <div className="text-[11px] text-neutral-600 mt-1">
              {SITE.name} · недвижимость в Иркутске
            </div>
          </div>
        </div>
        <div className="text-right text-[11px] text-neutral-600 shrink-0">
          <div className="font-medium text-neutral-800">{host}</div>
          <div>Объявление для печати</div>
        </div>
      </header>

      <h1 className="text-2xl font-bold leading-snug mb-1.5">{title}</h1>
      {address && (
        <p className="text-sm text-neutral-700 mb-4">{address}</p>
      )}

      <div className="mb-5">
        <div className="text-2xl font-bold tabular-nums">
          {price ?? "Цена по запросу"}
        </div>
        {Number(property.price_per_m2) > 0 && (
          <div className="text-sm text-neutral-600 mt-0.5 tabular-nums">
            {Number(property.price_per_m2).toLocaleString("ru-RU")} ₽/м²
          </div>
        )}
      </div>

      {specs.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
            Параметры
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {specs.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 py-0.5">
                <span className="text-neutral-500 shrink-0">{row.label}</span>
                <span className="font-medium text-right">{row.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
          Кто сдаёт / продаёт
        </h2>
        <div className="text-sm space-y-0.5">
          <div>
            <span className="text-neutral-500">Роль: </span>
            <span className="font-medium">{seller.role}</span>
            {seller.verified ? (
              <span className="text-neutral-500"> · проверен</span>
            ) : null}
          </div>
          <div>
            <span className="text-neutral-500">
              {seller.role === ACCOUNT_TYPE_LABELS.developer
                ? "Застройщик: "
                : seller.role === ACCOUNT_TYPE_LABELS.owner
                  ? "Собственник: "
                  : "Организация: "}
            </span>
            <span className="font-medium">{seller.name}</span>
          </div>
          {seller.person ? (
            <div>
              <span className="text-neutral-500">Контактное лицо: </span>
              <span className="font-medium">{seller.person}</span>
            </div>
          ) : null}
          {seller.phone ? (
            <div>
              <span className="text-neutral-500">Телефон: </span>
              <span className="font-medium tabular-nums">{seller.phone}</span>
            </div>
          ) : null}
        </div>
      </section>

      {photos.length > 0 && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
            Фотографии
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((src, i) => (
              <ProtectedImage
                key={`${src}-${i}`}
                src={src}
                alt=""
                protect={false}
                className="w-full aspect-[4/3] object-cover bg-neutral-100"
                loading="eager"
                decoding="sync"
              />
            ))}
          </div>
        </section>
      )}

      {description && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
            Описание
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
            {description}
          </p>
        </section>
      )}

      <footer className="pt-4 mt-auto text-[11px] text-neutral-600 flex flex-wrap justify-between gap-2">
        <div>
          <div className="font-medium text-neutral-800">{url}</div>
          <div>Распечатано: {printedAt}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-[#8B0015]">{SITE.name}</div>
          <div>{host}</div>
        </div>
      </footer>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}
