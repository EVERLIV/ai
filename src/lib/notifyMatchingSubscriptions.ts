import { getPropertyTypes } from "@/lib/propertyTypes";
import { getResidentialMarket } from "@/lib/propertyResidential";
import { notifyPropertyEmail } from "@/lib/notifyPropertyEmail";
import {
  fetchActiveSearchSubscriptionsApi,
  type SearchSubscription,
  type SearchSubscriptionFilters,
} from "@/lib/searchSubscriptions";

type MatchProperty = {
  id?: string | null;
  public_id?: string | null;
  segment?: string | null;
  type?: string | null;
  extras?: Record<string, unknown> | null;
  deal_type?: string | null;
  district?: string | null;
  address?: string | null;
  price?: number | string | null;
  area?: number | string | null;
  floor?: string | number | null;
  deposit?: string | null;
  contract_term?: string | null;
  request_type?: string | null;
  description?: string | null;
};

function filtersMatch(
  filters: SearchSubscriptionFilters,
  property: MatchProperty,
): boolean {
  if (filters.segment) {
    const seg = (property.segment || "").toString();
    if (seg && seg !== filters.segment) return false;
  }

  const deal = filters.deal_type?.trim();
  if (deal && deal !== "Все" && property.deal_type !== deal) return false;

  const district = filters.district?.trim();
  if (district && district !== "Все" && property.district !== district)
    return false;

  if (filters.market?.length) {
    const market = getResidentialMarket(property);
    if (!market || !filters.market.includes(market)) return false;
  }

  const price =
    typeof property.price === "number"
      ? property.price
      : Number(property.price);
  if (Number.isFinite(price)) {
    if (
      filters.price_min != null &&
      filters.price_min > 0 &&
      price < filters.price_min
    )
      return false;
    if (
      filters.price_max != null &&
      filters.price_max > 0 &&
      price > filters.price_max
    )
      return false;
  }

  const area =
    typeof property.area === "number" ? property.area : Number(property.area);
  if (Number.isFinite(area)) {
    if (
      filters.area_min != null &&
      filters.area_min > 0 &&
      area < filters.area_min
    )
      return false;
    if (
      filters.area_max != null &&
      filters.area_max > 0 &&
      area > filters.area_max
    )
      return false;
  }

  return true;
}

export function subscriptionMatchesProperty(
  sub: SearchSubscription,
  property: MatchProperty,
): boolean {
  if (!sub.is_active) return false;

  const types = getPropertyTypes(property);
  if (sub.property_types?.length) {
    const overlap = types.some((t) => sub.property_types.includes(t));
    if (!overlap) {
      const primary = property.type?.trim();
      if (!primary || !sub.property_types.includes(primary)) return false;
    }
  }

  return filtersMatch(sub.filters || {}, property);
}

/** Best-effort: после публикации объекта — письма подписчикам. */
export async function notifyMatchingSubscriptions(
  property: MatchProperty,
  opts?: { excludeEmails?: string[] },
): Promise<void> {
  let subs: SearchSubscription[] = [];
  try {
    subs = await fetchActiveSearchSubscriptionsApi();
  } catch (e) {
    console.warn("notifyMatchingSubscriptions: fetch failed", e);
    return;
  }

  const exclude = new Set(
    (opts?.excludeEmails || []).map((e) => e.trim().toLowerCase()).filter(Boolean),
  );
  const sent = new Set<string>();

  for (const sub of subs) {
    const email = (sub.email || "").trim().toLowerCase();
    if (!email || exclude.has(email) || sent.has(email)) continue;
    if (!subscriptionMatchesProperty(sub, property)) continue;

    sent.add(email);
    await notifyPropertyEmail({
      event: "subscription_match",
      to: email,
      name: null,
      property: {
        id: property.id,
        public_id: property.public_id,
        address: property.address,
        district: property.district,
        type: getPropertyTypes(property).join(", ") || property.type,
        deal_type: property.deal_type,
        area: property.area,
        price: property.price,
        floor: property.floor,
        deposit: property.deposit,
        contract_term: property.contract_term,
        request_type: property.request_type,
        description: property.description,
      },
    });
  }
}
