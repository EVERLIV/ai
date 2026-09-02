import type { ProfileAccountType } from "@/hooks/useProfile";

const COMMON = [
  "Техническая проблема",
  "Личный кабинет",
  "Предложить идею",
  "Другое",
] as const;

const PROPERTY = [
  "Размещение объекта",
  "Модерация объявления",
  "Верификация аккаунта",
] as const;

const AGENCY = ["Команда и менеджеры", "Отзывы"] as const;

const DEVELOPER = [
  "Проекты и объекты",
  "Webhooks и интеграции",
  "Документы",
] as const;

const SEEKER = ["Поиск и избранное"] as const;

export type SupportCategory = string;

export function getSupportCategories(
  accountType?: ProfileAccountType | null,
): SupportCategory[] {
  const type = accountType || "owner";
  const set = new Set<string>(COMMON);

  if (type === "seeker") {
    SEEKER.forEach((c) => set.add(c));
  } else if (type === "developer") {
    DEVELOPER.forEach((c) => set.add(c));
    PROPERTY.forEach((c) => set.add(c));
  } else if (type === "agency") {
    PROPERTY.forEach((c) => set.add(c));
    AGENCY.forEach((c) => set.add(c));
  } else {
    PROPERTY.forEach((c) => set.add(c));
  }

  return Array.from(set);
}

export const SUPPORT_TICKET_STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  open: {
    label: "Новый",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  in_progress: {
    label: "В работе",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  answered: {
    label: "Ответ получен",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  closed: {
    label: "Закрыт",
    className: "bg-muted text-muted-foreground border-border",
  },
};
