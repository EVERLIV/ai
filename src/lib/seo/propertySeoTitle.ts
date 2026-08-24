import { isSaleDeal } from "@/lib/propertyDeal";
import { getPrimaryPropertyType } from "@/lib/propertyTypes";

export type PropertySeoInput = {
  deal_type?: string | null;
  type?: string | null;
  extras?: Record<string, unknown> | null;
  address?: string | null;
  district?: string | null;
  price?: number | null;
  area?: number | null;
  description?: string | null;
};

const TYPE_SEO: Record<string, string> = {
  Офис: "офис",
  Торговая: "помещение для торговли",
  Склад: "склад",
  Земля: "земельный участок",
  Помещение: "помещение",
  Павильон: "павильон",
  Киоск: "киоск",
};

export function formatPriceShort(
  price: number | null | undefined,
  dealType?: string | null,
): string {
  const n = Number(price) || 0;
  if (n <= 0) return "цена по запросу";

  const rent = !isSaleDeal(dealType || "Аренда");
  const suffix = rent ? " ₽/мес" : " ₽";

  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const label =
      m >= 10
        ? `${Math.round(m)} млн`
        : `${m.toFixed(1).replace(".0", "")} млн`;
    return `${label}${suffix}`;
  }
  if (n >= 1_000) {
    const k = Math.round(n / 1_000);
    return `${k} тыс${suffix}`;
  }
  return `${n.toLocaleString("ru-RU")}${suffix}`;
}

function typeSeoLabel(type: string): string {
  return TYPE_SEO[type] || type.toLowerCase() || "объект";
}

function parseAddress(
  address: string,
  district?: string | null,
): { location: string; street: string } {
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0)
    return { location: district?.trim() || "", street: "" };

  const first = parts[0];
  const rest = parts.slice(1).join(", ");

  let location = first;
  if (district?.trim()) {
    const d = district.trim();
    if (!first.toLowerCase().includes(d.toLowerCase())) {
      location = `${first}, ${d}`;
    }
  }

  const street = rest.length > 60 ? `${rest.slice(0, 57)}…` : rest;
  return { location, street };
}

/** SEO title: «Аренда — помещение для торговли — Ангарск, 11 мкр — 45 тыс ₽/мес» */
export function buildPropertySeoTitle(p: PropertySeoInput): string {
  const deal = (p.deal_type || "Аренда").trim();
  const typeLabel = typeSeoLabel(getPrimaryPropertyType(p));
  const address = (p.address || "").trim();
  const { location, street } = parseAddress(address, p.district);
  const price = formatPriceShort(Number(p.price) || null, p.deal_type);

  const parts = [deal, typeLabel];
  if (location) parts.push(location);
  if (street) parts.push(street);
  parts.push(price);

  return parts.join(" — ");
}

export function buildPropertySeoDescription(p: PropertySeoInput): string {
  const typeLabel = typeSeoLabel(getPrimaryPropertyType(p));
  const area = Number(p.area) > 0 ? `${p.area} м²` : "";
  const price = formatPriceShort(Number(p.price) || null, p.deal_type);
  const district = p.district?.trim() ? `, ${p.district.trim()}` : "";
  const desc = (p.description || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const base = [typeLabel, area, price, district.replace(/^, /, "")]
    .filter(Boolean)
    .join(" · ");
  return desc ? `${base}. ${desc}` : base;
}
