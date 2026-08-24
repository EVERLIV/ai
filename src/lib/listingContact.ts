import { getOwnerUserId } from "@/lib/propertyModeration";

type PropertyPhoneSource = {
  extras?: Record<string, unknown> | null;
  submitted_by?: string | null;
};

/** Нормализация телефона для tel: ссылки */
export function normalizePhoneTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8"))
    return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

/** Маска: +7 ••• •••-12-34 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  if (local.length < 4) return "+7 ••• •••-••-••";
  const tail = local.slice(-4);
  return `+7 ••• •••-${tail.slice(0, 2)}-${tail.slice(2)}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  if (local.length !== 10) return phone.trim();
  return `+7 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 8)}-${local.slice(8)}`;
}

/** Телефон из extras объявления */
export function getListingPhoneFromExtras(
  extras?: Record<string, unknown> | null,
): string {
  if (!extras) return "";
  for (const key of ["agent_phone", "contact_phone", "phone"] as const) {
    const value = extras[key];
    if (typeof value === "string" && value.replace(/\D/g, "").length >= 10) {
      return value.trim();
    }
  }
  return "";
}

export function getListingOwnerUserId(
  property: PropertyPhoneSource,
): string | null {
  return getOwnerUserId(property.extras, property.submitted_by);
}
