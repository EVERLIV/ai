import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import { COMPANY, CONTACTS } from "@/config/company";

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
  accountType: "realtor" as const,
  agencyName: COMPANY.brand,
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
