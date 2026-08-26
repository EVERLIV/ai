import {
  getPropertyDeveloperId,
  isDeveloperListing,
} from "@/lib/listingSource";
import { readPropertyMediaExtras } from "@/lib/propertyMedia";
import { getResidentialMarket } from "@/lib/propertyResidential";
import { getListingAgentDisplay } from "@/lib/propertySidebar";

type PropertyLike = {
  type?: string | null;
  condition?: string | null;
  features?: string[] | null;
  developer_id?: string | null;
  developer_project_id?: string | null;
  extras?: Record<string, unknown> | null;
};

/** Новостройка по рынку / типу */
export function isNewbuildListing(property: PropertyLike): boolean {
  return getResidentialMarket(property) === "Новостройка";
}

/** Дом / объект индивидуальной сборки (ещё нет — строят под заказ) */
export function isMadeToOrderListing(property: PropertyLike): boolean {
  if (getResidentialMarket(property) === "На заказ") return true;
  const types = [
    property.type,
    ...((property.extras?.property_types as unknown[]) || []),
  ]
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim());
  return types.includes("Дом на заказ");
}

export function propertyHasVideo(
  extras?: Record<string, unknown> | null,
): boolean {
  return readPropertyMediaExtras(extras).videoUrls.length > 0;
}

/** Бейдж «С отделкой» / состояние отделки для карточки */
export function getFinishingBadgeLabel(
  property: PropertyLike,
): string | null {
  const condition = (property.condition || "").trim();
  if (condition) {
    const c = condition.toLowerCase();
    if (/без отделк/.test(c)) return "Без отделки";
    if (/чернов/.test(c)) return "Черновая отделка";
    if (/под чистовую/.test(c)) return "Под чистовую";
    if (
      /евро|дизайнер|хороший ремонт|косметическ|с отделк|чистовая|премиум|premium/.test(
        c,
      )
    ) {
      return "С отделкой";
    }
    if (/отделк|ремонт|новое/.test(c)) return condition;
  }

  const features = property.features || [];
  if (
    features.some((f) =>
      /отделк|евроремонт|дизайнер|ремонт/i.test(String(f)),
    )
  ) {
    return "С отделкой";
  }
  return null;
}

export function getNewbuildPhotoBadges(property: PropertyLike): string[] {
  if (isMadeToOrderListing(property)) {
    return ["На заказ"];
  }
  if (!isNewbuildListing(property) && !isDeveloperListing(property)) {
    return [];
  }
  // Застройщик домов без рынка «Новостройка» — не «Первичная продажа»
  if (isDeveloperListing(property) && !isNewbuildListing(property)) {
    return ["На заказ"];
  }
  return ["Первичная продажа"];
}

export function getNewbuildBodyBadges(property: PropertyLike): string[] {
  if (
    !isMadeToOrderListing(property) &&
    !isNewbuildListing(property) &&
    !isDeveloperListing(property)
  ) {
    return [];
  }
  const badges: string[] = [];
  if (isMadeToOrderListing(property)) {
    badges.push("Индивидуальная сборка");
  }
  const finishing = getFinishingBadgeLabel(property);
  if (finishing) badges.push(finishing);
  return badges;
}

export function getCardDeveloperLabel(property: PropertyLike): {
  name: string;
  href: string | null;
  avatarUrl: string | null;
} | null {
  const agent = getListingAgentDisplay(property.extras);
  const developerId =
    getPropertyDeveloperId(property) || agent?.developerId || null;
  if (agent?.isDeveloper || developerId) {
    const name =
      agent?.primaryLabel?.trim() ||
      agent?.secondaryLabel?.trim() ||
      "";
    if (!name && !developerId) return null;
    return {
      name: name || "Застройщик",
      href: developerId ? `/zastroyshchik/${developerId}` : null,
      avatarUrl: agent?.avatarUrl || null,
    };
  }
  return null;
}

export function formatProjectCardTitle(
  title: string,
  projectKind?: string | null,
): string {
  const t = title.trim();
  if (!t) return "";
  if (projectKind === "house_series") return t;
  if (/^жк\b/i.test(t) || /^серия\b/i.test(t) || /^«/.test(t)) return t;
  return `ЖК «${t}»`;
}
