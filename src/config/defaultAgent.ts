import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import { COMPANY, CONTACTS } from "@/config/company";

/**
 * Фиксированные UUID агентства АрендаСити / Анастасии.
 * Должны совпадать с sql/seed_arendacity_agency.sql
 */
export const ARENDACITY_AGENCY_ID =
  "a0000000-0000-4000-8000-000000000001" as const;
export const ARENDACITY_MANAGER_ID =
  "a0000000-0000-4000-8000-000000000002" as const;

/**
 * Агент агентства по умолчанию.
 *
 * Объекты, добавленные не собственником через личный кабинет, ведёт агент
 * компании. Карточка агента на таких объектах берёт данные отсюда, чтобы
 * имя, статус и контакты были одинаковыми на всём сайте.
 */
export const DEFAULT_AGENT = {
  name: "Анастасия Романова",
  /** Тип аккаунта в терминах ACCOUNT_TYPE_LABELS. */
  accountType: "agency" as const,
  agencyName: COMPANY.brand,
  agencyId: ARENDACITY_AGENCY_ID,
  managerId: ARENDACITY_MANAGER_ID,
  isVerified: true,
  avatar: consultantAvatar,
  rating: 4.9,
  /** Среднее время ответа, минуты. */
  responseMinutes: 12,
  position: "Менеджер по коммерческой недвижимости",
  about:
    "Ведёт объекты агентства в Ангарске, Иркутске и области. Подбор помещений, показы, проверка арендаторов и сопровождение сделки.",
  phone: CONTACTS.phone,
  phoneTel: CONTACTS.phoneTel,
  email: CONTACTS.email,
} as const;
