export const SALE_DEAL_TYPE = "Продажа";
export const RENT_DEAL_TYPE = "Аренда";
export const DAILY_DEAL_TYPE = "Посуточно";

export function isSaleDeal(dealType: string | null | undefined): boolean {
  return dealType === SALE_DEAL_TYPE;
}

/** Долгосрочная аренда (месяц/год). Посуточно сюда не входит. */
export function isRentDeal(dealType: string | null | undefined): boolean {
  return dealType === RENT_DEAL_TYPE;
}

export function isDailyDeal(dealType: string | null | undefined): boolean {
  return dealType === DAILY_DEAL_TYPE;
}

export function isLongTermRent(dealType: string | null | undefined): boolean {
  return dealType === RENT_DEAL_TYPE;
}

/** Любая аренда: долгосрочная или посуточная */
export function isAnyRentDeal(dealType: string | null | undefined): boolean {
  return isLongTermRent(dealType) || isDailyDeal(dealType);
}
